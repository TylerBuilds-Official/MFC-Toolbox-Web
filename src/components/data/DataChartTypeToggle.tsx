/**
 * DataChartTypeToggle - Switch between chart types
 */

import { useDataStore } from '../../store/useDataStore';
import type { VisualizationConfig } from '../../types/data';
import styles from '../../styles/data_page/DataChartTypeToggle.module.css';

type ChartType = VisualizationConfig['chart_type'];

const chartTypes: { type: ChartType; label: string; icon: JSX.Element }[] = [
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
];

const DataChartTypeToggle = () => {
    const { chartType, setChartType } = useDataStore();

    return (
        <div className={styles.toggle}>
            {chartTypes.map(({ type, label, icon }) => (
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
