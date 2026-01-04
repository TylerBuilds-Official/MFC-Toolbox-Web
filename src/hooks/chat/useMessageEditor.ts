import { useCallback, useState } from "react";


export function useMessageEditor() {
    const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
    const [editedContent, setEditedContent]       = useState("");


    const startEditing = useCallback((messageId: number, content: string) => {
        setEditingMessageId(messageId);
        setEditedContent(content);
    }, []);


    const cancelEditing = useCallback(() => {
        setEditingMessageId(null);
        setEditedContent("");
    }, []);


    const updateEditContent = useCallback((content: string) => {
        setEditedContent(content);
    }, []);


    const finishEditing = useCallback((): string => {
        const content = editedContent.trim();
        setEditingMessageId(null);
        setEditedContent("");
        return content;
    }, [editedContent]);


    return {
        editingMessageId,
        editedContent,
        startEditing,
        cancelEditing,
        updateEditContent,
        finishEditing,
        isEditing: editingMessageId !== null,
    };
}

export type UseMessageEditorReturn = ReturnType<typeof useMessageEditor>;
