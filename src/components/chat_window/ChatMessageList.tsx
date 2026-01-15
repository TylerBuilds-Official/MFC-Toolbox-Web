import React, { memo } from 'react';
import type { DisplayMessage, ContentBlock } from '../../types/chat';
import ChatMessage from './ChatMessage';
import LoadingDots from '../LoadingDots';


interface ChatMessageListProps {
    messages: DisplayMessage[];
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    
    // Streaming state
    streamingMessageId: number | null;
    thinkingContent: string;
    isThinkingActive: boolean;
    streamingContentBlocks: ContentBlock[];
    
    // Editing state
    editingMessageId: number | null;
    editedContent: string;
    isRegenerating: boolean;
    
    // Callbacks
    onRetry: (id: number, content: string) => void;
    onStartEdit: (id: number, content: string) => void;
    onCancelEdit: () => void;
    onSaveEdit: (index: number) => void;
    onEditChange: (content: string) => void;
    onRegenerate: (index: number) => void;
    
    // Pagination
    hasMore?: boolean;
    isLoadingMore?: boolean;
    onLoadMore?: () => void;
}


const ChatMessageList: React.FC<ChatMessageListProps> = ({
    messages,
    messagesEndRef,
    streamingMessageId,
    thinkingContent,
    isThinkingActive,
    streamingContentBlocks,
    editingMessageId,
    editedContent,
    isRegenerating,
    onRetry,
    onStartEdit,
    onCancelEdit,
    onSaveEdit,
    onEditChange,
    onRegenerate,
    // Pagination
    hasMore = false,
    isLoadingMore = false,
    onLoadMore,
}) => {
    return (
        <div className="chat-messages">
            {/* Loading indicator at top when fetching older messages */}
            {isLoadingMore && (
                <div className="chat-messages-loading-more">
                    <LoadingDots size="small" message="" variant="minimal" />
                    <span>Loading older messages...</span>
                </div>
            )}
            
            {/* "Load more" indicator when there are more messages */}
            {hasMore && !isLoadingMore && (
                <div className="chat-messages-has-more">
                    <button 
                        className="load-more-btn"
                        onClick={onLoadMore}
                        type="button"
                    >
                        ↑ Load older messages
                    </button>
                </div>
            )}
            
            {/* Beginning of conversation indicator - only show for existing conversations with history */}
            {!hasMore && messages.length > 1 && messages[0]?.status === 'sent' && (
                <div className="chat-messages-beginning">
                    <span>Beginning of conversation</span>
                </div>
            )}
            
            {messages.map((message, index) => (
                <ChatMessage
                    key={message.id}
                    message={message}
                    index={index}
                    streamingMessageId={streamingMessageId}
                    thinkingContent={thinkingContent}
                    isThinkingActive={isThinkingActive}
                    streamingContentBlocks={streamingContentBlocks}
                    editingMessageId={editingMessageId}
                    editedContent={editedContent}
                    isRegenerating={isRegenerating}
                    onRetry={onRetry}
                    onStartEdit={onStartEdit}
                    onCancelEdit={onCancelEdit}
                    onSaveEdit={onSaveEdit}
                    onEditChange={onEditChange}
                    onRegenerate={onRegenerate}
                />
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default memo(ChatMessageList);
