import type { Trigger, TriggerResult } from './types';


export const helpTrigger: Trigger = {
    command: 'help',
    description: 'List all available commands',
    devOnly: false,

    execute: (ctx): TriggerResult => {
        const triggers = ctx.getAllTriggers();
        const isDev = import.meta.env.DEV;

        const availableTriggers = triggers.filter(t => !t.devOnly || isDev);

        const commandList = availableTriggers
            .map(t => `• /${t.command} - ${t.description}${t.devOnly ? ' (dev)' : ''}`)
            .join('\n');

        const response = `**Available Commands**\n\n${commandList}`;

        return {
            handled: true,
            preventDefault: true,
            response
        };
    }
};
