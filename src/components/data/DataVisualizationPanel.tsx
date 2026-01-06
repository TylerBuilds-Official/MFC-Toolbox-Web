/**
 * DataVisualizationPanel - Main visualization area
 * Shows chart, table, or empty state depending on data
 */

import { useDataStore } from '../../store';
import type { DataSession, DataResult } from '../../types/data';
import DataEmptyState from './DataEmptyState';
import DataChartCanvas from './DataChartCanvas';
import DataChartTypeToggle from './DataChartTypeToggle';
import DataAxisControls from './DataAxisControls';
import DataTable from './DataTable';
import DataDetailCard from './DataDetailCard';
import DataPageSummary from './DataPageSummary';
import styles from '../../styles/data_page/DataVisualizationPanel.module.css';

interface DataVisualizationPanelProps {
    session: DataSession | null;
    result: DataResult | null;
    isLoading: boolean;
}

const DataVisualizationPanel = ({ session, result, isLoading }: DataVisualizationPanelProps) => {
    const { chartType, isExecuting } = useDataStore();

    // Loading state
    if (isLoading || isExecuting) {
        return (
            <div className={styles.panel}>
                <div className={styles.loadingState}>
                    <div className={styles.spinner} />
                    <span>{isExecuting ? 'Running tool...' : 'Loading...'}</span>
                </div>
            </div>
        );
    }

    // No session - empty state
    if (!session) {
        return (
            <div className={styles.panel}>
                <DataEmptyState />
            </div>
        );
    }

    // Session exists but error state
    if (session.status === 'error') {
        return (
            <div className={styles.panel}>
                <div className={styles.errorState}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <h3>Execution Failed</h3>
                    <p>{session.error_message || 'An unknown error occurred'}</p>
                    <span className={styles.errorHint}>
                        Try adjusting your parameters or contact support if the issue persists.
                    </span>
                </div>
            </div>
        );
    }

    // Session pending (not yet executed)
    if (session.status === 'pending') {
        return (
            <div className={styles.panel}>
                <div className={styles.pendingState}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <h3>Session Created</h3>
                    <p>This session is ready to execute.</p>
                </div>
            </div>
        );
    }

    // Session running
    if (session.status === 'running') {
        return (
            <div className={styles.panel}>
                <div className={styles.loadingState}>
                    <div className={styles.spinner} />
                    <span>Executing tool...</span>
                </div>
            </div>
        );
    }

    // Success but no result yet
    if (!result) {
        return (
            <div className={styles.panel}>
                <div className={styles.loadingState}>
                    <div className={styles.spinner} />
                    <span>Loading results...</span>
                </div>
            </div>
        );
    }

    // Success with result - show visualization
    return (
        <div className={styles.panel}>
            {/* Controls Bar */}
            <div className={styles.controlsBar}>
                <DataChartTypeToggle />
                {!['table', 'card'].includes(chartType) && <DataAxisControls columns={result.columns} />}
                <div className={styles.resultInfo}>
                    <span className={styles.rowCount}>
                        {result.row_count} {result.row_count === 1 ? 'record' : 'rows'}
                    </span>
                </div>
            </div>

            {/* Visualization Area */}
            <div className={styles.visualizationArea}>
                {chartType === 'table' && <DataTable result={result} />}
                {chartType === 'card'  && <DataDetailCard result={result} />}
                {['bar', 'line', 'pie'].includes(chartType) && <DataChartCanvas result={result} />}
            </div>

            {/* Session Summary */}
            <DataPageSummary session={session} result={result} />
        </div>
    );
};

export default DataVisualizationPanel;
