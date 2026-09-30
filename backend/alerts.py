"""
Sanjeevani Grid — Alert Engine
Computes days-of-cover and generates ranked early-warning alerts.
Severity: critical <5d, warning <10d, watch <20d.
"""

import pandas as pd
import numpy as np


def compute_alerts(daily_df: pd.DataFrame, phcs_df: pd.DataFrame,
                   forecasts: dict = None, scenario_multipliers: dict = None) -> list[dict]:
    """
    Generate stock-out alerts for all PHCs.

    Args:
        daily_df: daily stock/consumption data
        phcs_df: PHC master list
        forecasts: optional {(phc_id, medicine): [forecast_dicts]} for demand override
        scenario_multipliers: optional {district: multiplier} for outbreak scenarios

    Returns: list of alert dicts, sorted by severity then footfall.
    """
    # Get the latest day per PHC×medicine
    latest_date = daily_df["date"].max()
    latest = daily_df[daily_df["date"] == latest_date].copy()

    # Also compute average consumption over last 7 available days per PHC×medicine
    alerts = []
    alert_id = 0

    for _, row in latest.iterrows():
        phc_id = row["phc_id"]
        medicine = row["medicine"]
        stock = row["stock_on_hand"]
        lead_time = row["restock_lead_time"]
        footfall = row["footfall"]
        country = row["country"]
        district = row["district"]

        # Average daily demand (last 7 days or available)
        phc_med_data = daily_df[
            (daily_df["phc_id"] == phc_id) & (daily_df["medicine"] == medicine)
        ].sort_values("date")
        recent = phc_med_data.tail(7)
        avg_demand = recent["consumption"].mean() if len(recent) > 0 else 1.0

        # Apply scenario multiplier if active
        multiplier = 1.0
        if scenario_multipliers and district in scenario_multipliers:
            dengue_meds = {"paracetamol", "IV fluids", "ORS"}
            if medicine in dengue_meds:
                multiplier = scenario_multipliers[district]

        forecast_demand = avg_demand * multiplier
        forecast_demand = max(forecast_demand, 0.1)  # avoid division by zero

        # Days of cover
        days_of_cover = stock / forecast_demand

        # Severity classification
        if days_of_cover < 5:
            severity = "critical"
        elif days_of_cover < 10:
            severity = "warning"
        elif days_of_cover < 20:
            severity = "watch"
        else:
            continue  # No alert needed

        # Build reason string
        reason = f"{medicine} stock at {stock:.0f} units, {days_of_cover:.1f} days of cover"
        if row.get("outbreak_flag", 0) == 1:
            reason = f"Dengue surge in {district} district: {medicine} demand +{multiplier:.1f}x. " + reason
        elif multiplier > 1.0:
            reason = f"Simulated outbreak in {district}: {medicine} demand +{multiplier:.1f}x. " + reason

        # Get PHC name
        phc_info = phcs_df[phcs_df["phc_id"] == phc_id]
        phc_name = phc_info.iloc[0]["name"] if len(phc_info) > 0 else phc_id

        alert_id += 1
        alerts.append({
            "id": alert_id,
            "phc_id": phc_id,
            "phc_name": phc_name,
            "district": district,
            "country": country,
            "medicine": medicine,
            "severity": severity,
            "days_of_cover": round(days_of_cover, 1),
            "lead_time_days": lead_time,
            "reason": reason,
            "forecast_demand_14d": round(forecast_demand * 14, 0),
            "footfall": footfall,
        })

    # Sort: critical > warning > watch; within severity, highest footfall first
    severity_order = {"critical": 0, "warning": 1, "watch": 2}
    alerts.sort(key=lambda a: (severity_order[a["severity"]], -a["footfall"]))

    # Re-number after sort
    for i, a in enumerate(alerts):
        a["id"] = i + 1

    return alerts
