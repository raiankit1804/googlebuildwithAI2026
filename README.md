# Sanjeevani Grid 🏥

**Federated AI Platform for National-Scale Health Resource Management across BRICS Nations**

> *Real-time visibility. Predictive intelligence. Privacy-preserving federation.*

---

## 🚀 Quick Start

```bash
# One command to start everything
./run.sh
```

This will:
1. Create a Python virtual environment and install backend dependencies
2. Generate synthetic data (100 PHCs × 12 medicines × 180 days)
3. Train forecast models and run 5 rounds of federated learning
4. Start the FastAPI backend on **:8000**
5. Start the React frontend on **:5173**

Open **http://localhost:5173** in your browser.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    SANJEEVANI GRID                            │
│                                                              │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐                │
│  │  🇮🇳 IN   │   │  🇧🇷 BR   │   │  🇷🇺 RU   │ ← Country    │
│  │  Node    │   │  Node    │   │  Node    │   Nodes        │
│  │(20 PHCs) │   │(20 PHCs) │   │(20 PHCs) │                │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘                │
│       │              │              │                        │
│  ┌────┴──────────────┴──────────────┴────┐                  │
│  │         FedAvg Aggregation Server      │ ← Only model    │
│  │   (weighted avg of Ridge coefficients) │   weights shared │
│  └────┬──────────────┬──────────────┬────┘                  │
│       │              │              │                        │
│  ┌────┴─────┐   ┌────┴─────┐                                │
│  │  🇨🇳 CN   │   │  🇿🇦 ZA   │ ← ZA: sparse node            │
│  │  Node    │   │  Node    │   (30 days, high noise)        │
│  │(20 PHCs) │   │(20 PHCs) │   benefits most from           │
│  └──────────┘   └──────────┘   federation                   │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                   FastAPI Backend (:8000)               │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐ │  │
│  │  │Forecast  │ │ Alerts   │ │Redistrib │ │Federation │ │  │
│  │  │(Ridge)   │ │(DoC)     │ │(LP solve)│ │(FedAvg)   │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └───────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
│                          ↕ REST API                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              React + Vite Frontend (:5173)              │  │
│  │  Map │ KPIs │ Alerts │ Redistribution │ Federation     │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
├── run.sh                  # One-command launcher
├── API_CONTRACT.md         # API specification
├── README.md               # This file
├── DEMO_SCRIPT.md          # 3-minute demo walkthrough
├── backend/
│   ├── main.py             # FastAPI server
│   ├── data_gen.py         # Synthetic data generator
│   ├── forecast.py         # Ridge regression forecasting
│   ├── federated.py        # FedAvg implementation
│   ├── alerts.py           # Stock-out alert engine
│   ├── redistribute.py     # Transportation problem solver
│   ├── requirements.txt    # Python dependencies
│   └── data/               # Generated CSV data (gitignored)
└── frontend/
    ├── src/
    │   ├── App.jsx          # Main React application
    │   ├── main.jsx         # Entry point
    │   └── index.css        # Global styles + design system
    ├── index.html           # HTML template
    ├── vite.config.js       # Vite + Tailwind config
    └── package.json         # Node dependencies
```

---

## 🧠 How Federation Works

### The Problem
- Each BRICS nation has its own PHC data (stock, consumption, footfall)
- **Raw data cannot leave the country** (sovereignty, privacy)
- But **better models** can be trained with more data

### The Solution: Federated Learning (FedAvg)

```
Round 1:
  1. Server sends global Ridge weights to all 5 country nodes
  2. Each node trains locally on its own data
  3. Each node sends back ONLY coefficients + sample count
  4. Server computes weighted average (FedAvg)
  5. Repeat for 5 rounds

Result: ZA (sparse, noisy data) improves dramatically because it
        benefits from patterns learned by IN, BR, RU, CN without
        ever seeing their raw data.
```

**Privacy guarantee**: Only 7 Ridge coefficients + 1 intercept are shared per round. No patient data, no stock levels, no identifiable information crosses borders.

---

## 🔧 Tech Stack

| Layer      | Technology                                           |
|------------|------------------------------------------------------|
| Backend    | Python 3.11+, FastAPI, uvicorn                       |
| ML         | scikit-learn (Ridge), scipy (linprog), numpy, pandas |
| Frontend   | React 18, Vite, Tailwind CSS v4, Recharts            |
| Map        | react-leaflet + OpenStreetMap                        |
| Data       | In-memory (pandas DataFrames) + CSV seed data        |

---

## 📡 API Endpoints

| Method | Endpoint                     | Description                          |
|--------|------------------------------|--------------------------------------|
| GET    | `/api/overview`              | KPI summary (stock-out risk, etc.)   |
| GET    | `/api/phcs`                  | All PHCs with lat/lon and status     |
| GET    | `/api/phc/{id}`              | PHC detail with stock and history    |
| GET    | `/api/forecast`              | 14-day demand forecast               |
| GET    | `/api/alerts`                | Ranked early-warning list            |
| GET    | `/api/redistribution`        | Recommended transfers                |
| POST   | `/api/redistribution/approve`| Approve a transfer                   |
| POST   | `/api/scenario`              | Simulate outbreak                    |
| GET    | `/api/federation`            | Federated learning metrics           |
| POST   | `/api/federation/train`      | Run one more federated round         |

See [API_CONTRACT.md](API_CONTRACT.md) for full request/response schemas.

---

## 🎯 Key Features

1. **Real-time Visibility**: Map view of all 100 PHCs colour-coded by stock status (green/amber/red)
2. **Demand Forecasting**: Ridge regression with lag features, weekly seasonality, outbreak detection
3. **Early Warning System**: Days-of-cover alerts ranked by severity and population served
4. **Smart Redistribution**: Transportation problem solver minimising distance with cross-district penalties
5. **Federated Learning**: FedAvg across 5 BRICS nations — raw data never leaves the country
6. **Scenario Simulation**: Simulate dengue/cholera/flu outbreaks and see real-time impact

---

## 📜 License

Built for the Google Hackathon. MIT License.
