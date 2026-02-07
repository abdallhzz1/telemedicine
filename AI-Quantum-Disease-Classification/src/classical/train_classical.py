import time
from sklearn.model_selection import train_test_split
from src.common.data_loader import load_data
from src.common.preprocess import build_preprocess_pipeline
from src.common.metrics import evaluate_model
from src.classical.model import build_classical_model

def train_classical(visits_path, patients_path, symptom_cols, vital_cols, cat_cols, bin_cols, target="diagnosis_group"):
    # Load data
    df = load_data(visits_path, patients_path, target)
    feature_cols = symptom_cols + vital_cols + cat_cols + bin_cols
    X = df[feature_cols]
    y = df[target]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    preprocess = build_preprocess_pipeline(symptom_cols, vital_cols, cat_cols, bin_cols)
    model = build_classical_model(preprocess)

    t0 = time.time()
    model.fit(X_train, y_train)
    train_time = time.time() - t0

    acc, mf1 = evaluate_model(model, X_test, y_test)
    print(f"Classical Train time: {train_time:.3f}s")
    return model
