from sklearn.metrics import accuracy_score, f1_score, classification_report, confusion_matrix

def evaluate_model(model, X_test, y_test):
    """
    Evaluate a model and print metrics.
    """
    preds = model.predict(X_test)
    acc = accuracy_score(y_test, preds)
    mf1 = f1_score(y_test, preds, average="macro")

    print("Accuracy:", acc)
    print("Macro-F1:", mf1)
    print("\nClassification Report:\n", classification_report(y_test, preds))
    print("Confusion Matrix:\n", confusion_matrix(y_test, preds))

    return acc, mf1
