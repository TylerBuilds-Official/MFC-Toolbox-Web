import { useEffect, useState } from 'react';
import { useApi } from '../auth/useApi';
import { useAuth } from '../auth/AuthContext';
import type { Conversation, Message, ConversationWithMessages, ConversationsResponse } from '../types/conversation';
import '../styles/home.css';
import ChatWindow from "../components/chatWindow";
import ToolboxSidebar from "../components/ToolboxSidebar";
import ConversationSidebar from "../components/ConversationSidebar";
import WrenchIcon from "../assets/svg/toolbox/buttonWrench";

const Home = () => {
    const { user } = useAuth();
    const api = useApi();

    // Toolbox state
    const [toolboxOpen, setToolboxOpen] = useState(false);
    const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

    // Conversation sidebar state
    const [conversationsOpen, setConversationsOpen] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [conversationsLoading, setConversationsLoading] = useState(true);

    // Active conversation state
    const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);

    // Load conversations on mount
    useEffect(() => {
        if (user) {
            loadConversations();
        }
    }, [user]);

    const loadConversations = async () => {
        setConversationsLoading(true);
        try {
            const data = await api.get<ConversationsResponse>('/conversations');
            setConversations(data.conversations);
        } catch (error) {
            console.error("Failed to load conversations:", error);
        } finally {
            setConversationsLoading(false);
        }
    };

    const loadConversation = async (conversationId: number) => {
        try {
            const data = await api.get<ConversationWithMessages>(`/conversations/${conversationId}`);
            setMessages(data.messages);
            setActiveConversationId(conversationId);
        } catch (error) {
            console.error("Failed to load conversation:", error);
        }
    };

    const handleSelectConversation = (conversationId: number) => {
        loadConversation(conversationId);
    };

    const handleNewConversation = () => {
        // Clear active conversation - ChatWindow will create new one on first message
        setActiveConversationId(null);
        setMessages([]);
    };

    const handleDeleteConversation = async (conversationId: number) => {
        try {
            await api.delete(`/conversations/${conversationId}`);
            setConversations(prev => prev.filter(c => c.id !== conversationId));

            // If we deleted the active conversation, clear it
            if (activeConversationId === conversationId) {
                setActiveConversationId(null);
                setMessages([]);
            }
        } catch (error) {
            console.error("Failed to delete conversation:", error);
        }
    };

    const handleConversationCreated = (conversationId: number) => {
        if (conversationId === -1) {
            setActiveConversationId(null);
            setMessages([]);
        } else {
            setActiveConversationId(conversationId);
            loadConversations();
        }
    };

    const handleMessagesUpdated = (newMessages: Message[]) => {
        setMessages(newMessages);
    };

    // Toolbox handlers
    const handleToolSelect = (prompt: string) => {
        setPendingPrompt(prompt);
    };

    const handlePromptConsumed = () => {
        setPendingPrompt(null);
    };

    return (
        <div className="home-page">
            <ToolboxSidebar
                isOpen={toolboxOpen}
                onClose={() => setToolboxOpen(false)}
                onToolSelect={handleToolSelect}
            />

            <ConversationSidebar
                isOpen={conversationsOpen}
                onClose={() => setConversationsOpen(false)}
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelectConversation={handleSelectConversation}
                onNewConversation={handleNewConversation}
                onDeleteConversation={handleDeleteConversation}
                loading={conversationsLoading}
            />

            <div className="header-container">
                <button
                    className="toolbox-sidebar-toggle"
                    onClick={() => setToolboxOpen(true)}
                    aria-label="Open Toolbox"
                    title="Open Toolbox"
                >
                    <WrenchIcon />
                </button>

                <div className="welcome-header">
                    <h1>Welcome to the MFC Toolbox</h1>
                    <p>Your AI-powered assistant for fabrication workflows, document processing, and internal operations.</p>
                </div>

                <button
                    className="conversations-sidebar-toggle"
                    onClick={() => setConversationsOpen(true)}
                    aria-label="Open Conversations"
                    title="Conversation History"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                </button>
            </div>

            <div className="chat-section">
                <ChatWindow
                    externalPrompt={pendingPrompt}
                    onPromptConsumed={handlePromptConsumed}
                    activeConversationId={activeConversationId}
                    initialMessages={messages}
                    onConversationCreated={handleConversationCreated}
                    onMessagesUpdated={handleMessagesUpdated}
                />
            </div>
        </div>
    );
};

export default Home;