import type { Trigger, TriggerContext, TriggerResult } from './types';
import { failTrigger } from './fail';
import { clearTrigger } from './clear';
import { helpTrigger } from './help';


// Trigger Registry

const triggers: Trigger[] = [
    failTrigger,
    clearTrigger,
    helpTrigger,
];


// Get all registered triggers

export function getAllTriggers(): Trigger[] {
    return triggers;
}


// Execute a trigger if message matches

export function executeTrigger(
    message: string,
    ctx: Omit<TriggerContext, 'args' | 'getAllTriggers'>
): TriggerResult | null {

    if (!message.startsWith('/')) {
        return null;
    }

    const trimmed = message.slice(1).trim();
    const [command, ...args] = trimmed.split(/\s+/);

    if (!command) {
        return null;
    }

    const trigger = triggers.find(t => t.command.toLowerCase() === command.toLowerCase());

    if (!trigger) {
        return null;
    }

    // Check dev-only restriction
    if (trigger.devOnly && !import.meta.env.DEV) {
        return null;
    }

    const fullContext: TriggerContext = {
        ...ctx,
        args,
        getAllTriggers
    };

    return trigger.execute(fullContext);
}


// Export types
export type { Trigger, TriggerContext, TriggerResult } from './types';
