/**
 * DataDetailCard - Single record display as a styled card
 * Used for tools that return a single row (job details, etc.)
 */

import type { DataResult } from '../../types/data';
import formatDateWithYear, { formatColumnName, formatPMName } from '../../services/api';
import styles from '../../styles/data_page/DataDetailCard.module.css';

interface DataDetailCardProps {
    result: DataResult;
}

// =============================================================================
// Value Type Detection & Formatting
// =============================================================================

type ValueType = 'string' | 'number' | 'date' | 'empty' | 'currency' | 'weight' | 'hours';

const isNumeric = (value: unknown): boolean => {
    if (typeof value === 'number') return true;
    if (typeof value === 'string' && value !== '' && !isNaN(Number(value))) return true;
    return false;
};

const detectValueType = (value: unknown, colName: string): ValueType => {
    if (value === null || value === undefined || value === '') return 'empty';
    
    const col = colName.toLowerCase();
    
    // Currency check FIRST (before date, since "CostsToDate" contains "date")
    if (isNumeric(value)) {
        if (col.includes('amount') || col.includes('cost')) return 'currency';
        if (col.includes('contract') && !col.includes('contractor')) return 'currency';
        if (col.includes('weight')) return 'weight';
        if (col.includes('hours'))  return 'hours';
    }
    
    // Date patterns - be more specific
    const isDateField = col.endsWith('date') || col.startsWith('date') || 
                        col === 'targetdelivery' || col === 'erectdate' || col === 'startdate';
    if (isDateField) return 'date';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
    
    // Identifier fields - numeric but shouldn't be formatted with commas
    if (col.includes('jobnumber') || col.includes('jobno') || col.includes('_id') || col === 'id') return 'string';
    
    // Generic numeric
    if (isNumeric(value)) return 'number';
    
    return 'string';
};

const formatNumber = (value: number): string => {
    const rounded = Math.round(value * 100) / 100;
    return rounded.toLocaleString(undefined, { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 2 
    });
};

const formatValue = (value: unknown, type: ValueType): string => {
    switch (type) {
        case 'empty':    return '—';
        case 'currency': return '$' + formatNumber(Number(value));
        case 'weight':   return formatNumber(Number(value)) + ' lbs';
        case 'hours':    return formatNumber(Number(value)) + ' hrs';
        case 'number':   return formatNumber(Number(value));
        case 'date':     return formatDateWithYear(String(value));
        default:         return String(value);
    }
};

// =============================================================================
// Field Classification
// =============================================================================

const isFullWidthField = (colName: string): boolean => {
    const col = colName.toLowerCase();
    return col === 'notes' || col.includes('description') || col.includes('comment');
};

const isPrimaryField = (colName: string): boolean => {
    const col = colName.toLowerCase();
    return col === 'jobnumber' || col === 'jobname';
};

// =============================================================================
// Conditional Styling
// =============================================================================

const getStatusStyle = (value: unknown): string | null => {
    if (typeof value !== 'string') return null;
    
    const status = value.toLowerCase();
    if (status === 'active')                         return 'positive';
    if (status === 'on hold' || status === 'onhold') return 'warning';
    if (status === 'complete')                       return 'neutral';
    
    return null;
};

const getSteelStatusStyle = (value: unknown): string | null => {
    if (typeof value !== 'string') return null;
    
    const status = value.toLowerCase();
    if (status === 'fully ordered') return 'positive';
    
    return 'warning';
};

const getHoursStyle = (
    colName: string,
    value: unknown,
    rowData: Record<string, unknown>
): string | null => {
    const col    = colName.toLowerCase();
    const numVal = typeof value === 'number' ? value : Number(value);
    
    if (col === 'hoursremaining') {
        return numVal > 0 ? 'positive' : 'negative';
    }
    
    if (col === 'hoursused') {
        const total = Number(rowData['TotalHours']) || 0;
        if (total > 0) {
            return numVal <= total ? 'positive' : 'negative';
        }
    }
    
    return null;
};

// =============================================================================
// Component
// =============================================================================

const DataDetailCard = ({ result }: DataDetailCardProps) => {
    if (!result.rows.length) {
        return (
            <div className={styles.card}>
                <p>No data available</p>
            </div>
        );
    }

    const row = result.rows[0];
    
    // Build lookup object for conditional logic
    const rowData: Record<string, unknown> = {};
    result.columns.forEach((col, i) => {
        rowData[col] = row[i];
    });

    // Separate full-width fields from regular fields
    const regularFields: { col: string; index: number }[] = [];
    const fullWidthFields: { col: string; index: number }[] = [];
    
    result.columns.forEach((col, i) => {
        if (isFullWidthField(col)) {
            fullWidthFields.push({ col, index: i });
        } else {
            regularFields.push({ col, index: i });
        }
    });

    // Render a single field
    const renderField = (col: string, index: number, isFullWidth: boolean = false) => {
        const value     = row[index];
        const valueType = detectValueType(value, col);
        const isPrimary = isPrimaryField(col);
        const colLower  = col.toLowerCase();
        
        // Determine conditional styling
        let conditionalStyle: string | null = null;
        if (colLower === 'status')           conditionalStyle = getStatusStyle(value);
        else if (colLower === 'steelstatus') conditionalStyle = getSteelStatusStyle(value);
        else                                 conditionalStyle = getHoursStyle(col, value, rowData);

        const fieldClasses = [
            styles.field,
            isFullWidth && styles.fullWidth,
            isPrimary   && styles.primary,
        ].filter(Boolean).join(' ');

        const valueClasses = [
            styles.fieldValue,
            valueType === 'empty'           && styles.empty,
            valueType === 'number'          && styles.number,
            valueType === 'currency'        && styles.number,
            valueType === 'weight'          && styles.number,
            valueType === 'hours'           && styles.number,
            valueType === 'date'            && styles.date,
            conditionalStyle === 'positive' && styles.positive,
            conditionalStyle === 'negative' && styles.negative,
            conditionalStyle === 'warning'  && styles.warning,
            conditionalStyle === 'neutral'  && styles.neutral,
        ].filter(Boolean).join(' ');

        // Format display value (with PM name mapping)
        let displayValue = formatValue(value, valueType);
        if (colLower === 'projectmanager') {
            displayValue = formatPMName(value);
        }

        return (
            <div key={col} className={fieldClasses}>
                <span className={styles.fieldLabel}>
                    {formatColumnName(col)}
                </span>
                <span className={valueClasses}>
                    {displayValue}
                </span>
            </div>
        );
    };

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
                <span className={styles.headerTitle}>
                    {rowData['JobName'] ? String(rowData['JobName']) : 'Record Details'}
                </span>
            </div>

            {/* Two-column grid for regular fields */}
            <div className={styles.grid}>
                {regularFields.map(({ col, index }) => renderField(col, index, false))}
            </div>

            {/* Full-width fields at bottom (Notes, etc.) */}
            {fullWidthFields.length > 0 && (
                <div className={styles.notesSection}>
                    {fullWidthFields.map(({ col, index }) => renderField(col, index, true))}
                </div>
            )}
        </div>
    );
};

export default DataDetailCard;
