import React from 'react';
import { CheckIcon } from '../../assets/svg/chat_window';


interface MessageEditorProps {
    content: string;
    onChange: (content: string) => void;
    onSave: () => void;
    onCancel: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
}


const MessageEditor: React.FC<MessageEditorProps> = ({
    content,
    onChange,
    onSave,
    onCancel,
    onKeyDown,
}) => {
    return (
        <div className="message-edit-container">
            <textarea
                className="message-edit-input"
                value={content}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={onKeyDown}
                autoFocus
                rows={3}
            />
            <div className="message-edit-actions">
                <button
                    className="message-edit-save"
                    onClick={onSave}
                    disabled={!content.trim()}
                >
                    <CheckIcon />
                    Save & Submit
                </button>
                <button
                    className="message-edit-cancel"
                    onClick={onCancel}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default MessageEditor;
