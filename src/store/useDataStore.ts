/**
 * Data Visualization Store
 * Zustand store for managing data sessions, results, and UI state
 */

import { create } from 'zustand';
import type {
    DataSession,
    DataResult,
    DataTool,
    VisualizationConfig,
} from '../types/data';

interface DataState {
    // Data
    tools: DataTool[];
    sessions: DataSession[];
    activeSession: DataSession | null;
    activeResult: DataResult | null;
    
    // UI State
    isLoading: boolean;
    isExecuting: boolean;
    error: string | null;
    sidebarOpen: boolean;
    
    // Visualization State
    chartType: VisualizationConfig['chart_type'];
    xAxis: string | null;
    yAxis: string | null;
}

interface DataActions {
    // Sidebar
    setSidebarOpen: (open: boolean) => void;
    
    // Tools
    setTools: (tools: DataTool[]) => void;
    
    // Sessions
    setSessions: (sessions: DataSession[]) => void;
    addSession: (session: DataSession) => void;
    setActiveSession: (session: DataSession | null) => void;
    updateSession: (session: DataSession) => void;
    
    // Results
    setActiveResult: (result: DataResult | null) => void;
    
    // Visualization Config
    setChartType: (type: VisualizationConfig['chart_type']) => void;
    setXAxis: (column: string | null) => void;
    setYAxis: (column: string | null) => void;
    
    // Loading/Error
    setLoading: (loading: boolean) => void;
    setExecuting: (executing: boolean) => void;
    setError: (error: string | null) => void;
    
    // Reset
    reset: () => void;
}

const initialState: DataState = {
    tools: [],
    sessions: [],
    activeSession: null,
    activeResult: null,
    isLoading: false,
    isExecuting: false,
    error: null,
    sidebarOpen: false,
    chartType: 'bar',
    xAxis: null,
    yAxis: null,
};

export const useDataStore = create<DataState & DataActions>((set) => ({
    ...initialState,
    
    // Sidebar
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    
    // Tools
    setTools: (tools) => set({ tools }),
    
    // Sessions
    setSessions: (sessions) => set({ sessions }),
    
    addSession: (session) => set((state) => ({
        sessions: [session, ...state.sessions],
    })),
    
    setActiveSession: (session) => set({ 
        activeSession: session,
        // Reset visualization when changing sessions
        activeResult: null,
        xAxis: null,
        yAxis: null,
        chartType: 'bar',  // Reset to default so hints can be applied on result load
    }),
    
    updateSession: (session) => set((state) => ({
        sessions: state.sessions.map((s) => 
            s.id === session.id ? session : s
        ),
        activeSession: state.activeSession?.id === session.id 
            ? session 
            : state.activeSession,
    })),
    
    // Results
    setActiveResult: (result) => set((state) => {
        // Get chart config from the active session's tool
        const tool = state.tools.find(t => t.name === state.activeSession?.tool_name);
        const chartConfig = tool?.chart_config;
        
        // Apply chart type hint if available
        let chartType = state.chartType;
        if (tool?.default_chart_type && state.chartType === 'bar') {
            // Only override if still on default 'bar'
            chartType = tool.default_chart_type as VisualizationConfig['chart_type'];
        }
        
        // Apply axis hints from chart_config, or use smart auto-detection
        let xAxis = state.xAxis;
        let yAxis = state.yAxis;
        
        if (result && result.columns.length >= 2) {
            // Priority 1: Use chart_config hints if available
            if (chartConfig?.x_axis && result.columns.includes(chartConfig.x_axis)) {
                xAxis = chartConfig.x_axis;
            }
            if (chartConfig?.y_axis && result.columns.includes(chartConfig.y_axis)) {
                yAxis = chartConfig.y_axis;
            }
            
            // Priority 2: Smart auto-detection by column name patterns
            if (!xAxis) {
                const cols = result.columns.map(c => c.toLowerCase());
                const dateCol = result.columns.find((_, i) => 
                    cols[i].includes('date')    ||
                    cols[i].includes('time')    ||
                    cols[i].includes('created') ||
                    cols[i].includes('updated')
                );
                xAxis = dateCol || result.columns[0];
            }
            
            if (!yAxis) {
                const cols = result.columns.map(c => c.toLowerCase());
                const numericCol = result.columns.find((_, i) => 
                    cols[i].includes('total')    ||
                    cols[i].includes('count')    ||
                    cols[i].includes('sum')      ||
                    cols[i].includes('hours')    ||
                    cols[i].includes('amount')   ||
                    cols[i].includes('quantity') ||
                    cols[i].includes('pieces')   ||
                    cols[i].includes('weight')
                );
                yAxis = numericCol || result.columns[1];
            }
        }
        
        return { activeResult: result, xAxis, yAxis, chartType };
    }),
    
    // Visualization Config
    setChartType: (chartType) => set({ chartType }),
    setXAxis: (xAxis) => set({ xAxis }),
    setYAxis: (yAxis) => set({ yAxis }),
    
    // Loading/Error
    setLoading: (isLoading) => set({ isLoading }),
    setExecuting: (isExecuting) => set({ isExecuting }),
    setError: (error) => set({ error }),
    
    // Reset
    reset: () => set(initialState),
}));

// Selector hooks for common patterns
export const useActiveSession = () => useDataStore((state) => state.activeSession);
export const useActiveResult = () => useDataStore((state) => state.activeResult);
export const useDataTools = () => useDataStore((state) => state.tools);
export const useVisualizationConfig = () => useDataStore((state) => ({
    chartType: state.chartType,
    xAxis: state.xAxis,
    yAxis: state.yAxis,
}));

// Get chart_config for the active session's tool
export const useActiveChartConfig = () => useDataStore((state) => {
    if (!state.activeSession) return null;
    const tool = state.tools.find(t => t.name === state.activeSession?.tool_name);
    return tool?.chart_config ?? null;
});
