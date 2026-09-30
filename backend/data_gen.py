"""
Sanjeevani Grid — Synthetic data generator
Generates deterministic (seed=42) health-centre data for 5 BRICS countries.
"""

import os, json
import numpy as np
import pandas as pd
from pathlib import Path

SEED = 42
np.random.seed(SEED)

DATA_DIR = Path(__file__).parent / "data"

# ── 12 essential medicines ──────────────────────────────────────────
MEDICINES = [
    "ORS", "paracetamol", "amoxicillin", "artemether-lumefantrine",
    "insulin", "antivenom", "oxytocin", "metformin",
    "IV fluids", "doxycycline", "zinc", "malaria rapid test",
]

# ── Dengue-affected medicines (demand spike during outbreaks) ──────
DENGUE_MEDICINES = {"paracetamol", "IV fluids", "ORS"}

# ── Country / District / PHC definitions ───────────────────────────
# Each country has 4 districts; each district has 5 PHCs = 100 PHCs total.
# lat/lon are approximate centres; PHC coords are clustered around them.
COUNTRIES = {
    "IN": {
        "name": "India",
        "districts": {
            "Pune":      {"lat": 18.52, "lon": 73.86},
            "Delhi":     {"lat": 28.61, "lon": 77.21},
            "Chennai":   {"lat": 13.08, "lon": 80.27},
            "Nagpur":    {"lat": 21.15, "lon": 79.09},
        },
    },
    "BR": {
        "name": "Brazil",
        "districts": {
            "São Paulo":  {"lat": -23.55, "lon": -46.63},
            "Rio":        {"lat": -22.91, "lon": -43.17},
            "Brasília":   {"lat": -15.79, "lon": -47.88},
            "Salvador":   {"lat": -12.97, "lon": -38.51},
        },
    },
    "RU": {
        "name": "Russia",
        "districts": {
            "Moscow":        {"lat": 55.75, "lon": 37.62},
            "St Petersburg": {"lat": 59.93, "lon": 30.32},
            "Novosibirsk":   {"lat": 55.03, "lon": 82.92},
            "Kazan":         {"lat": 55.80, "lon": 49.11},
        },
    },
    "CN": {
        "name": "China",
        "districts": {
            "Beijing":   {"lat": 39.90, "lon": 116.40},
            "Shanghai":  {"lat": 31.23, "lon": 121.47},
            "Guangzhou": {"lat": 23.13, "lon": 113.26},
            "Chengdu":   {"lat": 30.57, "lon": 104.07},
        },
    },
    "ZA": {
        "name": "South Africa",
        "districts": {
            "Johannesburg": {"lat": -26.20, "lon": 28.04},
            "Cape Town":    {"lat": -33.93, "lon": 18.42},
            "Durban":       {"lat": -29.86, "lon": 31.02},
            "Pretoria":     {"lat": -25.75, "lon": 28.19},
        },
    },
}

# PHC name templates per district (5 names each)
PHC_SUFFIXES = ["Central", "North", "South", "East", "West"]

TOTAL_DAYS = 180  # 6 months of history

# Districts that will have a dengue-like outbreak (last 10 days)
OUTBREAK_DISTRICTS = ["Pune", "Delhi"]


def _phc_id(country: str, district: str, idx: int) -> str:
    """Generate a readable PHC identifier like IN-PUN-001."""
    abbr = district[:3].upper()
    return f"{country}-{abbr}-{idx+1:03d}"


def _generate_phc_list() -> pd.DataFrame:
    """Build the master list of 100 PHCs with coordinates."""
    rows = []
    for cc, cinfo in COUNTRIES.items():
        for dist, coords in cinfo["districts"].items():
            for i in range(5):
                pid = _phc_id(cc, dist, i)
                # Cluster coords within ~0.15° of district centre
                lat = coords["lat"] + np.random.uniform(-0.15, 0.15)
                lon = coords["lon"] + np.random.uniform(-0.15, 0.15)
                beds_total = int(np.random.randint(10, 35))
                staff_total = int(np.random.randint(8, 20))
                name = f"{dist} {PHC_SUFFIXES[i]} PHC"
                rows.append({
                    "phc_id": pid,
                    "name": name,
                    "country": cc,
                    "district": dist,
                    "lat": round(lat, 4),
                    "lon": round(lon, 4),
                    "beds_total": beds_total,
                    "staff_total": staff_total,
                })
    return pd.DataFrame(rows)


