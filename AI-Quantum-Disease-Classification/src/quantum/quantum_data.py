import pandas as pd

def select_top_k_classes(df, target, k=4):
    """
    Select the top k most frequent classes.
    """
    top_classes = df[target].value_counts().head(k).index.tolist()
    return df[df[target].isin(top_classes)].copy(), top_classes

def build_balanced_quantum_sets(df, feature_cols, target, train_per_class=100, test_per_class=25, random_state=42):
    """
    Create a balanced training and testing set for quantum model.
    """
    classes = sorted(df[target].unique())
    train_parts, test_parts = [], []

    for c in classes:
        df_c = df[df[target] == c].sample(frac=1, random_state=random_state)
        if len(df_c) < (train_per_class + test_per_class):
            raise ValueError(f"Not enough samples for class {c}: {len(df_c)} < {train_per_class + test_per_class}")
        train_parts.append(df_c.iloc[:train_per_class])
        test_parts.append(df_c.iloc[train_per_class:train_per_class + test_per_class])

    df_train = pd.concat(train_parts).sample(frac=1, random_state=random_state)
    df_test  = pd.concat(test_parts).sample(frac=1, random_state=random_state)

    X_train = df_train[feature_cols]
    y_train = df_train[target]
    X_test  = df_test[feature_cols]
    y_test  = df_test[target]

    return X_train, X_test, y_train, y_test
