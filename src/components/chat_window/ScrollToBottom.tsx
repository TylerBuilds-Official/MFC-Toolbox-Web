import React, { useState, useEffect, useCallback, memo } from 'react';
import { ChevronDown } from 'lucide-react';
import '../../styles/scrollToBottom.css';

// How far from the bottom before showing the button (in pixels)
const SCROLL_THRESHOLD = 300;

interface ScrollToBottomProps {
    isStreaming?: boolean;
}

const ScrollToBottom: React.FC<ScrollToBottomProps> = ({ isStreaming = false }) => {
    const [isVisible, setIsVisible] = useState(false);

    // Track scroll position
    useEffect(() => {
        const handleScroll = () => {
            // Don't show during streaming (we auto-scroll anyway)
            if (isStreaming) {
                setIsVisible(false);
                return;
            }

            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight;
            const clientHeight = document.documentElement.clientHeight;
            
            // Distance from bottom
            const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
            
            setIsVisible(distanceFromBottom > SCROLL_THRESHOLD);
        };

        // Check initial state
        handleScroll();

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isStreaming]);

    // Hide when streaming starts
    useEffect(() => {
        if (isStreaming) {
            setIsVisible(false);
        }
    }, [isStreaming]);

    const handleClick = useCallback(() => {
        window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth'
        });
    }, []);

    if (!isVisible) return null;

    return (
        <button
            className="scroll-to-bottom-btn"
            onClick={handleClick}
            aria-label="Scroll to bottom"
            title="Scroll to latest messages"
        >
            <ChevronDown size={20} />
        </button>
    );
};

export default memo(ScrollToBottom);
