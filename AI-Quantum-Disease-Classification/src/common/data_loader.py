import pandas as pd

def load_data(visits_path, patients_path, target="diagnosis_group"):
    """
    Load and merge visits and patients datasets.
    """
    visits = pd.read_csv(visits_path)
    patients = pd.read_csv(patients_path)

    df = visits.merge(patients, on="patient_id", how="left")
    df = df.dropna(subset=[target]).copy()

    return df
