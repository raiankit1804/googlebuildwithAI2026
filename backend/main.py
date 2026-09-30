"""
Sanjeevani Grid — FastAPI Backend
All endpoints match /API_CONTRACT.md
Runs on port 8000 with CORS enabled.
"""

import os, sys, json
from pathlib import Path
from contextlib import asynccontextmanager

import numpy as np
import pandas as pd
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add backend dir to path for local imports
sys.path.insert(0, str(Path(__file__).parent))

from data_gen import generate, MEDICINES, DENGUE_MEDICINES, OUTBREAK_DISTRICTS
from forecast import train_ridge, forecast_14d, get_model_weights, set_model_weights, _build_features, FEATURE_COLS
from alerts import compute_alerts
from redistribute import compute_redistribution
from federated import federated_train, run_one_more_round


# ── In-memory state ────────────────────────────────────────────────
class AppState:
    phcs_df: pd.DataFrame = None
    daily_df: pd.DataFrame = None
    models: dict = {}           # {(phc_id, medicine): (model, residual_std)}
    federation: dict = {}       # federated learning results
    scenario_multipliers: dict = {}  # {district: multiplier}
    redistribution_cache: dict = None
    alerts_cache: list = None
    avg_demand_cache: dict = {}


state = AppState()


def _init_data():
    """Generate data if needed and load into memory."""
    data_dir = Path(__file__).parent / "data"
    if not (data_dir / "phcs.csv").exists():
        generate()

    state.phcs_df = pd.read_csv(data_dir / "phcs.csv")
    state.daily_df = pd.read_csv(data_dir / "daily.csv")
    print(f"📂  Loaded {len(state.phcs_df)} PHCs, {len(state.daily_df):,} daily rows")


def _train_models():
    """Train Ridge models for each PHC × medicine pair."""
    print("🤖  Training forecast models …")
    count = 0
    for (phc_id, med), group in state.daily_df.groupby(["phc_id", "medicine"]):
        model, residual_std, _, _, mape = train_ridge(group)
        if model is not None:
            state.models[(phc_id, med)] = (model, residual_std)
            count += 1
    print(f"   → {count} models trained")


def _run_federation():
    """Run federated learning and print comparison table."""
    print("🌐  Running federated learning (5 rounds) …")
    result = federated_train(state.daily_df)
    state.federation = result

    # Print comparison table
    print("\n" + "=" * 50)
    print("📊 LOCAL vs FEDERATED MAPE (% error)")
    print(f"{'Country':<8} {'Local':>8} {'Federated':>10} {'Δ':>8}")
    print("-" * 36)
    for cc in sorted(result["local_mapes"]):
        local = result["local_mapes"][cc]
        fed = result["federated_mapes"][cc]
        delta = local - fed
        marker = " ✓" if delta > 0 else ""
        print(f"{cc:<8} {local:>7.1f}% {fed:>9.1f}% {delta:>+7.1f}%{marker}")
    print("=" * 50 + "\n")


