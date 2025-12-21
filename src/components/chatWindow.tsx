import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useApi } from "../auth";
import { useAuth } from "../auth";
import "../styles/chatWindow.css";
import ModelSelector from "./modelSelector";

type Message = {
    id: number;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
};

type ChatWindowProps = {
    externalPrompt?: string | null;
    onPromptConsumed?: () => void;
};

const WELCOME_MESSAGE: Message = {
    id: Date.now(),
    role: "assistant",
    content: "Welcome to the MFC Toolbox! I'm here to help with fabrication workflows, document processing, and more. What can I assist you with today?",
    timestamp: new Date().toISOString()
};

const ChatWindow: React.FC<ChatWindowProps> = ({ externalPrompt, onPromptConsumed }) => {
    const { user } = useAuth();
    const api = useApi();

    const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [selectedModel, setSelectedModel] = useState<string>("");  // Empty until loaded
    const [currentProvider, setCurrentProvider] = useState<string>("openai");

    // Helper to infer provider from model name
    const inferProviderFromModel = (model: string): string => {
        if (model.startsWith("claude")) return "anthropic";
        if (model.startsWith("gpt")) return "openai";
        return currentProvider; // Fallback to current
    };

    // Handle model change with provider sync
    const handleModelChange = (newModel: string) => {
        setSelectedModel(newModel);
        setCurrentProvider(inferProviderFromModel(newModel));
    };
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

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
            // Fallback to a safe default
            setSelectedModel("gpt-4o");
            setCurrentProvider("openai");
        }
    };

    const sendMessageInternal = async (messageContent: string) => {
        const timestamp = Date.now();

        const userMessage: Message = {
            id: timestamp,
            role: "user",
            content: messageContent,
            timestamp: new Date(timestamp).toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setIsTyping(true);

        try {
            // Build query params for GET request - include provider for proper routing
            const params = new URLSearchParams({
                message: messageContent,
                model: selectedModel,
                provider: currentProvider
            });

            const response = await api.get<{ response: string }>(`/chat?${params.toString()}`);

            setMessages(prev => [
                ...prev,
                {
                    id: Date.now(),
                    role: "assistant",
                    content: response.response,
                    timestamp: new Date().toISOString()
                }
            ]);
        } catch (error) {
            console.error("Chat API error:", error);
            setMessages(prev => [
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

    const handleNewChat = async () => {
        try {
            await api.post('/reset', {});
            setMessages([{
                ...WELCOME_MESSAGE,
                id: Date.now(),
                timestamp: new Date().toISOString()
            }]);
            // Reload default model in case it changed
            await loadDefaultModel();
        } catch (error) {
            console.error("Reset API error:", error);
        }
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

    // Show loading state until model is loaded
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

                {/* Messages */}
                <div className="chat-messages">
                    {messages.map(message => (
                        <div
                            key={message.id}
                            className={`chat-message ${message.role}`}
                        >
                            <div className="message-bubble">
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>
                            <div className="message-meta">
                                <span className="message-timestamp">
                                    {formatTime(message.timestamp)}
                                </span>
                            </div>
                        </div>
                    ))}

                    {/* Typing Indicator */}
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
                    {/* Input Row */}
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