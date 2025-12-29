import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown, {type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useApi } from "../auth";
import { useAuth } from "../auth";
import { useToast } from "./Toast";
import { executeTrigger, type Trigger } from "../triggers";
import CommandContextMenu from "./CommandContextMenu";
import ThinkingBlock from "./ThinkingBlock";
import type { Message } from "../types/conversation";
import "../styles/chatWindow.css";
import ModelSelector from "./modelSelector";
import CodeBlock from "./CodeBlock";
import MessageCopyButton from "./MessageCopyButton";
import RegenResponseButton from "./RegenResponseButton.tsx";
import LoadingSpinner from "./loadingSpinner.tsx";


// Types

type MessageStatus = 'sending' | 'streaming' | 'sent' | 'failed';

type DisplayMessage = {
    id: number;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    status?: MessageStatus;
    error?: string;
    thinking?: string;
};

type ChatWindowProps = {
    externalPrompt?: string | null;
    onPromptConsumed?: () => void;
    activeConversationId: number | null;
    initialMessages: Message[];
    onConversationCreated: (id: number) => void;
    onMessagesUpdated: (messages: Message[]) => void;
};


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


    // =========================================================================
    // State
    // =========================================================================

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
    const [showCommandMenu, setShowCommandMenu] = useState<boolean>(false);
    const [commandSearch, setCommandSearch] = useState<string>('');
    
    // Streaming state
    const [streamingMessageId, setStreamingMessageId] = useState<number | null>(null);
    const [streamingContent, setStreamingContent] = useState<string>("");
    const [thinkingContent, setThinkingContent] = useState<string>("");
    const [isThinkingActive, setIsThinkingActive] = useState<boolean>(false);


    // =========================================================================
    // Refs
    // =========================================================================

    const thinkingContentRef = useRef<string>("");
    const streamingContentRef = useRef<string>("");
    const abortControllerRef = useRef<AbortController | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const sendMessageRef = useRef<(content: string, existingId?: number, simFail?: boolean, skipUser?: boolean) => Promise<void>>(null!);


    // =========================================================================
    // Helper Functions (defined before effects that use them)
    // =========================================================================

    const inferProviderFromModel = useCallback((model: string): string => {
        if (model.startsWith("claude")) return "anthropic";
        if (model.startsWith("gpt")) return "openai";
        return currentProvider;
    }, [currentProvider]);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    const formatTime = useCallback((timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    }, []);

    const autoResizeTextarea = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
        }
    }, []);

    const updateMessageStatus = useCallback((messageId: number, status: MessageStatus, error?: string) => {
        setDisplayMessages(prev => prev.map(msg =>
            msg.id === messageId
                ? { ...msg, status, error }
                : msg
        ));
    }, []);

    const updateMessageContent = useCallback((messageId: number, content: string, thinking?: string) => {
        setDisplayMessages(prev => prev.map(msg =>
            msg.id === messageId
                ? { ...msg, content, thinking: thinking || msg.thinking }
                : msg
        ));
    }, []);

    const clearMessages = useCallback(() => {
        setDisplayMessages([{
            ...WELCOME_MESSAGE,
            id: Date.now(),
            timestamp: new Date().toISOString()
        }]);
        setConversationId(null);
        onConversationCreated(-1);
    }, [onConversationCreated]);

    const loadDefaultModel = useCallback(async () => {
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
    }, [api]);

    const sendMessageInternal = useCallback(async (
        messageContent: string, 
        existingMessageId?: number, 
        simulateFailure?: boolean,
        skipUserMessage?: boolean
    ) => {
        const timestamp = Date.now();
        const userMessageId = existingMessageId || timestamp;
        const assistantMessageId = timestamp + 1;

        if (existingMessageId) {
            updateMessageStatus(existingMessageId, 'sending', undefined);
        } else if (!skipUserMessage) {
            const userMessage: DisplayMessage = {
                id: userMessageId,
                role: "user",
                content: messageContent,
                timestamp: new Date(timestamp).toISOString(),
                status: 'sending'
            };
            setDisplayMessages(prev => [...prev, userMessage]);
        }

        const assistantMessage: DisplayMessage = {
            id: assistantMessageId,
            role: "assistant",
            content: "",
            timestamp: new Date().toISOString(),
            status: 'streaming'
        };
        setDisplayMessages(prev => [...prev, assistantMessage]);

        setIsTyping(true);
        setIsStreaming(true);
        setStreamingMessageId(assistantMessageId);
        setStreamingContent("");
        setThinkingContent("");
        setIsThinkingActive(false);
        
        thinkingContentRef.current = "";
        streamingContentRef.current = "";

        if (simulateFailure) {
            setDisplayMessages(prev => prev.filter(m => m.id !== assistantMessageId));
            updateMessageStatus(userMessageId, 'failed', 'Simulated failure triggered by /fail');
            setIsTyping(false);
            setIsStreaming(false);
            setStreamingMessageId(null);
            return;
        }

        try {
            const abortController = await api.streamChat(
                messageContent,
                selectedModel,
                currentProvider,
                conversationId,
                {
                    onMeta: (newConversationId) => {
                        if (newConversationId !== conversationId) {
                            setConversationId(newConversationId);
                            onConversationCreated(newConversationId);
                        }
                    },
                    onThinkingStart: () => {
                        setIsThinkingActive(true);
                    },
                    onThinking: (text) => {
                        thinkingContentRef.current += text;
                        setThinkingContent(thinkingContentRef.current);
                    },
                    onThinkingEnd: () => {
                        setIsThinkingActive(false);
                    },
                    onContent: (text) => {
                        streamingContentRef.current += text;
                        setStreamingContent(streamingContentRef.current);
                        updateMessageContent(assistantMessageId, streamingContentRef.current, thinkingContentRef.current);
                    },
                    onToolStart: (name) => {
                        console.log(`[ChatWindow] Tool started: ${name}`);
                    },
                    onToolEnd: (name, result) => {
                        console.log(`[ChatWindow] Tool ended: ${name}`, result);
                    },
                    onStreamEnd: (finalConversationId, _title) => {
                        const finalContent = streamingContentRef.current;
                        const finalThinking = thinkingContentRef.current;
                        
                        if (!skipUserMessage) {
                            updateMessageStatus(userMessageId, 'sent');
                        }
                        
                        setDisplayMessages(prev => prev.map(msg => 
                            msg.id === assistantMessageId
                                ? { 
                                    ...msg, 
                                    status: 'sent' as MessageStatus, 
                                    content: finalContent || msg.content,
                                    thinking: finalThinking || undefined 
                                }
                                : msg
                        ));
                        
                        if (finalConversationId !== conversationId) {
                            setConversationId(finalConversationId);
                            onConversationCreated(finalConversationId);
                        }

                        setIsTyping(false);
                        setIsStreaming(false);
                        setStreamingMessageId(null);
                        setStreamingContent("");
                        setThinkingContent("");
                        thinkingContentRef.current = "";
                        streamingContentRef.current = "";
                        abortControllerRef.current = null;
                    },
                    onError: (errorMessage) => {
                        console.error("[ChatWindow] Stream error:", errorMessage);
                        
                        setDisplayMessages(prev => prev.filter(m => m.id !== assistantMessageId));
                        
                        if (!skipUserMessage) {
                            updateMessageStatus(userMessageId, 'failed', errorMessage);
                            
                            showToast('Failed to send message', 'error', {
                                duration: 6000,
                                action: {
                                    label: 'Retry',
                                    onClick: () => {
                                        setDisplayMessages(prev => prev.filter(m => m.id !== userMessageId));
                                        sendMessageRef.current(messageContent);
                                    }
                                }
                            });
                        } else {
                            showToast('Failed to regenerate response', 'error');
                        }
                        
                        setIsTyping(false);
                        setIsStreaming(false);
                        setStreamingMessageId(null);
                        setStreamingContent("");
                        setThinkingContent("");
                        thinkingContentRef.current = "";
                        streamingContentRef.current = "";
                        abortControllerRef.current = null;
                    }
                }
            );

            abortControllerRef.current = abortController;

        } catch (error) {
            console.error("[ChatWindow] Failed to start stream:", error);
            
            setDisplayMessages(prev => prev.filter(m => m.id !== assistantMessageId));
            
            if (!skipUserMessage) {
                updateMessageStatus(userMessageId, 'failed', 'Failed to connect');
            } else {
                showToast('Failed to regenerate response', 'error');
            }
            
            setIsTyping(false);
            setIsStreaming(false);
            setStreamingMessageId(null);
            abortControllerRef.current = null;
        }
    }, [api, selectedModel, currentProvider, conversationId, onConversationCreated, updateMessageStatus, updateMessageContent, showToast]);


    // =========================================================================
    // Effects (now functions are defined above)
    // =========================================================================

    // Keep sendMessageRef in sync
    useEffect(() => {
        sendMessageRef.current = sendMessageInternal;
    }, [sendMessageInternal]);

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
                status: 'sent' as MessageStatus,
                thinking: msg.thinking
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
    }, [displayMessages, isTyping, streamingContent, scrollToBottom]);

    useEffect(() => {
        if (user) {
            loadDefaultModel();
        }
    }, [user, loadDefaultModel]);

    useEffect(() => {
        if (externalPrompt && !isTyping) {
            sendMessageInternal(externalPrompt);
            onPromptConsumed?.();
        }
    }, [externalPrompt, isTyping, sendMessageInternal, onPromptConsumed]);


    // =========================================================================
    // Event Handlers
    // =========================================================================

    const retryMessage = useCallback((messageId: number, content: string) => {
        setDisplayMessages(prev => prev.filter(m => m.id !== messageId));
        sendMessageRef.current(content);
    }, []);

    const handleModelChange = useCallback((newModel: string) => {
        setSelectedModel(newModel);
        setCurrentProvider(inferProviderFromModel(newModel));
    }, [inferProviderFromModel]);

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

    const handleCommandSelect = useCallback(async (trigger: Trigger, params?: Record<string, string>) => {
        setShowCommandMenu(false);
        setCommandSearch('');
        setInput('');

        const commandMessage = `/${trigger.command}`;

        const triggerResult = await executeTrigger(commandMessage, {
            message: commandMessage,
            conversationId,
            showToast,
            clearMessages,
            params
        });

        if (triggerResult) {
            if (triggerResult.response) {
                const responseMessage: DisplayMessage = {
                    id: Date.now(),
                    role: "assistant",
                    content: triggerResult.response,
                    timestamp: new Date().toISOString(),
                    status: 'sent'
                };
                setDisplayMessages(prev => [...prev, responseMessage]);
            }

            if (triggerResult.simulateFailure) {
                sendMessageInternal(commandMessage, undefined, true);
            }
        }
    }, [conversationId, showToast, clearMessages, sendMessageInternal]);

    const handleSendMessage = useCallback(async () => {
        if (!input.trim() || !selectedModel) return;

        const messageContent = input.trim();
        setInput("");

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        const triggerResult = await executeTrigger(messageContent, {
            message: messageContent,
            conversationId,
            showToast,
            clearMessages
        });

        if (triggerResult) {
            if (triggerResult.response) {
                const responseMessage: DisplayMessage = {
                    id: Date.now(),
                    role: "assistant",
                    content: triggerResult.response,
                    timestamp: new Date().toISOString(),
                    status: 'sent'
                };
                setDisplayMessages(prev => [...prev, responseMessage]);
            }

            if (triggerResult.preventDefault) {
                return;
            }

            if (triggerResult.simulateFailure) {
                await sendMessageInternal(messageContent, undefined, true);
                return;
            }
        }

        await sendMessageInternal(messageContent);
    }, [input, selectedModel, conversationId, showToast, clearMessages, sendMessageInternal]);

    // Wire up handleKeyDown to use handleSendMessage
    const onKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (showCommandMenu && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter' || e.key === 'Tab')) {
            return;
        }

        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }

        if (e.key === "Escape" && showCommandMenu) {
            setShowCommandMenu(false);
        }
    }, [showCommandMenu, handleSendMessage]);

    const stopGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        
        const finalContent = streamingContentRef.current;
        const finalThinking = thinkingContentRef.current;
        
        if (streamingMessageId) {
            setDisplayMessages(prev => prev.map(msg =>
                msg.id === streamingMessageId
                    ? { 
                        ...msg, 
                        content: finalContent || "_Generation cancelled by user._",
                        status: 'sent' as MessageStatus,
                        thinking: finalThinking || undefined
                    }
                    : msg
            ));
        }
        
        setIsStreaming(false);
        setIsTyping(false);
        setIsRegenerating(false);
        setStreamingMessageId(null);
        setStreamingContent("");
        setThinkingContent("");
        setIsThinkingActive(false);
        
        thinkingContentRef.current = "";
        streamingContentRef.current = "";
    }, [streamingMessageId]);

    const handleNewChat = useCallback(() => {
        setConversationId(null);
        setDisplayMessages([{
            ...WELCOME_MESSAGE,
            id: Date.now(),
            timestamp: new Date().toISOString()
        }]);
        onConversationCreated(-1);
    }, [onConversationCreated]);

    const startEditingMessage = useCallback((message_id: number, currentContent: string) => {
        setEditingMessageId(message_id);
        setEditedContent(currentContent);
    }, []);

    const cancelEditingMessage = useCallback(() => {
        setEditingMessageId(null);
        setEditedContent("");
    }, []);

    // saveEditedMessage must be defined BEFORE handleEditKeyDown since it references it
    const saveEditedMessage = useCallback(async (messageIndex: number) => {
        if (!editedContent.trim()) return;

        const editedMessage = displayMessages[messageIndex];
        if (!editedMessage || editedMessage.role !== "user") return;

        const messageBeforeEdit = displayMessages.slice(0, messageIndex);

        setEditingMessageId(null);
        setEditedContent("");
        setDisplayMessages(messageBeforeEdit);

        await sendMessageInternal(editedContent.trim());
    }, [editedContent, displayMessages, sendMessageInternal]);

    const handleEditKeyDown = useCallback((e: React.KeyboardEvent, messageIndex: number) => {
        if (e.key === "Enter" && e.ctrlKey && !e.shiftKey) {
            e.preventDefault();
            saveEditedMessage(messageIndex);
        } else if (e.key === "Escape") {
            cancelEditingMessage();
        }
    }, [saveEditedMessage, cancelEditingMessage]);

    const regenerateResponse = useCallback(async (messageIndex: number) => {
        const previousUserMessage = displayMessages
            .slice(0, messageIndex)
            .reverse()
            .find(msg => msg.role === "user");

        if (!previousUserMessage) {
            console.error("Failed to find previous user message to regenerate response for.");
            return;
        }

        setIsRegenerating(true);
        
        const messagesBeforeRegenerate = displayMessages.slice(0, messageIndex);
        setDisplayMessages(messagesBeforeRegenerate);

        await sendMessageInternal(previousUserMessage.content, undefined, false, true);
        
        setIsRegenerating(false);
    }, [displayMessages, sendMessageInternal]);


    // =========================================================================
    // Markdown Components
    // =========================================================================

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


    // =========================================================================
    // Render
    // =========================================================================

    if (!selectedModel) {
        return (
            <div className="chat-window-container">
                <div className="chat-window">
                    <LoadingSpinner size='small' message='Loading conversations..' variant="minimal"/>
                </div>
            </div>
        );
    }

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
                                <span>{isStreaming ? 'Responding...' : 'Online'}</span>
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
                            className={`chat-message ${message.role} ${message.status === 'failed' ? 'message-failed' : ''} ${message.status === 'sending' ? 'message-sending' : ''} ${message.status === 'streaming' ? 'message-streaming' : ''}`}
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
                                <>
                                    {/* Thinking block for assistant messages */}
                                    {message.role === "assistant" && (message.thinking || (message.id === streamingMessageId && thinkingContent)) && (
                                        <ThinkingBlock 
                                            content={message.thinking || thinkingContent}
                                            isStreaming={message.id === streamingMessageId && isThinkingActive}
                                        />
                                    )}
                                    
                                    <div className="message-bubble markdown-content">
                                        {message.status === 'streaming' && !message.content ? (
                                            <div className="typing-indicator">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                        ) : (
                                            <ReactMarkdown
                                                components={markdownComponents}
                                                remarkPlugins={[remarkGfm]}
                                            >
                                                {message.content}
                                            </ReactMarkdown>
                                        )}
                                    </div>
                                </>
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
                                                {message.status === 'streaming' ? 'Streaming...' : formatTime(message.timestamp)}
                                            </span>
                                        </div>
                                        {message.status === 'sent' && (
                                            <div className="msg-btn-wrapper">
                                                <MessageCopyButton textContent={message.content} className="msg-copy-btn"/>
                                                <RegenResponseButton
                                                    onRegen={() => regenerateResponse(index)}
                                                    isRegenerating={isRegenerating}
                                                    className="msg-regenerate-btn"
                                                />
                                            </div>
                                        )}
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

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="chat-input-area">
                    <div className="chat-input-wrapper">
                        {/* Command Context Menu */}
                        <CommandContextMenu
                            isOpen={showCommandMenu}
                            searchQuery={commandSearch}
                            onSelect={handleCommandSelect}
                            onClose={() => setShowCommandMenu(false)}
                        />

                        <textarea
                            ref={textareaRef}
                            className="chat-input"
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={onKeyDown}
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
                                    onClick={handleSendMessage}
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
