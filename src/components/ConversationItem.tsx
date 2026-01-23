import React, { useState, useRef, useEffect } from 'react';
import type { Conversation } from "../types/conversation.ts";
import { useConfirm } from './ConfirmDialog';
import '../styles/conversationSidebar.css';

interface ConversationItemProps {
    conversation: Conversation;
    isActive: boolean;
    onSelect: () => void;
    onDelete: () => void;
    onRename: (newTitle: string) => void;
}

const ConversationItem = ({
                              conversation,
                              isActive,
                              onSelect,
                              onDelete,
                              onRename
                          }: ConversationItemProps) => {
    const { confirm } = useConfirm();
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(conversation.title);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when entering edit mode
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays} days ago`;

        return date.toLocaleDateString();
    };

    const stripMarkdown = (text: string): string => {
        return text
            // Remove code blocks
            .replace(/```[\s\S]*?```/g, '')
            // Remove inline code
            .replace(/`([^`]+)`/g, '$1')
            // Remove headers
            .replace(/^#{1,6}\s+/gm, '')
            // Remove bold/italic (*** or ___)
            .replace(/(\*\*\*|___)(.+?)\1/g, '$2')
            // Remove bold (** or __)
            .replace(/(\*\*|__)(.+?)\1/g, '$2')
            // Remove italic (* or _)
            .replace(/(\*|_)(.+?)\1/g, '$2')
            // Remove strikethrough
            .replace(/~~(.+?)~~/g, '$1')
            // Remove links, keep text
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            // Remove images
            .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
            // Remove blockquotes
            .replace(/^>\s?/gm, '')
            // Remove horizontal rules
            .replace(/^[-*_]{3,}$/gm, '')
            // Remove list markers
            .replace(/^[\s]*[-*+]\s+/gm, '')
            .replace(/^[\s]*\d+\.\s+/gm, '')
            // Clean up extra whitespace
            .replace(/\n+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    };

    const getPreviewText = (preview: string | null): string => {
        if (!preview || preview.trim() === '') {
            return "No messages yet";
        }
        return stripMarkdown(preview);
    };

    const handleDeleteClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const confirmed = await confirm({
            title: 'Delete Conversation',
            message: 'Are you sure you want to delete this conversation? This cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            variant: 'danger'
        });

        if (confirmed) {
            onDelete();
        }
    };

    const handleTitleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
        setEditedTitle(conversation.title);
    };

    const handleSaveTitle = () => {
        const trimmedTitle = editedTitle.trim();
        if (trimmedTitle && trimmedTitle !== conversation.title) {
            onRename(trimmedTitle);
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedTitle(conversation.title);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSaveTitle();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCancelEdit();
        }
    };

    const handleBlur = () => {
        // Save on blur
        handleSaveTitle();
    };

    return (
        <div
            className={`conversation-item ${isActive ? "active" : ""}`}
            onClick={isEditing ? undefined : onSelect}
        >
            <div className="conversation-icon">💬</div>
            <div className="conversation-info">
                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        className="conversation-title-input"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleBlur}
                        onClick={(e) => e.stopPropagation()}
                        maxLength={100}
                    />
                ) : (
                    <span
                        className="conversation-title"
                        onClick={handleTitleClick}
                        title="Click to rename"
                    >
                        {conversation.title}
                    </span>
                )}
                <span className="conversation-preview">{getPreviewText(conversation.last_message_preview)}</span>
                <span className="conversation-date">{formatDate(conversation.updated_at)}</span>
            </div>
            <button
                className="conversation-delete-btn"
                onClick={handleDeleteClick}
                aria-label="Delete conversation"
                title="Delete conversation"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        </div>
    );
};

export default ConversationItem;