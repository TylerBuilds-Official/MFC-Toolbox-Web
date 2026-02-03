/**
 * DataToolSidebar - Left sidebar for selecting and running data tools
 * Grouped by category with collapsible sections
 */

import {useState, useMemo, type JSX} from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/useDataStore';
import { useDataApi } from '../../store/useDataApi';
import type { DataTool } from '../../types/data';
import styles from '../../styles/data_page/DataToolSidebar.module.css';

interface DataToolSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

// Category display order (categories not in this list appear at the end)
const CATEGORY_ORDER = ["Jobs", "Production", "Overtime"];

// Category icons (SVG components)
const CategoryIcons: Record<string, JSX.Element> = {
    Jobs: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
    ),
    Production: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
    ),
    Overtime: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    default: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
    ),
};

const getCategoryIcon = (category: string) => CategoryIcons[category] || CategoryIcons.default;

const DataToolSidebar = ({ isOpen, onClose }: DataToolSidebarProps) => {
    const navigate = useNavigate();
    const { tools, isLoading, isExecuting, error } = useDataStore();
    const { createAndExecute } = useDataApi();

    const [activeToolName, setActiveToolName] = useState<string | null>(null);
    const [paramValues, setParamValues] = useState<Record<string, string>>({});
    const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

    // Group tools by category and sort categories
    const groupedTools = useMemo(() => {
        const groups: Record<string, DataTool[]> = {};
        
        tools.forEach(tool => {
            const category = tool.display_category || "Other";
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(tool);
        });

        // Sort categories by defined order, then alphabetically for unlisted ones
        const sortedCategories = Object.keys(groups).sort((a, b) => {
            const indexA = CATEGORY_ORDER.indexOf(a);
            const indexB = CATEGORY_ORDER.indexOf(b);
            
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.localeCompare(b);
        });

        return sortedCategories.map(category => ({
            category,
            tools: groups[category]
        }));
    }, [tools]);

    const toggleCategory = (category: string) => {
        setCollapsedCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    };

    const handleToolClick = (tool: DataTool) => {
        if (tool.parameters.length === 0) {
            // No params - execute immediately
            runTool(tool.name, {});
        } else {
            // Toggle param form
            setActiveToolName(activeToolName === tool.name ? null : tool.name);
            setParamValues({});
        }
    };

    const handleParamChange = (paramName: string, value: string) => {
        setParamValues((prev) => ({ ...prev, [paramName]: value }));
    };

    const handleSubmitParams = (tool: DataTool) => {
        const params: Record<string, unknown> = {};
        tool.parameters.forEach((param) => {
            const value = paramValues[param.name];
            if (param.type === 'boolean') {
                // Always send booleans — default to false if never toggled
                params[param.name] = value === 'true';
            } else if (value !== undefined && value !== '') {
                if (param.type === 'number' || param.type === 'integer') {
                    params[param.name] = Number(value);
                } else {
                    params[param.name] = value;
                }
            }
        });
        runTool(tool.name, params);
    };

    const runTool = async (toolName: string, toolParams: Record<string, unknown>) => {
        try {
            const { session } = await createAndExecute({
                tool_name: toolName,
                tool_params: Object.keys(toolParams).length > 0 ? toolParams : undefined,
            });

            // Navigate to the new session
            navigate(`/data?session=${session.id}`);
            
            // Reset state and close
            setActiveToolName(null);
            setParamValues({});
            onClose();
        } catch (err) {
            console.error('Failed to run tool:', err);
        }
    };

    const canSubmit = (tool: DataTool): boolean => {
        return tool.parameters
            .filter((p) => p.required)
            .every((p) => paramValues[p.name]?.trim());
    };

    const formatToolName = (name: string): string => {
        return name
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`${styles.backdrop} ${isOpen ? styles.open : ''}`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerTitle}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                        </svg>
                        <h2>Data Tools</h2>
                    </div>
                    <button 
                        className={styles.closeBtn} 
                        onClick={onClose} 
                        aria-label="Close sidebar"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {/* Loading */}
                    {isLoading && !tools.length && (
                        <div className={styles.loading}>
                            <div className={styles.spinner} />
                            <span>Loading tools...</span>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className={styles.error}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Empty */}
                    {!isLoading && !error && tools.length === 0 && (
                        <div className={styles.empty}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                            </svg>
                            <span>No tools available</span>
                        </div>
                    )}

                    {/* Tools List - Grouped by Category */}
                    {!isLoading && !error && tools.length > 0 && (
                        <div className={styles.toolsList}>
                            {groupedTools.map(({ category, tools: categoryTools }) => {
                                const isCollapsed = collapsedCategories.has(category);
                                
                                return (
                                    <div key={category} className={styles.toolCategory}>
                                        <button
                                            className={`${styles.categoryHeader} ${isCollapsed ? styles.collapsed : ''}`}
                                            onClick={() => toggleCategory(category)}
                                            aria-expanded={!isCollapsed}
                                        >
                                            <span className={styles.categoryIcon}>
                                                {getCategoryIcon(category)}
                                            </span>
                                            <span className={styles.categoryName}>{category}</span>
                                            <span className={styles.categoryCount}>{categoryTools.length}</span>
                                            <span className={styles.categoryChevron}>
                                                <svg 
                                                    width="16" 
                                                    height="16" 
                                                    viewBox="0 0 24 24" 
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <polyline points="6 9 12 15 18 9" />
                                                </svg>
                                            </span>
                                        </button>
                                        
                                        <div className={`${styles.categoryTools} ${isCollapsed ? styles.collapsed : ''}`}>
                                            {categoryTools.map((tool) => (
                                                <div key={tool.name} className={styles.toolWrapper}>
                                                    <button
                                                        className={`${styles.toolItem} ${activeToolName === tool.name ? styles.active : ''}`}
                                                        onClick={() => handleToolClick(tool)}
                                                        disabled={isExecuting}
                                                    >
                                                        <span className={styles.toolIcon}>
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                                <line x1="3" y1="9" x2="21" y2="9" />
                                                                <line x1="9" y1="21" x2="9" y2="9" />
                                                            </svg>
                                                        </span>
                                                        <div className={styles.toolInfo}>
                                                            <span className={styles.toolName}>
                                                                {formatToolName(tool.name)}
                                                            </span>
                                                            <span className={styles.toolDescription}>
                                                                {tool.description}
                                                            </span>
                                                        </div>
                                                        {tool.parameters.length > 0 && (
                                                            <span className={styles.expandIcon}>
                                                                <svg 
                                                                    width="16" 
                                                                    height="16" 
                                                                    viewBox="0 0 24 24" 
                                                                    fill="none" 
                                                                    stroke="currentColor" 
                                                                    strokeWidth="2"
                                                                    style={{
                                                                        transform: activeToolName === tool.name ? 'rotate(180deg)' : 'rotate(0deg)',
                                                                        transition: 'transform 0.2s ease',
                                                                    }}
                                                                >
                                                                    <polyline points="6 9 12 15 18 9" />
                                                                </svg>
                                                            </span>
                                                        )}
                                                    </button>

                                                    {/* Parameter Form */}
                                                    {activeToolName === tool.name && tool.parameters.length > 0 && (
                                                        <div className={styles.paramsForm}>
                                                            {tool.parameters.map((param) => (
                                                                <div key={param.name} className={styles.paramField}>
                                                                    <label htmlFor={`param-${param.name}`}>
                                                                        {param.name}
                                                                        {param.required && <span className={styles.required}>*</span>}
                                                                    </label>
                                                                    {param.type === 'boolean' ? (
                                                                        <div className={styles.toggleRow}>
                                                                            <button
                                                                                id={`param-${param.name}`}
                                                                                type="button"
                                                                                className={`${styles.toggle} ${paramValues[param.name] === 'true' ? styles.toggleOn : ''}`}
                                                                                onClick={() => handleParamChange(
                                                                                    param.name,
                                                                                    paramValues[param.name] === 'true' ? 'false' : 'true'
                                                                                )}
                                                                                disabled={isExecuting}
                                                                            >
                                                                                <span className={styles.toggleKnob} />
                                                                            </button>
                                                                            <span className={styles.toggleLabel}>
                                                                                | {paramValues[param.name] === 'true' ? 'Yes' : 'No'}
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        <input
                                                                            id={`param-${param.name}`}
                                                                            type={param.type === 'number' || param.type === 'integer' ? 'number' : 'text'}
                                                                            placeholder={param.description || `Enter ${param.name}`}
                                                                            value={paramValues[param.name] || ''}
                                                                            onChange={(e) => handleParamChange(param.name, e.target.value)}
                                                                            disabled={isExecuting}
                                                                        />
                                                                    )}
                                                                </div>
                                                            ))}
                                                            <button
                                                                className={styles.submitBtn}
                                                                onClick={() => handleSubmitParams(tool)}
                                                                disabled={!canSubmit(tool) || isExecuting}
                                                            >
                                                                {isExecuting ? (
                                                                    <>
                                                                        <div className={styles.spinnerSmall} />
                                                                        Running...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                            <polygon points="5 3 19 12 5 21 5 3" />
                                                                        </svg>
                                                                        Run Tool
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};

export default DataToolSidebar;
