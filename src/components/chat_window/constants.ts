import type { DisplayMessage } from "../../types/chat";

export const WELCOME_MESSAGE: DisplayMessage = {
    id: Date.now(),
    role: 'assistant',
    // TODO ADD RANDOM USER AWARE WELCOME MESSAGING
    content: 'Welcome to the MFC Toolbox! I\'m here to help with fabrication workflows, document processing, and more. What can I assist you with today?',
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
