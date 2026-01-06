/**
 * DataSessionTooltip - Hover card showing session context and AI summary
 * Features smart parameter formatting and mini data preview
 * Positioned towards center of screen for easy reading
 * Uses fixed positioning via portal to escape overflow clipping
 */

import type { DataSession } from '../../types/data';
import styles from '../../styles/data_page/DataSessionTooltip.module.css';

interface DataSessionTooltipProps {
    session: DataSession;
    position: { top: number; left: number };
}

// =============================================================================
// Parameter Formatting - Contextual, Human-Readable
// =============================================================================

type FormattedParam = { label: string; value: string };
type ParamFormatter = (value: unknown, allParams: Record<string, unknown>) => FormattedParam | null;

/**
 * Smart formatters for known parameter types.
 * Returns null if the formatter doesn't apply or wants to skip the param.
 */
const PARAM_FORMATTERS: Record<string, ParamFormatter> = {
    // Job number - clean display
    job_number: (value) => {
        if (!value) return null;
        return { label: 'Job Number', value: String(value) };
    },

    // Days back - contextual language
    days_back: (value) => {
        if (!value) return null;
        const days = Number(value);
        let contextual: string;
        if (days === 1) contextual = 'Last 24 hours';
        else if (days === 7) contextual = 'Last 7 days';
        else if (days === 14) contextual = 'Last 2 weeks';
        else if (days === 30) contextual = 'Last 30 days';
        else if (days === 60) contextual = 'Last 60 days';
        else if (days === 90) contextual = 'Last 90 days';
        else contextual = `Last ${days} days`;
        return { label: 'Days Back', value: contextual };
    },

    // Days ahead - for shipping/deadline queries
    days_ahead: (value) => {
        if (!value) return null;
        const days = Number(value);
        let contextual: string;
        if (days === 7) contextual = 'Next 7 days';
        else if (days === 14) contextual = 'Next 2 weeks';
        else if (days === 30) contextual = 'Next 30 days';
        else contextual = `Next ${days} days`;
        return { label: 'Days Ahead', value: contextual };
    },

    // PM name - full label
    pm_name: (value) => {
        if (!value) return null;
        return { label: 'Project Manager', value: String(value) };
    },

    // Date parameters - format nicely
    start_date: (value, allParams) => {
        if (!value) return null;
        const startDate = formatDateShort(String(value));
        const endDate = allParams.end_date ? formatDateShort(String(allParams.end_date)) : null;
        
        // If we have both dates, combine them
        if (endDate) {
            return { label: 'Date Range', value: `${startDate} – ${endDate}` };
        }
        return { label: 'Start Date', value: startDate };
    },

    // Skip end_date if start_date handles it
    end_date: (value, allParams) => {
        if (allParams.start_date) return null; // Already handled by start_date
        if (!value) return null;
        return { label: 'End Date', value: formatDateShort(String(value)) };
    },

    // Boolean flags
    include_on_hold: (value) => {
        if (value === true) return { label: 'Include On-Hold', value: 'Yes' };
        return null; // Don't show if false
    },

    active_only: (value) => {
        if (value === false) return { label: 'Status Filter', value: 'All statuses' };
        return null; // Don't show if true (default behavior)
    },

    // Limit - only show if non-default
    limit: (value) => {
        if (!value || Number(value) === 10) return null;
        return { label: 'Limit', value: `Top ${value}` };
    },
};

/**
 * Format a date string to short display format (Jan 5, 2025)
 */
function formatDateShort(dateString: string): string {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    } catch {
        return dateString;
    }
}

/**
 * Format tool parameters into human-readable label/value pairs.
 * Uses smart formatters for known params, falls back to simple formatting.
 */
function formatParams(params: Record<string, unknown> | null): FormattedParam[] {
    if (!params || Object.keys(params).length === 0) {
        return [];
    }

    const result: FormattedParam[] = [];
    const processedKeys = new Set<string>();

    // First pass: use smart formatters
    for (const [key, value] of Object.entries(params)) {
        const formatter = PARAM_FORMATTERS[key];
        if (formatter) {
            const formatted = formatter(value, params);
            if (formatted) {
                result.push(formatted);
            }
            processedKeys.add(key);
            
            // Mark related keys as processed (e.g., end_date when start_date handles it)
            if (key === 'start_date' && params.end_date) {
                processedKeys.add('end_date');
            }
        }
    }

    // Second pass: format remaining params generically
    for (const [key, value] of Object.entries(params)) {
        if (processedKeys.has(key)) continue;
        if (value === null || value === undefined || value === '') continue;

        // Format the key nicely
        const label = key
            .split('_')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');

        // Format the value
        let displayValue: string;
        if (typeof value === 'boolean') {
            displayValue = value ? 'Yes' : 'No';
        } else if (typeof value === 'number') {
            displayValue = value.toLocaleString();
        } else if (typeof value === 'string') {
            // Check if it looks like a date
            if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
                displayValue = formatDateShort(value);
            } else {
                displayValue = value;
            }
        } else {
            displayValue = JSON.stringify(value);
        }

        result.push({ label, value: displayValue });
    }

    return result;
}

