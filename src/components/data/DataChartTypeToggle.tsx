/**
 * DataChartTypeToggle - Switch between chart types
 * Filters available types based on data characteristics
 */

import { useMemo } from 'react';
import { useDataStore, useActiveChartConfig } from '../../store/useDataStore';
import type { VisualizationConfig } from '../../types/data';
import styles from '../../styles/data_page/DataChartTypeToggle.module.css';
import type { JSX } from "react";

type ChartType = VisualizationConfig['chart_type'];

interface ChartTypeOption {
    type:  ChartType;
    label: string;
    icon:  JSX.Element;
}

const ALL_CHART_TYPES: ChartTypeOption[] = [
    {
        type: 'bar',
        label: 'Bar',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
        ),
    },
    {
        type: 'line',
        label: 'Line',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
        ),
    },
    {
        type: 'pie',
        label: 'Pie',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                <path d="M22 12A10 10 0 0 0 12 2v10z" />
            </svg>
        ),
    },
    {
        type: 'table',
        label: 'Table',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
        ),
    },
    {
        type: 'card',
        label: 'Card',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="7" y1="8" x2="17" y2="8" />
                <line x1="7" y1="12" x2="14" y2="12" />
                <line x1="7" y1="16" x2="11" y2="16" />
            </svg>
        ),
    },
];

const DataChartTypeToggle = () => {
    const { chartType, setChartType, activeResult } = useDataStore();
    const chartConfig = useActiveChartConfig();

    // Filter valid chart types based on data characteristics
    const validTypes = useMemo(() => {
        const types: ChartType[] = ['table']; // Always available
        
        if (!activeResult) return types;
        
        const rowCount = activeResult.row_count;
        
        // Single record -> card makes sense
        if (rowCount === 1) {
            types.push('card');
        }
        
        // Multi-series data -> bar and line
        if (chartConfig?.series_by) {
            types.push('bar', 'line');
        } else if (rowCount > 1) {
            // Regular multi-row data
            types.push('bar', 'line');
            
            // Pie only makes sense for small datasets
            if (rowCount <= 12) {
                types.push('pie');
            }
        }
        
        return types;
    }, [activeResult, chartConfig]);

    // Filter to only show valid types
    const availableTypes = ALL_CHART_TYPES.filter(ct => validTypes.includes(ct.type));

    return (
        <div className={styles.toggle}>
            {availableTypes.map(({ type, label, icon }) => (
                <button
                    key={type}
                    className={`${styles.button} ${chartType === type ? styles.active : ''}`}
                    onClick={() => setChartType(type)}
                    title={label}
                    aria-label={`Switch to ${label} view`}
                >
                    {icon}
                    <span className={styles.label}>{label}</span>
                </button>
            ))}
        </div>
    );
};

export default DataChartTypeToggle;
