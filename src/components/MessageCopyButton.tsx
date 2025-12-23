import React from 'react';

interface MessageCopyButtonProps {
    textContent: string;
    className?: string;
}

const MessageCopyButton = ({ textContent, className = "" }: MessageCopyButtonProps) => {

    const [copied, setCopied] = React.useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(textContent);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
        catch (error) {
            console.error('Failed to copy message:', error);
            fallbackCopy(textContent);
        }
    };

    const fallbackCopy = (text: string) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
        catch (error) {
            console.error('Failed to copy message using fallback:', error);
        }
        finally {
            document.body.removeChild(textarea);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className={`msg-copy-btn ${copied ? 'copied' : ''} ${className}`}
            aria-label={copied ? 'Copied!' : 'Copy message'}
            title={copied ? 'Copied!' : 'Copy message'}>

            {copied ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
            )}
            {copied && <span className="copy-feedback">Copied!</span>}
        </button>
    );
};

export default MessageCopyButton;