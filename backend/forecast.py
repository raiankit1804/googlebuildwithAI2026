"""
Sanjeevani Grid — Demand Forecasting Module
Ridge regression with lag features, rolling means, day-of-week, footfall, outbreak flag.
Produces 14-day forecasts with uncertainty bands.
"""

import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge


def _build_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Build feature matrix for a single PHC × medicine time-series.
    Features: lag_1, lag_7, lag_14, rolling_7d_mean, day_of_week, footfall, outbreak_flag.
    """
    df = df.sort_values("date").copy()
    df["lag_1"] = df["consumption"].shift(1)
    df["lag_7"] = df["consumption"].shift(7)
    df["lag_14"] = df["consumption"].shift(14)
    df["rolling_7"] = df["consumption"].rolling(7, min_periods=1).mean()
    df["day_of_week"] = pd.to_datetime(df["date"]).dt.dayofweek
    # footfall and outbreak_flag already in df
    return df.dropna(subset=["lag_1", "lag_7", "lag_14"])


FEATURE_COLS = ["lag_1", "lag_7", "lag_14", "rolling_7", "day_of_week", "footfall", "outbreak_flag"]


def train_ridge(df: pd.DataFrame, alpha: float = 1.0):
    """
    Train a Ridge regression model on prepared features.
    Returns: (model, residual_std, X_test, y_test, mape)
    """
    feat_df = _build_features(df)
    if len(feat_df) < 20:
        return None, None, None, None, None

    # Hold out last 14 days for evaluation
    train = feat_df.iloc[:-14]
    test = feat_df.iloc[-14:]

    X_train = train[FEATURE_COLS].values
    y_train = train["consumption"].values
    X_test = test[FEATURE_COLS].values
    y_test = test["consumption"].values

    model = Ridge(alpha=alpha)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_train)
    residual_std = float(np.std(y_train - y_pred))

    # MAPE on test set
    y_test_pred = model.predict(X_test)
    mape = float(np.mean(np.abs((y_test - y_test_pred) / np.maximum(y_test, 1))) * 100)

    return model, residual_std, X_test, y_test, mape


def forecast_14d(model, last_row: dict, residual_std: float,
                 outbreak_multiplier: float = 1.0) -> list[dict]:
    """
    Generate 14-day ahead forecast from the last known data point.
    Returns list of {date, predicted, lower, upper}.
    """
    if model is None:
        return []

    base_date = pd.to_datetime(last_row["date"])
    predictions = []

    # Running values for lag features
    recent = [last_row.get("consumption", 0)] * 15  # pad with last known
    rolling_vals = list(recent[:7])

    for step in range(14):
        future_date = base_date + pd.Timedelta(days=step + 1)
        dow = future_date.dayofweek

        lag1 = recent[-1] if len(recent) > 0 else 0
        lag7 = recent[-7] if len(recent) >= 7 else recent[0]
        lag14 = recent[-14] if len(recent) >= 14 else recent[0]
        roll7 = np.mean(recent[-7:]) if len(recent) >= 7 else np.mean(recent)

        features = np.array([[lag1, lag7, lag14, roll7, dow,
                               last_row.get("footfall", 80),
                               last_row.get("outbreak_flag", 0)]])

        pred = float(model.predict(features)[0]) * outbreak_multiplier
        pred = max(0, pred)

        predictions.append({
            "date": future_date.strftime("%Y-%m-%d"),
            "predicted": round(pred, 1),
            "lower": round(max(0, pred - 1.5 * residual_std), 1),
            "upper": round(pred + 1.5 * residual_std, 1),
        })
        recent.append(pred)

    return predictions


def get_model_weights(model) -> dict:
    """Extract Ridge coefficients + intercept for federated averaging."""
    if model is None:
        return {}
    return {
        "coef": model.coef_.tolist(),
        "intercept": float(model.intercept_),
    }


def set_model_weights(model, weights: dict):
    """Set Ridge coefficients + intercept from federated global model."""
    model.coef_ = np.array(weights["coef"])
    model.intercept_ = weights["intercept"]
    return model
