/**
 * DataPageSummary - Collapsible summary section at bottom of data visualization
 * Shows AI-generated insights, parameters used, and data overview
 */

import { useState } from 'react';
import type { DataSession, DataResult } from '../../types/data';
import styles from '../../styles/data_page/DataPageSummary.module.css';

interface DataPageSummaryProps {
    session: DataSession;
    result?: DataResult | null;
}

// =============================================================================
// Parameter Formatting (reused from tooltip logic)
// =============================================================================

type FormattedParam = { label: string; value: string };

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

function formatParams(params: Record<string, unknown> | null): FormattedParam[] {
    if (!params || Object.keys(params).length === 0) {
        return [];
    }

    const result: FormattedParam[] = [];

    for (const [key, value] of Object.entries(params)) {
        if (value === null || value === undefined || value === '') continue;

        // Format the key nicely
        let label = key
            .split('_')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');

        // Special label mappings
        if (key === 'pm_name') label = 'Project Manager';
        if (key === 'job_number') label = 'Job Number';

        // Format the value
        let displayValue: string;
        if (key === 'days_back') {
            const days = Number(value);
            if (days === 1) displayValue = 'Last 24 hours';
            else if (days === 7) displayValue = 'Last 7 days';
            else if (days === 14) displayValue = 'Last 2 weeks';
            else if (days === 30) displayValue = 'Last 30 days';
            else if (days === 60) displayValue = 'Last 60 days';
            else if (days === 90) displayValue = 'Last 90 days';
            else displayValue = `Last ${days} days`;
            label = 'Time Range';
        } else if (key === 'days_ahead') {
            const days = Number(value);
            if (days === 7) displayValue = 'Next 7 days';
            else if (days === 14) displayValue = 'Next 2 weeks';
            else if (days === 30) displayValue = 'Next 30 days';
            else displayValue = `Next ${days} days`;
            label = 'Time Range';
        } else if (typeof value === 'boolean') {
            displayValue = value ? 'Yes' : 'No';
        } else if (typeof value === 'number') {
            displayValue = value.toLocaleString();
        } else if (typeof value === 'string') {
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

function formatToolName(name: string): string {
    return name
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function formatTimestamp(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

// =============================================================================
// Component
// =============================================================================

const DataPageSummary = ({ session, result }: DataPageSummaryProps) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const formattedParams = formatParams(session.tool_params);
    const hasSummary = !!session.summary;
    const hasParams = formattedParams.length > 0;

    // Don't render if there's nothing to show
    if (!hasSummary && !hasParams) {
        return null;
    }

    return (
        <div className={styles.container}>
            {/* Collapse Toggle Header */}
            <button 
                className={`${styles.header} ${isExpanded ? styles.headerExpanded : ''}`}
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
            >
                <div className={styles.headerLeft}>
                    <svg 
                        className={`${styles.chevron} ${isExpanded ? styles.expanded : ''}`}
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    >
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                    <span className={styles.headerTitle}>Session Details</span>
                </div>
                <span className={styles.timestamp}>{formatTimestamp(session.created_at)}</span>
            </button>

            {/* Collapsible Content */}
            <div className={`${styles.contentWrapper} ${isExpanded ? styles.expanded : ''}`}>
                <div className={styles.content}>
                    {/* Main Grid - AI Summary + Details Side by Side */}
                    <div className={styles.grid}>
                        {/* AI Summary - Primary Focus */}
                        {hasSummary && (
                            <div className={styles.summarySection}>
                                <div className={styles.sectionHeader}>
                                    <span>AI Summary</span>
                                </div>
                                <p className={styles.summaryText}>{session.summary}</p>
                            </div>
                        )}

                        {/* Details Panel */}
                        <div className={styles.detailsSection}>
                            {/* Tool Info */}
                            <div className={styles.detailGroup}>
                                <span className={styles.detailLabel}>Tool</span>
                                <span className={styles.detailValue}>{formatToolName(session.tool_name)}</span>
                            </div>

                            {/* Parameters */}
                            {hasParams && (
                                <div className={styles.paramsGroup}>
                                    <span className={styles.detailLabel}>Parameters</span>
                                    <div className={styles.paramsList}>
                                        {formattedParams.map((param, idx) => (
                                            <div key={idx} className={styles.paramItem}>
                                                <span className={styles.paramLabel}>{param.label}:</span>
                                                <span className={styles.paramValue}>{param.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Data Overview */}
                            {result && (
                                <div className={styles.detailGroup}>
                                    <span className={styles.detailLabel}>Data</span>
                                    <span className={styles.detailValue}>
                                        {result.row_count.toLocaleString()} {result.row_count === 1 ? 'record' : 'rows'} · {result.columns.length} columns
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataPageSummary;
