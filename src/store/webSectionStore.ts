import { create } from 'zustand';
import { apiClient, ApiResponse } from '../api/client';

export interface WebSection {
    id: number;
    title: string;
    description: string;
    imageUrl?: string;
    carouselImages?: string[];
    sectionType: string;
    orderIndex: number;
    isActive: boolean;
}

interface WebSectionState {
    sections: WebSection[];
    isLoading: boolean;
    error: string | null;
    fetchSections: () => Promise<void>;
    createSection: (formData: FormData) => Promise<boolean>;
    updateSection: (id: number, formData: FormData) => Promise<boolean>;
    deleteSection: (id: number) => Promise<boolean>;
    updateOrder: (orderedIds: number[]) => Promise<boolean>;
}

export const useWebSectionStore = create<WebSectionState>((set, get) => ({
    sections: [],
    isLoading: false,
    error: null,

    fetchSections: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.get<ApiResponse<WebSection[]>>('/website/sections/all');
            if (response.data.success) {
                set({ sections: response.data.data, isLoading: false });
            } else {
                set({ error: response.data.message, isLoading: false });
            }
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    createSection: async (formData: FormData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.post<ApiResponse<WebSection>>('/website/sections', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (response.data.success) {
                await get().fetchSections();
                return true;
            } else {
                set({ error: response.data.message, isLoading: false });
                return false;
            }
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            return false;
        }
    },

    updateSection: async (id: number, formData: FormData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.put<ApiResponse<WebSection>>(`/website/sections/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (response.data.success) {
                await get().fetchSections();
                return true;
            } else {
                set({ error: response.data.message, isLoading: false });
                return false;
            }
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            return false;
        }
    },

    deleteSection: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.delete<ApiResponse<void>>(`/website/sections/${id}`);
            if (response.data.success) {
                await get().fetchSections();
                return true;
            } else {
                set({ error: response.data.message, isLoading: false });
                return false;
            }
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            return false;
        }
    },

    updateOrder: async (orderedIds: number[]) => {
        try {
            const response = await apiClient.put<ApiResponse<void>>('/website/sections/order', orderedIds);
            if (response.data.success) {
                return true;
            }
            return false;
        } catch (error: any) {
            return false;
        }
    }
}));
