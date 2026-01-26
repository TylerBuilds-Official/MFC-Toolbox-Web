import React, { useEffect, useRef, useCallback, useMemo, useState } from "react";
import "../../styles/chatWindow.css";
import "../../styles/chatSettingsModal.css";

import { useAuth, useApi } from "../../auth";
import { useToast } from "../Toast";
import { useConfirm } from "../ConfirmDialog";
import { executeTrigger } from "../../triggers";
import type { Trigger } from "../../triggers";
import type { DisplayMessage, ChatWindowProps, ConversationProject } from "../../types";
import { exportChat } from "../../utils/exportChat";
import type { ExportFormat } from "../../utils/exportChat";
import { publicApi } from "../../services/api";

// Hooks
import {
    useChatMessages,
    useChatInput,
    useMessageEditor,
    useStreamingChat,
} from "../../hooks";

// Components
import ChatToolbar from "./ChatToolbar";
import type { ChatToolbarRef } from "./ChatToolbar";
import ChatMessageList from "./ChatMessageList";
import ChatInputArea from "./ChatInputArea";
import ChatSettingsModal from "./ChatSettingsModal";
import ScrollToBottom from "./ScrollToBottom";
import LoadingSpinner from "../loadingSpinner";
import { createWelcomeMessage } from "./constants";


// ============================================================================
// Constants
// ============================================================================

const COMPACT_MODE_KEY = 'fabcore_compact_mode';


// ============================================================================
// Component
// ============================================================================

