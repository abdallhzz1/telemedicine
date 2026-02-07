/**
 * ML API Client
 * Handles communication with the FastAPI ML prediction service
 */

// Base URL for the ML API service
const ML_API_BASE_URL = import.meta.env.VITE_ML_API_BASE_URL || 'http://localhost:8000';

// Types
export interface PredictRequest {
    features: number[];
}

export interface PredictResponse {
    model: string;
    prediction: string;
    probabilities: number[] | null;
    message: string;
}

export interface HealthResponse {
    status: string;
    models_loaded: {
        classical: boolean;
        quantum: boolean;
    };
}

// Alias for backwards compatibility
export type MLHealthResponse = HealthResponse;

export interface ApiError {
    detail: string;
}

// Helper function to handle API errors
async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const error: ApiError = await response.json().catch(() => ({
            detail: `HTTP error ${response.status}: ${response.statusText}`
        }));
        throw new Error(error.detail);
    }
    return response.json();
}

/**
 * Check API health and model status
 */
export async function checkHealth(): Promise<HealthResponse> {
    const response = await fetch(`${ML_API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    return handleResponse<HealthResponse>(response);
}

/**
 * Make prediction using Classical Logistic Regression model
 */
export async function predictClassical(features: number[]): Promise<PredictResponse> {
    const response = await fetch(`${ML_API_BASE_URL}/predict/classical`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ features }),
    });
    return handleResponse<PredictResponse>(response);
}

/**
 * Make prediction using Quantum QSVC model
 */
export async function predictQuantum(features: number[]): Promise<PredictResponse> {
    const response = await fetch(`${ML_API_BASE_URL}/predict/quantum`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ features }),
    });
    return handleResponse<PredictResponse>(response);
}
