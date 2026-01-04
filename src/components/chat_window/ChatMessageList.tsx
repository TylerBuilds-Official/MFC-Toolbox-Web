import React from 'react';
import type { DisplayMessage } from '../../types/chat';
import ChatMessage from './ChatMessage';


interface ChatMessageListProps {
    messages: DisplayMessage[];
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    
    // Streaming state
    streamingMessageId: number | null;
    thinkingContent: string;
    isThinkingActive: boolean;
    
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
}


const ChatMessageList: React.FC<ChatMessageListProps> = ({
    messages,
    messagesEndRef,
    streamingMessageId,
    thinkingContent,
    isThinkingActive,
    editingMessageId,
    editedContent,
    isRegenerating,
    onRetry,
    onStartEdit,
    onCancelEdit,
    onSaveEdit,
    onEditChange,
    onRegenerate,
}) => {
    return (
        <div className="chat-messages">
            {messages.map((message, index) => (
                <ChatMessage
                    key={message.id}
                    message={message}
                    index={index}
                    streamingMessageId={streamingMessageId}
                    thinkingContent={thinkingContent}
                    isThinkingActive={isThinkingActive}
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

export default ChatMessageList;
