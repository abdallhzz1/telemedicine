from sklearn.pipeline import Pipeline
from sklearn.decomposition import TruncatedSVD
from sklearn.preprocessing import MinMaxScaler
from qiskit.circuit.library import ZZFeatureMap
from qiskit_machine_learning.kernels import FidelityQuantumKernel
from qiskit_machine_learning.algorithms import QSVC

def build_quantum_pipeline(preprocess, n_qubits=6, reps=1):
    """
    Build a QSVC quantum pipeline.
    """
    feature_map = ZZFeatureMap(feature_dimension=n_qubits, reps=reps, entanglement="linear")
    quantum_kernel = FidelityQuantumKernel(feature_map=feature_map)
    qsvc = QSVC(quantum_kernel=quantum_kernel)

    pipeline = Pipeline([
        ("pre", preprocess),
        ("svd", TruncatedSVD(n_components=n_qubits, random_state=42)),
        ("scale", MinMaxScaler(feature_range=(0, 3.1415))),
        ("qsvc", qsvc)
    ])
    return pipeline
