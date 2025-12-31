/**
 * DataTable - Raw data table view
 */

import type { DataResult } from '../../types/data';
import styles from '../../styles/data_page/DataTable.module.css';

interface DataTableProps {
    result: DataResult;
}

const DataTable = ({ result }: DataTableProps) => {
    const formatValue = (value: unknown): string => {
        if (value === null || value === undefined) {
            return '—';
        }
        if (typeof value === 'number') {
            // Format numbers with commas
            return value.toLocaleString();
        }
        return String(value);
    };

    return (
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        {result.columns.map((column) => (
                            <th key={column}>{column}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {result.rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                                <td key={cellIndex}>{formatValue(cell)}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;