def _compute_alerts_and_redistribution():
    """Compute alerts and redistribution with current scenario state."""
    state.alerts_cache = compute_alerts(
        state.daily_df, state.phcs_df,
        scenario_multipliers=state.scenario_multipliers
    )
    state.redistribution_cache = compute_redistribution(
        state.daily_df, state.phcs_df,
        scenario_multipliers=state.scenario_multipliers
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: generate data, train models, run federation."""
    _init_data()
    _refresh_avg_demand()
    _train_models()
    _run_federation()
    _compute_alerts_and_redistribution()
    print("🚀  Sanjeevani Grid backend ready on http://localhost:8000")
    yield


app = FastAPI(title="Sanjeevani Grid", lifespan=lifespan)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic models ────────────────────────────────────────────────
class ScenarioRequest(BaseModel):
    outbreak_type: str = "dengue"
    districts: list[str] = []
    multiplier: float = 3.0

class ApproveRequest(BaseModel):
    transfer_id: int


# ── Helper: filter by country ──────────────────────────────────────
def _filter_country(df, country):
    if country and country != "ALL":
        return df[df["country"] == country]
    return df


def _refresh_avg_demand():
    """Cache recent 7-day average consumption for all (phc_id, medicine) pairs."""
    unique_dates = sorted(state.daily_df["date"].unique())
    last_7_dates = set(unique_dates[-7:])
    recent = state.daily_df[state.daily_df["date"].isin(last_7_dates)]
    state.avg_demand_cache = recent.groupby(["phc_id", "medicine"])["consumption"].mean().to_dict()


def _get_phc_status_fast(phc_id: str, latest_phc_rows: pd.DataFrame) -> tuple:
    """Determine worst stock status for a PHC using pre-cached averages."""
    worst_doc = float("inf")
    dengue_meds = {"paracetamol", "IV fluids", "ORS"}

    for _, row in latest_phc_rows.iterrows():
        med = row["medicine"]
        stock = row["stock_on_hand"]
        district = row["district"]

        avg_demand = max(state.avg_demand_cache.get((phc_id, med), 1.0), 0.1)

        mult = 1.0
        if state.scenario_multipliers and district in state.scenario_multipliers:
            if med in dengue_meds:
                mult = state.scenario_multipliers[district]

        doc = stock / (avg_demand * mult)
        worst_doc = min(worst_doc, doc)

    if worst_doc < 5:
        return "critical", worst_doc
    elif worst_doc < 10:
        return "warning", worst_doc
    elif worst_doc < 20:
        return "watch", worst_doc
    else:
        return "ok", worst_doc


# ── API Endpoints ──────────────────────────────────────────────────

@app.get("/api/overview")
def overview(country: str = Query(None)):
    """KPI summary in <5ms."""
    if not state.avg_demand_cache:
        _refresh_avg_demand()

    phcs = _filter_country(state.phcs_df, country)
    phc_ids = set(phcs["phc_id"])

    latest_date = state.daily_df["date"].max()
    latest = state.daily_df[(state.daily_df["date"] == latest_date) & (state.daily_df["phc_id"].isin(phc_ids))]

    risk_count = 0
    total_doc = []
    dengue_meds = {"paracetamol", "IV fluids", "ORS"}

    for phc_id, group in latest.groupby("phc_id"):
        phc_at_risk = False
        for _, row in group.iterrows():
            med = row["medicine"]
            stock = row["stock_on_hand"]
            district = row["district"]

            avg_demand = max(state.avg_demand_cache.get((phc_id, med), 1.0), 0.1)

            mult = 1.0
            if state.scenario_multipliers and district in state.scenario_multipliers:
                if med in dengue_meds:
                    mult = state.scenario_multipliers[district]

            doc = stock / (avg_demand * mult)
            total_doc.append(doc)
            if doc < 10:
                phc_at_risk = True

        if phc_at_risk:
            risk_count += 1

    bed_rows = latest.drop_duplicates(subset=["phc_id"])
    bed_occ = (bed_rows["beds_occupied"].sum() / max(bed_rows["beds_total"].sum(), 1)) * 100
    staff_att = (bed_rows["staff_present"].sum() / max(bed_rows["staff_total"].sum(), 1)) * 100

    return {
        "total_phcs": len(phcs),
        "stockout_risk_count": risk_count,
        "avg_days_of_cover": round(float(np.mean(total_doc)) if total_doc else 0, 1),
        "bed_occupancy_pct": round(float(bed_occ), 1),
        "staff_attendance_pct": round(float(staff_att), 1),
        "country_filter": country,
    }


@app.get("/api/phcs")
def list_phcs(country: str = Query(None)):
    """List all PHCs with location and status in <5ms."""
    if not state.avg_demand_cache:
        _refresh_avg_demand()

    phcs = _filter_country(state.phcs_df, country)
    phc_ids = set(phcs["phc_id"])

    latest_date = state.daily_df["date"].max()
    latest = state.daily_df[(state.daily_df["date"] == latest_date) & (state.daily_df["phc_id"].isin(phc_ids))]
    latest_grouped = {pid: grp for pid, grp in latest.groupby("phc_id")}

    result = []
    for _, phc in phcs.iterrows():
        pid = phc["phc_id"]
        phc_latest = latest_grouped.get(pid, pd.DataFrame())
        status, worst_doc = _get_phc_status_fast(pid, phc_latest) if not phc_latest.empty else ("ok", 99.0)

        beds_occ = int(phc_latest.iloc[0]["beds_occupied"]) if len(phc_latest) > 0 else 0
        staff_pres = int(phc_latest.iloc[0]["staff_present"]) if len(phc_latest) > 0 else 0

        result.append({
            "id": pid,
            "name": phc["name"],
            "country": phc["country"],
            "district": phc["district"],
            "lat": float(phc["lat"]),
            "lon": float(phc["lon"]),
            "status": status,
            "worst_days_of_cover": round(worst_doc, 1),
            "beds_total": int(phc["beds_total"]),
            "beds_occupied": beds_occ,
            "staff_total": int(phc["staff_total"]),
            "staff_present": staff_pres,
        })

    return result


@app.get("/api/phc/{phc_id}")
def get_phc(phc_id: str):
    """Detail for one PHC."""
    phc_info = state.phcs_df[state.phcs_df["phc_id"] == phc_id]
    if len(phc_info) == 0:
        raise HTTPException(404, "PHC not found")

    phc = phc_info.iloc[0]
    latest_date = state.daily_df["date"].max()
    phc_latest = state.daily_df[
        (state.daily_df["phc_id"] == phc_id) &
        (state.daily_df["date"] == latest_date)
    ]
    status, worst_doc = _get_phc_status_fast(phc_id, phc_latest)

    # Stock table
    dengue_meds = {"paracetamol", "IV fluids", "ORS"}
    stock_table = []
    for _, row in phc_latest.iterrows():
        med = row["medicine"]
        stock = row["stock_on_hand"]
        district = row["district"]

        avg_demand = max(state.avg_demand_cache.get((phc_id, med), 1.0), 0.1)

        mult = 1.0
        if state.scenario_multipliers and district in state.scenario_multipliers:
            if med in dengue_meds:
                mult = state.scenario_multipliers[district]
        adj_demand = avg_demand * mult

        doc = stock / adj_demand
        if doc < 5:
            s = "critical"
        elif doc < 10:
            s = "warning"
        elif doc < 20:
            s = "watch"
        else:
            s = "ok"

        stock_table.append({
            "medicine": med,
            "stock_on_hand": round(stock, 0),
            "daily_consumption_avg": round(adj_demand, 1),
            "days_of_cover": round(doc, 1),
            "lead_time_days": int(row["restock_lead_time"]),
            "status": s,
        })

    # 30-day history
    phc_data = state.daily_df[state.daily_df["phc_id"] == phc_id].sort_values("date")
    last_30_dates = sorted(phc_data["date"].unique())[-30:]
    history = []
    for date in last_30_dates:
        day_data = phc_data[phc_data["date"] == date]
        if len(day_data) == 0:
            continue
        stock_dict = {}
        for _, r in day_data.iterrows():
            stock_dict[r["medicine"]] = round(r["stock_on_hand"], 0)
        first = day_data.iloc[0]
        history.append({
            "date": date,
            "footfall": round(float(first["footfall"]), 0),
            "beds_occupied": int(first["beds_occupied"]),
            "staff_present": int(first["staff_present"]),
            "stock": stock_dict,
        })

    beds_occ = int(phc_latest.iloc[0]["beds_occupied"]) if len(phc_latest) > 0 else 0
    staff_pres = int(phc_latest.iloc[0]["staff_present"]) if len(phc_latest) > 0 else 0

    return {
        "id": phc_id,
        "name": phc["name"],
        "country": phc["country"],
        "district": phc["district"],
        "lat": float(phc["lat"]),
        "lon": float(phc["lon"]),
        "status": status,
        "beds_total": int(phc["beds_total"]),
        "beds_occupied": beds_occ,
        "staff_total": int(phc["staff_total"]),
        "staff_present": staff_pres,
        "stock": stock_table,
        "history": history,
    }


@app.get("/api/forecast")
def get_forecast(phc_id: str = Query(...), medicine: str = Query(...)):
    """14-day demand forecast for a PHC + medicine."""
    key = (phc_id, medicine)
    if key not in state.models:
        raise HTTPException(404, f"No model for {phc_id} / {medicine}")

    model, residual_std = state.models[key]

    # Get series data
    series = state.daily_df[
        (state.daily_df["phc_id"] == phc_id) & (state.daily_df["medicine"] == medicine)
    ].sort_values("date")

    # History: last 30 days
    last_30 = series.tail(30)
    history = [{"date": r["date"], "actual": round(r["consumption"], 1)} for _, r in last_30.iterrows()]

    # Forecast: 14 days ahead
    last_row = series.iloc[-1].to_dict()

    # Apply scenario multiplier
    district = last_row.get("district", "")
    dengue_meds = {"paracetamol", "IV fluids", "ORS"}
    mult = 1.0
    if state.scenario_multipliers and district in state.scenario_multipliers:
        if medicine in dengue_meds:
            mult = state.scenario_multipliers[district]

    forecast = forecast_14d(model, last_row, residual_std, outbreak_multiplier=mult)

    # Compute MAPE
    _, _, _, _, mape = train_ridge(series)
    mape = mape if mape is not None else 0

    return {
        "phc_id": phc_id,
        "medicine": medicine,
        "history": history,
        "forecast": forecast,
        "model": "ridge_federated",
        "mape": round(mape, 1),
    }


@app.get("/api/alerts")
def get_alerts(country: str = Query(None)):
    """Ranked early-warning list."""
    alerts = state.alerts_cache or []
    if country and country != "ALL":
        alerts = [a for a in alerts if a["country"] == country]
    return alerts


@app.get("/api/redistribution")
def get_redistribution(country: str = Query(None)):
    """Recommended transfers."""
    result = state.redistribution_cache or {"transfers": [], "international_aid": []}
    if country and country != "ALL":
        result = {
            "transfers": [t for t in result["transfers"] if
                          t["from_phc_id"].startswith(country) or t["to_phc_id"].startswith(country)],
            "international_aid": [a for a in result["international_aid"] if a["requesting_country"] == country],
        }
    return result


@app.post("/api/redistribution/approve")
def approve_transfer(req: ApproveRequest):
    """Approve a transfer: update in-memory stock."""
    transfers = state.redistribution_cache.get("transfers", [])
    transfer = None
    for t in transfers:
        if t["id"] == req.transfer_id:
            transfer = t
            break

    if transfer is None:
        raise HTTPException(404, "Transfer not found")

    if transfer["approved"]:
        return {"success": True, "transfer_id": req.transfer_id, "message": "Already approved"}

    # Update stock in daily_df (latest date)
    latest_date = state.daily_df["date"].max()
    med = transfer["medicine"]
    qty = transfer["quantity"]

    # Reduce from source
    mask_from = (
        (state.daily_df["phc_id"] == transfer["from_phc_id"]) &
        (state.daily_df["date"] == latest_date) &
        (state.daily_df["medicine"] == med)
    )
    if mask_from.any():
        old_from = state.daily_df.loc[mask_from, "stock_on_hand"].iloc[0]
        state.daily_df.loc[mask_from, "stock_on_hand"] = max(0, old_from - qty)
        updated_from = max(0, old_from - qty)
    else:
        updated_from = 0

    # Add to destination
    mask_to = (
        (state.daily_df["phc_id"] == transfer["to_phc_id"]) &
        (state.daily_df["date"] == latest_date) &
        (state.daily_df["medicine"] == med)
    )
    if mask_to.any():
        old_to = state.daily_df.loc[mask_to, "stock_on_hand"].iloc[0]
        state.daily_df.loc[mask_to, "stock_on_hand"] = old_to + qty
        updated_to = old_to + qty
    else:
        updated_to = qty

    transfer["approved"] = True

    # Recompute alerts after stock change
    state.alerts_cache = compute_alerts(
        state.daily_df, state.phcs_df,
        scenario_multipliers=state.scenario_multipliers
    )

    return {
        "success": True,
        "transfer_id": req.transfer_id,
        "message": f"Transferred {int(qty)} units of {med} from {transfer['from_phc_name']} to {transfer['to_phc_name']}",
        "updated_from_stock": round(updated_from, 0),
        "updated_to_stock": round(updated_to, 0),
    }


@app.post("/api/scenario")
def apply_scenario(req: ScenarioRequest):
    """Simulate an outbreak scenario."""
    # Set multipliers
    state.scenario_multipliers = {d: req.multiplier for d in req.districts}

    # Recompute alerts and redistribution
    _compute_alerts_and_redistribution()

    # Count affected PHCs
    affected_phcs = state.phcs_df[state.phcs_df["district"].isin(req.districts)]
    critical = len([a for a in state.alerts_cache if a["severity"] == "critical"])
    warning = len([a for a in state.alerts_cache if a["severity"] == "warning"])

    return {
        "success": True,
        "affected_phcs": len(affected_phcs),
        "new_critical_alerts": critical,
        "new_warning_alerts": warning,
        "message": f"{req.outbreak_type.title()} scenario applied: {req.multiplier}x demand multiplier in {', '.join(req.districts)}",
    }


@app.get("/api/federation")
def get_federation():
    """Federated learning status and metrics."""
    fed = state.federation
    if not fed:
        return {"current_round": 0, "total_rounds": 0, "per_country": [], "round_history": []}

    per_country = []
    for cc in sorted(fed["local_mapes"]):
        local = fed["local_mapes"][cc]
        federated = fed["federated_mapes"].get(cc, local)
        improvement = ((local - federated) / max(local, 0.1)) * 100
        per_country.append({
            "country": cc,
            "local_mape": local,
            "federated_mape": federated,
            "improvement_pct": round(improvement, 1),
            "sample_count": fed["sample_counts"].get(cc, 0),
        })

    return {
        "current_round": len(fed["round_history"]),
        "total_rounds": len(fed["round_history"]),
        "per_country": per_country,
        "round_history": fed["round_history"],
        "privacy_note": "Raw patient and stock data never leaves the country; only model weights are shared.",
    }


@app.post("/api/federation/train")
def train_federation_round():
    """Run one more federated round."""
    fed = state.federation
    current_round = len(fed["round_history"])
    result = run_one_more_round(
        state.daily_df,
        fed["global_weights"],
        current_round,
    )

    # Update state
    fed["round_history"].append({
        "round": result["new_round"],
        "global_mape": result["global_mape"],
        "per_country": result["per_country"],
    })
    fed["global_weights"] = result["global_weights"]
    fed["federated_mapes"] = result["per_country"]

    return {
        "success": True,
        "new_round": result["new_round"],
        "global_mape": result["global_mape"],
        "per_country": result["per_country"],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
