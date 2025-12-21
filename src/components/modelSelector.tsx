import { useState, useEffect } from "react";
import { useApi } from "../auth/useApi";

type ModelSelectorProps = {
    value: string;
    onChange: (model: string) => void;
    provider?: string; // Optional: if provided, shows only models for that provider
    disabled?: boolean;
}

const ModelSelector = ({ value, onChange, provider, disabled }: ModelSelectorProps) => {
    const api = useApi();
    const [models, setModels] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [currentProvider, setCurrentProvider] = useState<string>("openai");

    useEffect(() => {
        loadModels();
        if (!provider) {
            loadCurrentProvider();
        }
    }, []);

    useEffect(() => {
        if (provider) {
            setCurrentProvider(provider);
        }
    }, [provider]);

    const loadModels = async () => {
        try {
            const data = await api.get<{
                models: {
                    openai_models: string[];
                    claude_models: string[];
                }
            }>('/models');
            
            // Combine all models with friendly names
            const allModels: Record<string, string> = {};
            
            // OpenAI Models
            data.models.openai_models.forEach(model => {
                allModels[getModelDisplayName(model)] = model;
            });
            
            // Anthropic Models  
            data.models.claude_models.forEach(model => {
                allModels[getModelDisplayName(model)] = model;
            });
            
            setModels(allModels);
        } catch (error) {
            console.error("Failed to load models:", error);
            // Fallback to hardcoded models
            setModels({
                "GPT 4o": "gpt-4o",
                "GPT 4": "gpt-4",
                "Claude Sonnet 4.5": "claude-sonnet-4-5-20250929"
            });
        } finally {
            setLoading(false);
        }
    };

    const loadCurrentProvider = async () => {
        try {
            const providerInfo = await api.get<{ provider: string }>('/settings');
            setCurrentProvider(providerInfo.provider);
        } catch (error) {
            console.error("Failed to load provider:", error);
        }
    };

    const getModelDisplayName = (modelId: string): string => {
        // OpenAI models
        if (modelId === "gpt-3.5-turbo") return "GPT 3.5 Turbo";
        if (modelId === "gpt-4") return "GPT 4";
        if (modelId === "gpt-4o") return "GPT 4o";
        if (modelId === "gpt-4.1") return "GPT 4.1";
        if (modelId === "gpt-5") return "GPT 5";
        if (modelId === "gpt-5.1") return "GPT 5.1";
        if (modelId === "gpt-5.2-chat-latest") return "GPT 5.2";
        
        // Anthropic models - Updated for latest naming
        if (modelId === "claude-3-opus-latest") return "Claude Opus 3";
        if (modelId === "claude-3-5-haiku-latest") return "Claude Haiku 3.5";
        if (modelId === "claude-3-7-sonnet-latest") return "Claude Sonnet 3.7";
        if (modelId === "claude-haiku-4-5") return "Claude Haiku 4.5";
        if (modelId === "claude-sonnet-4-5-20250929") return "Claude Sonnet 4.5";
        if (modelId === "claude-opus-4-5-20251101") return "Claude Opus 4.5";
        
        return modelId; // Fallback to model ID
    };

    const getFilteredModels = (): Record<string, string> => {
        if (!provider && !currentProvider) return models;
        
        const activeProvider = provider || currentProvider;
        const filtered: Record<string, string> = {};
        
        Object.entries(models).forEach(([name, id]) => {
            if (activeProvider === "openai" && id.startsWith("gpt")) {
                filtered[name] = id;
            } else if (activeProvider === "anthropic" && id.startsWith("claude")) {
                filtered[name] = id;
            }
        });
        
        return filtered;
    };

    if (loading) {
        return (
            <select className="model-selector" disabled>
                <option>Loading models...</option>
            </select>
        );
    }

    const filteredModels = getFilteredModels();

    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="model-selector"
            disabled={disabled}
        >
            {Object.entries(filteredModels).map(([name, model]) => (
                <option key={model} value={model}>{name}</option>
            ))}
        </select>
    );
}

export default ModelSelector;
