/**
 * DataSessionTooltip - Hover card showing session metrics and AI summary
 * Positioned towards center of screen for easy reading
 * Uses fixed positioning via portal to escape overflow clipping
 */

import type { DataSession } from '../../types/data';
import styles from '../../styles/data_page/DataSessionTooltip.module.css';

interface DataSessionTooltipProps {
    session: DataSession;
    position: { top: number; left: number };
}

const DataSessionTooltip = ({ session, position }: DataSessionTooltipProps) => {
    
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatToolName = (name: string): string => {
        return name
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const getStatusLabel = (status: string): string => {
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    // Extract key metrics from params
    const getMetrics = (): { label: string; value: string }[] => {
        const metrics: { label: string; value: string }[] = [];
        
        if (session.tool_params) {
            Object.entries(session.tool_params).forEach(([key, value]) => {
                const label = key
                    .split('_')
                    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ');
                
                let displayValue: string;
                if (typeof value === 'string') {
                    displayValue = value;
                } else if (typeof value === 'number') {
                    displayValue = value.toLocaleString();
                } else if (value instanceof Date) {
                    displayValue = value.toLocaleDateString();
                } else {
                    displayValue = JSON.stringify(value);
                }
                
                metrics.push({ label, value: displayValue });
            });
        }
        
        return metrics;
    };

    const metrics = getMetrics();

    // Calculate style with fixed positioning
    const tooltipStyle: React.CSSProperties = {
        position: 'fixed',
        top: position.top,
        left: position.left,
        transform: 'translate(-100%, -50%)', // Position to the left, vertically centered
    };

    return (
        <div className={styles.tooltip} style={tooltipStyle}>
            {/* Header */}
            <div className={styles.header}>
                <span className={styles.toolName}>{formatToolName(session.tool_name)}</span>
                <span className={`${styles.status} ${styles[session.status]}`}>
                    {getStatusLabel(session.status)}
                </span>
            </div>

            {/* Metrics Grid */}
            {metrics.length > 0 && (
                <div className={styles.metrics}>
                    {metrics.map((metric, idx) => (
                        <div key={idx} className={styles.metric}>
                            <span className={styles.metricLabel}>{metric.label}</span>
                            <span className={styles.metricValue}>{metric.value}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Timestamp */}
            <div className={styles.timestamp}>
                {formatDate(session.created_at)}
            </div>

            {/* AI Summary */}
            {session.summary && (
                <div className={styles.summarySection}>
                    <span className={styles.summaryLabel}>AI Generated Summary:</span>
                    <p className={styles.summaryText}>{session.summary}</p>
                </div>
            )}

            {/* No summary yet */}
            {!session.summary && session.status === 'success' && (
                <div className={styles.summarySection}>
                    <span className={styles.summaryLabel}>AI Generated Summary:</span>
                    <p className={styles.summaryPending}>Generating...</p>
                </div>
            )}
        </div>
    );
};

export default DataSessionTooltip;
