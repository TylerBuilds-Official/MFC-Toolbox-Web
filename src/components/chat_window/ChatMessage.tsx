import React, { memo } from 'react';
import type { DisplayMessage, ContentBlock } from '../../types';
import { formatMessageTime } from '../../services';

import ThinkingBlock from '../ThinkingBlock';
import ToolCallBlock from '../ToolCallBlock';
import SkillCallBlock from '../SkillCallBlock';
import MessageContent from '../MessageContent';
import MessageCopyButton from '../MessageCopyButton';
import RegenResponseButton from '../RegenResponseButton';
import MessageEditor from './MessageEditor';
import TypingIndicator from './TypingIndicator';

import { RetryIcon, WarningIcon, EditIcon } from '../../assets/svg/chat_window';


interface ChatMessageProps {
    message: DisplayMessage;
    index: number;
    
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
}


const ChatMessage: React.FC<ChatMessageProps> = ({
    message,
    index,
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
}) => {
    const isEditing   = editingMessageId === message.id;
    const isStreaming = message.id === streamingMessageId;
    
    // Use streaming blocks if this is the streaming message, otherwise use stored blocks
    const contentBlocks = isStreaming ? streamingContentBlocks : (message.contentBlocks || []);

    const handleEditKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && e.ctrlKey && !e.shiftKey) {
            e.preventDefault();
            onSaveEdit(index);
        } else if (e.key === "Escape") {
            onCancelEdit();
        }
    };

    const statusClasses = [
        message.status === 'failed'    ? 'message-failed'    : '',
        message.status === 'sending'   ? 'message-sending'   : '',
        message.status === 'streaming' ? 'message-streaming' : '',
    ].filter(Boolean).join(' ');

    return (
        <div className={`chat-message ${message.role} ${statusClasses}`}>
            {/* Edit mode */}
            {isEditing ? (
                <MessageEditor
                    content={editedContent}
                    onChange={onEditChange}
                    onSave={() => onSaveEdit(index)}
                    onCancel={onCancelEdit}
                    onKeyDown={handleEditKeyDown}
                />
            ) : (
                <>
                    {/* Render content blocks for assistant messages */}
                    {message.role === "assistant" && contentBlocks.length > 0 ? (
                        <div className="message-bubble markdown-content">
                            {contentBlocks.map((block, blockIndex) => {
                                if (block.type === 'thinking') {
                                    return (
                                        <ThinkingBlock
                                            key={`thinking-${blockIndex}`}
                                            content={block.content}
                                            isStreaming={block.isStreaming}
                                        />
                                    );
                                }
                                if (block.type === 'tool_call') {
                                    // Debug log
                                    console.log('[ChatMessage] Tool block:', block.name, 'chatRenderHint:', block.chatRenderHint);
                                    // Route based on render hint
                                    if (block.chatRenderHint === 'skill_read') {
                                        return (
                                            <SkillCallBlock
                                                key={`skill-${blockIndex}`}
                                                name={block.name}
                                                isComplete={block.isComplete}
                                            />
                                        );
                                    }
                                    return (
                                        <ToolCallBlock
                                            key={`tool-${blockIndex}`}
                                            name={block.name}
                                            params={block.params}
                                            result={block.result}
                                            isComplete={block.isComplete}
                                        />
                                    );
                                }
                                if (block.type === 'text') {
                                    return (
                                        <MessageContent
                                            key={`text-${blockIndex}`}
                                            content={block.content}
                                            isStreaming={isStreaming && blockIndex === contentBlocks.length - 1}
                                        />
                                    );
                                }
                                return null;
                            })}

                        </div>
                    ) : (
                        /* Fallback for messages without contentBlocks (legacy or user messages) */
                        <>
                            {/* Legacy thinking block for old assistant messages */}
                            {message.role === "assistant" && (message.thinking || (isStreaming && thinkingContent)) && (
                                <ThinkingBlock
                                    content={message.thinking || thinkingContent}
                                    isStreaming={isStreaming && isThinkingActive}
                                />
                            )}

                            <div className="message-bubble markdown-content">
                                {message.status === 'streaming' && !message.content ? (
                                    <TypingIndicator />
                                ) : (
                                    <MessageContent
                                        content={message.content}
                                        isStreaming={message.status === 'streaming'}
                                    />
                                )}
                            </div>
                        </>
                    )}
                </>
            )}

            {/* Failed message indicator */}
            {message.status === 'failed' && message.role === 'user' && (
                <div className="message-error-indicator">
                    <WarningIcon />
                    <span>Failed to send</span>
                    <button
                        className="message-retry-btn"
                        onClick={() => onRetry(message.id, message.content)}
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
                                {message.status === 'streaming' 
                                    ? 'Streaming...' 
                                    : formatMessageTime(message.timestamp)}
                            </span>
                        </div>
                        {message.status === 'sent' && (
                            <div className="msg-btn-wrapper">
                                <MessageCopyButton textContent={message.content} className="msg-copy-btn" />
                                <RegenResponseButton
                                    onRegen={() => onRegenerate(index)}
                                    isRegenerating={isRegenerating}
                                    className="msg-regenerate-btn"
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="msg-btn-wrapper">
                            <MessageCopyButton textContent={message.content} className="msg-copy-btn" />
                            {!isEditing && message.status !== 'failed' && (
                                <button
                                    onClick={() => onStartEdit(message.id, message.content)}
                                    className="msg-edit-btn"
                                    aria-label="Edit message"
                                    title="Edit message"
                                >
                                    <EditIcon />
                                </button>
                            )}
                        </div>
                        <div className="message-meta-time">
                            <span className="message-timestamp">
                                {message.status === 'sending' 
                                    ? 'Sending...' 
                                    : formatMessageTime(message.timestamp)}
                            </span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// Custom comparison to prevent unnecessary re-renders
const arePropsEqual = (prevProps: ChatMessageProps, nextProps: ChatMessageProps): boolean => {
    // Always re-render if the message itself changed
    if (prevProps.message !== nextProps.message) return false;
    
    // Check if THIS message is currently being edited
    const wasEditing = prevProps.editingMessageId === prevProps.message.id;
    const isEditing = nextProps.editingMessageId === nextProps.message.id;
    if (wasEditing || isEditing) {
        // Re-render if editing state or content changed
        if (prevProps.editingMessageId !== nextProps.editingMessageId) return false;
        if (prevProps.editedContent !== nextProps.editedContent) return false;
    }
    
    // Check if THIS message is currently streaming
    const wasStreaming = prevProps.streamingMessageId === prevProps.message.id;
    const isStreaming = nextProps.streamingMessageId === nextProps.message.id;
    if (wasStreaming || isStreaming) {
        // Re-render if streaming state changed for this message
        if (prevProps.streamingMessageId !== nextProps.streamingMessageId) return false;
        if (prevProps.thinkingContent !== nextProps.thinkingContent) return false;
        if (prevProps.isThinkingActive !== nextProps.isThinkingActive) return false;
        if (prevProps.streamingContentBlocks !== nextProps.streamingContentBlocks) return false;
    }
    
    // Re-render if regenerating state changed
    if (prevProps.isRegenerating !== nextProps.isRegenerating) return false;
    
    // Props are equal enough - skip re-render
    return true;
};

export default memo(ChatMessage, arePropsEqual);
