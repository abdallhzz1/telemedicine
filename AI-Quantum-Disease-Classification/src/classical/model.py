from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression

def build_classical_model(preprocess):
    """
    Build classical Logistic Regression pipeline.
    """
    model = Pipeline([
        ("pre", preprocess),
        ("clf", LogisticRegression(
            max_iter=5000,
            solver="saga",
            n_jobs=-1,
            class_weight="balanced"
        ))
    ])
    return model
