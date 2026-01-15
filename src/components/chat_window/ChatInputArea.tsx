import React, { memo } from 'react';
import type { Trigger } from '../../triggers';
import CommandContextMenu from './CommandContextMenu';
import ModelSelector from '../modelSelector';
import { SendIcon, StopIcon } from '../../assets/svg/chat_window';


interface ChatInputAreaProps {
    input: string;
    selectedModel: string;
    currentProvider: string;
    isTyping: boolean;
    isStreaming: boolean;
    showCommandMenu: boolean;
    commandSearch: string;
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onSend: () => void;
    onStop: () => void;
    onModelChange: (model: string) => void;
    onCommandSelect: (trigger: Trigger, params?: Record<string, string>) => void;
    onCloseCommandMenu: () => void;
}


const ChatInputArea: React.FC<ChatInputAreaProps> = ({
    input,
    selectedModel,
    currentProvider,
    isTyping,
    isStreaming,
    showCommandMenu,
    commandSearch,
    textareaRef,
    onInputChange,
    onKeyDown,
    onSend,
    onStop,
    onModelChange,
    onCommandSelect,
    onCloseCommandMenu,
}) => {
    return (
        <div className="chat-input-area">
            <div className="chat-input-wrapper">
                {/* Command Context Menu */}
                <CommandContextMenu
                    isOpen={showCommandMenu}
                    searchQuery={commandSearch}
                    onSelect={onCommandSelect}
                    onClose={onCloseCommandMenu}
                />

                <textarea
                    ref={textareaRef}
                    className="chat-input"
                    value={input}
                    onChange={onInputChange}
                    onKeyDown={onKeyDown}
                    placeholder="Type your message..."
                    disabled={isTyping}
                    rows={1}
                />
                <div className="chat-input-actions">
                    <ModelSelector
                        value={selectedModel}
                        onChange={onModelChange}
                        provider={currentProvider}
                        disabled={isTyping}
                    />
                    {isStreaming ? (
                        <button
                            className="stop-btn"
                            onClick={onStop}
                            aria-label="Stop generation"
                            title="Stop generation"
                        >
                            <StopIcon />
                        </button>
                    ) : (
                        <button
                            className="send-btn"
                            onClick={onSend}
                            disabled={!input.trim() || isTyping}
                            aria-label="Send message"
                        >
                            <SendIcon />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default memo(ChatInputArea);
