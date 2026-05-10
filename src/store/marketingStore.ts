import { create } from 'zustand';
import { apiClient, ApiResponse } from '../api/client';

export interface MarketingProposal {
    id: number;
    titulo: string;
    tipo: 'promocion' | 'campaña_marketing' | 'consejo_retencion' | 'estrategia';
    descripcion: string;
    acciones: string;
    fechaGeneracion: string;
    estado: 'pendiente' | 'en_progreso' | 'completada' | 'descartada';
    resultado?: string;
}

interface MarketingState {
    proposals: MarketingProposal[];
    isLoading: boolean;
    isRunning: boolean;
    lastRun: string | null;
    fetchProposals: () => Promise<void>;
    triggerAnalysis: () => Promise<string>;
}

export const useMarketingStore = create<MarketingState>((set, get) => ({
    proposals: [],
    isLoading: false,
    isRunning: false,
    lastRun: null,

    fetchProposals: async () => {
        set({ isLoading: true });
        try {
            const res = await apiClient.get<ApiResponse<MarketingProposal[]>>('/marketing/proposals');
            if (res.data.success) {
                const data = res.data.data || [];
                set({
                    proposals: data,
                    lastRun: data.length > 0 ? data[0].fechaGeneracion : null,
                    isLoading: false
                });
            }
        } catch (e) {
            set({ isLoading: false });
        }
    },

    triggerAnalysis: async () => {
        set({ isRunning: true });
        try {
            const res = await apiClient.post<ApiResponse<string>>('/marketing/trigger', {});
            if (res.data.success) {
                // Refresh proposals after analysis
                await get().fetchProposals();
                set({ isRunning: false });
                return res.data.data || 'Análisis completado.';
            }
            set({ isRunning: false });
            return 'Error en el análisis.';
        } catch (e) {
            set({ isRunning: false });
            return 'Error de conexión con el servidor.';
        }
    }
}));
