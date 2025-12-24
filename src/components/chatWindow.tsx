import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown, {type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useApi } from "../auth";
import { useAuth } from "../auth";
import { useToast } from "./Toast";
import type { Message } from "../types/conversation";
import "../styles/chatWindow.css";
import ModelSelector from "./modelSelector";
import CodeBlock from "./CodeBlock";
import MessageCopyButton from "./MessageCopyButton";
import RegenResponseButton from "./RegenResponseButton.tsx";
import LoadingSpinner from "./loadingSpinner.tsx";


// Types

type MessageStatus = 'sending' | 'sent' | 'failed';

type DisplayMessage = {
    id: number;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    status?: MessageStatus;
    error?: string;
};

type ChatWindowProps = {
    externalPrompt?: string | null;
    onPromptConsumed?: () => void;
    activeConversationId: number | null;
    initialMessages: Message[];
    onConversationCreated: (id: number) => void;
    onMessagesUpdated: (messages: Message[]) => void;
};

interface ChatResponse {
    response: string;
    conversation_id: number;
}


// Constants

const WELCOME_MESSAGE: DisplayMessage = {
    id: Date.now(),
    role: "assistant",
    content: "Welcome to the MFC Toolbox! I'm here to help with fabrication workflows, document processing, and more. What can I assist you with today?",
    timestamp: new Date().toISOString(),
    status: 'sent'
};


// Icons

const RetryIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10"></polyline>
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
    </svg>
);

const WarningIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
);


// Component

