/**
 * DataChartCanvas - Renders charts using Recharts
 * Supports both single-series and multi-series (pivoted) data
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
import { useDataStore, useActiveChartConfig } from '../../store/useDataStore';
import type { DataResult } from '../../types/data';
import { formatColumnName, formatTickValue, formatTooltipValue, formatYAxisValue } from '../../services/api';
import styles from '../../styles/data_page/DataChartCanvas.module.css';

interface DataChartCanvasProps {
    result: DataResult;
}

// Alias for cleaner code in this file
const formatLabel = formatColumnName;

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

/**
 * Calculate optimal tick interval based on data length
 * Aims for ~10-15 visible ticks max to prevent label overlap
 */
const getTickInterval = (dataLength: number): number | "preserveStartEnd" => {
    if (dataLength <= 12)  return 0;
    if (dataLength <= 25)  return 1;
    if (dataLength <= 50)  return Math.floor(dataLength / 12) - 1;
    if (dataLength <= 100) return Math.floor(dataLength / 10) - 1;
    
    return "preserveStartEnd";
};

/**
 * Pivot flat data into multi-series format for charting
 * 
 * Input (flat):
 *   [{ ProductionDate: "2025-12-01", Machine: "V807", PiecesProcessed: 33 }, ...]
 * 
 * Output (pivoted):
 *   [{ xValue: "2025-12-01", "V807": 33, "Voortman": 16, ... }, ...]
 */
const pivotData = (
    rows: unknown[][],
    columns: string[],
    xAxisCol: string,
    seriesCol: string,
    yAxisCol: string
): { data: Record<string, unknown>[]; seriesNames: string[] } => {
    const xIndex = columns.indexOf(xAxisCol);
    const seriesIndex = columns.indexOf(seriesCol);
    const yIndex = columns.indexOf(yAxisCol);

    if (xIndex === -1 || seriesIndex === -1 || yIndex === -1) {
        return { data: [], seriesNames: [] };
    }

    // Group by x-axis value
    const grouped = new Map<string, Record<string, unknown>>();
    const seriesSet = new Set<string>();

    for (const row of rows) {
        const xValue = String(row[xIndex] ?? '');
        const seriesName = String(row[seriesIndex] ?? '');
        const yValue = row[yIndex];

        seriesSet.add(seriesName);

        if (!grouped.has(xValue)) {
            grouped.set(xValue, { xValue });
        }

        const entry = grouped.get(xValue)!;
        entry[seriesName] = typeof yValue === 'number' ? yValue : parseFloat(String(yValue)) || 0;
    }

    // Sort by x-axis value (assumes date or sortable string)
    const sortedData = Array.from(grouped.values()).sort((a, b) => 
        String(a.xValue).localeCompare(String(b.xValue))
    );

    return {
        data: sortedData,
        seriesNames: Array.from(seriesSet).sort(),
    };
};

