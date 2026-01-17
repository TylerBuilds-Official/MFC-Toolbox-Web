import type { DisplayMessage } from "../../types/chat";

export const WELCOME_MESSAGE: DisplayMessage = {
    id: Date.now(),
    role: 'assistant',
    // TODO ADD RANDOM USER AWARE WELCOME MESSAGING
    content: 'Welcome to FabCore AI! I\'m Atlas, your assistant for fabrication workflows, document processing, and more. What can I help you with today?',
    timestamp: new Date().toISOString(),
    status: 'sent'
};

export const DEFAULT_ERROR_MESSAGE: DisplayMessage = {
    id: Date.now(),
    role: 'assistant',
    content: 'An error occurred while processing your request. Please try again later.',
    timestamp: new Date().toISOString(),
    status: 'failed'
};
