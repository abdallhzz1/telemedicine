# Configuration file for project

# Columns
symptom_cols = ["symptom_1","symptom_2","symptom_3"]  # example
vital_cols = ["temp_c","spo2","heart_rate","triage_level"]
cat_cols = ["visit_mode","region_id","age_group","gender"]
bin_cols = ["chronic_diabetes","chronic_hypertension","risk_group"]

target = "diagnosis_group"

# Quantum parameters
n_qubits = 6
reps = 1

# Training sizes for quantum
train_per_class = 100
test_per_class = 25