const DataChartCanvas = ({ result }: DataChartCanvasProps) => {
    const { chartType, xAxis, yAxis } = useDataStore();
    const chartConfig = useActiveChartConfig();

    // Check if we should use multi-series pivot
    const useMultiSeries = chartConfig?.series_by && chartConfig?.x_axis && chartConfig?.y_axis;

    // Transform result data into chart-friendly format
    const { chartData, seriesNames, axisLabels } = useMemo(() => {
        if (!result) return { chartData: [], seriesNames: [], axisLabels: { x: '', y: '' } };

        // Multi-series pivot mode
        if (useMultiSeries && chartConfig) {
            const { data, seriesNames } = pivotData(
                result.rows,
                result.columns,
                chartConfig.x_axis,
                chartConfig.series_by,
                chartConfig.y_axis
            );
            return {
                chartData: data,
                seriesNames,
                axisLabels: {
                    x: formatLabel(chartConfig.x_axis_label || chartConfig.x_axis),
                    y: formatLabel(chartConfig.y_axis_label || chartConfig.y_axis),
                },
            };
        }

        // Single-series mode (original behavior)
        if (!xAxis) return { chartData: [], seriesNames: [], axisLabels: { x: '', y: '' } };

        const xIndex = result.columns.indexOf(xAxis);
        const yIndex = yAxis ? result.columns.indexOf(yAxis) : -1;

        if (xIndex === -1) return { chartData: [], seriesNames: [], axisLabels: { x: '', y: '' } };

        const data = result.rows.map((row, i) => {
            const item: Record<string, unknown> = {
                name: String(row[xIndex] ?? `Row ${i + 1}`),
            };

            if (yIndex !== -1) {
                const yValue = row[yIndex];
                item.value = typeof yValue === 'number' ? yValue : parseFloat(String(yValue)) || 0;
            } else {
                item.value = i + 1;
            }

            return item;
        });

        return {
            chartData: data,
            seriesNames: [],
            axisLabels: { x: formatLabel(xAxis), y: formatLabel(yAxis || 'Value') },
        };
    }, [result, xAxis, yAxis, chartConfig, useMultiSeries]);

    // No data to display
    if (!chartData.length) {
        return (
            <div className={styles.noData}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 3v18h18" />
                    <path d="M18 17l-5-5-4 4-3-3" />
                </svg>
                <h3>No visualization available</h3>
                <p>
                    {useMultiSeries 
                        ? 'The data returned is empty or incompatible with charting.'
                        : 'Use the axis dropdowns above to select which columns to visualize.'}
                </p>
            </div>
        );
    }

    // Render multi-series line chart
    const renderMultiSeriesLineChart = () => (
        <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis
                    dataKey="xValue"
                    stroke="var(--text-secondary)"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    tickFormatter={formatTickValue}
                    interval={getTickInterval(chartData.length)}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    label={{
                        value: axisLabels.x,
                        position: 'insideBottom',
                        offset: -10,
                        fill: 'var(--text-secondary)',
                    }}
                />
                <YAxis
                    stroke="var(--text-secondary)"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    tickFormatter={formatYAxisValue}
                    label={{
                        value: axisLabels.y,
                        angle: -90,
                        position: 'insideLeft',
                        fill: 'var(--text-secondary)',
                    }}
                />
                <Tooltip
                    contentStyle={{
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                    labelFormatter={formatTooltipValue}
                    formatter={(value: number, name: string) => [value.toLocaleString(), formatLabel(name)]}
                />
                <Legend formatter={formatLabel} />
                {seriesNames.map((name, index) => (
                    <Line
                        key={name}
                        type="monotone"
                        dataKey={name}
                        name={formatLabel(name)}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                        dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 6 }}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );

    // Render multi-series bar chart
    const renderMultiSeriesBarChart = () => (
        <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis
                    dataKey="xValue"
                    stroke="var(--text-secondary)"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    tickFormatter={formatTickValue}
                    interval={getTickInterval(chartData.length)}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                />
                <YAxis
                    stroke="var(--text-secondary)"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    tickFormatter={formatYAxisValue}
                    label={{
                        value: axisLabels.y,
                        angle: -90,
                        position: 'insideLeft',
                        fill: 'var(--text-secondary)',
                    }}
                />
                <Tooltip
                    contentStyle={{
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                    labelFormatter={formatTooltipValue}
                    formatter={(value: number, name: string) => [value.toLocaleString(), formatLabel(name)]}
                />
                <Legend formatter={formatLabel} />
                {seriesNames.map((name, index) => (
                    <Bar
                        key={name}
                        dataKey={name}
                        name={formatLabel(name)}
                        fill={COLORS[index % COLORS.length]}
                        radius={[4, 4, 0, 0]}
                    />
                ))}
            </BarChart>
        </ResponsiveContainer>
    );

    // Render single-series charts (original behavior)
    const renderSingleSeriesChart = () => {
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
                                tickFormatter={formatTickValue}
                                interval={getTickInterval(chartData.length)}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis
                                stroke="var(--text-secondary)"
                                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                tickFormatter={formatYAxisValue}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--bg-primary)',
                                    border: '1px solid var(--border-primary)',
                                    borderRadius: '8px',
                                }}
                                labelStyle={{ color: 'var(--text-primary)' }}
                                formatter={(value: number) => [value.toLocaleString(), axisLabels.y]}
                            />
                            <Legend />
                            <Bar
                                dataKey="value"
                                name={axisLabels.y}
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
                                tickFormatter={formatTickValue}
                                interval={getTickInterval(chartData.length)}
                                angle={-45}
                                textAnchor="end"
                                height={80}/>

                            <YAxis
                                stroke="var(--text-secondary)"
                                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                tickFormatter={formatYAxisValue}/>

                            <Tooltip
                                contentStyle={{
                                    background: 'var(--bg-primary)',
                                    border: '1px solid var(--border-primary)',
                                    borderRadius: '8px',
                                }}
                                labelStyle={{ color: 'var(--text-primary)' }}
                                formatter={(value: number) => [value.toLocaleString(), axisLabels.y]}/>

                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="value"
                                name={axisLabels.y}
                                stroke={COLORS[0]}
                                strokeWidth={2}
                                dot={{ fill: COLORS[0], strokeWidth: 2 }}
                                activeDot={{ r: 6 }}/>

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
                                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                                outerRadius={150}
                                fill="#8884d8"
                                dataKey="value">

                                {chartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}

                            </Pie>

                            <Tooltip
                                contentStyle={{
                                    background: 'var(--bg-primary)',
                                    border: '1px solid var(--border-primary)',
                                    borderRadius: '8px',
                                }}/>

                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );

            default:
                return null;
        }
    };

    // Render appropriate chart
    const renderChart = () => {
        // Multi-series mode
        if (useMultiSeries && seriesNames.length > 0) {
            switch (chartType) {
                case 'line':
                    return renderMultiSeriesLineChart();
                case 'bar':
                    return renderMultiSeriesBarChart();
                case 'pie':
                    // Pie doesn't make sense for time-series, fall back to single
                    return renderSingleSeriesChart();
                default:
                    return renderMultiSeriesLineChart();
            }
        }

        // Single-series mode
        return renderSingleSeriesChart();
    };

    return (
        <div className={styles.canvas}>
            {renderChart()}
        </div>
    );
};

export default DataChartCanvas;
