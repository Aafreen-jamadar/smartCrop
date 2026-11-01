"""
SmartCrop - Flask ML API (crop recommendation)

Only the Spring Boot backend calls this API (http://127.0.0.1:5001), the browser never does.

    GET  /          -> health text
    GET  /health    -> {"status": "ok", "crop_model": true}
    POST /predict   -> {"N","P","K","temperature","humidity","ph","rainfall"}
                       -> {"status","crop","confidence","alternatives":[{"crop","probability"}]}

crop_model.pkl, minmaxscaler.pkl and standscaler.pkl must be in this same folder.
"""
import os
import traceback
import warnings

import joblib
import numpy as np
from flask import Flask, jsonify, request

# The MinMaxScaler was fitted with column names; we pass a plain array, which only triggers a harmless warning.
warnings.filterwarnings("ignore", message="X does not have valid feature names")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__)

try:
    model = joblib.load(os.path.join(BASE_DIR, "crop_model.pkl"))
    scaler = joblib.load(os.path.join(BASE_DIR, "standscaler.pkl"))
    mm = joblib.load(os.path.join(BASE_DIR, "minmaxscaler.pkl"))
    print("Crop model and scalers loaded successfully", flush=True)
except Exception:
    print("Error loading crop model/scalers", flush=True)
    traceback.print_exc()
    raise

crop_reverse_dict = {
    1: "rice", 2: "maize", 3: "jute", 4: "cotton", 5: "coconut", 6: "papaya",
    7: "orange", 8: "apple", 9: "muskmelon", 10: "watermelon", 11: "grapes",
    12: "mango", 13: "banana", 14: "pomegranate", 15: "lentil", 16: "blackgram",
    17: "mungbean", 18: "mothbeans", 19: "pigeonpeas", 20: "kidneybeans",
    21: "chickpea", 22: "coffee",
}

FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]


def error(message, status=400):
    return jsonify({"status": "error", "message": message}), status


@app.route("/")
def home():
    return "SmartCrop Flask API is running!"


@app.route("/health")
def health():
    return jsonify({"status": "ok", "crop_model": True})


@app.route("/predict", methods=["POST"])
def predict_crop():
    data = request.get_json(silent=True)
    if data is None:
        return error("No JSON data received")

    values = []
    for field in FEATURES:
        if field not in data or data[field] is None or data[field] == "":
            return error(f"Invalid input data: {field} is missing")
        try:
            values.append(float(data[field]))
        except (TypeError, ValueError):
            return error(f"Invalid input data: {field} must be a valid number")

    try:
        scaled = scaler.transform(mm.transform(np.array([values])))
        probs = model.predict_proba(scaled)[0]
        order = np.argsort(probs)[::-1][:3]
        ranked = [
            {"crop": crop_reverse_dict.get(int(model.classes_[i]), "Unknown Crop"),
             "probability": round(float(probs[i]), 4)}
            for i in order
        ]
        return jsonify({
            "status": "success",
            "crop": ranked[0]["crop"],
            "confidence": ranked[0]["probability"],
            "alternatives": ranked[1:],
        })
    except Exception as e:
        traceback.print_exc()
        return error(f"Prediction error: {e}", 500)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=False)
