import { create } from 'zustand';
import { apiClient, ApiResponse } from '../api/client';

export interface Branch {
    id: number;
    name: string;
    timezone: string;
    createdAt: string;
}

interface BranchState {
    branches: Branch[];
    isLoading: boolean;
    error: string | null;
    fetchBranches: () => Promise<void>;
    createBranch: (name: string, timezone: string) => Promise<void>;
}

export const useBranchStore = create<BranchState>((set, get) => ({
    branches: [],
    isLoading: false,
    error: null,

    fetchBranches: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.get<ApiResponse<Branch[]>>('/branches');
            if (response.data.success) {
                set({ branches: response.data.data, isLoading: false });
            } else {
                set({ error: response.data.message, isLoading: false });
            }
        } catch (error: any) {
            set({ error: error.response?.data?.message || error.message, isLoading: false });
        }
    },

    createBranch: async (name: string, timezone: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.post<ApiResponse<Branch>>('/branches', { name, timezone });
            if (response.data.success) {
                // Instantly update the state cache instead of immediately re-fetching to save network calls
                set({ 
                    branches: [...get().branches, response.data.data], 
                    isLoading: false 
                });
            } else {
                set({ error: response.data.message, isLoading: false });
            }
        } catch (error: any) {
            set({ error: error.response?.data?.message || error.message, isLoading: false });
        }
    }
}));
