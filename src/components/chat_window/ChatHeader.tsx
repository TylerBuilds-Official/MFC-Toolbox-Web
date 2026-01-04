import React from 'react';
import { NewChatIcon, SettingsIcon } from '../../assets/svg/chat_window';


interface ChatHeaderProps {
    isStreaming: boolean;
    onNewChat: () => void;
}


const ChatHeader: React.FC<ChatHeaderProps> = ({ isStreaming, onNewChat }) => {
    return (
        <div className="chat-header">
            <div className="chat-header-info">
                <div className="chat-header-avatar">🤖</div>
                <div className="chat-header-text">
                    <h2>MFC Assistant</h2>
                    <div className="chat-header-status">
                        <span className="status-indicator"></span>
                        <span>{isStreaming ? 'Responding...' : 'Online'}</span>
                    </div>
                </div>
            </div>
            <div className="chat-header-actions">
                <button
                    className="chat-header-btn"
                    aria-label="New Chat"
                    title="New Chat"
                    onClick={onNewChat}
                >
                    <NewChatIcon />
                </button>

                <button 
                    className="chat-header-btn" 
                    aria-label="Settings" 
                    title="Chat Settings"
                >
                    <SettingsIcon />
                </button>
            </div>
        </div>
    );
};

export default ChatHeader;
