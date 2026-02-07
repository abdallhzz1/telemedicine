# AI & Quantum Disease Classification

This project implements both classical and quantum machine learning pipelines
to classify patient visits into disease groups.

## Modules
- Classical: Logistic Regression baseline
- Quantum: QSVC using ZZFeatureMap

## How to Run
1. Install dependencies:
   pip install -r requirements.txt

2. Place datasets in the data/ folder:
   - visits.csv
   - patients.csv

3. Train classical model:
   python src/classical/train_classical.py

4. Train quantum model:
   python src/quantum/train_quantum.py
