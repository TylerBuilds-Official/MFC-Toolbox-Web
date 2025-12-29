import type { Trigger, TriggerContext, TriggerResult, UserRole } from './types';
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


// Get triggers available to a specific user role

export function getAvailableTriggers(userRole?: UserRole, isDev?: boolean): Trigger[] {
    const devMode = isDev ?? import.meta.env.DEV;

    return triggers.filter(trigger => {
        // Filter out dev-only triggers in production
        if (trigger.devOnly && !devMode) {
            return false;
        }

        // Filter by required role
        if (trigger.requiredRole) {
            if (!userRole) return false;

            // Role hierarchy: admin > user > pending
            const roleHierarchy: Record<UserRole, number> = {
                'pending': 0,
                'user': 1,
                'admin': 2
            };

            const userLevel = roleHierarchy[userRole] ?? 0;
            const requiredLevel = roleHierarchy[trigger.requiredRole] ?? 0;

            if (userLevel < requiredLevel) {
                return false;
            }
        }

        return true;
    });
}


// Execute a trigger if message matches

export async function executeTrigger(
    message: string,
    ctx: Omit<TriggerContext, 'args' | 'getAllTriggers'>
): Promise<TriggerResult | null> {

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

    // Handle both sync and async triggers
    return await trigger.execute(fullContext);
}


// Export types
export type { Trigger, TriggerContext, TriggerResult, TriggerParameter, UserRole } from './types';