const ChatWindow: React.FC<ChatWindowProps> = ({
    externalPrompt,
    onPromptConsumed,
    activeConversationId,
    initialMessages,
    onConversationCreated
}) => {
    const { user } = useAuth();
    const api = useApi();
    const { showToast } = useToast();


    // State

    const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([WELCOME_MESSAGE]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [selectedModel, setSelectedModel] = useState<string>("");
    const [currentProvider, setCurrentProvider] = useState<string>("openai");
    const [conversationId, setConversationId] = useState<number | null>(null);
    const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
    const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
    const [editedContent, setEditedContent] = useState<string>("");
    const [isStreaming, setIsStreaming] = useState<boolean>(false);


    // Refs

    const abortControllerRef = useRef<AbortController | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);


    // Effects

    useEffect(() => {
        setConversationId(activeConversationId);
    }, [activeConversationId]);


    useEffect(() => {
        if (initialMessages.length > 0) {
            const converted: DisplayMessage[] = initialMessages.map(msg => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                timestamp: msg.created_at,
                status: 'sent' as MessageStatus
            }));
            setDisplayMessages(converted);
        } else if (activeConversationId === null) {
            setDisplayMessages([{
                ...WELCOME_MESSAGE,
                id: Date.now(),
                timestamp: new Date().toISOString()
            }]);
        }
    }, [initialMessages, activeConversationId]);


    useEffect(() => {
        scrollToBottom();
    }, [displayMessages, isTyping]);


    useEffect(() => {
        if (user) {
            loadDefaultModel();
        }
    }, [user]);


    useEffect(() => {
        if (externalPrompt && !isTyping) {
            sendMessageInternal(externalPrompt);
            onPromptConsumed?.();
        }
    }, [externalPrompt]);


    // Helpers

    const inferProviderFromModel = (model: string): string => {
        if (model.startsWith("claude")) return "anthropic";
        if (model.startsWith("gpt")) return "openai";
        return currentProvider;
    };


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };


    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };


    const autoResizeTextarea = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
        }
    };


    // Update message status helper

    const updateMessageStatus = useCallback((messageId: number, status: MessageStatus, error?: string) => {
        setDisplayMessages(prev => prev.map(msg =>
            msg.id === messageId
                ? { ...msg, status, error }
                : msg
        ));
    }, []);


    // API Calls

    const loadDefaultModel = async () => {
        try {
            const providerInfo = await api.get<{ provider: string; default_model: string; }>('/settings');
            setSelectedModel(providerInfo.default_model);
            setCurrentProvider(providerInfo.provider);
            console.log("[ChatWindow] Loaded default model:", providerInfo);
        } catch (error) {
            console.error("[ChatWindow] Failed to load default model:", error);
            setSelectedModel("gpt-4o");
            setCurrentProvider("openai");
        }
    };


    // Message sending with retry support

    const sendMessageInternal = async (messageContent: string, existingMessageId?: number) => {
        const timestamp = Date.now();
        const messageId = existingMessageId || timestamp;

        // If retrying, update existing message status
        if (existingMessageId) {
            updateMessageStatus(existingMessageId, 'sending', undefined);
        } else {
            // New message
            const userMessage: DisplayMessage = {
                id: messageId,
                role: "user",
                content: messageContent,
                timestamp: new Date(timestamp).toISOString(),
                status: 'sending'
            };
            setDisplayMessages(prev => [...prev, userMessage]);
        }

        setIsTyping(true);
        setIsStreaming(true);
        abortControllerRef.current = new AbortController();

        try {
            const params = new URLSearchParams({
                message: messageContent,
                model: selectedModel,
                provider: currentProvider,
            });

            if (conversationId !== null) {
                params.append("conversation_id", conversationId.toString());
            }

            const response = await api.get<ChatResponse>(
                `/chat?${params.toString()}`,
                { signal: abortControllerRef.current.signal }
            );

            // Handle new conversation created
            if (response.conversation_id && response.conversation_id !== conversationId) {
                setConversationId(response.conversation_id);
                onConversationCreated(response.conversation_id);
            }

            // Mark user message as sent
            updateMessageStatus(messageId, 'sent');

            // Add assistant response
            const assistantMessage: DisplayMessage = {
                id: Date.now(),
                role: "assistant",
                content: response.response,
                timestamp: new Date().toISOString(),
                status: 'sent'
            };
            setDisplayMessages(prev => [...prev, assistantMessage]);

        } catch (error: unknown) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.log("Aborted generation request.");
                updateMessageStatus(messageId, 'sent');
                setDisplayMessages(prev => [
                    ...prev,
                    {
                        id: Date.now(),
                        role: "assistant",
                        content: "_Answer generation cancelled by user._",
                        timestamp: new Date().toISOString(),
                        status: 'sent'
                    }
                ]);
            } else {
                console.error("Chat API error:", error);

                // Mark message as failed
                const errorMessage = 'Failed to send message';
                updateMessageStatus(messageId, 'failed', errorMessage);

                // Show toast with retry action
                showToast('Failed to send message', 'error', {
                    duration: 6000,
                    action: {
                        label: 'Retry',
                        onClick: () => retryMessage(messageId, messageContent)
                    }
                });
            }
        } finally {
            setIsTyping(false);
            setIsStreaming(false);
            abortControllerRef.current = null;
        }
    };


    // Retry handler

    const retryMessage = useCallback((messageId: number, content: string) => {
        sendMessageInternal(content, messageId);
    }, [selectedModel, currentProvider, conversationId]);


    // Event handlers

    const handleModelChange = (newModel: string) => {
        setSelectedModel(newModel);
        setCurrentProvider(inferProviderFromModel(newModel));
    };


    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        autoResizeTextarea();
    };


    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };


    const sendMessage = async () => {
        if (!input.trim() || !selectedModel) return;

        const messageContent = input.trim();
        setInput("");

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        await sendMessageInternal(messageContent);
    };


    const stopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsStreaming(false);
        setIsTyping(false);
        setIsRegenerating(false);
    };


    const handleNewChat = () => {
        setConversationId(null);
        setDisplayMessages([{
            ...WELCOME_MESSAGE,
            id: Date.now(),
            timestamp: new Date().toISOString()
        }]);
        onConversationCreated(-1);
    };


    // Edit message handlers

    const startEditingMessage = (message_id: number, currentContent: string) => {
        setEditingMessageId(message_id);
        setEditedContent(currentContent);
    };


    const cancelEditingMessage = () => {
        setEditingMessageId(null);
        setEditedContent("");
    };


    const handleEditKeyDown = (e: React.KeyboardEvent, messageIndex: number) => {
        if (e.key === "Enter" && e.ctrlKey && !e.shiftKey) {
            e.preventDefault();
            saveEditedMessage(messageIndex);
        } else if (e.key === "Escape") {
            cancelEditingMessage();
        }
    };


    const saveEditedMessage = async (messageIndex: number) => {
        if (!editedContent.trim()) return;

        const editedMessage = displayMessages[messageIndex];
        if (!editedMessage || editedMessage.role !== "user") return;

        const messageBeforeEdit = displayMessages.slice(0, messageIndex);

        setEditingMessageId(null);
        setEditedContent("");
        setDisplayMessages(messageBeforeEdit);
        setIsTyping(true);
        setIsStreaming(true);

        abortControllerRef.current = new AbortController();

        try {
            const params = new URLSearchParams({
                message: editedContent.trim(),
                model: selectedModel,
                provider: currentProvider,
            });

            if (conversationId !== null) {
                params.append("conversation_id", conversationId.toString());
            }

            const response = await api.get<ChatResponse>(
                `/chat?${params.toString()}`,
                { signal: abortControllerRef.current.signal }
            );

            if (response.conversation_id && response.conversation_id !== conversationId) {
                setConversationId(response.conversation_id);
                onConversationCreated(response.conversation_id);
            }

            const newUserMessage: DisplayMessage = {
                id: Date.now(),
                role: "user",
                content: editedContent.trim(),
                timestamp: new Date().toISOString(),
                status: 'sent'
            };

            const newAssistantMessage: DisplayMessage = {
                id: Date.now() + 1,
                role: "assistant",
                content: response.response,
                timestamp: new Date().toISOString(),
                status: 'sent'
            };

            setDisplayMessages(prev => [...prev, newUserMessage, newAssistantMessage]);

        } catch (error: unknown) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.log("Aborted editing request.");
                setDisplayMessages(prev => [
                    ...prev,
                    {
                        id: Date.now(),
                        role: "assistant",
                        content: "_Generation cancelled by user._",
                        timestamp: new Date().toISOString(),
                        status: 'sent'
                    }
                ]);
            } else {
                console.error("Error sending edited message:", error);
                setDisplayMessages(displayMessages);
                showToast('Failed to send edited message', 'error');
            }
        } finally {
            setIsTyping(false);
            setIsStreaming(false);
        }
    };


    // Regenerate response

    const regenerateResponse = async (messageIndex: number) => {
        const previousUserMessage = displayMessages
            .slice(0, messageIndex)
            .reverse()
            .find(msg => msg.role === "user");

        if (!previousUserMessage) {
            console.error("Failed to find previous user message to regenerate response for.");
            return;
        }

        setIsRegenerating(true);
        setIsTyping(true);
        setIsStreaming(false);

        abortControllerRef.current = new AbortController();

        try {
            const messagesBeforeRegenerate = displayMessages.slice(0, messageIndex);
            setDisplayMessages(messagesBeforeRegenerate);

            const params = new URLSearchParams({
                message: previousUserMessage.content,
                model: selectedModel,
                provider: currentProvider,
            });

            if (conversationId !== null) {
                params.append("conversation_id", conversationId.toString());
            }

            const response = await api.get<ChatResponse>(
                `/chat?${params.toString()}`,
                { signal: abortControllerRef.current.signal }
            );

            const newAssistantMessage: DisplayMessage = {
                id: Date.now(),
                role: "assistant",
                content: response.response,
                timestamp: new Date().toISOString(),
                status: 'sent'
            };

            setDisplayMessages(prev => [...prev, newAssistantMessage]);

        } catch (error: unknown) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.log("Aborted regeneration request.");
                setDisplayMessages(prev => [
                    ...prev,
                    {
                        id: Date.now(),
                        role: "assistant",
                        content: "_Regeneration cancelled by user._",
                        timestamp: new Date().toISOString(),
                        status: 'sent'
                    }
                ]);
            } else {
                console.error("Regenerate API error:", error);
                setDisplayMessages(displayMessages);
                showToast('Failed to regenerate response', 'error');
            }
        } finally {
            setIsRegenerating(false);
            setIsTyping(false);
            setIsStreaming(false);
            abortControllerRef.current = null;
        }
    };


    // Markdown components

    const markdownComponents: Components = {
        code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !className && !String(children).includes("\n");

            if (isInline) {
                return <code className="inline-code" {...props}>{children}</code>;
            }

            return (
                <CodeBlock language={match?.[1]}>
                    {String(children).replace(/\n$/, "")}
                </CodeBlock>
            );
        },

        pre({ children }) {
            return <>{children}</>;
        },

        table({ children, ...props }) {
            return (
                <div className="table-wrapper">
                    <table {...props}>{children}</table>
                </div>
            );
        },
    };


    // Loading state

    if (!selectedModel) {
        return (
            <div className="chat-window-container">
                <div className="chat-window">
                    <LoadingSpinner size='small' message='Loading conversations..' variant="minimal"/>
                </div>
            </div>
        );
    }


    // Render

    return (
        <div className="chat-window-container">
            <div className="chat-window">

                {/* Header */}
                <div className="chat-header">
                    <div className="chat-header-info">
                        <div className="chat-header-avatar">🤖</div>
                        <div className="chat-header-text">
                            <h2>MFC Assistant</h2>
                            <div className="chat-header-status">
                                <span className="status-indicator"></span>
                                <span>Online</span>
                            </div>
                        </div>
                    </div>
                    <div className="chat-header-actions">
                        <button
                            className="chat-header-btn"
                            aria-label="New Chat"
                            title="New Chat"
                            onClick={handleNewChat}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>

                        <button className="chat-header-btn" aria-label="Settings" title="Chat Settings">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="chat-messages">
                    {displayMessages.map((message, index) => (
                        <div
                            key={message.id}
                            className={`chat-message ${message.role} ${message.status === 'failed' ? 'message-failed' : ''} ${message.status === 'sending' ? 'message-sending' : ''}`}
                        >
                            {/* Edit mode */}
                            {editingMessageId === message.id ? (
                                <div className="message-edit-container">
                                    <textarea
                                        className="message-edit-input"
                                        value={editedContent}
                                        onChange={(e) => setEditedContent(e.target.value)}
                                        onKeyDown={(e) => handleEditKeyDown(e, index)}
                                        autoFocus
                                        rows={3}
                                    />
                                    <div className="message-edit-actions">
                                        <button
                                            className="message-edit-save"
                                            onClick={() => saveEditedMessage(index)}
                                            disabled={!editedContent.trim()}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                            Save & Submit
                                        </button>
                                        <button
                                            className="message-edit-cancel"
                                            onClick={cancelEditingMessage}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="message-bubble markdown-content">
                                    <ReactMarkdown
                                        components={markdownComponents}
                                        remarkPlugins={[remarkGfm]}
                                    >
                                        {message.content}
                                    </ReactMarkdown>
                                </div>
                            )}

                            {/* Failed message indicator */}
                            {message.status === 'failed' && message.role === 'user' && (
                                <div className="message-error-indicator">
                                    <WarningIcon />
                                    <span>Failed to send</span>
                                    <button
                                        className="message-retry-btn"
                                        onClick={() => retryMessage(message.id, message.content)}
                                    >
                                        <RetryIcon />
                                        Retry
                                    </button>
                                </div>
                            )}

                            {/* Message meta */}
                            <div className="message-meta">
                                {message.role === "assistant" ? (
                                    <>
                                        <div className="message-meta-time">
                                            <span className="message-timestamp">
                                                {formatTime(message.timestamp)}
                                            </span>
                                        </div>
                                        <div className="msg-btn-wrapper">
                                            <MessageCopyButton textContent={message.content} className="msg-copy-btn"/>
                                            <RegenResponseButton
                                                onRegen={() => regenerateResponse(index)}
                                                isRegenerating={isRegenerating}
                                                className="msg-regenerate-btn"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="msg-btn-wrapper">
                                            <MessageCopyButton textContent={message.content} className="msg-copy-btn"/>
                                            {editingMessageId !== message.id && message.status !== 'failed' && (
                                                <button
                                                    onClick={() => startEditingMessage(message.id, message.content)}
                                                    className="msg-edit-btn"
                                                    aria-label="Edit message"
                                                    title="Edit message"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        <div className="message-meta-time">
                                            <span className="message-timestamp">
                                                {message.status === 'sending' ? 'Sending...' : formatTime(message.timestamp)}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="chat-message assistant">
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="chat-input-area">
                    <div className="chat-input-wrapper">
                        <textarea
                            ref={textareaRef}
                            className="chat-input"
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message..."
                            disabled={isTyping}
                            rows={1}
                        />
                        <div className="chat-input-actions">
                            <ModelSelector
                                value={selectedModel}
                                onChange={handleModelChange}
                                provider={currentProvider}
                                disabled={isTyping}
                            />
                            {isStreaming ? (
                                <button
                                    className="stop-btn"
                                    onClick={stopGeneration}
                                    aria-label="Stop generation"
                                    title="Stop generation"
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <rect x="6" y="6" width="12" height="12" rx="2"/>
                                    </svg>
                                </button>
                            ) : (
                                <button
                                    className="send-btn"
                                    onClick={sendMessage}
                                    disabled={!input.trim() || isTyping}
                                    aria-label="Send message"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13"></line>
                                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default ChatWindow;
