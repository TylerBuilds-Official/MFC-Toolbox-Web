import { useEffect, useState, useCallback, useRef } from 'react';
import { useApi } from '../auth';
import { useAuth } from '../auth';
import { useToast } from '../components/Toast';
import { useChatModel } from '../hooks/chat/useChatModel';
import { usePaginatedMessages } from '../hooks/chat/usePaginatedMessages';
import type { Conversation, ConversationWithMessages, ConversationsResponse } from '../types/conversation';
import type { Message } from '../types/message';
import '../styles/home.css';
import '../styles/auth.css'
import ChatWindow from "../components/chat_window/chatWindow";
import ToolboxSidebar from "../components/ToolboxSidebar";
import ConversationSidebar from "../components/ConversationSidebar";
import SidebarToggleWrench from "../assets/svg/toolbox/sidebarToggleWrench";

const SCROLL_THRESHOLD = 200; // pixels from top to trigger load

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
    
    // Initial pagination state (will be populated when loading conversation)
    const [initialMessages, setInitialMessages] = useState<Message[]>([]);
    const [initialHasMore, setInitialHasMore] = useState(false);
    const [initialOldestId, setInitialOldestId] = useState<number | null>(null);

    // Paginated messages hook
    const pagination = usePaginatedMessages({
        api,
        conversationId: activeConversationId,
        initialMessages,
        initialHasMore,
        initialOldestId,
    });

    // Ref for scroll position restoration
    const scrollRestorationRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(null);
    
    // Flag to scroll to bottom after initial conversation load
    const shouldScrollToBottomRef = useRef(false);

    // Load conversations and default model on mount
    useEffect(() => {
        if (user) {
            loadConversations();
            chatModel.loadDefaultModel();
        }
    }, [user]);

    // Scroll to bottom after initial conversation load
    useEffect(() => {
        if (shouldScrollToBottomRef.current && pagination.messages.length > 0) {
            // Use requestAnimationFrame to ensure DOM has updated
            requestAnimationFrame(() => {
                window.scrollTo(0, document.documentElement.scrollHeight);
                shouldScrollToBottomRef.current = false;
            });
        }
    }, [pagination.messages.length]);

    // Scroll detection for loading older messages
    useEffect(() => {
        const handleScroll = () => {
            // Don't trigger if we're in the middle of scrolling to bottom
            if (shouldScrollToBottomRef.current) return;
            
            // Only trigger if we have more to load and aren't already loading
            if (!pagination.hasMore || pagination.isLoadingMore) return;
            
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            
            if (scrollTop < SCROLL_THRESHOLD) {
                // Store scroll position before loading
                scrollRestorationRef.current = {
                    scrollHeight: document.documentElement.scrollHeight,
                    scrollTop: scrollTop
                };
                pagination.loadOlderMessages();
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [pagination.hasMore, pagination.isLoadingMore, pagination.loadOlderMessages]);

    // Restore scroll position after prepending messages
    useEffect(() => {
        if (scrollRestorationRef.current && !pagination.isLoadingMore) {
            const { scrollHeight: oldHeight, scrollTop: oldScrollTop } = scrollRestorationRef.current;
            const newHeight = document.documentElement.scrollHeight;
            const heightDiff = newHeight - oldHeight;
            
            // Restore scroll position so user stays at same visual position
            if (heightDiff > 0) {
                window.scrollTo(0, oldScrollTop + heightDiff);
            }
            
            scrollRestorationRef.current = null;
        }
    }, [pagination.messages.length, pagination.isLoadingMore]);

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
            
            // Set initial state for pagination hook
            setInitialMessages(data.messages);
            setInitialHasMore(data.has_more);
            setInitialOldestId(data.oldest_id);
            
            setActiveConversationId(conversationId);
            setActiveProjectId(null);

            // Reset pagination with new data
            pagination.resetPagination(
                data.messages, 
                data.has_more, 
                data.oldest_id,
                data.total_count
            );
            
            // Flag to scroll to bottom after messages render
            shouldScrollToBottomRef.current = true;

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
        setInitialMessages([]);
        setInitialHasMore(false);
        setInitialOldestId(null);
        pagination.resetPagination([], false, null);
        
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
                setInitialMessages([]);
                setInitialHasMore(false);
                setInitialOldestId(null);
                pagination.resetPagination([], false, null);
            }
        } catch (error) {
            console.error("Failed to delete conversation:", error);
        }
    };

    const handleConversationCreated = (conversationId: number) => {
        if (conversationId === -1) {
            setActiveConversationId(null);
            setInitialMessages([]);
            setInitialHasMore(false);
            setInitialOldestId(null);
            pagination.resetPagination([], false, null);
        } else {
            setActiveConversationId(conversationId);
            // New conversation won't have pagination initially
            setInitialHasMore(false);
            setInitialOldestId(null);
            loadConversations();
        }
    };

    const handleMessagesUpdated = useCallback((newMessages: Message[]) => {
        pagination.setMessages(newMessages);
    }, [pagination.setMessages]);

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
                    initialMessages={pagination.messages}
                    onConversationCreated={handleConversationCreated}
                    onMessagesUpdated={handleMessagesUpdated}
                    // Model state props
                    selectedModel={chatModel.selectedModel}
                    currentProvider={chatModel.currentProvider}
                    onModelChange={chatModel.handleModelChange}
                    isModelReady={chatModel.isReady}
                    // Pagination props
                    hasMoreMessages={pagination.hasMore}
                    isLoadingMoreMessages={pagination.isLoadingMore}
                    onLoadMoreMessages={pagination.loadOlderMessages}
                />
            </div>
        </div>
    );
};

export default Home;
