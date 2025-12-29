import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAvailableTriggers, type Trigger } from '../triggers';
import { useAuth } from '../auth';
import '../styles/commandContextMenu.css';


// Icons

const CommandIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 17 10 11 4 5"></polyline>
        <line x1="12" y1="19" x2="20" y2="19"></line>
    </svg>
);


const DevIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
    </svg>
);


// Types

interface CommandContextMenuProps {
    isOpen: boolean;
    searchQuery: string;
    onSelect: (trigger: Trigger, params?: Record<string, string>) => void;
    onClose: () => void;
    position?: { bottom: number; left: number; width: number };
}


interface ParamInputState {
    trigger: Trigger;
    values: Record<string, string>;
}


// Component

const CommandContextMenu: React.FC<CommandContextMenuProps> = ({
    isOpen,
    searchQuery,
    onSelect,
    onClose,
    position
}) => {
    const { user } = useAuth();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [paramInput, setParamInput] = useState<ParamInputState | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const paramInputRefs = useRef<Record<string, HTMLInputElement | null>>({});


    // Get available triggers filtered by search

    const availableTriggers = getAvailableTriggers(user?.role);

    const filteredTriggers = availableTriggers.filter(trigger =>
        trigger.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trigger.description.toLowerCase().includes(searchQuery.toLowerCase())
    );


    // Reset selection when filtered results change

    useEffect(() => {
        setSelectedIndex(0);
    }, [searchQuery]);


    // Focus first param input when param popout opens

    useEffect(() => {
        if (paramInput && paramInput.trigger.parameters?.length) {
            const firstParam = paramInput.trigger.parameters[0];
            const input = paramInputRefs.current[firstParam.name];
            if (input) {
                setTimeout(() => input.focus(), 50);
            }
        }
    }, [paramInput]);


    // Keyboard navigation

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return;

        // If param input is open, handle differently
        if (paramInput) {
            if (e.key === 'Escape') {
                e.preventDefault();
                setParamInput(null);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                handleParamSubmit();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < filteredTriggers.length - 1 ? prev + 1 : 0
                );
                break;

            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev > 0 ? prev - 1 : filteredTriggers.length - 1
                );
                break;

            case 'Enter':
                e.preventDefault();
                if (filteredTriggers[selectedIndex]) {
                    handleTriggerSelect(filteredTriggers[selectedIndex]);
                }
                break;

            case 'Escape':
                e.preventDefault();
                onClose();
                break;

            case 'Tab':
                e.preventDefault();
                if (filteredTriggers[selectedIndex]) {
                    handleTriggerSelect(filteredTriggers[selectedIndex]);
                }
                break;
        }
    }, [isOpen, filteredTriggers, selectedIndex, paramInput, onClose]);


    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);


    // Scroll selected item into view

    useEffect(() => {
        if (menuRef.current && isOpen) {
            const selectedItem = menuRef.current.querySelector('.command-item.selected');
            if (selectedItem) {
                selectedItem.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex, isOpen]);


    // Handle trigger selection

    const handleTriggerSelect = (trigger: Trigger) => {
        // If trigger has parameters, show param input
        if (trigger.parameters && trigger.parameters.length > 0) {
            setParamInput({
                trigger,
                values: {}
            });
        } else {
            // No params, execute immediately
            onSelect(trigger);
        }
    };


    // Handle param value change

    const handleParamChange = (paramName: string, value: string) => {
        if (!paramInput) return;

        setParamInput({
            ...paramInput,
            values: {
                ...paramInput.values,
                [paramName]: value
            }
        });
    };


    // Handle param submit

    const handleParamSubmit = () => {
        if (!paramInput) return;

        const { trigger, values } = paramInput;

        // Check required params
        const missingRequired = trigger.parameters?.filter(
            p => p.required && !values[p.name]?.trim()
        );

        if (missingRequired && missingRequired.length > 0) {
            // Focus first missing required field
            const firstMissing = missingRequired[0];
            const input = paramInputRefs.current[firstMissing.name];
            if (input) {
                input.focus();
                input.classList.add('shake');
                setTimeout(() => input.classList.remove('shake'), 500);
            }
            return;
        }

        onSelect(trigger, values);
        setParamInput(null);
    };


    // Check if can submit params

    const canSubmitParams = (): boolean => {
        if (!paramInput) return false;

        const { trigger, values } = paramInput;
        const requiredParams = trigger.parameters?.filter(p => p.required) || [];

        return requiredParams.every(p => values[p.name]?.trim());
    };


    if (!isOpen || filteredTriggers.length === 0) {
        return null;
    }


    return (
        <div
            className="command-context-menu"
            ref={menuRef}
            style={position ? {
                bottom: position.bottom,
                left: position.left,
                width: position.width
            } : undefined}
        >
            {/* Command List */}
            {!paramInput && (
                <div className="command-list">
                    <div className="command-header">
                        <CommandIcon />
                        <span>Commands</span>
                    </div>

                    {filteredTriggers.map((trigger, index) => (
                        <div
                            key={trigger.command}
                            className={`command-item ${index === selectedIndex ? 'selected' : ''}`}
                            onClick={() => handleTriggerSelect(trigger)}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            <div className="command-item-main">
                                <span className="command-name">/{trigger.command}</span>
                                {trigger.devOnly && (
                                    <span className="command-dev-badge" title="Developer only">
                                        <DevIcon />
                                    </span>
                                )}
                            </div>
                            <span className="command-description">{trigger.description}</span>
                        </div>
                    ))}

                    <div className="command-footer">
                        <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
                        <span><kbd>Enter</kbd> select</span>
                        <span><kbd>Esc</kbd> close</span>
                    </div>
                </div>
            )}

            {/* Parameter Input Popout */}
            {paramInput && (
                <div className="command-param-popout">
                    <div className="param-header">
                        <span className="param-command">/{paramInput.trigger.command}</span>
                        <button
                            className="param-close-btn"
                            onClick={() => setParamInput(null)}
                            aria-label="Close"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    <p className="param-description">{paramInput.trigger.description}</p>

                    <div className="param-fields">
                        {paramInput.trigger.parameters?.map(param => (
                            <div key={param.name} className="param-field">
                                <label htmlFor={`param-${param.name}`}>
                                    {param.name}
                                    {param.required && <span className="param-required">*</span>}
                                </label>
                                <input
                                    ref={el => { paramInputRefs.current[param.name] = el; }}
                                    id={`param-${param.name}`}
                                    type={param.type === 'number' ? 'number' : 'text'}
                                    placeholder={param.description || `Enter ${param.name}`}
                                    value={paramInput.values[param.name] || ''}
                                    onChange={e => handleParamChange(param.name, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="param-actions">
                        <button
                            className="param-cancel-btn"
                            onClick={() => setParamInput(null)}
                        >
                            Cancel
                        </button>
                        <button
                            className="param-submit-btn"
                            onClick={handleParamSubmit}
                            disabled={!canSubmitParams()}
                        >
                            Run Command
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};


export default CommandContextMenu;
