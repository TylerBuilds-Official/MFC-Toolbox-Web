import { useCallback, useState, useRef } from "react";
import { useApi } from "../../auth";


interface ProviderInfo {
    provider: string;
    default_model: string;
}


export function useChatModel(api: ReturnType<typeof useApi>) {
    // User's persisted defaults (from /settings)
    const defaultsRef = useRef<{ provider: string; model: string }>({
        provider: "openai",
        model: "gpt-4o"
    });

    // Active session state (drives UI, can be temporarily overridden)
    const [activeModel, setActiveModel]       = useState<string>("");
    const [activeProvider, setActiveProvider] = useState<string>("openai");


    const inferProviderFromModel = useCallback((model: string): string => {
        if (model.startsWith("claude")) return "anthropic";
        if (model.startsWith("gpt"))    return "openai";
        return activeProvider;
    }, [activeProvider]);


    /**
     * Handle user manually changing model in selector
     * Updates active state only, does not persist
     */
    const handleModelChange = useCallback((newModel: string) => {
        setActiveModel(newModel);
        setActiveProvider(inferProviderFromModel(newModel));
    }, [inferProviderFromModel]);


    /**
     * Load user's default provider/model from settings
     * Sets BOTH defaults AND active state
     */
    const loadDefaultModel = useCallback(async () => {
        try {
            const providerInfo = await api.get<ProviderInfo>('/settings');
            
            // Store as defaults
            defaultsRef.current = {
                provider: providerInfo.provider,
                model: providerInfo.default_model
            };
            
            // Also set as active
            setActiveModel(providerInfo.default_model);
            setActiveProvider(providerInfo.provider);
            
            console.log("[useChatModel] Loaded defaults:", providerInfo);
        } catch (error) {
            console.error("[useChatModel] Failed to load default model:", error);
            setActiveModel("gpt-4o");
            setActiveProvider("openai");
        }
    }, [api]);


    /**
     * Set active provider/model for a specific conversation context
     * Does NOT update user's persisted defaults
     * Returns true if a switch occurred (for toast notification)
     */
    const setConversationContext = useCallback((provider: string, model: string): boolean => {
        const switched = provider !== activeProvider;
        
        setActiveProvider(provider);
        setActiveModel(model);
        
        console.log("[useChatModel] Set conversation context:", { provider, model, switched });
        return switched;
    }, [activeProvider]);


    /**
     * Reset active state back to user's defaults
     * Called when starting a new conversation
     */
    const resetToDefaults = useCallback(() => {
        setActiveProvider(defaultsRef.current.provider);
        setActiveModel(defaultsRef.current.model);
        console.log("[useChatModel] Reset to defaults:", defaultsRef.current);
    }, []);


    return {
        // Active state (for UI)
        selectedModel: activeModel,
        currentProvider: activeProvider,
        
        // Actions
        handleModelChange,
        loadDefaultModel,
        setConversationContext,
        resetToDefaults,
        
        // Status
        isReady: !!activeModel,
    };
}

export type UseChatModelReturn = ReturnType<typeof useChatModel>;
