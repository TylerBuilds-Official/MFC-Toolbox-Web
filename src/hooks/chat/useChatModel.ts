import { useCallback, useState } from "react";
import { useApi } from "../../auth";


interface ProviderInfo {
    provider: string;
    default_model: string;
}


export function useChatModel(api: ReturnType<typeof useApi>) {
    const [selectedModel, setSelectedModel]     = useState<string>("");
    const [currentProvider, setCurrentProvider] = useState<string>("openai");


    const inferProviderFromModel = useCallback((model: string): string => {
        if (model.startsWith("claude")) return "anthropic";
        if (model.startsWith("gpt"))    return "openai";
        return currentProvider;
    }, [currentProvider]);


    const handleModelChange = useCallback((newModel: string) => {
        setSelectedModel(newModel);
        setCurrentProvider(inferProviderFromModel(newModel));
    }, [inferProviderFromModel]);


    const loadDefaultModel = useCallback(async () => {
        try {
            const providerInfo = await api.get<ProviderInfo>('/settings');
            setSelectedModel(providerInfo.default_model);
            setCurrentProvider(providerInfo.provider);
            console.log("[useChatModel] Loaded default model:", providerInfo);
        } catch (error) {
            console.error("[useChatModel] Failed to load default model:", error);
            setSelectedModel("gpt-4o");
            setCurrentProvider("openai");
        }
    }, [api]);


    return {
        selectedModel,
        currentProvider,
        handleModelChange,
        loadDefaultModel,
        isReady: !!selectedModel,
    };
}

export type UseChatModelReturn = ReturnType<typeof useChatModel>;