// =============================================================================
// Data Preview Helpers
// =============================================================================

/**
 * Format row count with appropriate label
 */
// function formatRowCount(count: number | null | undefined): string | null {
//     if (count === null || count === undefined) return null;
//     if (count === 0) return 'No data';
//     if (count === 1) return '1 row';
//     return `${count.toLocaleString()} rows`;
// }

/**
 * Get a preview of column names (first 3-4)
 */
// function formatColumnPreview(columns: string[] | null | undefined): string | null {
//     if (!columns || columns.length === 0) return null;
//
//     const maxShow = 4;
//     const shown = columns.slice(0, maxShow);
//     const remaining = columns.length - maxShow;
//
//     // Format column names nicely
//     const formatted = shown.map(col =>
//         col.split(/(?=[A-Z])|_/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
//     );
//
//     if (remaining > 0) {
//         return `${formatted.join(', ')} +${remaining} more`;
//     }
//     return formatted.join(', ');
// }

// =============================================================================
// Component
// =============================================================================

const DataSessionTooltip = ({ session, position }: DataSessionTooltipProps) => {
    
    const formatTimestamp = (dateString: string): string => {
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

    // Get formatted parameter pairs
    const formattedParams = formatParams(session.tool_params);
    
    // Get data preview info
    // const rowCountLabel = formatRowCount(session.row_count);
    // const columnPreview = formatColumnPreview(session.columns);
    // const hasDataPreview = session.has_results && (rowCountLabel || columnPreview);

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

            {/* Context Params - Label/value pairs */}
            {formattedParams.length > 0 && (
                <div className={styles.contextParams}>
                    {formattedParams.map((param, idx) => (
                        <div key={idx} className={styles.param}>
                            <span className={styles.paramLabel}>{param.label}:</span>
                            <span className={styles.paramValue}>{param.value}</span>
                        </div>
                    ))}
                </div>
            )}

            {/*/!* Data Preview - Row count and columns *!/*/}
            {/*{hasDataPreview && (*/}
            {/*    <div className={styles.dataPreview}>*/}
            {/*        <div className={styles.previewIcon}>*/}
            {/*            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">*/}
            {/*                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>*/}
            {/*                <line x1="3" y1="9" x2="21" y2="9"/>*/}
            {/*                <line x1="9" y1="21" x2="9" y2="9"/>*/}
            {/*            </svg>*/}
            {/*        </div>*/}
            {/*        /!*<div className={styles.previewText}>*!/*/}
            {/*        /!*    /!*{rowCountLabel && <span className={styles.rowCount}>{rowCountLabel}</span>}*!/*!/*/}
            {/*        /!*    /!*{columnPreview && <span className={styles.columnList}>{columnPreview}</span>}*!/*!/*/}
            {/*        /!*</div>*!/*/}
            {/*    </div>*/}
            {/*)}*/}

            {/* AI Summary */}
            {session.summary && (
                <div className={styles.summarySection}>
                    <span className={styles.summaryLabel}>AI Summary</span>
                    <p className={styles.summaryText}>{session.summary}</p>
                </div>
            )}

            {/* Timestamp */}
            <div className={styles.timestamp}>
                {formatTimestamp(session.created_at)}
            </div>

            {/* No summary yet */}
            {!session.summary && session.status === 'success' && (
                <div className={styles.summarySection}>
                    <p className={styles.summaryPending}>Generating summary...</p>
                </div>
            )}
            
            {/* Pending/Running state */}
            {(session.status === 'pending' || session.status === 'running') && (
                <div className={styles.summarySection}>
                    <p className={styles.summaryPending}>
                        {session.status === 'pending' ? 'Waiting to execute...' : 'Running...'}
                    </p>
                </div>
            )}

            {/* Error state */}
            {session.status === 'error' && session.error_message && (
                <div className={styles.errorSection}>
                    <p className={styles.errorText}>{session.error_message}</p>
                </div>
            )}
        </div>
    );
};

export default DataSessionTooltip;
