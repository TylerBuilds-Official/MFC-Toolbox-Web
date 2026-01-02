/**
 * DataDetailCard - Single record display as a styled card
 * Used for tools that return a single row (job details, etc.)
 */

import type { DataResult } from '../../types/data';
import { formatColumnName, formatTickValue } from '../../services/api';
import styles from '../../styles/data_page/DataDetailCard.module.css';

interface DataDetailCardProps {
    result: DataResult;
}

/**
 * Detect value type for formatting
 */
type ValueType = 'string' | 'number' | 'date' | 'empty';

const detectValueType = (value: unknown, colName: string): ValueType => {
    if (value === null || value === undefined || value === '') return 'empty';
    if (typeof value === 'number')                              return 'number';
    
    if (typeof value === 'string') {
        // Check for ISO date format
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
    }
    
    // Check column name hints
    const col = colName.toLowerCase();
    if (col.includes('date') || col.includes('time')) return 'date';
    
    return 'string';
};

/**
 * Format value for display based on type
 */
const formatValue = (value: unknown, type: ValueType): string => {
    switch (type) {
        case 'empty':  return '—';
        case 'number': return (value as number).toLocaleString();
        case 'date':   return formatTickValue(String(value));
        default:       return String(value);
    }
};

/**
 * Check if field should be full-width (long text)
 */
const isLongTextField = (value: unknown, colName: string): boolean => {
    const col = colName.toLowerCase();
    if (col.includes('description') || col.includes('notes') || col.includes('comment')) return true;
    if (typeof value === 'string' && value.length > 100)                                  return true;
    
    return false;
};

/**
 * Check if field is a primary identifier
 */
const isPrimaryField = (colName: string): boolean => {
    const col = colName.toLowerCase();
    return col.includes('job') && (col.includes('number') || col.includes('id') || col.includes('name'));
};

const DataDetailCard = ({ result }: DataDetailCardProps) => {
    // Handle empty result
    if (!result.rows.length) {
        return (
            <div className={styles.card}>
                <p>No data available</p>
            </div>
        );
    }

    const row = result.rows[0];

    return (
        <div className={styles.card}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                </div>
                <span className={styles.headerTitle}>Record Details</span>
            </div>

            {/* Fields Grid */}
            <div className={styles.grid}>
                {result.columns.map((col, i) => {
                    const value     = row[i];
                    const valueType = detectValueType(value, col);
                    const isLong    = isLongTextField(value, col);
                    const isPrimary = isPrimaryField(col);

                    const fieldClasses = [
                        styles.field,
                        isLong    && styles.fullWidth,
                        isPrimary && styles.primary,
                    ].filter(Boolean).join(' ');

                    const valueClasses = [
                        styles.fieldValue,
                        valueType === 'empty'  && styles.empty,
                        valueType === 'number' && styles.number,
                        valueType === 'date'   && styles.date,
                    ].filter(Boolean).join(' ');

                    return (
                        <div key={col} className={fieldClasses}>
                            <span className={styles.fieldLabel}>
                                {formatColumnName(col)}
                            </span>
                            <span className={valueClasses}>
                                {formatValue(value, valueType)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DataDetailCard;
