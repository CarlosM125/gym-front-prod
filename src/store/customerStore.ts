import { create } from 'zustand';
import { apiClient, ApiResponse } from '../api/client';

// Customer = gym member/client
export interface Customer {
    id: number;
    fullName: string;
    documentId: string;
    email: string;
    phone?: string;
    pinZkteco: number;
    profileImageUrl?: string;
    status: string;
    homeBranchId: number | null;
    homeBranchName?: string;
    createdAt?: string;
}

interface CustomerState {
    customers: Customer[];
    isLoading: boolean;
    error: string | null;
    registerCustomer: (data: Partial<Customer>) => Promise<Customer | null>;
    fetchCustomers: () => Promise<void>;
    fetchCustomerByDocId: (docId: string) => Promise<Customer | null>;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
    customers: [],
    isLoading: false,
    error: null,

    fetchCustomers: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.get<ApiResponse<Customer[]>>('/customers');
            if (response.data.success) {
                set({ customers: response.data.data, isLoading: false });
            } else {
                set({ error: response.data.message, isLoading: false });
            }
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Error fetching customers', isLoading: false });
        }
    },

    fetchCustomerByDocId: async (docId: string) => {
        try {
            const response = await apiClient.get<ApiResponse<Customer>>(`/customers/by-document/${docId}`);
            if (response.data.success) return response.data.data;
            return null;
        } catch (e) {
            return null;
        }
    },

    registerCustomer: async (data: Partial<Customer>) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.post<ApiResponse<Customer>>('/customers', data);
            if (response.data.success) {
                set({ customers: [...get().customers, response.data.data], isLoading: false });
                return response.data.data;
            } else {
                set({ error: response.data.message, isLoading: false });
                return null;
            }
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Error registering customer', isLoading: false });
            return null;
        }
    }
}));
