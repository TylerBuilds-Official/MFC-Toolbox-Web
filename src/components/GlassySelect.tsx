/**
 * GlassySelect - A custom dropdown with glassy styling
 * Reusable select component with rounded dropdown menu and frosted glass effect
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import '../styles/glassySelect.css';

// ============================================================================
// Types
// ============================================================================

export interface SelectOption {
    value: string;
    label: string;
}

interface GlassySelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    disabled?: boolean;
    placeholder?: string;
    className?: string;
}

// ============================================================================
// Component
// ============================================================================

const GlassySelect: React.FC<GlassySelectProps> = ({
    value,
    onChange,
    options,
    disabled = false,
    placeholder = 'Select...',
    className = '',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Find current selected option
    const selectedOption = options.find(opt => opt.value === value);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Reset highlighted index when dropdown opens
    useEffect(() => {
        if (isOpen) {
            const currentIndex = options.findIndex(opt => opt.value === value);
            setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
        }
    }, [isOpen, options, value]);

    // Scroll highlighted item into view
    useEffect(() => {
        if (isOpen && menuRef.current && highlightedIndex >= 0) {
            const items = menuRef.current.querySelectorAll('.glassy-select-item');
            const highlightedItem = items[highlightedIndex] as HTMLElement;
            if (highlightedItem) {
                highlightedItem.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightedIndex, isOpen]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (disabled) return;

        switch (event.key) {
            case 'Enter':
            case ' ':
                event.preventDefault();
                if (isOpen && highlightedIndex >= 0) {
                    onChange(options[highlightedIndex].value);
                    setIsOpen(false);
                } else {
                    setIsOpen(true);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                break;
            case 'ArrowDown':
                event.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                } else {
                    setHighlightedIndex(prev => 
                        prev < options.length - 1 ? prev + 1 : prev
                    );
                }
                break;
            case 'ArrowUp':
                event.preventDefault();
                if (isOpen) {
                    setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
                }
                break;
            case 'Tab':
                setIsOpen(false);
                break;
        }
    }, [disabled, isOpen, highlightedIndex, options, onChange]);

    const handleSelect = useCallback((optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    }, [onChange]);

    const handleTriggerClick = useCallback(() => {
        if (!disabled) {
            setIsOpen(prev => !prev);
        }
    }, [disabled]);

    return (
        <div 
            ref={containerRef}
            className={`glassy-select ${className} ${disabled ? 'glassy-select-disabled' : ''}`}
        >
            <button
                type="button"
                className={`glassy-select-trigger ${isOpen ? 'glassy-select-trigger-open' : ''}`}
                onClick={handleTriggerClick}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className="glassy-select-value">
                    {selectedOption?.label || placeholder}
                </span>
                <ChevronDown 
                    size={16} 
                    className={`glassy-select-chevron ${isOpen ? 'glassy-select-chevron-open' : ''}`}
                />
            </button>

            {isOpen && (
                <div 
                    ref={menuRef}
                    className="glassy-select-menu"
                    role="listbox"
                >
                    {options.map((option, index) => (
                        <button
                            key={option.value}
                            type="button"
                            className={`glassy-select-item ${option.value === value ? 'glassy-select-item-selected' : ''} ${index === highlightedIndex ? 'glassy-select-item-highlighted' : ''}`}
                            onClick={() => handleSelect(option.value)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            role="option"
                            aria-selected={option.value === value}
                        >
                            <span>{option.label}</span>
                            {option.value === value && <Check size={14} />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GlassySelect;
