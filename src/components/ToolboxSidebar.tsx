import { useState, useEffect } from "react";
import { type Tool } from "../types/tools";
import { useApi } from "../auth/useApi";
import { useAuth } from "../auth/AuthContext";
import { transformOpenAITools, formatToolName } from "../services/api";
import "../styles/toolboxSidebar.css";
import Icons from "../assets/svg/toolbox/toolboxIcons.tsx";
import HeaderWrenchIcon from "../assets/svg/toolbox/headerWrench.tsx";
import ToolboxCloseButtonIcon from "../assets/svg/toolbox/toolboxCloseButton.tsx";
import ToolboxErrorIcon from "../assets/svg/toolbox/toolboxError.tsx";
import EmptyToolboxIcon from "../assets/svg/toolbox/emptyToolbox.tsx";
import ToolExpandIcon from "../assets/svg/toolbox/toolExpand.tsx";
import ParamSubmitIcon from "../assets/svg/toolbox/paramSubmit.tsx";

// Interface for API response
interface ToolsApiResponse {
    open_ai_tools: Array<{
        type: "function";
        function: {
            name: string;
            description: string;
            parameters: {
                type: "object";
                properties: Record<string, { type: string; description?: string }>;
                required: string[];
            };
        };
    }>;
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
                // Fetch with proper response type, then transform using shared function
                const response = await api.get<ToolsApiResponse>('/tools');
                const fetchedTools = transformOpenAITools(response.open_ai_tools || []);
                console.log("[ToolboxSidebar] Transformed tools:", fetchedTools);
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
    }, [isOpen, user]);

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
        if (id.includes("job")) return <Icons.job />;
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
                            <span>Loading tools...</span>
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