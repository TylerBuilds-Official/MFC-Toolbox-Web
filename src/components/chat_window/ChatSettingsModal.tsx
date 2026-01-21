/**
 * ChatSettingsModal - In-chat settings for conversation management
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
    X, 
    MessageSquare, 
    Calendar, 
    Cpu,
    Download,
    Plus,
    Trash2,
    Pencil,
    Check,
    ChevronDown,
} from 'lucide-react';
import type { ConversationProject } from '../../types';
import type { ExportFormat } from '../../utils/exportChat';
import ProjectPicker from './ProjectPicker';

// ============================================================================
// Types
// ============================================================================

interface ChatSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    // Conversation context
    conversationId: number | null;
    conversationTitle: string;
    messageCount: number;
    createdAt: string | null;
    currentModel: string;
    currentProvider: string;
    // Available options
    models: { openai: string[]; anthropic: string[] };
    projects: ConversationProject[];
    currentProjectIds: number[];
    // Display settings
    compactMode: boolean;
    // Callbacks
    onRename: (newTitle: string) => void;
    onDelete: () => void;
    onNewChat: () => void;
    onExport: (format: ExportFormat) => void;
    onModelChange: (model: string) => void;
    onProviderChange: (provider: string) => void;
    onProjectsChange: (projectIds: number[]) => void;
    onToggleCompact: (compact: boolean) => void;
    onCreateProject?: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

function formatDate(timestamp: string): string {
    return new Date(timestamp).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatModelName(model: string): string {
    // claude-sonnet-4-5-20250929 -> Claude Sonnet 4.5
    // gpt-5.1 -> GPT 5.1
    if (model.startsWith('claude')) {
        return model
            .replace('claude-', 'Claude ')
            .replace(/-latest$/, '')
            .replace(/-\d{8}$/, '')
            .replace(/-/g, ' ')
            .replace(/(\d) (\d)/g, '$1.$2')
            .split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
    }
    if (model.startsWith('gpt')) {
        return model.toUpperCase().replace('-', ' ');
    }
    return model;
}

function formatProviderName(provider: string): string {
    return provider.charAt(0).toUpperCase() + provider.slice(1);
}

// ============================================================================
// Component
// ============================================================================

const ChatSettingsModal: React.FC<ChatSettingsModalProps> = ({
    isOpen,
    onClose,
    conversationId,
    conversationTitle,
    messageCount,
    createdAt,
    currentModel,
    currentProvider,
    models,
    projects,
    currentProjectIds,
    compactMode,
    onRename,
    onDelete,
    onNewChat,
    onExport,
    onModelChange,
    onProviderChange,
    onProjectsChange,
    onToggleCompact,
    onCreateProject,
}) => {
    // Local state
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleInput, setTitleInput] = useState(conversationTitle);
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const [showProviderDropdown, setShowProviderDropdown] = useState(false);
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    const [showProjectPicker, setShowProjectPicker] = useState(false);
    const [pendingProjectIds, setPendingProjectIds] = useState<number[]>(currentProjectIds);

    // Sync title input when prop changes
    useEffect(() => {
        setTitleInput(conversationTitle);
    }, [conversationTitle]);

    // Sync pending projects when prop changes
    useEffect(() => {
        setPendingProjectIds(currentProjectIds);
    }, [currentProjectIds]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setIsEditingTitle(false);
            setShowModelDropdown(false);
            setShowProviderDropdown(false);
            setShowExportDropdown(false);
            setShowProjectPicker(false);
        }
    }, [isOpen]);

    // Handlers
    const handleSaveTitle = useCallback(() => {
        const trimmed = titleInput.trim();
        if (trimmed && trimmed !== conversationTitle) {
            onRename(trimmed);
        }
        setIsEditingTitle(false);
    }, [titleInput, conversationTitle, onRename]);

    const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveTitle();
        } else if (e.key === 'Escape') {
            setTitleInput(conversationTitle);
            setIsEditingTitle(false);
        }
    }, [handleSaveTitle, conversationTitle]);

    const handleModelSelect = useCallback((model: string) => {
        onModelChange(model);
        setShowModelDropdown(false);
    }, [onModelChange]);

    const handleProviderSelect = useCallback((provider: string) => {
        if (provider !== currentProvider) {
            onProviderChange(provider);
        }
        setShowProviderDropdown(false);
    }, [currentProvider, onProviderChange]);

    const handleExport = useCallback((format: ExportFormat) => {
        onExport(format);
        setShowExportDropdown(false);
    }, [onExport]);

    const handleProjectsConfirm = useCallback(() => {
        onProjectsChange(pendingProjectIds);
        setShowProjectPicker(false);
    }, [pendingProjectIds, onProjectsChange]);

    const handleDelete = useCallback(() => {
        onDelete();
        onClose();
    }, [onDelete, onClose]);

    const handleNewChat = useCallback(() => {
        onNewChat();
        onClose();
    }, [onNewChat, onClose]);

    // Close dropdowns when clicking outside
    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }, [onClose]);

    // Get models for current provider
    const availableModels = currentProvider === 'anthropic' ? models.anthropic : models.openai;

    // Get selected projects for display
    const selectedProjects = projects.filter(p => currentProjectIds.includes(p.id));

    if (!isOpen) return null;

    return (
        <div className="chat-settings-backdrop" onClick={handleBackdropClick}>
            <div className="chat-settings-modal">
                {/* Header */}
                <div className="chat-settings-header">
                    <h2>Chat Settings</h2>
                    <button 
                        className="chat-settings-close" 
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="chat-settings-content">
                    {/* Conversation Info Card */}
                    <div className="chat-settings-info-card">
                        {/* Title (editable) */}
                        <div className="chat-settings-title-row">
                            {isEditingTitle ? (
                                <div className="chat-settings-title-edit">
                                    <input
                                        type="text"
                                        value={titleInput}
                                        onChange={(e) => setTitleInput(e.target.value)}
                                        onKeyDown={handleTitleKeyDown}
                                        onBlur={handleSaveTitle}
                                        autoFocus
                                        className="chat-settings-title-input"
                                    />
                                    <button 
                                        className="chat-settings-title-save"
                                        onClick={handleSaveTitle}
                                    >
                                        <Check size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div className="chat-settings-title-display">
                                    <span className="chat-settings-title-text">
                                        {conversationTitle || 'New Conversation'}
                                    </span>
                                    {conversationId && (
                                        <button 
                                            className="chat-settings-title-edit-btn"
                                            onClick={() => setIsEditingTitle(true)}
                                            aria-label="Edit title"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Meta info */}
                        <div className="chat-settings-meta">
                            <div className="chat-settings-meta-item">
                                <MessageSquare size={14} />
                                <span>{messageCount} message{messageCount !== 1 ? 's' : ''}</span>
                            </div>
                            {createdAt && (
                                <div className="chat-settings-meta-item">
                                    <Calendar size={14} />
                                    <span>Created {formatDate(createdAt)}</span>
                                </div>
                            )}
                            <div className="chat-settings-meta-item">
                                <Cpu size={14} />
                                <span>{formatModelName(currentModel)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Model & Provider Section */}
                    <div className="chat-settings-section">
                        <h3 className="chat-settings-section-title">Model & Provider</h3>
                        
                        <div className="chat-settings-dropdowns">
                            {/* Model Dropdown */}
                            <div className="chat-settings-dropdown-wrapper">
                                <label>Model</label>
                                <div className="chat-settings-dropdown">
                                    <button 
                                        className="chat-settings-dropdown-trigger"
                                        onClick={() => setShowModelDropdown(!showModelDropdown)}
                                    >
                                        <span>{formatModelName(currentModel)}</span>
                                        <ChevronDown size={16} />
                                    </button>
                                    {showModelDropdown && (
                                        <div className="chat-settings-dropdown-menu">
                                            {availableModels.map((model) => (
                                                <button
                                                    key={model}
                                                    className={`chat-settings-dropdown-item ${model === currentModel ? 'active' : ''}`}
                                                    onClick={() => handleModelSelect(model)}
                                                >
                                                    {formatModelName(model)}
                                                    {model === currentModel && <Check size={14} />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Provider Dropdown */}
                            <div className="chat-settings-dropdown-wrapper">
                                <label>
                                    Provider 
                                    <span className="chat-settings-label-hint">(opens new chat)</span>
                                </label>
                                <div className="chat-settings-dropdown">
                                    <button 
                                        className="chat-settings-dropdown-trigger"
                                        onClick={() => setShowProviderDropdown(!showProviderDropdown)}
                                    >
                                        <span>{formatProviderName(currentProvider)}</span>
                                        <ChevronDown size={16} />
                                    </button>
                                    {showProviderDropdown && (
                                        <div className="chat-settings-dropdown-menu">
                                            <button
                                                className={`chat-settings-dropdown-item ${currentProvider === 'anthropic' ? 'active' : ''}`}
                                                onClick={() => handleProviderSelect('anthropic')}
                                            >
                                                Anthropic
                                                {currentProvider === 'anthropic' && <Check size={14} />}
                                            </button>
                                            <button
                                                className={`chat-settings-dropdown-item ${currentProvider === 'openai' ? 'active' : ''}`}
                                                onClick={() => handleProviderSelect('openai')}
                                            >
                                                OpenAI
                                                {currentProvider === 'openai' && <Check size={14} />}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Display Section */}
                    <div className="chat-settings-section">
                        <h3 className="chat-settings-section-title">Display</h3>
                        
                        <div className="chat-settings-toggle-row">
                            <div className="chat-settings-toggle-info">
                                <span className="chat-settings-toggle-label">Compact messages</span>
                                <span className="chat-settings-toggle-description">
                                    Tighter spacing between messages
                                </span>
                            </div>
                            <label className="chat-settings-toggle">
                                <input
                                    type="checkbox"
                                    checked={compactMode}
                                    onChange={(e) => onToggleCompact(e.target.checked)}
                                />
                                <span className="chat-settings-toggle-slider"></span>
                            </label>
                        </div>
                    </div>

                    {/* Organization Section */}
                    <div className="chat-settings-section">
                        <h3 className="chat-settings-section-title">Organization</h3>
                        
                        <div className="chat-settings-project-row">
                            <div className="chat-settings-project-label">
                                <span>Projects</span>
                                {selectedProjects.length > 0 && (
                                    <div className="chat-settings-project-tags">
                                        {selectedProjects.map((p) => (
                                            <span 
                                                key={p.id} 
                                                className="chat-settings-project-tag"
                                                style={{ 
                                                    backgroundColor: p.color || '#6366f1',
                                                }}
                                            >
                                                {p.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {selectedProjects.length === 0 && (
                                    <span className="chat-settings-project-none">None</span>
                                )}
                            </div>
                            <button 
                                className="chat-settings-btn-secondary"
                                onClick={() => setShowProjectPicker(!showProjectPicker)}
                                disabled={!conversationId}
                            >
                                {selectedProjects.length > 0 ? 'Change' : 'Add to project'}
                            </button>
                        </div>

                        {/* Project Picker (expandable) */}
                        {showProjectPicker && (
                            <div className="chat-settings-project-picker-container">
                                <ProjectPicker
                                    projects={projects}
                                    selectedProjectIds={pendingProjectIds}
                                    onChange={setPendingProjectIds}
                                    onCreateNew={onCreateProject}
                                />
                                <div className="chat-settings-project-picker-actions">
                                    <button 
                                        className="chat-settings-btn-ghost"
                                        onClick={() => {
                                            setPendingProjectIds(currentProjectIds);
                                            setShowProjectPicker(false);
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        className="chat-settings-btn-primary"
                                        onClick={handleProjectsConfirm}
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions Section */}
                    <div className="chat-settings-actions">
                        {/* Export */}
                        <div className="chat-settings-dropdown-wrapper">
                            <div className="chat-settings-dropdown">
                                <button 
                                    className="chat-settings-btn-secondary"
                                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                                    disabled={!conversationId || messageCount === 0}
                                >
                                    <Download size={16} />
                                    <span>Export</span>
                                    <ChevronDown size={14} />
                                </button>
                                {showExportDropdown && (
                                    <div className="chat-settings-dropdown-menu export-menu">
                                        <button
                                            className="chat-settings-dropdown-item"
                                            onClick={() => handleExport('markdown')}
                                        >
                                            Markdown (.md)
                                        </button>
                                        <button
                                            className="chat-settings-dropdown-item"
                                            onClick={() => handleExport('json')}
                                        >
                                            JSON (.json)
                                        </button>
                                        <button
                                            className="chat-settings-dropdown-item"
                                            onClick={() => handleExport('html')}
                                        >
                                            HTML (.html)
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* New Chat */}
                        <button 
                            className="chat-settings-btn-secondary"
                            onClick={handleNewChat}
                        >
                            <Plus size={16} />
                            <span>New Chat</span>
                        </button>

                        {/* Delete */}
                        <button 
                            className="chat-settings-btn-danger"
                            onClick={handleDelete}
                            disabled={!conversationId}
                        >
                            <Trash2 size={16} />
                            <span>Delete</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatSettingsModal;
