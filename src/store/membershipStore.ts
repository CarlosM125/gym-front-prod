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
    durationMonths: number;
    isPromotion: boolean;
}

export interface PlanDistribution {
    name: string;
    clients: number;
    revenue: number;
    percentage: string;
}

export interface DashboardStats {
    activeCustomers: number;
    totalRevenue: number;
    averageRevenuePerCustomer: number;
    monthlyRevenue: number;
    planDistribution: PlanDistribution[];
    historicalStats: ChartData[];
}

interface MembershipState {
    plans: MembershipPlan[];
    expiringToday: Membership[];
    historicalStats: ChartData[];
    dashboardStats: DashboardStats | null;
    isLoading: boolean;
    error: string | null;
    fetchPlans: () => Promise<void>;
    fetchExpiringToday: () => Promise<void>;
    fetchExpiring: (fromDate: string, toDate: string) => Promise<void>;
    fetchHistoricalStats: (year: number) => Promise<void>;
    fetchDashboardStats: (filters?: { startDate?: string; endDate?: string; branchId?: number; planId?: number; status?: string; }) => Promise<void>;
    renewMembership: (payload: { customerId?: number; documentId?: string; customerFullName: string; branchId?: number; planId?: number; amountPaid: number; startDate: string; consentGiven?: boolean; }) => Promise<boolean>;
    updateMembershipStartDate: (customerId: number, startDate: string) => Promise<boolean>;
}

export const useMembershipStore = create<MembershipState>((set) => ({
    plans: [],
    expiringToday: [],
    historicalStats: [],
    dashboardStats: null,
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

    fetchDashboardStats: async (filters) => {
        set({ isLoading: true, error: null });
        try {
            let url = '/memberships/dashboard-stats';
            if (filters) {
                const params = new URLSearchParams();
                if (filters.startDate) params.append('startDate', filters.startDate);
                if (filters.endDate) params.append('endDate', filters.endDate);
                if (filters.branchId) params.append('branchId', filters.branchId.toString());
                if (filters.planId) params.append('planId', filters.planId.toString());
                if (filters.status) params.append('status', filters.status);
                const query = params.toString();
                if (query) url += `?${query}`;
            }

            const response = await apiClient.get<ApiResponse<DashboardStats>>(url);
            if (response.data.success) {
                set({ dashboardStats: response.data.data, isLoading: false });
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
    },

    updateMembershipStartDate: async (customerId: number, startDate: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.put<ApiResponse<Membership>>(`/memberships/customer/${customerId}/start-date`, { startDate });
            if (response.data.success) {
                set({ isLoading: false });
                return true;
            } else {
                set({ error: response.data.message, isLoading: false });
                return false;
            }
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Error updating start date', isLoading: false });
            return false;
        }
    }
}));
