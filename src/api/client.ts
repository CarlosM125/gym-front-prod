import axios from 'axios';

// Base Axios instance
export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('gym_jwt');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Generic response wrapper interface mapping Java ApiResponse<T>
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}
