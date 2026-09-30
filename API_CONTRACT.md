# Sanjeevani Grid — API Contract

Base URL: `http://localhost:8000`  
CORS: enabled for all origins  
All responses: `application/json`

---

## GET /api/overview

KPI summary across all (or filtered) PHCs.

**Query params:**  
- `country` (optional): ISO-2 code (IN, BR, RU, CN, ZA). Omit for global.

**Response 200:**
```json
{
  "total_phcs": 100,
  "stockout_risk_count": 23,
  "avg_days_of_cover": 18.4,
  "bed_occupancy_pct": 72.5,
  "staff_attendance_pct": 85.3,
  "country_filter": null
}
```

---

## GET /api/phcs

List all PHCs with location and status.

**Query params:**  
- `country` (optional): ISO-2 code

**Response 200:**
```json
[
  {
    "id": "IN-MH-PUN-001",
    "name": "Pune Urban PHC",
    "country": "IN",
    "district": "Pune",
    "lat": 18.52,
    "lon": 73.86,
    "status": "critical",
    "worst_days_of_cover": 3.2,
    "beds_total": 20,
    "beds_occupied": 17,
    "staff_total": 12,
    "staff_present": 10
  }
]
```

`status` is one of: `"critical"` (<5 days), `"warning"` (<10 days), `"watch"` (<20 days), `"ok"` (>=20 days).

---

## GET /api/phc/{phc_id}

Detail for one PHC including stock table, beds, staff, and 30-day history.

**Response 200:**
```json
{
  "id": "IN-MH-PUN-001",
  "name": "Pune Urban PHC",
  "country": "IN",
  "district": "Pune",
  "lat": 18.52,
  "lon": 73.86,
  "status": "critical",
  "beds_total": 20,
  "beds_occupied": 17,
  "staff_total": 12,
  "staff_present": 10,
  "stock": [
    {
      "medicine": "ORS",
      "stock_on_hand": 120,
      "daily_consumption_avg": 18.5,
      "days_of_cover": 6.5,
      "lead_time_days": 7,
      "status": "warning"
    }
  ],
  "history": [
    {
      "date": "2025-06-01",
      "footfall": 85,
      "beds_occupied": 15,
      "staff_present": 10,
      "stock": { "ORS": 200, "paracetamol": 150 }
    }
  ]
}
```

---

## GET /api/forecast

14-day demand forecast for a PHC + medicine.

**Query params (required):**  
- `phc_id`: PHC identifier  
- `medicine`: medicine name  

**Response 200:**
```json
{
  "phc_id": "IN-MH-PUN-001",
  "medicine": "ORS",
  "history": [
    { "date": "2025-06-01", "actual": 18.0 }
  ],
  "forecast": [
    { "date": "2025-07-01", "predicted": 22.0, "lower": 16.0, "upper": 28.0 }
  ],
  "model": "ridge_federated",
  "mape": 12.3
}
```

`history` contains last 30 days of actual consumption.  
`forecast` contains next 14 days with uncertainty band (±1 std of residuals).

---

## GET /api/alerts

Ranked early-warning list.

**Query params:**  
- `country` (optional)

**Response 200:**
```json
[
  {
    "id": 1,
    "phc_id": "IN-MH-PUN-001",
    "phc_name": "Pune Urban PHC",
    "district": "Pune",
    "country": "IN",
    "medicine": "ORS",
    "severity": "critical",
    "days_of_cover": 3.2,
    "lead_time_days": 7,
    "reason": "Dengue surge in Pune district: ORS demand +2.4x",
    "forecast_demand_14d": 308.0
  }
]
```

Sorted: critical first, then warning, then watch. Within same severity, by population (footfall) descending.

---

## GET /api/redistribution

Recommended transfer orders.

**Query params:**  
- `country` (optional)

**Response 200:**
```json
{
  "transfers": [
    {
      "id": 1,
      "from_phc_id": "IN-MH-NAG-003",
      "from_phc_name": "Nagpur South PHC",
      "from_lat": 21.14,
      "from_lon": 79.08,
      "to_phc_id": "IN-MH-PUN-001",
      "to_phc_name": "Pune Urban PHC",
      "to_lat": 18.52,
      "to_lon": 73.86,
      "medicine": "ORS",
      "quantity": 200,
      "distance_km": 535.0,
      "cross_district": true,
      "days_of_cover_gained": 10.8,
      "approved": false
    }
  ],
  "international_aid": [
    {
      "requesting_country": "ZA",
      "medicine": "ORS",
      "deficit_units": 500,
      "potential_donors": ["IN", "BR"]
    }
  ]
}
```

---

## POST /api/redistribution/approve

Approve a transfer; updates in-memory stock.

**Request body:**
```json
{ "transfer_id": 1 }
```

**Response 200:**
```json
{
  "success": true,
  "transfer_id": 1,
  "message": "Transferred 200 units of ORS from Nagpur South PHC to Pune Urban PHC",
  "updated_from_stock": 800,
  "updated_to_stock": 320
}
```

---

## POST /api/scenario

Simulate an outbreak scenario; recomputes forecasts, alerts, transfers.

**Request body:**
```json
{
  "outbreak_type": "dengue",
  "districts": ["Pune", "Delhi"],
  "multiplier": 3.0
}
```

**Response 200:**
```json
{
  "success": true,
  "affected_phcs": 10,
  "new_critical_alerts": 8,
  "new_warning_alerts": 5,
  "message": "Dengue scenario applied: 3.0x demand multiplier in Pune, Delhi"
}
```

---

## GET /api/federation

Federated learning status and metrics.

**Response 200:**
```json
{
  "current_round": 5,
  "total_rounds": 5,
  "per_country": [
    {
      "country": "IN",
      "local_mape": 15.2,
      "federated_mape": 12.1,
      "improvement_pct": 20.4,
      "sample_count": 12600
    }
  ],
  "round_history": [
    { "round": 1, "global_mape": 18.5, "per_country": { "IN": 16.0, "BR": 17.2, "RU": 15.8, "CN": 14.5, "ZA": 28.0 } }
  ],
  "privacy_note": "Raw patient and stock data never leaves the country; only model weights are shared."
}
```

ZA must show the largest improvement from federation.

---

## POST /api/federation/train

Run one additional federated round.

**Response 200:**
```json
{
  "success": true,
  "new_round": 6,
  "global_mape": 11.8,
  "per_country": { "IN": 11.5, "BR": 12.0, "RU": 11.2, "CN": 10.8, "ZA": 16.5 }
}
```
