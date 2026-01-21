/**
 * Export chat conversations to various formats
 */

import type { DisplayMessage } from '../types/chat';

export type ExportFormat = 'markdown' | 'json' | 'html';

interface ExportOptions {
    messages: DisplayMessage[];
    title: string;
    format: ExportFormat;
    createdAt?: string;
}

/**
 * Export chat to the specified format and trigger download
 */
export function exportChat({ messages, title, format, createdAt }: ExportOptions): void {
    let content: string;
    let mimeType: string;
    let extension: string;

    switch (format) {
        case 'markdown':
            content = toMarkdown(messages, title, createdAt);
            mimeType = 'text/markdown';
            extension = 'md';
            break;
        case 'json':
            content = toJSON(messages, title, createdAt);
            mimeType = 'application/json';
            extension = 'json';
            break;
        case 'html':
            content = toHTML(messages, title, createdAt);
            mimeType = 'text/html';
            extension = 'html';
            break;
    }

    downloadFile(content, `${sanitizeFilename(title)}.${extension}`, mimeType);
}

/**
 * Convert messages to Markdown format
 */
function toMarkdown(messages: DisplayMessage[], title: string, createdAt?: string): string {
    const lines: string[] = [];
    
    lines.push(`# ${title}`);
    lines.push('');
    
    if (createdAt) {
        lines.push(`*Exported from FabCore AI — Created ${formatDate(createdAt)}*`);
        lines.push('');
    }
    
    lines.push('---');
    lines.push('');

    for (const msg of messages) {
        const role = msg.role === 'user' ? '**You**' : '**Atlas**';
        const time = formatTime(msg.timestamp);
        
        lines.push(`### ${role} — ${time}`);
        lines.push('');
        lines.push(msg.content);
        lines.push('');
    }

    return lines.join('\n');
}

/**
 * Convert messages to JSON format
 */
function toJSON(messages: DisplayMessage[], title: string, createdAt?: string): string {
    const exportData = {
        title,
        createdAt,
        exportedAt: new Date().toISOString(),
        messageCount: messages.length,
        messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            ...(msg.thinking && { thinking: msg.thinking }),
        })),
    };

    return JSON.stringify(exportData, null, 2);
}

/**
 * Convert messages to HTML format
 */
function toHTML(messages: DisplayMessage[], title: string, createdAt?: string): string {
    const messagesHTML = messages.map(msg => {
        const roleClass = msg.role === 'user' ? 'user' : 'assistant';
        const roleName = msg.role === 'user' ? 'You' : 'Atlas';
        const time = formatTime(msg.timestamp);
        const content = escapeHTML(msg.content).replace(/\n/g, '<br>');
        
        return `
        <div class="message ${roleClass}">
            <div class="message-header">
                <span class="role">${roleName}</span>
                <span class="time">${time}</span>
            </div>
            <div class="message-content">${content}</div>
        </div>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHTML(title)}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a2e;
            color: #e4e4e7;
            padding: 2rem;
            line-height: 1.6;
        }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { color: #fff; margin-bottom: 0.5rem; }
        .meta { color: #71717a; margin-bottom: 2rem; font-size: 0.875rem; }
        .message {
            padding: 1rem;
            margin-bottom: 1rem;
            border-radius: 12px;
        }
        .message.user {
            background: #3b82f6;
            margin-left: 2rem;
        }
        .message.assistant {
            background: #27272a;
            margin-right: 2rem;
        }
        .message-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
            font-size: 0.875rem;
        }
        .role { font-weight: 600; }
        .time { color: #a1a1aa; }
        .message-content { white-space: pre-wrap; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${escapeHTML(title)}</h1>
        <p class="meta">Exported from FabCore AI${createdAt ? ` — Created ${formatDate(createdAt)}` : ''}</p>
        ${messagesHTML}
    </div>
</body>
</html>`;
}

/**
 * Trigger file download in browser
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

/**
 * Sanitize filename for download
 */
function sanitizeFilename(name: string): string {
    return name
        .replace(/[^a-z0-9\s-]/gi, '')
        .replace(/\s+/g, '-')
        .substring(0, 50) || 'chat-export';
}

/**
 * Format timestamp to readable time
 */
function formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Format date for display
 */
function formatDate(timestamp: string): string {
    return new Date(timestamp).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * Escape HTML entities
 */
function escapeHTML(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
