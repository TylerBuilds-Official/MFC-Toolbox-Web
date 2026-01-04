import React, { useEffect, useRef, useCallback } from "react";
import "../../styles/chatWindow.css";

import { useAuth, useApi } from "../../auth";
import { useToast } from "../Toast";
import { executeTrigger } from "../../triggers";
import type { Trigger } from "../../triggers";
import type { DisplayMessage, ChatWindowProps } from "../../types";

// Hooks
import {
    useChatMessages,
    useChatModel,
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
    initialMessages,
    onConversationCreated,
}) => {
    const { user }      = useAuth();
    const api           = useApi();
    const { showToast } = useToast();

    const messagesEndRef = useRef<HTMLDivElement>(null);


    // ========================================================================
    // Initialize Hooks
    // ========================================================================

    const chatModel    = useChatModel(api);
    const chatMessages = useChatMessages(initialMessages, activeConversationId, onConversationCreated);
    const chatInput    = useChatInput();
    const editor       = useMessageEditor();

    const streaming = useStreamingChat(
        api,
        chatMessages,
        chatModel,
        showToast,
        onConversationCreated
    );


    // ========================================================================
    // Effects
    // ========================================================================

    // Load default model on mount
    useEffect(() => {
        if (user) {
            chatModel.loadDefaultModel();
        }
    }, [user, chatModel.loadDefaultModel]);


    // Handle external prompt
    useEffect(() => {
        if (externalPrompt && !streaming.isTyping) {
            streaming.sendMessage(externalPrompt);
            onPromptConsumed?.();
        }
    }, [externalPrompt, streaming.isTyping, streaming.sendMessage, onPromptConsumed]);


    // ========================================================================
    // Event Handlers
    // ========================================================================

    const handleNewChat = useCallback(() => {
        chatMessages.setConversationId(null);
        chatMessages.setDisplayMessages([{
            ...WELCOME_MESSAGE,
            id:        Date.now(),
            timestamp: new Date().toISOString()
        }]);
        onConversationCreated(-1);
    }, [chatMessages, onConversationCreated]);


    const handleSaveEdit = useCallback(async (messageIndex: number) => {
        const content = editor.finishEditing();
        if (!content) return;

        const editedMessage = chatMessages.displayMessages[messageIndex];
        if (!editedMessage || editedMessage.role !== "user") return;

        chatMessages.truncateToIndex(messageIndex);
        await streaming.sendMessage(content);
    }, [editor, chatMessages, streaming]);


    const handleCommandSelect = useCallback(async (trigger: Trigger, params?: Record<string, string>) => {
        chatInput.closeCommandMenu();
        chatInput.clearInput();

        const commandMessage = `/${trigger.command}`;

        const triggerResult = await executeTrigger(commandMessage, {
            message:        commandMessage,
            conversationId: chatMessages.conversationId,
            showToast,
            clearMessages:  chatMessages.clearMessages,
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
                chatMessages.setDisplayMessages(prev => [...prev, responseMessage]);
            }

            if (triggerResult.simulateFailure) {
                streaming.sendMessage(commandMessage, undefined, true);
            }
        }
    }, [chatInput, chatMessages, showToast, streaming]);


    const handleSendMessage = useCallback(async () => {
        if (!chatInput.input.trim() || !chatModel.selectedModel) return;

        const messageContent = chatInput.input.trim();
        chatInput.clearInput();

        // Check for trigger commands
        const triggerResult = await executeTrigger(messageContent, {
            message:        messageContent,
            conversationId: chatMessages.conversationId,
            showToast,
            clearMessages:  chatMessages.clearMessages
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
                chatMessages.setDisplayMessages(prev => [...prev, responseMessage]);
            }

            if (triggerResult.preventDefault) {
                return;
            }

            if (triggerResult.simulateFailure) {
                await streaming.sendMessage(messageContent, undefined, true);
                return;
            }
        }

        await streaming.sendMessage(messageContent);
    }, [chatInput, chatModel.selectedModel, chatMessages, showToast, streaming]);


    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        // Let command menu handle its own keys
        if (chatInput.showCommandMenu && ['ArrowUp', 'ArrowDown', 'Enter', 'Tab'].includes(e.key)) {
            return;
        }

        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }

        if (e.key === "Escape" && chatInput.showCommandMenu) {
            chatInput.closeCommandMenu();
        }
    }, [chatInput, handleSendMessage]);


    // ========================================================================
    // Render
    // ========================================================================

    if (!chatModel.isReady) {
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
                    editingMessageId={editor.editingMessageId}
                    editedContent={editor.editedContent}
                    isRegenerating={streaming.isRegenerating}
                    onRetry={streaming.retryMessage}
                    onStartEdit={editor.startEditing}
                    onCancelEdit={editor.cancelEditing}
                    onSaveEdit={handleSaveEdit}
                    onEditChange={editor.updateEditContent}
                    onRegenerate={streaming.regenerateResponse}
                />

                <ChatInputArea
                    input={chatInput.input}
                    selectedModel={chatModel.selectedModel}
                    currentProvider={chatModel.currentProvider}
                    isTyping={streaming.isTyping}
                    isStreaming={streaming.isStreaming}
                    showCommandMenu={chatInput.showCommandMenu}
                    commandSearch={chatInput.commandSearch}
                    textareaRef={chatInput.textareaRef}
                    onInputChange={chatInput.handleInputChange}
                    onKeyDown={handleKeyDown}
                    onSend={handleSendMessage}
                    onStop={streaming.stopGeneration}
                    onModelChange={chatModel.handleModelChange}
                    onCommandSelect={handleCommandSelect}
                    onCloseCommandMenu={chatInput.closeCommandMenu}
                />
            </div>
        </div>
    );
};

export default ChatWindow;
