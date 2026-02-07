"""
FastAPI ML Prediction Service
-----------------------------
(c) 2026 Telemedicine

Serves:
1. Classical Model: Logistic Regression (Scikit-learn)
2. Quantum Model: Quantum Support Vector Classifier (QSVC via Qiskit)

This service provides endpoints for:
- Health checks and model status
- Feature metadata
- Real-time predictions
"""

import os
import sys
import logging
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- Logging Configuration ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("ml-service")

# --- FastAPI App ---
app = FastAPI(
    title="Telemedicine ML API",
    description="API for Classical and Quantum AI model predictions",
    version="1.0.0"
)

# --- CORS Configuration ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Configuration ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(SCRIPT_DIR, "models")

# Global model storage
models: Dict[str, Any] = {"classical": None, "quantum": None}
load_errors: Dict[str, Optional[str]] = {"classical": None, "quantum": None}

# --- Model Loading Logic ---
def load_models():
    """
    Attempts to load both Classical and Quantum models from disk.
    Updates the global `models` and `load_errors` dictionaries.
    """
    global models, load_errors
    
    try:
        import joblib
    except ImportError as e:
        msg = f"joblib not installed: {e}"
        logger.error(msg)
        load_errors["classical"] = msg
        load_errors["quantum"] = msg
        return
    
    classical_path = os.path.join(MODELS_DIR, "classical_logistic_regression_FULL.pkl")
    quantum_path = os.path.join(MODELS_DIR, "quantum_qsvc_FULL.pkl")
    
    # Load Classical Model
    try:
        if os.path.exists(classical_path):
            models["classical"] = joblib.load(classical_path)
            logger.info("✅ Classical model loaded successfully")
        else:
            msg = f"File not found: {classical_path}"
            load_errors["classical"] = msg
            logger.warning(f"⚠️ Classical model not found at {classical_path}")
    except Exception as e:
        load_errors["classical"] = str(e)
        logger.error(f"❌ Classical model error: {e}")
    
    # Load Quantum Model
    try:
        if os.path.exists(quantum_path):
            models["quantum"] = joblib.load(quantum_path)
            logger.info("✅ Quantum model loaded successfully")
        else:
            msg = f"File not found: {quantum_path}"
            load_errors["quantum"] = msg
            logger.warning(f"⚠️ Quantum model not found at {quantum_path}")
    except Exception as e:
        load_errors["quantum"] = str(e)
        logger.error(f"❌ Quantum model error: {e}")

# Load models on startup
logger.info("🚀 Starting ML Service and loading models...")
load_models()

# --- Pydantic Data Models ---
class PredictRequest(BaseModel):
    features: List[float]

# --- Endpoints ---

@app.get("/")
def root():
    """Root endpoint providing API information."""
    return {
        "message": "Health Hub ML Prediction API",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
def health_check():
    """
    Health check endpoint.
    Returns the status of the service and loaded models.
    """
    versions = {}
    try:
        import qiskit
        import qiskit_machine_learning
        import sklearn
        versions = {
            "qiskit": qiskit.__version__,
            "qiskit_ml": qiskit_machine_learning.__version__,
            "sklearn": sklearn.__version__
        }
    except ImportError as e:
        logger.warning(f"Could not retrieve package versions: {e}")

    return {
        "status": "healthy",
        "versions": versions,
        "models_loaded": {
            "classical": models["classical"] is not None,
            "quantum": models["quantum"] is not None
        },
        "errors": load_errors
    }

@app.get("/features")
def get_features():
    """
    Get feature names required by the model.
    Useful for frontend dynamic form generation.
    """
    feature_names = []
    n_features = 29  # Default fallback
    
    if models["classical"] is not None:
        if hasattr(models["classical"], "feature_names_in_"):
            feature_names = list(models["classical"].feature_names_in_)
            n_features = len(feature_names)
        elif hasattr(models["classical"], "n_features_in_"):
            n_features = models["classical"].n_features_in_
            feature_names = [f"feature_{i}" for i in range(n_features)]
    
    return {
        "n_features": n_features,
        "feature_names": feature_names
    }

@app.post("/predict/classical")
def predict_classical(request: PredictRequest):
    """
    Make a prediction using the Classical Logistic Regression model.
    """
    if models["classical"] is None:
        raise HTTPException(
            status_code=503,
            detail=f"Classical model not loaded: {load_errors['classical']}"
        )
    
    try:
        import pandas as pd
        
        # Determine feature names
        feature_names = None
        if hasattr(models["classical"], "feature_names_in_"):
            feature_names = models["classical"].feature_names_in_
        else:
            feature_names = [f"feature_{i}" for i in range(len(request.features))]
        
        # Create DataFrame
        features_df = pd.DataFrame([request.features], columns=feature_names)
        
        prediction = str(models["classical"].predict(features_df)[0])
        
        probabilities = None
        if hasattr(models["classical"], "predict_proba"):
            proba = models["classical"].predict_proba(features_df)[0]
            probabilities = [float(p) for p in proba]
        
        logger.info(f"Classical Prediction: {prediction}")
        return {
            "model": "classical_logistic_regression",
            "prediction": prediction,
            "probabilities": probabilities,
            "message": "Prediction successful"
        }
    except Exception as e:
        logger.error(f"Classical Prediction Failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/predict/quantum")
def predict_quantum(request: PredictRequest):
    """
    Make a prediction using the Quantum QSVC model.
    Handles feature mismatch injection (facility_id) automatically.
    """
    if models["quantum"] is None:
        raise HTTPException(
            status_code=503,
            detail=f"Quantum model not loaded: {load_errors['quantum']}"
        )
    
    try:
        import pandas as pd
        
        # Define the exact 30 feature names expected by the Quantum model
        quantum_feature_names = [
            'symptom_fever', 'symptom_cough', 'symptom_sore_throat', 'symptom_diarrhea',
            'symptom_vomiting', 'symptom_rash', 'symptom_headache', 'symptom_dizziness',
            'symptom_chest_pain', 'symptom_palpitations', 'symptom_dysuria',
            'symptom_freq_urination', 'symptom_joint_pain', 'symptom_back_pain',
            'symptom_ear_pain', 'symptom_runny_nose', 'symptom_eye_redness',
            'symptom_fatigue', 'temp_c', 'spo2', 'heart_rate', 'triage_level',
            'visit_mode', 'region_id', 'facility_id', 'age_group', 'gender',
            'chronic_diabetes', 'chronic_hypertension', 'risk_group'
        ]
        
        # Handle feature count mismatch (Frontend send 29, Quantum needs 30)
        # Quantum expects 'facility_id' at index 24
        features_list = list(request.features)
        if len(features_list) == 29:
            # Inject default facility_id (1.0) at index 24
            features_list.insert(24, 1.0)
            
        # Create DataFrame with proper column names
        features_df = pd.DataFrame([features_list], columns=quantum_feature_names)
        
        prediction = str(models["quantum"].predict(features_df)[0])
        
        probabilities = None
        if hasattr(models["quantum"], "predict_proba"):
            try:
                proba = models["quantum"].predict_proba(features_df)[0]
                probabilities = [float(p) for p in proba]
            except Exception:
                pass
        
        logger.info(f"Quantum Prediction: {prediction}")
        return {
            "model": "quantum_qsvc",
            "prediction": prediction,
            "probabilities": probabilities,
            "message": "Prediction successful"
        }
    except Exception as e:
        logger.error(f"Quantum Prediction Failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
