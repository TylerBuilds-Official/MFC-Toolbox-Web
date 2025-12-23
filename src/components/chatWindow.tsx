import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown, {type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useApi } from "../auth";
import { useAuth } from "../auth";
import type { Message } from "../types/conversation";
import "../styles/chatWindow.css";
import ModelSelector from "./modelSelector";
import CodeBlock from "./CodeBlock";


type DisplayMessage = {
    id: number;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
};

type ChatWindowProps = {
    externalPrompt?: string | null;
    onPromptConsumed?: () => void;
    activeConversationId: number | null;
    initialMessages: Message[];
    onConversationCreated: (id: number) => void;
    onMessagesUpdated: (messages: Message[]) => void;
};

const WELCOME_MESSAGE: DisplayMessage = {
    id: Date.now(),
    role: "assistant",
    content: "Welcome to the MFC Toolbox! I'm here to help with fabrication workflows, document processing, and more. What can I assist you with today?",
    timestamp: new Date().toISOString()
};

interface ChatResponse {
    response: string;
    conversation_id: number;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
                                                   externalPrompt,
                                                   onPromptConsumed,
                                                   activeConversationId,
                                                   initialMessages,
                                                   onConversationCreated,
                                               }) => {
    const { user } = useAuth();
    const api = useApi();

    const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([WELCOME_MESSAGE]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [selectedModel, setSelectedModel] = useState<string>("");
    const [currentProvider, setCurrentProvider] = useState<string>("openai");
    const [conversationId, setConversationId] = useState<number | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Sync conversationId with prop
    useEffect(() => {
        setConversationId(activeConversationId);
    }, [activeConversationId]);

    // Convert and display initial messages when they change
    useEffect(() => {
        if (initialMessages.length > 0) {
            const converted: DisplayMessage[] = initialMessages.map(msg => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                timestamp: msg.created_at
            }));
            setDisplayMessages(converted);

        } else if (activeConversationId === null) {
            // New conversation - show welcome message
            setDisplayMessages([{
                ...WELCOME_MESSAGE,
                id: Date.now(),
                timestamp: new Date().toISOString()
            }]);
        }
    }, [initialMessages, activeConversationId]);

    // Helper to infer provider from model name
    const inferProviderFromModel = (model: string): string => {
        if (model.startsWith("claude")) return "anthropic";
        if (model.startsWith("gpt")) return "openai";
        return currentProvider;
    };

    // Handle model change with provider sync
    const handleModelChange = (newModel: string) => {
        setSelectedModel(newModel);
        setCurrentProvider(inferProviderFromModel(newModel));
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [displayMessages, isTyping]);

    // Load default model from backend on mount
    useEffect(() => {
        if (user) {
            loadDefaultModel();
        }
    }, [user]);

    // Handle external prompts from toolbox
    useEffect(() => {
        if (externalPrompt && !isTyping) {
            sendMessageInternal(externalPrompt);
            onPromptConsumed?.();
        }
    }, [externalPrompt]);

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

    const sendMessageInternal = async (messageContent: string) => {
        const timestamp = Date.now();

        const userMessage: DisplayMessage = {
            id: timestamp,
            role: "user",
            content: messageContent,
            timestamp: new Date(timestamp).toISOString()
        };

        setDisplayMessages(prev => [...prev, userMessage]);
        setIsTyping(true);

        try {
            const params = new URLSearchParams({
                message: messageContent,
                model: selectedModel,
                provider: currentProvider,

            });

            if (conversationId !== null) {
                params.append("conversation_id", conversationId.toString());
            }

            const response = await api.get<ChatResponse>(`/chat?${params.toString()}`);

            // Handle new conversation created
            if (response.conversation_id && response.conversation_id !== conversationId) {
                setConversationId(response.conversation_id);
                onConversationCreated(response.conversation_id);
            }

            const assistantMessage: DisplayMessage = {
                id: Date.now(),
                role: "assistant",
                content: response.response,
                timestamp: new Date().toISOString()
            };

            setDisplayMessages(prev => [...prev, assistantMessage]);

        } catch (error) {
            console.error("Chat API error:", error);
            setDisplayMessages(prev => [
                ...prev,
                {
                    id: Date.now(),
                    role: "assistant",
                    content: "Sorry, I couldn't connect to the server. Please make sure the API is running and try again.",
                    timestamp: new Date().toISOString()
                }
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || !selectedModel) return;
        const messageContent = input.trim();
        setInput("");
        await sendMessageInternal(messageContent);
    };

    const handleNewChat = () => {
        setConversationId(null);
        setDisplayMessages([{
            ...WELCOME_MESSAGE,
            id: Date.now(),
            timestamp: new Date().toISOString()
        }]);
        onConversationCreated(-1); // Signal parent to clear active conversation
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

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

    if (!selectedModel) {
        return (
            <div className="chat-window-container">
                <div className="chat-window">
                    <div className="loading-state">
                        <p>Loading chat interface...</p>
                    </div>
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

                <div className="chat-messages">
                    {displayMessages.map(message => (
                        <div
                            key={message.id}
                            className={`chat-message ${message.role}`}
                        >
                            <div className="message-bubble markdown-content">
                                <ReactMarkdown components={markdownComponents}
                                               remarkPlugins={[remarkGfm]}>
                                    {message.content}
                                </ReactMarkdown>
                            </div>
                            <div className="message-meta">
                                    <span className="message-timestamp">
                                        {formatTime(message.timestamp)}
                                    </span>
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
                        <input
                            className="chat-input"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message..."
                            disabled={isTyping}
                        />
                        <div className="chat-input-actions">
                            <ModelSelector
                                value={selectedModel}
                                onChange={handleModelChange}
                                provider={currentProvider}
                                disabled={isTyping}
                            />
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;