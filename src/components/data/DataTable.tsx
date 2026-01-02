/**
 * DataTable - Raw data table view with sorting and summaries
 */

import { useState, useMemo } from 'react';
import type { DataResult } from '../../types/data';
import { formatColumnName } from '../../services/api';
import styles from '../../styles/data_page/DataTable.module.css';

interface DataTableProps {
    result: DataResult;
}

type SortDirection = 'asc' | 'desc' | null;

type ColumnType = 'number' | 'date' | 'string';

interface ColumnSummary {
    type: ColumnType;
    sum?: number;
    distinctCount?: number;
    minDate?: Date;
    maxDate?: Date;
}

/**
 * Detect column type from values
 */
const detectColumnType = (values: unknown[]): ColumnType => {
    for (const value of values) {
        if (value === null || value === undefined || value === '') continue;
        
        if (typeof value === 'number') return 'number';
        
        if (typeof value === 'string') {
            // Check for ISO date format
            if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
                const parsed = new Date(value);
                if (!isNaN(parsed.getTime())) return 'date';
            }
        }
    }
    return 'string';
};

/**
 * Parse value for sorting comparison
 */
const parseValueForSort = (value: unknown, type: ColumnType): number | string | Date => {
    if (value === null || value === undefined) {
        // Nulls sort to end
        return type === 'number' ? -Infinity : type === 'date' ? new Date(0) : '';
    }
    
    switch (type) {
        case 'number':
            return typeof value === 'number' ? value : parseFloat(String(value)) || 0;
        case 'date':
            return new Date(String(value));
        default:
            return String(value).toLowerCase();
    }
};

/**
 * Compare two values for sorting
 */
const compareValues = (a: unknown, b: unknown, type: ColumnType, direction: 'asc' | 'desc'): number => {
    const aVal = parseValueForSort(a, type);
    const bVal = parseValueForSort(b, type);
    
    let result: number;
    
    if (type === 'number') {
        result = (aVal as number) - (bVal as number);
    } else if (type === 'date') {
        result = (aVal as Date).getTime() - (bVal as Date).getTime();
    } else {
        result = (aVal as string).localeCompare(bVal as string);
    }
    
    return direction === 'desc' ? -result : result;
};

/**
 * Calculate summary for a column
 */
const calculateColumnSummary = (values: unknown[], type: ColumnType): ColumnSummary => {
    const summary: ColumnSummary = { type };
    
    switch (type) {
        case 'number': {
            let sum = 0;
            for (const value of values) {
                if (typeof value === 'number') {
                    sum += value;
                } else if (value !== null && value !== undefined) {
                    sum += parseFloat(String(value)) || 0;
                }
            }
            summary.sum = sum;
            break;
        }
        case 'date': {
            let min: Date | null = null;
            let max: Date | null = null;
            for (const value of values) {
                if (value === null || value === undefined) continue;
                const date = new Date(String(value));
                if (isNaN(date.getTime())) continue;
                if (!min || date < min) min = date;
                if (!max || date > max) max = date;
            }
            if (min) summary.minDate = min;
            if (max) summary.maxDate = max;
            break;
        }
        case 'string': {
            const distinct = new Set<string>();
            for (const value of values) {
                if (value !== null && value !== undefined && value !== '') {
                    distinct.add(String(value));
                }
            }
            summary.distinctCount = distinct.size;
            break;
        }
    }
    
    return summary;
};

/**
 * Format summary value for display
 */
const formatSummary = (summary: ColumnSummary, isFirstColumn: boolean): string => {
    if (isFirstColumn) return 'Total';
    
    switch (summary.type) {
        case 'number':
            return summary.sum?.toLocaleString() ?? '—';
        case 'date':
            if (summary.minDate && summary.maxDate) {
                const fmt = (d: Date) => d.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                });
                return `${fmt(summary.minDate)} → ${fmt(summary.maxDate)}`;
            }
            return '—';
        case 'string':
            return summary.distinctCount !== undefined 
                ? `${summary.distinctCount} unique` 
                : '—';
        default:
            return '—';
    }
};

const DataTable = ({ result }: DataTableProps) => {
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    // Detect column types
    const columnTypes = useMemo(() => {
        const types: Record<string, ColumnType> = {};
        result.columns.forEach((col, colIndex) => {
            const values = result.rows.map(row => row[colIndex]);
            types[col] = detectColumnType(values);
        });
        return types;
    }, [result.columns, result.rows]);

    // Sort rows
    const sortedRows = useMemo(() => {
        if (!sortColumn || !sortDirection) return result.rows;
        
        const colIndex = result.columns.indexOf(sortColumn);
        if (colIndex === -1) return result.rows;
        
        const type = columnTypes[sortColumn];
        
        return [...result.rows].sort((a, b) => 
            compareValues(a[colIndex], b[colIndex], type, sortDirection)
        );
    }, [result.rows, result.columns, sortColumn, sortDirection, columnTypes]);

    // Calculate summaries
    const summaries = useMemo(() => {
        return result.columns.map((col, colIndex) => {
            const values = result.rows.map(row => row[colIndex]);
            return calculateColumnSummary(values, columnTypes[col]);
        });
    }, [result.rows, result.columns, columnTypes]);

    // Handle header click
    const handleHeaderClick = (column: string) => {
        if (sortColumn !== column) {
            // New column: start ascending
            setSortColumn(column);
            setSortDirection('asc');
        } else if (sortDirection === 'asc') {
            // Same column, was asc: go descending
            setSortDirection('desc');
        } else {
            // Same column, was desc: clear sort
            setSortColumn(null);
            setSortDirection(null);
        }
    };

    const formatValue = (value: unknown): string => {
        if (value === null || value === undefined) {
            return '—';
        }
        if (typeof value === 'number') {
            return value.toLocaleString();
        }
        return String(value);
    };

    // Render sort indicator
    const renderSortIndicator = (column: string) => {
        if (sortColumn !== column) {
            return <span className={styles.sortIndicator} />;
        }
        return (
            <span className={`${styles.sortIndicator} ${styles.active}`}>
                {sortDirection === 'asc' ? '▲' : '▼'}
            </span>
        );
    };

    return (
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        {result.columns.map((column) => (
                            <th 
                                key={column}
                                onClick={() => handleHeaderClick(column)}
                                className={styles.sortableHeader}
                                title={`Sort by ${formatColumnName(column)}`}
                            >
                                <span className={styles.headerContent}>
                                    {formatColumnName(column)}
                                    {renderSortIndicator(column)}
                                </span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedRows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                                <td key={cellIndex}>{formatValue(cell)}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className={styles.summaryRow}>
                        {summaries.map((summary, index) => (
                            <td key={index} className={styles.summaryCell}>
                                {formatSummary(summary, index === 0)}
                            </td>
                        ))}
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};

export default DataTable;
