import { useState, useEffect } from "react";
import { type Tool, type ToolParameter } from "../types/tools";
import { useApi } from "../auth";
import { useAuth } from "../auth";
import { formatToolName } from "../services/api";
import "../styles/toolboxSidebar.css";
import Icons from "../assets/svg/toolbox/toolboxIcons.tsx";
import HeaderWrenchIcon from "../assets/svg/toolbox/headerWrench.tsx";
import ToolboxCloseButtonIcon from "../assets/svg/toolbox/toolboxCloseButton.tsx";
import ToolboxErrorIcon from "../assets/svg/toolbox/toolboxError.tsx";
import EmptyToolboxIcon from "../assets/svg/toolbox/emptyToolbox.tsx";
import ToolExpandIcon from "../assets/svg/toolbox/toolExpand.tsx";
import ParamSubmitIcon from "../assets/svg/toolbox/paramSubmit.tsx";
import LoadingSpinner from "./loadingSpinner.tsx";

// Interface for API response (simplified format from backend)
interface ChatToolboxResponse {
    tools: Array<{
        name: string;
        description: string;
        parameters: Array<{
            name: string;
            type: string;
            required: boolean;
            description: string;
        }>;
        data_visualization?: boolean;
        default_chart_type?: string;
        chart_config?: Record<string, string>;
    }>;
}

// Generate a prompt template from tool name and parameters
function generateToolPrompt(name: string, parameters: ToolParameter[]): string {
    const defaultPrompts: Record<string, string> = {
        "get_job_info": "Get the details for job",
        "get_all_job_info": "List all jobs",
        "get_machine_production": "Show machine production data",
        "get_ot_hours_by_job": "Get overtime hours for job",
        "get_ot_hours_all_jobs": "Get overtime hours across all jobs",
    };
    
    const basePrompt = defaultPrompts[name] || formatToolName(name);
    
    if (parameters.length === 0) {
        return basePrompt;
    }
    
    const paramPlaceholders = parameters.map(p => `{${p.name}}`).join(", ");
    return `${basePrompt} ${paramPlaceholders}`;
}

interface ToolboxSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onToolSelect: (prompt: string) => void;
}

