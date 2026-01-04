import { useCallback, useState, useRef } from "react";


export function useChatInput() {
    const [input, setInput]                   = useState("");
    const [showCommandMenu, setShowCommandMenu] = useState(false);
    const [commandSearch, setCommandSearch]   = useState("");

    const textareaRef = useRef<HTMLTextAreaElement>(null);


    const autoResizeTextarea = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
        }
    }, []);


    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setInput(value);
        autoResizeTextarea();

        if (value.startsWith('/')) {
            setShowCommandMenu(true);
            setCommandSearch(value.slice(1));
        } else {
            setShowCommandMenu(false);
            setCommandSearch('');
        }
    }, [autoResizeTextarea]);


    const clearInput = useCallback(() => {
        setInput("");
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    }, []);


    const closeCommandMenu = useCallback(() => {
        setShowCommandMenu(false);
        setCommandSearch('');
    }, []);


    return {
        input,
        setInput,
        showCommandMenu,
        setShowCommandMenu,
        commandSearch,
        textareaRef,
        handleInputChange,
        clearInput,
        closeCommandMenu,
    };
}

export type UseChatInputReturn = ReturnType<typeof useChatInput>;
