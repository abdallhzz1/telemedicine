# Telemedicine - Intelligent Healthcare Platform

Welcome to **Telemedicine**, a comprehensive healthcare platform designed to bridge the gap between patients, doctors, and laboratories. This project integrates modern web technologies with advanced AI/ML capabilities, including Quantum Machine Learning, to provide intelligent health insights and streamlined healthcare management.

## Key Features

*   **Role-Based Portals**: distinct, tailored interfaces for **Doctors**, **Patients**, **Laboratories**, and **Admins**.
*   **AI-Powered Diagnostics**:
    *   **Classical ML**: Logistic Regression for initial risk assessment.
    *   **Quantum ML**: Integration with Qiskit for advanced feature classification (QSVC).
*   **Real-Time Communication**:
    *   Secure generic video conferencing (Jitsi/Agora integration ready).
    *   Real-time chat for doctor-patient consultation.
*   **Appointment Management**: Seamless scheduling, rescheduling, and cancellation of appointments.
*   **Lab Integration**: Digital lab request generation and result uploading/viewing.
*   **Electronic Health Records (EHR)**: Centralized patient history, prescriptions, and lab reports.
*   **Secure Authentication**: Role-based access control (RBAC) to ensure data privacy and security.

## Tech Stack

### Frontend
*   **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
*   **Language**: TypeScript
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) + Shadcn UI
*   **State Management**: Zustand / React Query
*   **Routing**: React Router DOM

### Backend & AI
*   **API Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
*   **Machine Learning**: Scikit-learn
*   **Quantum Computing**: Qiskit (IBM Quantum)
*   **Database**: Firebase / Firestore (implied from client code)

## Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   Python (v3.9+)
*   Git

### 1. Clone the Repository
```bash
git clone https://github.com/abdallhzz1/telemedicine.git
cd telemedicine
```

### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```
The application will be available at `http://localhost:5173`.

### 3. Backend (ML Service) Setup
Navigate to the `fastapi_service` directory:
```bash
cd fastapi_service

# Create a virtual environment (optional but recommended)
python -m venv .venv
# Activate:
# Windows: .venv\Scripts\activate
# Mac/Linux: source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload
```
The API will be available at `http://localhost:8000`. API Docs at `http://localhost:8000/docs`.

## Environment Variables

Create a `.env` file in the root directory based on `.env.example`.

```env
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=your_api_key
...
```

## AI Models
The system uses pre-trained models located in `fastapi_service/models/`:
*   `classical_logistic_regression_FULL.pkl`
*   `quantum_qsvc_FULL.pkl` (Quantum Support Vector Classifier)

## Contributing
1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/NewFeature`).
3.  Commit your changes.
4.  Push to the branch.
5.  Open a Pull Request.

## License
This project is licensed under the MIT License.