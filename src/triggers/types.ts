// Trigger Types

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';


export interface TriggerContext {
    message: string;
    args: string[];
    conversationId: number | null;
    showToast: (message: string, variant?: ToastVariant, options?: unknown) => void;
    clearMessages: () => void;
    getAllTriggers: () => Trigger[];
}


export interface TriggerResult {
    handled: boolean;
    preventDefault?: boolean;
    response?: string;
    simulateFailure?: boolean;
}


export interface Trigger {
    command: string;
    description: string;
    devOnly?: boolean;
    execute: (ctx: TriggerContext) => Promise<TriggerResult> | TriggerResult;
}
