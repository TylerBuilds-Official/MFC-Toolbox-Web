/**
 * DataTable - Raw data table view with sorting, summaries, and draggable columns
 */

import { useState, useMemo } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { DataResult } from '../../types/data';
import { formatColumnName, formatPMName } from '../../services/api';
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

// =============================================================================
// Sortable Header Cell Component
// =============================================================================

interface SortableHeaderProps {
    column: string;
    sortColumn: string | null;
    sortDirection: SortDirection;
    onSort: (column: string) => void;
}

const SortableHeader = ({ column, sortColumn, sortDirection, onSort }: SortableHeaderProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: column });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const isActive = sortColumn === column;

    return (
        <th
            ref={setNodeRef}
            style={style}
            className={`${styles.sortableHeader} ${isDragging ? styles.draggingHeader : ''}`}
            title={`Sort by ${formatColumnName(column)}`}
        >
            <span className={styles.headerContent}>
                <button
                    className={styles.columnDragHandle}
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical size={12} />
                </button>
                <span 
                    className={styles.headerLabel}
                    onClick={() => onSort(column)}
                >
                    {formatColumnName(column)}
                </span>
                <span className={`${styles.sortIndicator} ${isActive ? styles.active : ''}`}>
                    {isActive && (sortDirection === 'asc' ? '▲' : '▼')}
                </span>
            </span>
        </th>
    );
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Detect column type from values
 */
const detectColumnType = (values: unknown[]): ColumnType => {
    for (const value of values) {
        if (value === null || value === undefined || value === '') continue;

        if (typeof value === 'number') return 'number';

        if (typeof value === 'string') {
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

// =============================================================================
// Main Component
// =============================================================================

const DataTable = ({ result }: DataTableProps) => {
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [columnOrder, setColumnOrder] = useState<string[]>(result.columns);

    // Update column order when result changes
    useMemo(() => {
        if (JSON.stringify(result.columns) !== JSON.stringify(columnOrder)) {
            setColumnOrder(result.columns);
        }
    }, [result.columns]);

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Build column index map for reordering
    const originalIndexMap = useMemo(() => {
        const map: Record<string, number> = {};
        result.columns.forEach((col, i) => {
            map[col] = i;
        });
        return map;
    }, [result.columns]);

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

        const colIndex = originalIndexMap[sortColumn];
        if (colIndex === undefined) return result.rows;

        const type = columnTypes[sortColumn];

        return [...result.rows].sort((a, b) =>
            compareValues(a[colIndex], b[colIndex], type, sortDirection)
        );
    }, [result.rows, sortColumn, sortDirection, columnTypes, originalIndexMap]);

    // Calculate summaries
    const summaries = useMemo(() => {
        const summaryMap: Record<string, ColumnSummary> = {};
        result.columns.forEach((col, colIndex) => {
            const values = result.rows.map(row => row[colIndex]);
            summaryMap[col] = calculateColumnSummary(values, columnTypes[col]);
        });
        return summaryMap;
    }, [result.rows, result.columns, columnTypes]);

    // Handle header click for sorting
    const handleHeaderClick = (column: string) => {
        if (sortColumn !== column) {
            setSortColumn(column);
            setSortDirection('asc');
        } else if (sortDirection === 'asc') {
            setSortDirection('desc');
        } else {
            setSortColumn(null);
            setSortDirection(null);
        }
    };

    // Handle column drag end
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setColumnOrder((current) => {
                const oldIndex = current.indexOf(String(active.id));
                const newIndex = current.indexOf(String(over.id));
                return arrayMove(current, oldIndex, newIndex);
            });
        }
    };

    const formatValue = (value: unknown, colName: string): string => {
        if (value === null || value === undefined) {
            return '—';
        }

        const col = colName.toLowerCase();

        if (col === 'projectmanager') {
            return formatPMName(value);
        }

        // Handle ISO date strings (2024-07-22T00:00:00)
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            }
        }

        // Identifier fields - no comma formatting
        if (col.includes('jobnumber') || col.includes('jobno') || col.includes('_id') || col === 'id') {
            return String(value);
        }

        if (typeof value === 'number') {
            return value.toLocaleString();
        }
        return String(value);
    };

    return (
        <div className={styles.tableWrapper}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <SortableContext
                                items={columnOrder}
                                strategy={horizontalListSortingStrategy}
                            >
                                {columnOrder.map((column) => (
                                    <SortableHeader
                                        key={column}
                                        column={column}
                                        sortColumn={sortColumn}
                                        sortDirection={sortDirection}
                                        onSort={handleHeaderClick}
                                    />
                                ))}
                            </SortableContext>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {columnOrder.map((col) => (
                                    <td key={col}>
                                        {formatValue(row[originalIndexMap[col]], col)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className={styles.summaryRow}>
                            {columnOrder.map((col, index) => (
                                <td key={col} className={styles.summaryCell}>
                                    {formatSummary(summaries[col], index === 0)}
                                </td>
                            ))}
                        </tr>
                    </tfoot>
                </table>
            </DndContext>
        </div>
    );
};

export default DataTable;
