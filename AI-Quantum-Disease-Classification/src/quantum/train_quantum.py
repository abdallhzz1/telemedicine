import time
from src.common.data_loader import load_data
from src.common.preprocess import build_preprocess_pipeline
from src.common.metrics import evaluate_model
from src.quantum.quantum_data import select_top_k_classes, build_balanced_quantum_sets
from src.quantum.quantum_model import build_quantum_pipeline

def train_quantum(visits_path, patients_path, symptom_cols, vital_cols, cat_cols, bin_cols, target="diagnosis_group"):
    # Load and filter top 4 classes
    df = load_data(visits_path, patients_path, target)
    df, selected_classes = select_top_k_classes(df, target, k=4)
    print("Using classes:", selected_classes)

    feature_cols = symptom_cols + vital_cols + cat_cols + bin_cols
    X_train, X_test, y_train, y_test = build_balanced_quantum_sets(df, feature_cols, target)

    preprocess = build_preprocess_pipeline(symptom_cols, vital_cols, cat_cols, bin_cols)
    quantum_model = build_quantum_pipeline(preprocess, n_qubits=6, reps=1)

    t0 = time.time()
    quantum_model.fit(X_train, y_train)
    train_time = time.time() - t0

    t0 = time.time()
    preds = quantum_model.predict(X_test)
    pred_time = time.time() - t0

    acc, mf1 = evaluate_model(quantum_model, X_test, y_test)
    print(f"Quantum Train time: {train_time:.3f}s | Predict time: {pred_time:.3f}s")

    return quantum_model
