/**
 * DataChartCanvas - Renders charts using Recharts
 */

import { useMemo } from 'react';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { useDataStore } from '../../store/useDataStore';
import type { DataResult } from '../../types/data';
import styles from '../../styles/data_page/DataChartCanvas.module.css';

interface DataChartCanvasProps {
    result: DataResult;
}

// Color palette for charts
const COLORS = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
];

const DataChartCanvas = ({ result }: DataChartCanvasProps) => {
    const { chartType, xAxis, yAxis } = useDataStore();

    // Transform result data into chart-friendly format
    const chartData = useMemo(() => {
        if (!result || !xAxis) return [];

        const xIndex = result.columns.indexOf(xAxis);
        const yIndex = yAxis ? result.columns.indexOf(yAxis) : -1;

        if (xIndex === -1) return [];

        return result.rows.map((row, i) => {
            const item: Record<string, unknown> = {
                name: String(row[xIndex] ?? `Row ${i + 1}`),
            };

            if (yIndex !== -1) {
                const yValue = row[yIndex];
                item.value = typeof yValue === 'number' ? yValue : parseFloat(String(yValue)) || 0;
            } else {
                // If no Y axis selected, use row index or first numeric column
                item.value = i + 1;
            }

            return item;
        });
    }, [result, xAxis, yAxis]);

    // No data to display
    if (!chartData.length || !xAxis) {
        return (
            <div className={styles.noData}>
                <p>Select X and Y axes to visualize data</p>
            </div>
        );
    }

    // Render appropriate chart type
    const renderChart = () => {
        switch (chartType) {
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                            <XAxis 
                                dataKey="name" 
                                stroke="var(--text-secondary)"
                                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis 
                                stroke="var(--text-secondary)"
                                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                            />
                            <Tooltip 
                                contentStyle={{
                                    background: 'var(--bg-primary)',
                                    border: '1px solid var(--border-primary)',
                                    borderRadius: '8px',
                                }}
                                labelStyle={{ color: 'var(--text-primary)' }}
                            />
                            <Legend />
                            <Bar 
                                dataKey="value" 
                                name={yAxis || 'Value'}
                                fill={COLORS[0]} 
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                            <XAxis 
                                dataKey="name" 
                                stroke="var(--text-secondary)"
                                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis 
                                stroke="var(--text-secondary)"
                                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                            />
                            <Tooltip 
                                contentStyle={{
                                    background: 'var(--bg-primary)',
                                    border: '1px solid var(--border-primary)',
                                    borderRadius: '8px',
                                }}
                                labelStyle={{ color: 'var(--text-primary)' }}
                            />
                            <Legend />
                            <Line 
                                type="monotone" 
                                dataKey="value" 
                                name={yAxis || 'Value'}
                                stroke={COLORS[0]} 
                                strokeWidth={2}
                                dot={{ fill: COLORS[0], strokeWidth: 2 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={150}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {chartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{
                                    background: 'var(--bg-primary)',
                                    border: '1px solid var(--border-primary)',
                                    borderRadius: '8px',
                                }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );

            default:
                return null;
        }
    };

    return (
        <div className={styles.canvas}>
            {renderChart()}
        </div>
    );
};

export default DataChartCanvas;
