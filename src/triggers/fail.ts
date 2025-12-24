import type { Trigger, TriggerResult } from './types';


export const failTrigger: Trigger = {
    command: 'fail',
    description: 'Simulate a message send failure',
    devOnly: false,

    execute: (): TriggerResult => {
        // Return a special result that signals sendMessageInternal to simulate failure
        return {
            handled: true,
            preventDefault: false,  // Let it go to sendMessageInternal
            simulateFailure: true   // Custom flag to trigger failure
        } as TriggerResult & { simulateFailure: boolean };
    }
};
