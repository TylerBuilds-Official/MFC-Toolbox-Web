import type { Trigger, TriggerResult } from './types';


export const clearTrigger: Trigger = {
    command: 'clear',
    description: 'Clear the current chat history',
    devOnly: false,

    execute: (ctx): TriggerResult => {
        ctx.clearMessages();
        ctx.showToast('Chat cleared', 'success');

        return {
            handled: true,
            preventDefault: true
        };
    }
};
