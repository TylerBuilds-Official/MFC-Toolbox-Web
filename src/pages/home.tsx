import { useEffect, useState } from 'react';
import { useApi } from '../auth';
import { useAuth } from '../auth';
import { useToast } from '../components/Toast';
import { useChatModel } from '../hooks/chat/useChatModel';
import type { Conversation, ConversationWithMessages, ConversationsResponse } from '../types/conversation';
import type { Message } from '../types/message';
import '../styles/home.css';
import '../styles/auth.css'
import ChatWindow from "../components/chat_window/chatWindow";
import ToolboxSidebar from "../components/ToolboxSidebar";
import ConversationSidebar from "../components/ConversationSidebar";
import SidebarToggleWrench from "../assets/svg/toolbox/sidebarToggleWrench";

const Home = () => {
    const { user } = useAuth();
    const api = useApi();
    const { showToast } = useToast();

    // Model state (lifted from ChatWindow)
    const chatModel = useChatModel(api);

    // Toolbox state
    const [toolboxOpen, setToolboxOpen] = useState(false);
    const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

    // Conversation sidebar state
    const [conversationsOpen, setConversationsOpen] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [conversationsLoading, setConversationsLoading] = useState(true);

    // Active conversation state
    const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
    const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);

    // Load conversations and default model on mount
    useEffect(() => {
        if (user) {
            loadConversations();
            chatModel.loadDefaultModel();
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
            setActiveProjectId(null);

            // Check if we need to switch provider/model for this conversation
            if (data.conversation_provider && data.conversation_model) {
                const switched = chatModel.setConversationContext(
                    data.conversation_provider,
                    data.conversation_model
                );
                
                if (switched) {
                    const providerName = data.conversation_provider === 'anthropic' 
                        ? 'Anthropic' 
                        : 'OpenAI';
                    showToast(`Switched to ${providerName} for this conversation`, 'info');
                }
            }
        } catch (error) {
            console.error("Failed to load conversation:", error);
        }
    };

    const handleSelectConversation = (conversationId: number) => {
        loadConversation(conversationId);
    };

    const handleNewConversation = (projectId?: number) => {
        // Clear active conversation - ChatWindow will create new one on first message
        setActiveConversationId(null);
        setActiveProjectId(projectId ?? null);
        setMessages([]);
        
        // Reset model to user's defaults
        chatModel.resetToDefaults();
    };

    const handleRenameConversation = async (conversationId: number, newTitle: string) => {
        try {
            // Optimistic update
            setConversations(prev =>
                prev.map(c => c.id === conversationId ? { ...c, title: newTitle } : c)
            );

            // Call API
            await api.patch(`/conversations/${conversationId}`, { title: newTitle });

        } catch (error) {
            console.error("Failed to rename conversation:", error);

            // Revert on error
            await loadConversations();

            showToast('Failed to rename conversation. Please try again.', 'error');
        }
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
                onRenameConversation={handleRenameConversation}
                loading={conversationsLoading}
            />

            {/* Fixed sidebar toggle buttons */}
            <button
                className="toolbox-sidebar-toggle"
                onClick={() => setToolboxOpen(true)}
                aria-label="Open Toolbox"
                title="Open Toolbox"
            >
                <SidebarToggleWrench />
            </button>

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

            {/* Welcome Header */}
            <div className="welcome-header">
                <h1>Welcome to the MFC Toolbox</h1>
                <p>Your AI-powered assistant for fabrication workflows, document processing, and internal operations.</p>
            </div>

            <div className="chat-section">
                <ChatWindow
                    externalPrompt={pendingPrompt}
                    onPromptConsumed={handlePromptConsumed}
                    activeConversationId={activeConversationId}
                    activeProjectId={activeProjectId}
                    initialMessages={messages}
                    onConversationCreated={handleConversationCreated}
                    onMessagesUpdated={handleMessagesUpdated}
                    // Model state props
                    selectedModel={chatModel.selectedModel}
                    currentProvider={chatModel.currentProvider}
                    onModelChange={chatModel.handleModelChange}
                    isModelReady={chatModel.isReady}
                />
            </div>
        </div>
    );
};

export default Home;
