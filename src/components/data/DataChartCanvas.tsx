/**
 * DataChartCanvas - Renders charts using Recharts
 * Supports both single-series and multi-series (pivoted) data
 */

import { useMemo, useRef } from 'react';

import { BarChart, Bar, LineChart, Line,
         PieChart, Pie, Cell, XAxis,
         YAxis, CartesianGrid, Tooltip,
         Legend, ResponsiveContainer } from 'recharts';

import { useDataStore, useActiveChartConfig } from '../../store/useDataStore';
import type { DataResult } from '../../types';
import { formatColumnName, formatTickValue, formatTooltipValue, formatYAxisValue } from '../../services';
import styles from '../../styles/data_page/DataChartCanvas.module.css';

interface DataChartCanvasProps {
    result: DataResult;
}

// Alias for cleaner code in this file
const formatLabel = formatColumnName;

/**
 * Custom tooltip that flips to the left when on the right side of the chart
 * Prevents overflow and horizontal scrollbar issues
 */
interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
        value: number;
        name: string;
        color: string;
    }>;
    label?: string | number;
    coordinate?: { x: number; y: number };
    chartWidth?: number;
    labelFormatter?: (label: string) => string;
    valueFormatter?: (value: number, name: string) => [string, string];
}

const CustomTooltip = ({ 
    active, 
    payload, 
    label, 
    coordinate, 
    chartWidth = 0,
    labelFormatter,
    valueFormatter,
}: CustomTooltipProps) => {
    if (!active || !payload?.length) return null;

    // Determine if we're on the right half of the chart
    const cursorX = coordinate?.x || 0;
    const isRightHalf = chartWidth > 0 && cursorX > chartWidth / 2;

    const formattedLabel = labelFormatter ? labelFormatter(String(label)) : String(label);

    return (
        <div 
            className={styles.customTooltip}
            style={{
                transform: isRightHalf ? 'none' : 'translateX(16px)',
            }}
        >
            <p className={styles.tooltipLabel}>{formattedLabel}</p>
            {payload.map((entry, index: number) => {
                const [formattedValue, formattedName] = valueFormatter 
                    ? valueFormatter(entry.value, entry.name)
                    : [entry.value?.toLocaleString() || '0', formatLabel(entry.name)];
                
                return (
                    <p key={index} className={styles.tooltipItem}>
                        <span 
                            className={styles.tooltipDot} 
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className={styles.tooltipName}>{formattedName}:</span>
                        <span className={styles.tooltipValue}>{formattedValue}</span>
                    </p>
                );
            })}
        </div>
    );
};

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
 * Calculate the optimal tick interval based on data length
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

/** Legend item type for custom legend */
interface LegendItem {
    label: string;
    color: string;
}

const DataChartCanvas = ({ result }: DataChartCanvasProps) => {
    const { chartType, xAxis, yAxis } = useDataStore();
    const chartConfig = useActiveChartConfig();
    const chartWrapperRef = useRef<HTMLDivElement>(null);

    // Get chart width for tooltip positioning
    const getChartWidth = () => chartWrapperRef.current?.clientWidth || 0;

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

    // Build legend items for custom legend
    const legendItems: LegendItem[] = useMemo(() => {
        // Pie charts use Recharts' built-in legend
        if (chartType === 'pie') return [];
        
        // Multi-series: one item per series
        if (useMultiSeries && seriesNames.length > 0) {
            return seriesNames.map((name, index) => ({
                label: formatLabel(name),
                color: COLORS[index % COLORS.length],
            }));
        }
        
        // Single-series: show Y-axis label
        if (axisLabels.y) {
            return [{ label: axisLabels.y, color: COLORS[0] }];
        }
        
        return [];
    }, [chartType, useMultiSeries, seriesNames, axisLabels.y]);

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
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 80, right: 30, left: 60, bottom: 80 }}>
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
                        position: 'bottom',
                        offset: 0,
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
                        position: 'center',
                        dx: -20,
                        fill: 'var(--text-secondary)',
                    }}
                />
                <Tooltip
                    content={(props) => (
                        <CustomTooltip
                            active={props.active}
                            payload={props.payload as CustomTooltipProps['payload']}
                            label={props.label}
                            coordinate={props.coordinate}
                            chartWidth={getChartWidth()}
                            labelFormatter={formatTooltipValue}
                            valueFormatter={(value, name) => [value?.toLocaleString() ?? '0', formatLabel(name)]}
                        />
                    )}
                />
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
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 80, right: 30, left: 60, bottom: 80 }}>
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
                        position: 'bottom',
                        offset: 0,
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
                        position: 'center',
                        dx: -20,
                        fill: 'var(--text-secondary)',
                    }}
                />
                <Tooltip
                    content={(props) => (
                        <CustomTooltip
                            active={props.active}
                            payload={props.payload as CustomTooltipProps['payload']}
                            label={props.label}
                            coordinate={props.coordinate}
                            chartWidth={getChartWidth()}
                            labelFormatter={formatTooltipValue}
                            valueFormatter={(value, name) => [value?.toLocaleString() ?? '0', formatLabel(name)]}
                        />
                    )}
                />
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
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 80, right: 30, left: 60, bottom: 80 }}>
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
                                label={{
                                    value: axisLabels.x,
                                    position: 'bottom',
                                    offset: 0,
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
                                    position: 'center',
                                    dx: -20,
                                    fill: 'var(--text-secondary)',
                                }}
                            />
                            <Tooltip
                                content={(props) => (
                                    <CustomTooltip
                                        active={props.active}
                                        payload={props.payload as CustomTooltipProps['payload']}
                                        label={props.label}
                                        coordinate={props.coordinate}
                                        chartWidth={getChartWidth()}
                                        valueFormatter={(value) => [value?.toLocaleString() ?? '0', axisLabels.y]}
                                    />
                                )}
                            />
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
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 80, right: 30, left: 60, bottom: 80 }}>
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
                                label={{
                                    value: axisLabels.x,
                                    position: 'bottom',
                                    offset: 0,
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
                                    position: 'center',
                                    dx: -20,
                                    fill: 'var(--text-secondary)',
                                }}
                            />
                            <Tooltip
                                content={(props) => (
                                    <CustomTooltip
                                        active={props.active}
                                        payload={props.payload as CustomTooltipProps['payload']}
                                        label={props.label}
                                        coordinate={props.coordinate}
                                        chartWidth={getChartWidth()}
                                        valueFormatter={(value) => [value?.toLocaleString() ?? '0', axisLabels.y]}
                                    />
                                )}
                            />
                            <Line
                                type="monotone"
                                dataKey="value"
                                name={axisLabels.y}
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
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
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

    // Render custom legend
    const renderLegend = () => {
        if (legendItems.length === 0) return null;
        
        return (
            <div className={styles.legendContainer}>
                <span className={styles.legendHeader}>Legend</span>
                <div className={styles.legendItems}>
                    {legendItems.map((item, index) => (
                        <div key={index} className={styles.legendItem}>
                            <span 
                                className={styles.legendDot} 
                                style={{ backgroundColor: item.color }}
                            />
                            <span className={styles.legendLabel}>{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className={styles.canvas}>
            <div className={styles.chartWrapper} ref={chartWrapperRef}>
                {renderChart()}
            </div>
            {renderLegend()}
        </div>
    );
};

export default DataChartCanvas;
