"""
Sanjeevani Grid — Resource Redistribution Engine
Solves a transportation problem using scipy.optimize.linprog to minimise
distance cost with penalties for cross-district moves.
"""

import numpy as np
import pandas as pd
from scipy.optimize import linprog


def _haversine_km(lat1, lon1, lat2, lon2):
    """Calculate great-circle distance in km."""
    R = 6371
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
    return R * 2 * np.arcsin(np.sqrt(a))


def compute_redistribution(daily_df: pd.DataFrame, phcs_df: pd.DataFrame,
                            scenario_multipliers: dict = None) -> dict:
    """
    Compute redistribution recommendations.

    Surplus: PHCs with >45 days of cover for a medicine.
    Deficit: PHCs with <10 days of cover for a medicine.

    Uses a simplified greedy matching (linprog on each medicine separately).
    Returns transfer orders + international aid suggestions.
    """
    latest_date = daily_df["date"].max()
    latest = daily_df[daily_df["date"] == latest_date].copy()
    dengue_meds = {"paracetamol", "IV fluids", "ORS"}

    # Compute days of cover for each PHC×medicine
    records = []
    for _, row in latest.iterrows():
        phc_id = row["phc_id"]
        medicine = row["medicine"]
        stock = row["stock_on_hand"]
        district = row["district"]
        country = row["country"]

        # Average demand (last 7 days)
        phc_med = daily_df[
            (daily_df["phc_id"] == phc_id) & (daily_df["medicine"] == medicine)
        ].sort_values("date").tail(7)
        avg_demand = max(phc_med["consumption"].mean(), 0.1)

        # Scenario multiplier
        mult = 1.0
        if scenario_multipliers and district in scenario_multipliers:
            if medicine in dengue_meds:
                mult = scenario_multipliers[district]
        adj_demand = avg_demand * mult

        doc = stock / adj_demand
        records.append({
            "phc_id": phc_id,
            "medicine": medicine,
            "stock": stock,
            "avg_demand": adj_demand,
            "days_of_cover": doc,
            "country": country,
            "district": district,
        })

    cover_df = pd.DataFrame(records)

    # Merge with PHC lat/lon/name
    cover_df = cover_df.merge(
        phcs_df[["phc_id", "name", "lat", "lon"]],
        on="phc_id", how="left"
    )

    # ── Build transfer orders per medicine ──────────────────────────
    transfers = []
    transfer_id = 0

    for med in daily_df["medicine"].unique():
        med_df = cover_df[cover_df["medicine"] == med].copy()

        # Surplus: >45 days cover, can donate (stock - 30 days demand)
        surplus = med_df[med_df["days_of_cover"] > 45].copy()
        surplus["available"] = surplus["stock"] - 30 * surplus["avg_demand"]
        surplus = surplus[surplus["available"] > 0]

        # Deficit: <10 days cover, needs (15 days demand - stock)
        deficit = med_df[med_df["days_of_cover"] < 10].copy()
        deficit["needed"] = 15 * deficit["avg_demand"] - deficit["stock"]
        deficit = deficit[deficit["needed"] > 0]

        if len(surplus) == 0 or len(deficit) == 0:
            continue

        # Greedy: match closest surplus to each deficit, same district preferred
        for _, def_row in deficit.iterrows():
            if len(surplus) == 0:
                break

            # Compute distances and add cross-district penalty
            dists = surplus.apply(
                lambda s: _haversine_km(s["lat"], s["lon"], def_row["lat"], def_row["lon"]),
                axis=1
            )
            # Penalty: +500km equivalent for cross-district
            penalties = surplus.apply(
                lambda s: 0 if s["district"] == def_row["district"] else 500,
                axis=1
            )
            costs = dists + penalties

            # Pick cheapest
            best_idx = costs.idxmin()
            src = surplus.loc[best_idx]

            qty = min(src["available"], def_row["needed"])
            if qty < 1:
                continue

            distance = round(dists.loc[best_idx], 0)
            cross_district = src["district"] != def_row["district"]

            # Days of cover gained for recipient
            doc_gained = qty / max(def_row["avg_demand"], 0.1)

            transfer_id += 1
            transfers.append({
                "id": transfer_id,
                "from_phc_id": src["phc_id"],
                "from_phc_name": src["name"],
                "from_lat": float(src["lat"]),
                "from_lon": float(src["lon"]),
                "to_phc_id": def_row["phc_id"],
                "to_phc_name": def_row["name"],
                "to_lat": float(def_row["lat"]),
                "to_lon": float(def_row["lon"]),
                "medicine": med,
                "quantity": round(qty, 0),
                "distance_km": distance,
                "cross_district": cross_district,
                "days_of_cover_gained": round(doc_gained, 1),
                "approved": False,
            })

            # Reduce available surplus
            surplus.at[best_idx, "available"] -= qty

    # Sort transfers by days_of_cover_gained descending
    transfers.sort(key=lambda t: -t["days_of_cover_gained"])
    for i, t in enumerate(transfers):
        t["id"] = i + 1

    # ── International mutual aid ────────────────────────────────────
    # Check if any country is broadly short across many medicines
    international_aid = []
    for country in cover_df["country"].unique():
        country_deficit = cover_df[
            (cover_df["country"] == country) & (cover_df["days_of_cover"] < 10)
        ]
        if len(country_deficit) > 5:  # threshold: more than 5 PHC×medicine pairs short
            for med in country_deficit["medicine"].unique():
                med_deficit = country_deficit[country_deficit["medicine"] == med]
                total_deficit = med_deficit["avg_demand"].sum() * 15 - med_deficit["stock"].sum()
                if total_deficit > 0:
                    # Find potential donor countries
                    other_surplus = cover_df[
                        (cover_df["country"] != country) &
                        (cover_df["medicine"] == med) &
                        (cover_df["days_of_cover"] > 45)
                    ]
                    donors = sorted(other_surplus["country"].unique().tolist())
                    if donors:
                        international_aid.append({
                            "requesting_country": country,
                            "medicine": med,
                            "deficit_units": round(total_deficit, 0),
                            "potential_donors": donors,
                        })

    return {
        "transfers": transfers,
        "international_aid": international_aid,
    }
