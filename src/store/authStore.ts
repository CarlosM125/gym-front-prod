import { create } from 'zustand';
import { apiClient, ApiResponse } from '../api/client';
import { jwtDecode } from 'jwt-decode';

interface UserAuth {
    token: string;
    role: string;
    fullName: string;
}

interface AuthState {
    user: UserAuth | null;
    isLoading: boolean;
    error: string | null;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: false,
    error: null,

    login: async (username, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.post<ApiResponse<UserAuth>>('/auth/login', { username, password });
            if (response.data.success) {
                const data = response.data.data;
                localStorage.setItem('gym_jwt', data.token);
                localStorage.setItem('gym_role', data.role);
                localStorage.setItem('gym_name', data.fullName);
                set({ user: data, isLoading: false, error: null });
                return true;
            } else {
                set({ error: response.data.message, isLoading: false });
                return false;
            }
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Login failed', isLoading: false });
            return false;
        }
    },

    logout: () => {
        localStorage.removeItem('gym_jwt');
        localStorage.removeItem('gym_role');
        localStorage.removeItem('gym_name');
        set({ user: null });
    },

    checkAuth: () => {
        const token = localStorage.getItem('gym_jwt');
        const role = localStorage.getItem('gym_role');
        const fullName = localStorage.getItem('gym_name');
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                if (decoded.exp * 1000 < Date.now()) {
                    set({ user: null }); // expired
                    localStorage.clear();
                } else {
                    set({ user: { token, role: role || '', fullName: fullName || '' } });
                }
            } catch (e) {
                set({ user: null });
            }
        }
    }
}));
