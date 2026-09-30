# Sanjeevani Grid — 3-Minute Demo Script 🎬

## Setup (Before Demo)
```bash
./run.sh
# Wait for "✅ Sanjeevani Grid is running!" message
# Open http://localhost:5173
```

---

## Minute 1: The Problem & Live Map (0:00 – 1:00)

### 🗣️ Narration
> "Public Health Centres across BRICS nations suffer from invisible stock-outs.
> Medicine supplies, bed availability, and staff attendance are tracked in
> isolated spreadsheets — nobody sees the full picture until it's too late."

### 👆 Actions
1. **Look at the KPI cards** at the top:
   - "X PHCs at stock-out risk" — this is the scale of the problem
   - Average days of cover, bed occupancy, staff attendance

2. **Look at the map** — see the coloured dots:
   - 🔴 Red = Critical (<5 days of stock)
   - 🟡 Amber = Warning (<10 days)
   - 🟢 Green = OK
   - "Right now, you can see clusters of red in certain districts"

3. **Click a red PHC marker** on the map:
   - Side panel opens showing medicine stock table
   - Each medicine shows days-of-cover with status badges
   - **Select a medicine** to see the forecast chart
   - "This Ridge regression model predicts 14-day demand with uncertainty bands"

4. **Point to the Early Warnings feed** on the right:
   - "Alerts are ranked by severity and population served"
   - Click an alert to fly to that PHC on the map

---

## Minute 2: Outbreak Simulation & Redistribution (1:00 – 2:00)

### 🗣️ Narration
> "What happens when dengue hits? Let's simulate a 3x demand surge."

### 👆 Actions
1. **Click "🦠 Simulate Outbreak"** button in the top bar
   - Select: Dengue, Districts: Pune, Delhi
   - Slide multiplier to **3x**
   - Click **"🚨 Apply Scenario"**

2. **Watch the dashboard update**:
   - KPI cards change — more stock-out risk
   - New critical alerts appear in the feed
   - Map markers turn redder in affected districts
   - "The system automatically detects the surge and flags PHCs at risk"

3. **Switch to "📦 Redistribution" tab**:
   - "The system solved a transportation problem to find optimal transfers"
   - Shows from → to, medicine, quantity, distance
   - Same-district transfers preferred (cheaper)

4. **Click "Approve" on the top 3 transfers**:
   - Watch the map: green lines appear showing approved transfers
   - Recipient PHCs start turning greener
   - KPI cards update — stock-out risk decreases
   - "One click to redistribute supplies across the network"

---

## Minute 3: Federated Learning & Scale (2:00 – 3:00)

### 🗣️ Narration
> "But how do we share intelligence across borders without sharing raw data?
> The answer: federated learning."

### 👆 Actions
1. **Switch to "🌐 Federation" tab**:
   - Point to the **privacy card**: "Raw data never leaves the country"
   - Show the **bar chart**: Local vs Federated MAPE
   - "Look at South Africa — sparse data, high noise. Local model has high error"
   - "But after federated averaging, ZA improves significantly"

2. **Look at the improvement table**:
   - ZA shows the largest improvement
   - "ZA benefits from patterns learned by India, Brazil, Russia, China"

3. **Click "🧠 Run Federated Round"**:
   - Watch the metrics update
   - Show the round-by-round line chart
   - "Each round, only 8 numbers cross the border — 7 coefficients + 1 intercept"

4. **Close with scale story**:
   - Use the **country selector** to filter to "🇮🇳 India" — instant filter
   - Switch to "🇿🇦 South Africa" — see the sparser data
   - Switch back to "All BRICS"

### 🗣️ Closing
> "Sanjeevani Grid gives every BRICS nation real-time visibility, predictive
> intelligence, and smart redistribution — while keeping data sovereign.
> From 100 PHCs in this demo to 100,000 PHCs in production, the architecture
> scales because each country node trains independently and only shares
> model weights. That's resilience."

---

## 🏗️ Tech Highlights (if asked)

- **Backend**: FastAPI, Ridge regression, FedAvg, scipy linprog
- **Frontend**: React + Vite + Tailwind + Recharts + Leaflet
- **Federation**: Weights-only sharing (7 floats per round)
- **Zero external dependencies**: No database, no auth, no paid APIs
- **One command**: `./run.sh`
