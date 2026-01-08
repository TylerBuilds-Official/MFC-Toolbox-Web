import { useCallback, useState, useRef, useEffect } from "react";
import { useApi } from "../../auth";
import type { UseChatMessagesReturn } from "./useChatMessages";
import type { UseChatModelReturn } from "./useChatModel";
import type { MessageStatus } from "../../types/chat";


type ShowToastFn = (message: string, variant?: 'success' | 'error' | 'warning' | 'info', options?: { duration?: number; action?: { label: string; onClick: () => void } }) => void;

type SendMessageFn = (
    content: string,
    existingId?: number,
    simulateFailure?: boolean,
    skipUserMessage?: boolean
) => Promise<void>;


export function useStreamingChat(
    api: ReturnType<typeof useApi>,
    chatMessages: UseChatMessagesReturn,
    chatModel: UseChatModelReturn,
    showToast: ShowToastFn,
    onConversationCreated: (id: number) => void,
    projectId?: number | null
) {
    // State
    const [isStreaming, setIsStreaming]             = useState(false);
    const [isTyping, setIsTyping]                   = useState(false);
    const [streamingMessageId, setStreamingMessageId] = useState<number | null>(null);
    const [streamingContent, setStreamingContent]   = useState("");
    const [thinkingContent, setThinkingContent]     = useState("");
    const [isThinkingActive, setIsThinkingActive]   = useState(false);
    const [isRegenerating, setIsRegenerating]       = useState(false);

    // Refs
    const thinkingContentRef  = useRef("");
    const streamingContentRef = useRef("");
    const abortControllerRef  = useRef<AbortController | null>(null);
    const sendMessageRef      = useRef<SendMessageFn>(null!);


    const resetStreamingState = useCallback(() => {
        setIsTyping(false);
        setIsStreaming(false);
        setStreamingMessageId(null);
        setStreamingContent("");
        setThinkingContent("");
        setIsThinkingActive(false);
        thinkingContentRef.current  = "";
        streamingContentRef.current = "";
        abortControllerRef.current  = null;
    }, []);


    const sendMessage = useCallback(async (
        messageContent: string,
        existingMessageId?: number,
        simulateFailure?: boolean,
        skipUserMessage?: boolean
    ) => {
        const timestamp          = Date.now();
        const userMessageId      = existingMessageId || timestamp;
        const assistantMessageId = timestamp + 1;

        // Add user message if needed
        if (existingMessageId) {
            chatMessages.updateMessageStatus(existingMessageId, 'sending', undefined);
        } else if (!skipUserMessage) {
            chatMessages.addUserMessage(messageContent, userMessageId);
        }

        // Add assistant message placeholder
        chatMessages.addAssistantMessage(assistantMessageId);

        // Set streaming state
        setIsTyping(true);
        setIsStreaming(true);
        setStreamingMessageId(assistantMessageId);
        setStreamingContent("");
        setThinkingContent("");
        setIsThinkingActive(false);
        thinkingContentRef.current  = "";
        streamingContentRef.current = "";

        // Handle simulated failure
        if (simulateFailure) {
            chatMessages.removeMessage(assistantMessageId);
            chatMessages.updateMessageStatus(userMessageId, 'failed', 'Simulated failure triggered by /fail');
            resetStreamingState();
            return;
        }

        try {
            const abortController = await api.streamChat(
                messageContent,
                chatModel.selectedModel,
                chatModel.currentProvider,
                chatMessages.conversationId,
                {
                    onMeta: (newConversationId) => {
                        if (newConversationId !== chatMessages.conversationId) {
                            chatMessages.setConversationId(newConversationId);
                            onConversationCreated(newConversationId);
                        }
                    },
                    onThinkingStart: () => {
                        setIsThinkingActive(true);
                    },
                    onThinking: (text) => {
                        thinkingContentRef.current += text;
                        setThinkingContent(thinkingContentRef.current);
                    },
                    onThinkingEnd: () => {
                        setIsThinkingActive(false);
                    },
                    onContent: (text) => {
                        streamingContentRef.current += text;
                        setStreamingContent(streamingContentRef.current);
                        chatMessages.updateMessageContent(
                            assistantMessageId,
                            streamingContentRef.current,
                            thinkingContentRef.current
                        );
                    },
                    onToolStart: (name) => {
                        console.log(`[useStreamingChat] Tool started: ${name}`);
                    },
                    onToolEnd: (name, result) => {
                        console.log(`[useStreamingChat] Tool ended: ${name}`, result);
                    },
                    onStreamEnd: (finalConversationId, _title) => {
                        const finalContent  = streamingContentRef.current;
                        const finalThinking = thinkingContentRef.current;

                        if (!skipUserMessage) {
                            chatMessages.updateMessageStatus(userMessageId, 'sent');
                        }

                        chatMessages.finalizeMessage(
                            assistantMessageId,
                            finalContent,
                            finalThinking,
                            'sent'
                        );

                        if (finalConversationId !== chatMessages.conversationId) {
                            chatMessages.setConversationId(finalConversationId);
                            onConversationCreated(finalConversationId);
                        }

                        resetStreamingState();
                    },
                    onError: (errorMessage) => {
                        console.error("[useStreamingChat] Stream error:", errorMessage);

                        chatMessages.removeMessage(assistantMessageId);

                        if (!skipUserMessage) {
                            chatMessages.updateMessageStatus(userMessageId, 'failed', errorMessage);

                            showToast('Failed to send message', 'error', {
                                duration: 6000,
                                action: {
                                    label: 'Retry',
                                    onClick: () => {
                                        chatMessages.removeMessage(userMessageId);
                                        sendMessageRef.current(messageContent);
                                    }
                                }
                            });
                        } else {
                            showToast('Failed to regenerate response', 'error');
                        }

                        resetStreamingState();
                    }
                },
                projectId
            );

            abortControllerRef.current = abortController;

        } catch (error) {
            console.error("[useStreamingChat] Failed to start stream:", error);

            chatMessages.removeMessage(assistantMessageId);

            if (!skipUserMessage) {
                chatMessages.updateMessageStatus(userMessageId, 'failed', 'Failed to connect');
            } else {
                showToast('Failed to regenerate response', 'error');
            }

            resetStreamingState();
        }
    }, [
        api,
        chatModel.selectedModel,
        chatModel.currentProvider,
        chatMessages,
        onConversationCreated,
        showToast,
        resetStreamingState,
        projectId
    ]);


    // Keep sendMessageRef in sync
    useEffect(() => {
        sendMessageRef.current = sendMessage;
    }, [sendMessage]);


    const stopGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        const finalContent  = streamingContentRef.current;
        const finalThinking = thinkingContentRef.current;

        if (streamingMessageId) {
            chatMessages.finalizeMessage(
                streamingMessageId,
                finalContent || "_Generation cancelled by user._",
                finalThinking,
                'sent' as MessageStatus
            );
        }

        setIsStreaming(false);
        setIsTyping(false);
        setIsRegenerating(false);
        setStreamingMessageId(null);
        setStreamingContent("");
        setThinkingContent("");
        setIsThinkingActive(false);
        thinkingContentRef.current  = "";
        streamingContentRef.current = "";
    }, [streamingMessageId, chatMessages]);


    const retryMessage = useCallback((messageId: number, content: string) => {
        chatMessages.removeMessage(messageId);
        sendMessageRef.current(content);
    }, [chatMessages]);


    const regenerateResponse = useCallback(async (messageIndex: number) => {
        const previousUserMessage = chatMessages.displayMessages
            .slice(0, messageIndex)
            .reverse()
            .find(msg => msg.role === "user");

        if (!previousUserMessage) {
            console.error("[useStreamingChat] Failed to find previous user message for regeneration");
            return;
        }

        setIsRegenerating(true);
        chatMessages.truncateToIndex(messageIndex);

        await sendMessageRef.current(previousUserMessage.content, undefined, false, true);

        setIsRegenerating(false);
    }, [chatMessages]);


    return {
        // State
        isStreaming,
        isTyping,
        isRegenerating,
        streamingMessageId,
        streamingContent,
        thinkingContent,
        isThinkingActive,

        // Actions
        sendMessage,
        stopGeneration,
        retryMessage,
        regenerateResponse,
        sendMessageRef,
    };
}

export type UseStreamingChatReturn = ReturnType<typeof useStreamingChat>;