def _generate_daily_data(phcs: pd.DataFrame) -> pd.DataFrame:
    """Generate 180 days of daily stock/consumption/footfall/beds/staff data."""
    records = []
    dates = pd.date_range("2025-01-01", periods=TOTAL_DAYS, freq="D")

    for _, phc in phcs.iterrows():
        pid = phc["phc_id"]
        country = phc["country"]
        district = phc["district"]
        beds_total = phc["beds_total"]
        staff_total = phc["staff_total"]
        is_za = country == "ZA"

        # ZA sparse node: only last ~60 days of data (cold-start demo)
        if is_za:
            za_mask = np.zeros(TOTAL_DAYS, dtype=bool)
            za_mask[-60:] = True  # last 60 days only

        # Base footfall for this PHC (50-150 patients/day)
        base_footfall = np.random.uniform(50, 150)

        for med in MEDICINES:
            # ── Base consumption parameters ─────────────────────────
            base_consumption = np.random.uniform(5, 30)
            lead_time = int(np.random.choice([3, 5, 7, 10, 14]))

            # ── Determine if this PHC/medicine should be near stock-out or overstocked
            stock_bias = np.random.random()
            # ~10% near stock-out, ~10% overstocked, rest normal
            if stock_bias < 0.10:
                initial_stock_factor = np.random.uniform(2, 6)   # low stock
            elif stock_bias < 0.20:
                initial_stock_factor = np.random.uniform(60, 90) # overstocked
            else:
                initial_stock_factor = np.random.uniform(15, 40) # normal

            initial_stock = base_consumption * initial_stock_factor

            stock = initial_stock
            for d_idx, date in enumerate(dates):
                day_of_week = date.dayofweek  # 0=Mon
                day_of_year = date.dayofyear

                # ── ZA sparsity: skip days not in the mask ──────────
                if is_za and not za_mask[d_idx]:
                    continue

                # ── Footfall with weekly & seasonal patterns ────────
                weekly_factor = 1.0 + 0.15 * np.sin(2 * np.pi * day_of_week / 7)
                seasonal_factor = 1.0 + 0.2 * np.sin(2 * np.pi * day_of_year / 365)
                noise = np.random.normal(0, 0.1)
                footfall = max(10, base_footfall * weekly_factor * seasonal_factor * (1 + noise))

                # ── Consumption correlated with footfall ────────────
                consumption_ratio = base_consumption / base_footfall
                consumption = max(0, footfall * consumption_ratio * (1 + np.random.normal(0, 0.15)))

                # ── Outbreak injection: last 10 days in certain districts
                outbreak_flag = 0
                is_outbreak_district = district in OUTBREAK_DISTRICTS
                is_last_10_days = d_idx >= (TOTAL_DAYS - 10)
                if is_outbreak_district and is_last_10_days and med in DENGUE_MEDICINES:
                    outbreak_multiplier = np.random.uniform(2.0, 3.0)
                    consumption *= outbreak_multiplier
                    outbreak_flag = 1

                # ── Stock simulation ────────────────────────────────
                stock = max(0, stock - consumption)
                # Random restocking event (roughly every lead_time*2 days)
                if np.random.random() < 1.0 / (lead_time * 2):
                    restock_qty = base_consumption * np.random.uniform(15, 30)
                    stock += restock_qty

                # ── Beds & staff ────────────────────────────────────
                occ_rate = np.clip(0.5 + 0.3 * np.sin(2 * np.pi * d_idx / 30) + np.random.normal(0, 0.1), 0.2, 0.98)
                beds_occupied = int(beds_total * occ_rate)
                att_rate = np.clip(0.8 + np.random.normal(0, 0.08), 0.5, 1.0)
                staff_present = int(staff_total * att_rate)


                records.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "phc_id": pid,
                    "country": country,
                    "district": district,
                    "medicine": med,
                    "consumption": round(consumption, 1),
                    "stock_on_hand": round(stock, 0),
                    "restock_lead_time": lead_time,
                    "footfall": round(footfall, 0),
                    "beds_total": beds_total,
                    "beds_occupied": beds_occupied,
                    "staff_total": staff_total,
                    "staff_present": staff_present,
                    "outbreak_flag": outbreak_flag,
                })

    return pd.DataFrame(records)


def generate():
    """Main entry point: generate all data and save to /backend/data/."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    print("🏥  Generating PHC master list …")
    phcs = _generate_phc_list()
    phcs.to_csv(DATA_DIR / "phcs.csv", index=False)
    print(f"   → {len(phcs)} PHCs across {len(COUNTRIES)} countries")

    print("📊  Generating 180 days of daily data …")
    daily = _generate_daily_data(phcs)
    daily.to_csv(DATA_DIR / "daily.csv", index=False)
    print(f"   → {len(daily):,} rows")

    # Save metadata
    meta = {
        "medicines": MEDICINES,
        "countries": {k: v["name"] for k, v in COUNTRIES.items()},
        "outbreak_districts": OUTBREAK_DISTRICTS,
        "total_days": TOTAL_DAYS,
        "seed": SEED,
    }
    with open(DATA_DIR / "meta.json", "w") as f:
        json.dump(meta, f, indent=2)

    print("✅  Data generation complete → backend/data/")
    return phcs, daily


if __name__ == "__main__":
    generate()