const ChatWindow: React.FC<ChatWindowProps> = ({
    externalPrompt,
    onPromptConsumed,
    activeConversationId,
    activeProjectId,
    initialMessages,
    onConversationCreated,

    // Model state (lifted to parent)
    selectedModel,
    currentProvider,
    onModelChange,
    isModelReady,

    // Pagination state
    hasMoreMessages = false,
    isLoadingMoreMessages = false,
    onLoadMoreMessages,

    // Conversation management callbacks
    onDeleteConversation,
    onRenameConversation,
    onMoveToProjects,
    conversationTitle = 'New Conversation',
    conversationCreatedAt,

    // Toolbar actions
    onNewProject,

    // Scroll state
    isInitialScrolling,

}) => {
    const { user }      = useAuth();
    const api           = useApi();
    const { showToast } = useToast();
    const { confirm }   = useConfirm();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const toolbarRef = useRef<ChatToolbarRef>(null);


    // ========================================================================
    // Settings Modal State
    // ========================================================================

    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [compactMode, setCompactMode] = useState(() => {
        const stored = localStorage.getItem(COMPACT_MODE_KEY);
        return stored === 'true';
    });
    const [models, setModels] = useState<{ openai: string[]; anthropic: string[] }>({
        openai: [],
        anthropic: [],
    });
    const [projects, setProjects] = useState<ConversationProject[]>([]);
    const [currentProjectIds, setCurrentProjectIds] = useState<number[]>([]);


    // ========================================================================
    // Initialize Hooks
    // ========================================================================

    const chatMessages = useChatMessages(initialMessages, activeConversationId, onConversationCreated, user?.display_name);
    const chatInput    = useChatInput();
    const editor       = useMessageEditor();

    // Create a model-like object for useStreamingChat compatibility
    const chatModel = useMemo(() => ({
        selectedModel,
        currentProvider,
        handleModelChange: onModelChange,
        isReady: isModelReady,
    }), [selectedModel, currentProvider, onModelChange, isModelReady]);

    const streaming = useStreamingChat(
        api,
        chatMessages,
        chatModel,
        showToast,
        onConversationCreated,
        activeProjectId
    );


    // ========================================================================
    // Refs for stable callbacks
    // ========================================================================

    const chatInputRef    = useRef(chatInput);
    const chatMessagesRef = useRef(chatMessages);
    const streamingRef    = useRef(streaming);
    const editorRef       = useRef(editor);
    const selectedModelRef = useRef(selectedModel);

    // Keep refs in sync
    useEffect(() => {
        chatInputRef.current    = chatInput;
        chatMessagesRef.current = chatMessages;
        streamingRef.current    = streaming;
        editorRef.current       = editor;
        selectedModelRef.current = selectedModel;
    });


    // ========================================================================
    // Effects
    // ========================================================================

    // Handle external prompt
    useEffect(() => {
        if (externalPrompt && !streaming.isTyping) {
            streaming.sendMessage(externalPrompt);
            onPromptConsumed?.();
        }
    }, [externalPrompt, streaming.isTyping, streaming.sendMessage, onPromptConsumed]);

    // Load models on mount
    useEffect(() => {
        publicApi.getModels()
            .then((response) => {
                setModels({
                    openai: response.models.openai_models,
                    anthropic: response.models.claude_models,
                });
            })
            .catch((err) => {
                console.error('[ChatWindow] Failed to load models:', err);
            });
    }, []);

    // Load projects when settings modal opens
    useEffect(() => {
        if (showSettingsModal) {
            api.get<{ projects: ConversationProject[] }>('/conversations/projects')
                .then((response) => {
                    setProjects(response.projects);
                })
                .catch((err) => {
                    console.error('[ChatWindow] Failed to load projects:', err);
                });

            // Load current conversation's projects
            if (activeConversationId) {
                api.get<{ projects: { id: number }[] }>(`/conversations/${activeConversationId}/projects`)
                    .then((response) => {
                        setCurrentProjectIds(response.projects.map(p => p.id));
                    })
                    .catch((err) => {
                        console.error('[ChatWindow] Failed to load conversation projects:', err);
                    });
            } else {
                setCurrentProjectIds([]);
            }
        }
    }, [showSettingsModal, activeConversationId, api]);

    // Persist compact mode
    useEffect(() => {
        localStorage.setItem(COMPACT_MODE_KEY, String(compactMode));
    }, [compactMode]);


    // ========================================================================
    // Settings Modal Handlers
    // ========================================================================

    const handleOpenSettings = useCallback(() => {
        setShowSettingsModal(true);
    }, []);

    const handleCloseSettings = useCallback(() => {
        setShowSettingsModal(false);
    }, []);

    const handleRename = useCallback((newTitle: string) => {
        if (onRenameConversation && activeConversationId) {
            onRenameConversation(activeConversationId, newTitle);
            showToast('Conversation renamed', 'success');
        }
    }, [onRenameConversation, activeConversationId, showToast]);

    const handleDelete = useCallback(async () => {
        if (!activeConversationId) return;

        const confirmed = await confirm({
            title: 'Delete Conversation',
            message: 'Are you sure you want to delete this conversation? This cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            variant: 'danger'
        });

        if (confirmed && onDeleteConversation) {
            onDeleteConversation(activeConversationId);
            setShowSettingsModal(false);
            showToast('Conversation deleted', 'success');
        }
    }, [activeConversationId, confirm, onDeleteConversation, showToast]);

    const handleExport = useCallback((format: ExportFormat) => {
        exportChat({
            messages: chatMessages.displayMessages,
            title: conversationTitle,
            format,
            createdAt: conversationCreatedAt,
        });
        showToast(`Exported as ${format.toUpperCase()}`, 'success');
    }, [chatMessages.displayMessages, conversationTitle, conversationCreatedAt, showToast]);

    const handleModelChangeFromSettings = useCallback((model: string) => {
        onModelChange(model);
        showToast(`Switched to ${model}`, 'success');
    }, [onModelChange, showToast]);

    const handleProviderChange = useCallback((provider: string) => {
        // Provider change starts a new chat
        // First, update the provider preference via API (provider is a query param)
        api.post(`/settings/provider?provider=${provider}`)
            .then(() => {
                // Get the first model for the new provider
                const newModels = provider === 'anthropic' ? models.anthropic : models.openai;
                const defaultModel = newModels[0] || selectedModel;
                
                // Create new chat and switch model
                chatMessagesRef.current.setConversationId(null);
                chatMessagesRef.current.setDisplayMessages([createWelcomeMessage(user?.display_name)]);
                onConversationCreated(-1);
                onModelChange(defaultModel);
                
                setShowSettingsModal(false);
                showToast(`Switched to ${provider}`, 'success');
            })
            .catch((err) => {
                console.error('[ChatWindow] Failed to update provider:', err);
                showToast('Failed to switch provider', 'error');
            });
    }, [api, models, selectedModel, user?.display_name, onConversationCreated, onModelChange, showToast]);

    const handleProjectsChange = useCallback(async (projectIds: number[]) => {
        if (!activeConversationId || !onMoveToProjects) return;

        try {
            await onMoveToProjects(activeConversationId, projectIds);
            setCurrentProjectIds(projectIds);
            setShowSettingsModal(false);
            showToast('Projects updated', 'success');
        } catch (err) {
            console.error('[ChatWindow] Failed to update projects:', err);
            showToast('Failed to update projects', 'error');
        }
    }, [activeConversationId, onMoveToProjects, showToast]);

    const handleToggleCompact = useCallback((compact: boolean) => {
        setCompactMode(compact);
    }, []);


    // ========================================================================
    // Stable Event Handlers (using refs)
    // ========================================================================

    const handleNewChat = useCallback(() => {
        chatMessagesRef.current.setConversationId(null);
        chatMessagesRef.current.setDisplayMessages([createWelcomeMessage(user?.display_name)]);
        onConversationCreated(-1);
        setShowSettingsModal(false);
    }, [onConversationCreated, user?.display_name]);


    const handleSaveEdit = useCallback(async (messageIndex: number) => {
        const content = editorRef.current.finishEditing();
        if (!content) return;

        const editedMessage = chatMessagesRef.current.displayMessages[messageIndex];
        if (!editedMessage || editedMessage.role !== "user") return;

        chatMessagesRef.current.truncateToIndex(messageIndex);
        await streamingRef.current.sendMessage(content);
    }, []);


    const handleCommandSelect = useCallback(async (trigger: Trigger, params?: Record<string, string>) => {
        chatInputRef.current.closeCommandMenu();
        chatInputRef.current.clearInput();

        const commandMessage = `/${trigger.command}`;

        const triggerResult = await executeTrigger(commandMessage, {
            message:        commandMessage,
            conversationId: chatMessagesRef.current.conversationId,
            showToast,
            clearMessages:  chatMessagesRef.current.clearMessages,
            params
        });

        if (triggerResult) {
            if (triggerResult.response) {
                const responseMessage: DisplayMessage = {
                    id:        Date.now(),
                    role:      "assistant",
                    content:   triggerResult.response,
                    timestamp: new Date().toISOString(),
                    status:    'sent'
                };
                chatMessagesRef.current.setDisplayMessages(prev => [...prev, responseMessage]);
            }

            if (triggerResult.simulateFailure) {
                streamingRef.current.sendMessage(commandMessage, undefined, true);
            }
        }
    }, [showToast]);


    const handleSendMessage = useCallback(async () => {
        const input = chatInputRef.current.input;
        if (!input.trim() || !selectedModelRef.current) return;

        const messageContent = input.trim();
        chatInputRef.current.clearInput();

        // Check for trigger commands
        const triggerResult = await executeTrigger(messageContent, {
            message:        messageContent,
            conversationId: chatMessagesRef.current.conversationId,
            showToast,
            clearMessages:  chatMessagesRef.current.clearMessages
        });

        if (triggerResult) {
            if (triggerResult.response) {
                const responseMessage: DisplayMessage = {
                    id:        Date.now(),
                    role:      "assistant",
                    content:   triggerResult.response,
                    timestamp: new Date().toISOString(),
                    status:    'sent'
                };
                chatMessagesRef.current.setDisplayMessages(prev => [...prev, responseMessage]);
            }

            if (triggerResult.preventDefault) {
                return;
            }

            if (triggerResult.simulateFailure) {
                await streamingRef.current.sendMessage(messageContent, undefined, true);
                return;
            }
        }

        await streamingRef.current.sendMessage(messageContent);
    }, [showToast]);


    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        // Let command menu handle its own keys
        if (chatInputRef.current.showCommandMenu && ['ArrowUp', 'ArrowDown', 'Enter', 'Tab'].includes(e.key)) {
            return;
        }

        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }

        if (e.key === "Escape" && chatInputRef.current.showCommandMenu) {
            chatInputRef.current.closeCommandMenu();
        }
    }, [handleSendMessage]);


    // Stable wrappers for ChatMessageList callbacks
    const handleRetry = useCallback((id: number, content: string) => {
        streamingRef.current.retryMessage(id, content);
    }, []);

    const handleStartEdit = useCallback((id: number, content: string) => {
        editorRef.current.startEditing(id, content);
    }, []);

    const handleCancelEdit = useCallback(() => {
        editorRef.current.cancelEditing();
    }, []);

    const handleEditChange = useCallback((content: string) => {
        editorRef.current.updateEditContent(content);
    }, []);

    const handleRegenerate = useCallback((index: number) => {
        streamingRef.current.regenerateResponse(index);
    }, []);

    const handleStop = useCallback(() => {
        streamingRef.current.stopGeneration();
    }, []);

    // Hide toolbar when clicking in chat area (if scrolled down)
    const handleChatAreaClick = useCallback(() => {
        toolbarRef.current?.hideIfScrolled();
    }, []);


    // ========================================================================
    // Computed Values
    // ========================================================================

    // Message count excluding welcome message
    const messageCount = useMemo(() => {
        return chatMessages.displayMessages.filter(m => 
            !(m.role === 'assistant' && chatMessages.displayMessages.indexOf(m) === 0 && !activeConversationId)
        ).length;
    }, [chatMessages.displayMessages, activeConversationId]);


    // ========================================================================
    // Render
    // ========================================================================

    if (!isModelReady) {
        return (
            <div className="chat-window-container">
                <div className="chat-window">
                    <LoadingSpinner size="small" message="Loading conversations.." variant="minimal" />
                </div>
            </div>
        );
    }

    return (
        <div className="chat-window-container">
            <div className="chat-window" onClick={handleChatAreaClick}>
                <ChatToolbar
                    ref={toolbarRef}
                    isStreaming={streaming.isStreaming}
                    onNewChat={handleNewChat}
                    onNewProject={onNewProject || (() => {})}
                    onOpenSettings={handleOpenSettings}
                    isInitialScrolling={isInitialScrolling}
                />

                <ChatMessageList
                    messages={chatMessages.displayMessages}
                    messagesEndRef={messagesEndRef}
                    streamingMessageId={streaming.streamingMessageId}
                    thinkingContent={streaming.thinkingContent}
                    isThinkingActive={streaming.isThinkingActive}
                    streamingContentBlocks={streaming.contentBlocks}
                    editingMessageId={editor.editingMessageId}
                    editedContent={editor.editedContent}
                    isRegenerating={streaming.isRegenerating}
                    onRetry={handleRetry}
                    onStartEdit={handleStartEdit}
                    onCancelEdit={handleCancelEdit}
                    onSaveEdit={handleSaveEdit}
                    onEditChange={handleEditChange}
                    onRegenerate={handleRegenerate}
                    // Pagination
                    hasMore={hasMoreMessages}
                    isLoadingMore={isLoadingMoreMessages}
                    onLoadMore={onLoadMoreMessages}
                    // Display settings
                    compactMode={compactMode}
                />

                <ChatInputArea
                    input={chatInput.input}
                    selectedModel={selectedModel}
                    currentProvider={currentProvider}
                    isTyping={streaming.isTyping}
                    isStreaming={streaming.isStreaming}
                    showCommandMenu={chatInput.showCommandMenu}
                    commandSearch={chatInput.commandSearch}
                    textareaRef={chatInput.textareaRef}
                    onInputChange={chatInput.handleInputChange}
                    onKeyDown={handleKeyDown}
                    onSend={handleSendMessage}
                    onStop={handleStop}
                    onModelChange={onModelChange}
                    onCommandSelect={handleCommandSelect}
                    onCloseCommandMenu={chatInput.closeCommandMenu}
                />

                {/* Scroll to bottom button */}
                <ScrollToBottom isStreaming={streaming.isStreaming} />

                {/* Settings Modal */}
                <ChatSettingsModal
                    isOpen={showSettingsModal}
                    onClose={handleCloseSettings}
                    conversationId={activeConversationId}
                    conversationTitle={conversationTitle}
                    messageCount={messageCount}
                    createdAt={conversationCreatedAt || null}
                    currentModel={selectedModel}
                    currentProvider={currentProvider}
                    models={models}
                    projects={projects}
                    currentProjectIds={currentProjectIds}
                    compactMode={compactMode}
                    onRename={handleRename}
                    onDelete={handleDelete}
                    onNewChat={handleNewChat}
                    onExport={handleExport}
                    onModelChange={handleModelChangeFromSettings}
                    onProviderChange={handleProviderChange}
                    onProjectsChange={handleProjectsChange}
                    onToggleCompact={handleToggleCompact}
                />
            </div>
        </div>
    );
};

export default ChatWindow;
