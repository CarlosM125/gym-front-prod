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
    // Prevenir caché de navegador para las llamadas GET (ej. lista de clientes después de renovar)
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers['Pragma'] = 'no-cache';
    config.headers['Expires'] = '0';
    return config;
});

// Generic response wrapper interface mapping Java ApiResponse<T>
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}
