import React, { useEffect, useRef, useCallback, useMemo } from "react";
import "../../styles/chatWindow.css";

import { useAuth, useApi } from "../../auth";
import { useToast } from "../Toast";
import { executeTrigger } from "../../triggers";
import type { Trigger } from "../../triggers";
import type { DisplayMessage, ChatWindowProps } from "../../types";

// Hooks
import {
    useChatMessages,
    useChatInput,
    useMessageEditor,
    useStreamingChat,
} from "../../hooks";

// Components
import ChatHeader from "./ChatHeader";
import ChatMessageList from "./ChatMessageList";
import ChatInputArea from "./ChatInputArea";
import LoadingSpinner from "../loadingSpinner";
import { WELCOME_MESSAGE } from "./constants";


// ============================================================================
// Component
// ============================================================================

const ChatWindow: React.FC<ChatWindowProps> = ({
    externalPrompt,
    onPromptConsumed,
    activeConversationId,
    activeProjectId,
    initialMessages,
    onConversationCreated,
    // Model state (lifted to parent)
    selectedModel,
    currentProvider,
    onModelChange,
    isModelReady,
}) => {
    const { user }      = useAuth();
    const api           = useApi();
    const { showToast } = useToast();

    const messagesEndRef = useRef<HTMLDivElement>(null);


    // ========================================================================
    // Initialize Hooks
    // ========================================================================

    const chatMessages = useChatMessages(initialMessages, activeConversationId, onConversationCreated);
    const chatInput    = useChatInput();
    const editor       = useMessageEditor();

    // Create a model-like object for useStreamingChat compatibility
    const chatModel = useMemo(() => ({
        selectedModel,
        currentProvider,
        handleModelChange: onModelChange,
        isReady: isModelReady,
    }), [selectedModel, currentProvider, onModelChange, isModelReady]);

    const streaming = useStreamingChat(
        api,
        chatMessages,
        chatModel,
        showToast,
        onConversationCreated,
        activeProjectId
    );


    // ========================================================================
    // Refs for stable callbacks
    // ========================================================================

    const chatInputRef    = useRef(chatInput);
    const chatMessagesRef = useRef(chatMessages);
    const streamingRef    = useRef(streaming);
    const editorRef       = useRef(editor);
    const selectedModelRef = useRef(selectedModel);

    // Keep refs in sync
    useEffect(() => {
        chatInputRef.current    = chatInput;
        chatMessagesRef.current = chatMessages;
        streamingRef.current    = streaming;
        editorRef.current       = editor;
        selectedModelRef.current = selectedModel;
    });


    // ========================================================================
    // Effects
    // ========================================================================

    // Handle external prompt
    useEffect(() => {
        if (externalPrompt && !streaming.isTyping) {
            streaming.sendMessage(externalPrompt);
            onPromptConsumed?.();
        }
    }, [externalPrompt, streaming.isTyping, streaming.sendMessage, onPromptConsumed]);


    // ========================================================================
    // Stable Event Handlers (using refs)
    // ========================================================================

    const handleNewChat = useCallback(() => {
        chatMessagesRef.current.setConversationId(null);
        chatMessagesRef.current.setDisplayMessages([{
            ...WELCOME_MESSAGE,
            id:        Date.now(),
            timestamp: new Date().toISOString()
        }]);
        onConversationCreated(-1);
    }, [onConversationCreated]);


    const handleSaveEdit = useCallback(async (messageIndex: number) => {
        const content = editorRef.current.finishEditing();
        if (!content) return;

        const editedMessage = chatMessagesRef.current.displayMessages[messageIndex];
        if (!editedMessage || editedMessage.role !== "user") return;

        chatMessagesRef.current.truncateToIndex(messageIndex);
        await streamingRef.current.sendMessage(content);
    }, []);


    const handleCommandSelect = useCallback(async (trigger: Trigger, params?: Record<string, string>) => {
        chatInputRef.current.closeCommandMenu();
        chatInputRef.current.clearInput();

        const commandMessage = `/${trigger.command}`;

        const triggerResult = await executeTrigger(commandMessage, {
            message:        commandMessage,
            conversationId: chatMessagesRef.current.conversationId,
            showToast,
            clearMessages:  chatMessagesRef.current.clearMessages,
            params
        });

        if (triggerResult) {
            if (triggerResult.response) {
                const responseMessage: DisplayMessage = {
                    id:        Date.now(),
                    role:      "assistant",
                    content:   triggerResult.response,
                    timestamp: new Date().toISOString(),
                    status:    'sent'
                };
                chatMessagesRef.current.setDisplayMessages(prev => [...prev, responseMessage]);
            }

            if (triggerResult.simulateFailure) {
                streamingRef.current.sendMessage(commandMessage, undefined, true);
            }
        }
    }, [showToast]);


    const handleSendMessage = useCallback(async () => {
        const input = chatInputRef.current.input;
        if (!input.trim() || !selectedModelRef.current) return;

        const messageContent = input.trim();
        chatInputRef.current.clearInput();

        // Check for trigger commands
        const triggerResult = await executeTrigger(messageContent, {
            message:        messageContent,
            conversationId: chatMessagesRef.current.conversationId,
            showToast,
            clearMessages:  chatMessagesRef.current.clearMessages
        });

        if (triggerResult) {
            if (triggerResult.response) {
                const responseMessage: DisplayMessage = {
                    id:        Date.now(),
                    role:      "assistant",
                    content:   triggerResult.response,
                    timestamp: new Date().toISOString(),
                    status:    'sent'
                };
                chatMessagesRef.current.setDisplayMessages(prev => [...prev, responseMessage]);
            }

            if (triggerResult.preventDefault) {
                return;
            }

            if (triggerResult.simulateFailure) {
                await streamingRef.current.sendMessage(messageContent, undefined, true);
                return;
            }
        }

        await streamingRef.current.sendMessage(messageContent);
    }, [showToast]);


    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        // Let command menu handle its own keys
        if (chatInputRef.current.showCommandMenu && ['ArrowUp', 'ArrowDown', 'Enter', 'Tab'].includes(e.key)) {
            return;
        }

        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }

        if (e.key === "Escape" && chatInputRef.current.showCommandMenu) {
            chatInputRef.current.closeCommandMenu();
        }
    }, [handleSendMessage]);


    // Stable wrappers for ChatMessageList callbacks
    const handleRetry = useCallback((id: number, content: string) => {
        streamingRef.current.retryMessage(id, content);
    }, []);

    const handleStartEdit = useCallback((id: number, content: string) => {
        editorRef.current.startEditing(id, content);
    }, []);

    const handleCancelEdit = useCallback(() => {
        editorRef.current.cancelEditing();
    }, []);

    const handleEditChange = useCallback((content: string) => {
        editorRef.current.updateEditContent(content);
    }, []);

    const handleRegenerate = useCallback((index: number) => {
        streamingRef.current.regenerateResponse(index);
    }, []);

    const handleStop = useCallback(() => {
        streamingRef.current.stopGeneration();
    }, []);


    // ========================================================================
    // Render
    // ========================================================================

    if (!isModelReady) {
        return (
            <div className="chat-window-container">
                <div className="chat-window">
                    <LoadingSpinner size="small" message="Loading conversations.." variant="minimal" />
                </div>
            </div>
        );
    }

    return (
        <div className="chat-window-container">
            <div className="chat-window">
                <ChatHeader
                    isStreaming={streaming.isStreaming}
                    onNewChat={handleNewChat}
                />

                <ChatMessageList
                    messages={chatMessages.displayMessages}
                    messagesEndRef={messagesEndRef}
                    streamingMessageId={streaming.streamingMessageId}
                    thinkingContent={streaming.thinkingContent}
                    isThinkingActive={streaming.isThinkingActive}
                    streamingContentBlocks={streaming.contentBlocks}
                    editingMessageId={editor.editingMessageId}
                    editedContent={editor.editedContent}
                    isRegenerating={streaming.isRegenerating}
                    onRetry={handleRetry}
                    onStartEdit={handleStartEdit}
                    onCancelEdit={handleCancelEdit}
                    onSaveEdit={handleSaveEdit}
                    onEditChange={handleEditChange}
                    onRegenerate={handleRegenerate}
                />

                <ChatInputArea
                    input={chatInput.input}
                    selectedModel={selectedModel}
                    currentProvider={currentProvider}
                    isTyping={streaming.isTyping}
                    isStreaming={streaming.isStreaming}
                    showCommandMenu={chatInput.showCommandMenu}
                    commandSearch={chatInput.commandSearch}
                    textareaRef={chatInput.textareaRef}
                    onInputChange={chatInput.handleInputChange}
                    onKeyDown={handleKeyDown}
                    onSend={handleSendMessage}
                    onStop={handleStop}
                    onModelChange={onModelChange}
                    onCommandSelect={handleCommandSelect}
                    onCloseCommandMenu={chatInput.closeCommandMenu}
                />
            </div>
        </div>
    );
};

export default ChatWindow;
