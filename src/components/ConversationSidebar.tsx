import type { Conversation } from "../types/conversation.ts";
import ConversationItem from "./ConversationItem.tsx";
import '../styles/conversationSidebar.css';
import LoadingDots from "./LoadingDots.tsx";


interface ConversationSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    conversations: Conversation[];
    activeConversationId: number | null;
    onSelectConversation: (conversationId: number) => void;
    onNewConversation: () => void;
    onDeleteConversation: (conversationId: number) => void;
    onRenameConversation: (conversationId: number, newTitle: string) => void; // NEW
    loading: boolean;
}

const ConversationSidebar = ({ isOpen, onClose, conversations, activeConversationId, onSelectConversation, onNewConversation, onDeleteConversation, loading, onRenameConversation }: ConversationSidebarProps) => {

    const handleNewChat = () => {
        onNewConversation();
        onClose();
    };

    const handleSelectConversation = (conversationId: number) => {
        onSelectConversation(conversationId);
        onClose();
    };


    return (
        <>
            <div
                className={`conversation-backdrop ${isOpen ? "open" : ""}`}
                onClick={onClose}
            />

            <aside className={`conversation-sidebar ${isOpen ? "open" : ""}`}>
                <div className="conversation-sidebar-header">
                    <div className="conversation-sidebar-header-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <h2>Conversations</h2>
                    </div>
                    <button className="conversation-sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="conversation-sidebar-actions">
                    <button className="new-conversation-btn" onClick={handleNewChat}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        New Conversation
                    </button>
                </div>

                <div className="conversation-sidebar-content">
                    {loading && (
                        <div className="conversation-sidebar-loading">
                            <LoadingDots variant="primary" message="Loading conversations..." size='small' />
                        </div>
                    )}

                    {!loading && conversations.length === 0 && (
                        <div className="conversation-sidebar-empty">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <span>No conversations yet</span>
                            <p>Start a new conversation to get going!</p>
                        </div>
                    )}

                    {!loading && conversations.length > 0 && (
                        <div className="conversations-list">
                            {conversations.map(conversation => (
                                <ConversationItem
                                    key={conversation.id}
                                    conversation={conversation}
                                    isActive={conversation.id === activeConversationId}
                                    onSelect={() => handleSelectConversation(conversation.id)}
                                    onDelete={() => onDeleteConversation(conversation.id)}
                                    onRename={(newTitle) => onRenameConversation(conversation.id, newTitle)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};

export default ConversationSidebar;
