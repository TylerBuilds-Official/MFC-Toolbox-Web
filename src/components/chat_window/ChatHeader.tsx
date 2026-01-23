import React, { memo } from 'react';
import { NewChatIcon, SettingsIcon } from '../../assets/svg/chat_window';
import atlasLogo from '../../assets/png/atlas.png';


interface ChatHeaderProps {
    isStreaming: boolean;
    onNewChat: () => void;
    onOpenSettings: () => void;
}


const ChatHeader: React.FC<ChatHeaderProps> = ({ isStreaming, onNewChat, onOpenSettings }) => {
    return (
        <div className="chat-header">
            <div className="chat-header-info">
                <div className="chat-header-avatar"><img src={atlasLogo} alt="Atlas Logo" /></div> { /* Add in custom avatar or SVG - EMOJI = TEMP */ }
                <div className="chat-header-text">
                    <h2>Atlas</h2>
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
                    onClick={onOpenSettings}
                >
                    <SettingsIcon />
                </button>
            </div>
        </div>
    );
};

export default memo(ChatHeader);
