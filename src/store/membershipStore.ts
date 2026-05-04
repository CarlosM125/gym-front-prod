import { create } from 'zustand';
import { apiClient, ApiResponse } from '../api/client';

export interface Membership {
    id: number;
    userId: number;
    branchId: number;
    startDate: string;
    endDate: string;
    status: string;
    userFullName: string;
    customerFullName: string;
    documentId: string;
    profileImageUrl?: string;
}

export interface ChartData {
    month: string;
    signups: number;
    revenue: number;
}

export interface MembershipPlan {
    id: number;
    name: string;
    description: string;
    priceAmount: number;
    durationDays: number;
    isPromotion: boolean;
}

interface MembershipState {
    plans: MembershipPlan[];
    expiringToday: Membership[];
    historicalStats: ChartData[];
    isLoading: boolean;
    error: string | null;
    fetchPlans: () => Promise<void>;
    fetchExpiringToday: () => Promise<void>;
    fetchExpiring: (fromDate: string, toDate: string) => Promise<void>;
    fetchHistoricalStats: (year: number) => Promise<void>;
    renewMembership: (payload: { customerId?: number; documentId?: string; customerFullName: string; branchId?: number; planId?: number; amountPaid: number; startDate: string; }) => Promise<boolean>;
}

export const useMembershipStore = create<MembershipState>((set) => ({
    plans: [],
    expiringToday: [],
    historicalStats: [],
    isLoading: false,
    error: null,

    fetchPlans: async () => {
        set({ isLoading: true });
        try {
            const res = await apiClient.get<ApiResponse<MembershipPlan[]>>('/memberships/plans');
            if (res.data.success) set({ plans: res.data.data, isLoading: false });
        } catch (e: any) { set({ error: e.message, isLoading: false }); }
    },

    fetchExpiringToday: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.get<ApiResponse<Membership[]>>('/memberships/expiring?days=1');
            if (response.data.success) {
                set({ expiringToday: response.data.data, isLoading: false });
            }
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchExpiring: async (fromDate: string, toDate: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.get<ApiResponse<Membership[]>>(
                `/memberships/expiring?fromDate=${fromDate}&toDate=${toDate}`
            );
            if (response.data.success) {
                set({ expiringToday: response.data.data, isLoading: false });
            }
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchHistoricalStats: async (year: number) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.get<ApiResponse<ChartData[]>>(`/memberships/historical-stats?year=${year}`);
            if (response.data.success) {
                set({ historicalStats: response.data.data, isLoading: false });
            }
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    renewMembership: async (payload) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.post<ApiResponse<Membership>>('/memberships/renew', payload);
            if (response.data.success) {
                set({ isLoading: false });
                return true;
            } else {
                set({ error: response.data.message, isLoading: false });
                return false;
            }
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Error renewing membership', isLoading: false });
            return false;
        }
    }
}));
