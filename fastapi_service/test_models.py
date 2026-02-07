"""Test script to check model loading"""
import joblib
import os

models_dir = os.path.join(os.path.dirname(__file__), "..", "models")
classical_path = os.path.join(models_dir, "classical_logistic_regression_FULL.pkl")
quantum_path = os.path.join(models_dir, "quantum_qsvc_FULL.pkl")

print(f"Classical model path: {classical_path}")
print(f"Exists: {os.path.exists(classical_path)}")

print(f"\nQuantum model path: {quantum_path}")
print(f"Exists: {os.path.exists(quantum_path)}")

print("\n--- Attempting to load Classical model ---")
try:
    import warnings
    warnings.filterwarnings('ignore')
    model = joblib.load(classical_path)
    print(f"SUCCESS! Type: {type(model)}")
    if hasattr(model, 'n_features_in_'):
        print(f"Number of features: {model.n_features_in_}")
    if hasattr(model, 'feature_names_in_'):
        print(f"Feature names: {model.feature_names_in_}")
except Exception as e:
    print(f"FAILED: {e}")

print("\n--- Attempting to load Quantum model ---")
try:
    model = joblib.load(quantum_path)
    print(f"SUCCESS! Type: {type(model)}")
    if hasattr(model, 'n_features_in_'):
        print(f"Number of features: {model.n_features_in_}")
except Exception as e:
    print(f"FAILED: {e}")
