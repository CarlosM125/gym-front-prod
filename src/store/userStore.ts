import { create } from 'zustand';
import { apiClient, ApiResponse } from '../api/client';

export interface User {
    id: number;
    homeBranchId: number | null;
    pinZkteco: number;
    fullName: string;
    documentId: string;
    email: string;
    profileImageUrl?: string;
}

interface UserState {
    users: User[];
    isLoading: boolean;
    error: string | null;
    registerUser: (data: Partial<User>) => Promise<User | null>;
    fetchUsers: () => Promise<void>;
    fetchUserByDocId: (docId: string) => Promise<User | null>;
}

export const useUserStore = create<UserState>((set, get) => ({
    users: [],
    isLoading: false,
    error: null,

    fetchUsers: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.get<ApiResponse<User[]>>('/users');
            if (response.data.success) {
                set({ users: response.data.data, isLoading: false });
            } else {
                set({ error: response.data.message, isLoading: false });
            }
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Error fetching users', isLoading: false });
        }
    },

    fetchUserByDocId: async (docId: string) => {
        try {
            const response = await apiClient.get<ApiResponse<User>>(`/users/document/${docId}`);
            if (response.data.success) {
                return response.data.data;
            }
            return null;
        } catch (e) {
            return null;
        }
    },

    registerUser: async (data: Partial<User>) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.post<ApiResponse<User>>('/users', data);
            if (response.data.success) {
                set({ users: [...get().users, response.data.data], isLoading: false });
                return response.data.data;
            } else {
                set({ error: response.data.message, isLoading: false });
                return null;
            }
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Error registering user', isLoading: false });
            return null;
        }
    }
}));
