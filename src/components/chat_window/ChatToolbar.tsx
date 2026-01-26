import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { FolderPlus } from 'lucide-react';
import { NewChatIcon, SettingsIcon } from '../../assets/svg/chat_window';
import '../../styles/chatToolbar.css';

// Fun phrases for when the status is clicked
const STATUS_PHRASES = [
    "Hey!",
    "Ouch!",
    "That tickles!",
    "Boop!",
    "You poked me!",
    "I'm awake!",
    "Still here!",
    "At your service",
    "You rang?",
    "*yawns* Oh, hi!",
    "Hello there!",
    "👋",
    "Poke!",
    "Yes?",
    "Reporting for duty",
    "All systems go!",
];

// Scroll behavior constants
const SCROLL_THRESHOLD = 20; // Start hiding after scrolling this far from top
const SCROLL_DELTA_THRESHOLD = 5; // Minimum scroll delta to register direction change
const TRIGGER_ZONE_HEIGHT = 50; // Height of invisible trigger zone when hidden

interface ChatToolbarProps {
    onNewChat: () => void;
    onNewProject: () => void;
    onOpenSettings: () => void;
    isStreaming?: boolean;
    isInitialScrolling?: boolean; // True while programmatic scroll-to-bottom is happening
}

const ChatToolbar: React.FC<ChatToolbarProps> = ({ 
    onNewChat,
    onNewProject,
    onOpenSettings,
    isStreaming = false,
    isInitialScrolling = false
}) => {
    // Easter egg state
    const [statusPhrase, setStatusPhrase] = useState<string | null>(null);
    const [isPulsing, setIsPulsing] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [animKey, setAnimKey] = useState(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastPhraseIndexRef = useRef<number>(-1);

    // Scroll hide/show state
    const [isHidden, setIsHidden] = useState(false);
    const [isHoveredWhileHidden, setIsHoveredWhileHidden] = useState(false);
    const lastScrollY = useRef(0);
    const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
    const ignoreScrollUntil = useRef(0); // Timestamp to ignore scroll events until

    // Reset scroll tracking when initial scroll happens
    useEffect(() => {
        if (isInitialScrolling) {
            // Ignore scroll events for a brief period during programmatic scroll
            ignoreScrollUntil.current = Date.now() + 500;
            // Also ensure toolbar is visible after scroll completes
            setIsHidden(false);
        }
    }, [isInitialScrolling]);

    // Scroll direction detection
    useEffect(() => {
        const handleScroll = () => {
            // Ignore scroll events during programmatic scrolling
            if (Date.now() < ignoreScrollUntil.current) {
                lastScrollY.current = window.scrollY;
                return;
            }
            
            const currentScrollY = window.scrollY;
            const delta = currentScrollY - lastScrollY.current;
            
            // Debounce small movements
            if (Math.abs(delta) < SCROLL_DELTA_THRESHOLD) return;
            
            // Always show when near top
            if (currentScrollY < SCROLL_THRESHOLD) {
                setIsHidden(false);
                lastScrollY.current = currentScrollY;
                return;
            }
            
            // Scrolling down - hide
            if (delta > 0) {
                setIsHidden(true);
                setIsHoveredWhileHidden(false);
            }
            // Scrolling up - show
            else if (delta < 0) {
                setIsHidden(false);
            }
            
            lastScrollY.current = currentScrollY;
        };

        // Throttle scroll handler for performance
        const throttledScroll = () => {
            if (scrollTimeout.current) return;
            
            scrollTimeout.current = setTimeout(() => {
                handleScroll();
                scrollTimeout.current = null;
            }, 16); // ~60fps
        };

        window.addEventListener('scroll', throttledScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', throttledScroll);
            if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        };
    }, []);

    // Trigger zone hover handlers
    const handleTriggerMouseEnter = useCallback(() => {
        if (isHidden) {
            setIsHoveredWhileHidden(true);
        }
    }, [isHidden]);

    const handleTriggerMouseLeave = useCallback(() => {
        setIsHoveredWhileHidden(false);
    }, []);

    // Easter egg click handler
    const handleStatusClick = useCallback(() => {
        // Don't interrupt if streaming
        if (isStreaming) return;

        // Clear any existing timeouts
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        if (resetTimeoutRef.current) {
            clearTimeout(resetTimeoutRef.current);
        }
        
        // Clear resetting state if clicking again
        setIsResetting(false);

        // Pick a random phrase (avoid repeating the last one)
        let newIndex: number;
        do {
            newIndex = Math.floor(Math.random() * STATUS_PHRASES.length);
        } while (newIndex === lastPhraseIndexRef.current && STATUS_PHRASES.length > 1);
        
        lastPhraseIndexRef.current = newIndex;
        setStatusPhrase(STATUS_PHRASES[newIndex]);
        
        // Increment key to force animation restart
        setAnimKey(k => k + 1);
        
        // Trigger pulse animation
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 500);

        // Reset after delay - time this to start fading before phrase animation ends
        timeoutRef.current = setTimeout(() => {
            setStatusPhrase(null);
            setIsResetting(true);
            
            // Clear resetting state after Ready fades in and blur to release toolbar
            resetTimeoutRef.current = setTimeout(() => {
                setIsResetting(false);
                // Blur the button to release focus-within state on toolbar
                if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                }
            }, 400);
        }, 1600);
    }, [isStreaming]);

    // Compute visibility
    const shouldShow = !isHidden || isHoveredWhileHidden;

    return (
        <>
            {/* Trigger zone - only active when toolbar is hidden */}
            {isHidden && !isHoveredWhileHidden && (
                <div 
                    className="chat-toolbar-trigger"
                    style={{ height: TRIGGER_ZONE_HEIGHT }}
                    onMouseEnter={handleTriggerMouseEnter}
                    aria-hidden="true"
                />
            )}
            
            <div 
                className={`chat-toolbar ${shouldShow ? '' : 'hidden'}`}
                onMouseEnter={isHidden ? handleTriggerMouseEnter : undefined}
                onMouseLeave={isHidden ? handleTriggerMouseLeave : undefined}
            >
                <div className="chat-toolbar-inner">
                    {/* Status indicator - clickable easter egg */}
                    <button 
                        className="chat-toolbar-status"
                        onClick={handleStatusClick}
                        disabled={isStreaming}
                        aria-label="Status"
                    >
                        <span className="toolbar-status-dot-wrapper">
                            <span className={`toolbar-status-dot ${isStreaming ? 'streaming' : ''}`}></span>
                            {isPulsing && <span className="toolbar-status-pulse"></span>}
                        </span>
                        <span 
                            key={animKey}
                            className={`toolbar-status-text ${statusPhrase ? 'phrase' : ''} ${isResetting ? 'resetting' : ''}`}
                        >
                            {isStreaming ? 'Responding...' : (statusPhrase || 'Ready')}
                        </span>
                    </button>

                    {/* Actions */}
                    <div className="chat-toolbar-actions">
                        <button
                            className="chat-toolbar-btn"
                            aria-label="New Chat"
                            title="New Chat"
                            onClick={onNewChat}
                            style={{ '--btn-index': 0 } as React.CSSProperties}
                        >
                            <NewChatIcon />
                            <span>New Chat</span>
                        </button>

                        <button
                            className="chat-toolbar-btn"
                            aria-label="New Project"
                            title="New Project"
                            onClick={onNewProject}
                            style={{ '--btn-index': 1 } as React.CSSProperties}
                        >
                            <FolderPlus size={14} />
                            <span>New Project</span>
                        </button>

                        <button 
                            className="chat-toolbar-btn" 
                            aria-label="Settings" 
                            title="Chat Settings"
                            onClick={onOpenSettings}
                            style={{ '--btn-index': 2 } as React.CSSProperties}
                        >
                            <SettingsIcon />
                            <span>Settings</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default memo(ChatToolbar);
