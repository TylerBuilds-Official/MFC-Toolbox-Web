import type { DisplayMessage } from "../../types/chat";

// ============================================================================
// Greeting System
// ============================================================================

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'lateNight';
type DayContext = 'monday' | 'friday' | 'weekend' | 'weekday';

interface GreetingContext {
    userName?: string;
    timeOfDay: TimeOfDay;
    dayContext: DayContext;
}

// Greeting templates with placeholders
// {name} = user's first name, {timeGreeting} = Good morning/afternoon/etc
const GREETING_TEMPLATES: string[] = [
    // Casual & friendly
    "Hey {name}! What are we working on today?",
    "What's up {name}? Ready when you are.",
    "{timeGreeting} {name}! What can I help you with?",
    "Hey {name}, good to see you. What's on the agenda?",
    
    // Atlas intros
    "Atlas here! What can I do for you, {name}?",
    "{timeGreeting} {name}! Atlas here—how can I help?",
    "Hey {name}, Atlas at your service. What do you need?",
    
    // Simple & direct
    "{timeGreeting} {name}! What do you need?",
    "Hey {name}! How can I help today?",
    "Alright {name}, what are we getting into?",
];

// Special greetings for specific contexts
const MONDAY_GREETINGS: string[] = [
    "Happy Monday {name}! Let's start the week off right.",
    "Monday's here, {name}. What are we tackling first?",
    "{timeGreeting} {name}! New week—what's on deck?",
];

const FRIDAY_GREETINGS: string[] = [
    "Happy Friday {name}! What can I help with?",
    "Friday, {name}—let's finish strong. What do you need?",
    "{timeGreeting} {name}! End of the week—how can I help?",
];

const LATE_NIGHT_GREETINGS: string[] = [
    "Burning the midnight oil, {name}? How can I help?",
    "Late night? I'm here if you need me, {name}.",
    "Hey {name}, working late I see. What can I do?",
];

const WEEKEND_GREETINGS: string[] = [
    "Weekend mode, {name}? What can I help with?",
    "Hey {name}! What are we getting into today?",
];

// Fallback when no user name is available
const ANONYMOUS_GREETINGS: string[] = [
    "Hey there! I'm Atlas. What can I help you with today?",
    "Welcome! I'm Atlas—here to help. What do you need?",
    "Atlas here! What can I do for you?",
];


function getTimeOfDay(): TimeOfDay {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'lateNight';
}

function getTimeGreeting(timeOfDay: TimeOfDay): string {
    switch (timeOfDay) {
        case 'morning': return 'Good morning';
        case 'afternoon': return 'Good afternoon';
        case 'evening': return 'Good evening';
        case 'lateNight': return 'Hey there';
    }
}

function getDayContext(): DayContext {
    const day = new Date().getDay();
    if (day === 0 || day === 6) return 'weekend';
    if (day === 1) return 'monday';
    if (day === 5) return 'friday';
    return 'weekday';
}

function getFirstName(displayName: string): string {
    return displayName.split(' ')[0];
}

function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function selectGreetingTemplate(context: GreetingContext): string {
    const { timeOfDay, dayContext } = context;
    
    // Late night takes priority - they're dedicated!
    if (timeOfDay === 'lateNight') {
        // 50% chance for late night specific greeting
        if (Math.random() < 0.5) {
            return pickRandom(LATE_NIGHT_GREETINGS);
        }
    }
    
    // Day-specific greetings (30% chance)
    if (Math.random() < 0.3) {
        if (dayContext === 'monday') return pickRandom(MONDAY_GREETINGS);
        if (dayContext === 'friday') return pickRandom(FRIDAY_GREETINGS);
        if (dayContext === 'weekend') return pickRandom(WEEKEND_GREETINGS);
    }
    
    // Default to general greetings
    return pickRandom(GREETING_TEMPLATES);
}

function formatGreeting(template: string, context: GreetingContext): string {
    const firstName = context.userName ? getFirstName(context.userName) : '';
    const timeGreeting = getTimeGreeting(context.timeOfDay);
    
    return template
        .replace(/{name}/g, firstName)
        .replace(/{timeGreeting}/g, timeGreeting)
        .trim();
}


/**
 * Creates a context-aware welcome message for the user.
 * Takes into account: user name, time of day, day of week.
 */
export function createWelcomeMessage(userName?: string): DisplayMessage {
    const context: GreetingContext = {
        userName,
        timeOfDay: getTimeOfDay(),
        dayContext: getDayContext(),
    };
    
    let content: string;
    
    if (userName) {
        const template = selectGreetingTemplate(context);
        content = formatGreeting(template, context);
    } else {
        content = pickRandom(ANONYMOUS_GREETINGS);
    }
    
    return {
        id: Date.now(),
        role: 'assistant',
        content,
        timestamp: new Date().toISOString(),
        status: 'sent'
    };
}


// ============================================================================
// Legacy Export (for compatibility during transition)
// ============================================================================

export const WELCOME_MESSAGE: DisplayMessage = {
    id: Date.now(),
    role: 'assistant',
    content: 'Welcome to FabCore AI! I\'m Atlas, your assistant for fabrication workflows, document processing, and more. What can I help you with today?',
    timestamp: new Date().toISOString(),
    status: 'sent'
};


// ============================================================================
// Error Messages
// ============================================================================

export const DEFAULT_ERROR_MESSAGE: DisplayMessage = {
    id: Date.now(),
    role: 'assistant',
    content: 'An error occurred while processing your request. Please try again later.',
    timestamp: new Date().toISOString(),
    status: 'failed'
};