const ToolboxSidebar = ({ isOpen, onClose, onToolSelect }: ToolboxSidebarProps) => {
    const { user } = useAuth();
    const api = useApi();

    const [tools, setTools] = useState<Tool[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeToolId, setActiveToolId] = useState<string | null>(null);
    const [paramValues, setParamValues] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchTools = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                // Fetch tools filtered for chat toolbox (excludes AI-internal tools)
                const response = await api.get<ChatToolboxResponse>('/tools?surface=chat_toolbox');
                
                // Transform to internal Tool format
                const fetchedTools: Tool[] = (response.tools || []).map(tool => {
                    const parameters: ToolParameter[] = tool.parameters.map(p => ({
                        name: p.name,
                        type: p.type === "integer" ? "number" : p.type as "string" | "number",
                        required: p.required,
                        description: p.description
                    }));
                    
                    return {
                        id: tool.name,
                        name: formatToolName(tool.name),
                        description: tool.description,
                        prompt: generateToolPrompt(tool.name, parameters),
                        parameters
                    };
                });
                
                console.log("[ToolboxSidebar] Loaded tools:", fetchedTools);
                setTools(fetchedTools);
                setError(null);
            } catch (err) {
                setError("Failed to load tools");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            fetchTools();
        }
    }, [isOpen, user, api]);

    const handleToolClick = (tool: Tool) => {
        if (tool.parameters.length === 0) {
            onToolSelect(tool.prompt);
            onClose();
        } else {
            setActiveToolId(activeToolId === tool.id ? null : tool.id);
            setParamValues({});
        }
    };

    const handleParamChange = (paramName: string, value: string) => {
        setParamValues(prev => ({ ...prev, [paramName]: value }));
    };

    const handleSubmitParams = (tool: Tool) => {
        let finalPrompt = tool.prompt;
        tool.parameters.forEach(param => {
            const value = paramValues[param.name] || "";
            finalPrompt = finalPrompt.replace(`{${param.name}}`, value);
        });

        onToolSelect(finalPrompt);
        setActiveToolId(null);
        setParamValues({});
        onClose();
    };

    const canSubmit = (tool: Tool): boolean => {
        return tool.parameters
            .filter(p => p.required)
            .every(p => paramValues[p.name]?.trim());
    };

    const getToolIcon = (tool: Tool) => {
        const id = tool.id || "";
        if (id.includes("get_all")) return <Icons.list />;
        if (id.includes("ot_hours")) return <Icons.tool />; // OT/overtime tools
        if (id.includes("job")) return <Icons.job />;
        if (id.includes("machine") || id.includes("production")) return <Icons.tool />;
        if (id.includes("search")) return <Icons.search />;
        if (id.includes("create")) return <Icons.create />;
        if (id.includes("delete")) return <Icons.delete />;
        return <Icons.tool />;
    };

    return (
        <>
            <div
                className={`sidebar-backdrop ${isOpen ? "open" : ""}`}
                onClick={onClose}
            />

            <aside className={`toolbox-sidebar ${isOpen ? "open" : ""}`}>
                <div className="sidebar-header">
                    <div className="sidebar-header-title">
                        <HeaderWrenchIcon />
                        <h2>Toolbox</h2>
                    </div>
                    <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
                        <ToolboxCloseButtonIcon />
                    </button>
                </div>

                <div className="sidebar-content">
                    {loading && (
                        <div className="sidebar-loading">
                            <div className="loading-spinner"></div>
                            <LoadingSpinner variant="secondary" message="Loading tools..." size='small' />
                        </div>
                    )}

                    {error && (
                        <div className="sidebar-error">
                            <ToolboxErrorIcon />
                            <span>{error}</span>
                        </div>
                    )}

                    {!loading && !error && tools.length === 0 && (
                        <div className="sidebar-empty">
                            <EmptyToolboxIcon />
                            <span>No tools available</span>
                        </div>
                    )}

                    {!loading && !error && tools.length > 0 && (
                        <div className="tools-list">
                            {tools.map(tool => (
                                <div key={tool.id} className="tool-item-wrapper">
                                    <button
                                        className={`tool-item ${activeToolId === tool.id ? "active" : ""}`}
                                        onClick={() => handleToolClick(tool)}
                                    >
                                        <span className="tool-icon">{getToolIcon(tool)}</span>
                                        <div className="tool-info">
                                            <span className="tool-name">{tool.name}</span>
                                            <span className="tool-description">{tool.description}</span>
                                        </div>
                                        {tool.parameters.length > 0 && (
                                            <span className="tool-expand-icon">
                                                <ToolExpandIcon activeToolId={activeToolId} tool={tool} />
                                            </span>
                                        )}
                                    </button>

                                    {activeToolId === tool.id && tool.parameters.length > 0 && (
                                        <div className="tool-params-form">
                                            {tool.parameters.map(param => (
                                                <div key={param.name} className="param-field">
                                                    <label htmlFor={`param-${param.name}`}>
                                                        {param.name}
                                                        {param.required && <span className="required">*</span>}
                                                    </label>
                                                    <input
                                                        id={`param-${param.name}`}
                                                        type={param.type === "number" ? "number" : "text"}
                                                        placeholder={param.description || `Enter ${param.name}`}
                                                        value={paramValues[param.name] || ""}
                                                        onChange={e => handleParamChange(param.name, e.target.value)}
                                                    />
                                                </div>
                                            ))}
                                            <button
                                                className="param-submit-btn"
                                                onClick={() => handleSubmitParams(tool)}
                                                disabled={!canSubmit(tool)}
                                            >
                                                <ParamSubmitIcon />
                                                Run Tool
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};

export default ToolboxSidebar;