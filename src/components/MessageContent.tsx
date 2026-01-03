/**
 * MessageContent - Renders message content with embedded artifacts
 * 
 * Parses <artifact /> markers and renders them as clickable cards
 * between markdown text segments.
 */

import React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { parseMessageContent, hasArtifacts } from '../utils/artifactParser';
import { DataArtifactCard } from './artifacts';
import CodeBlock from './CodeBlock';

interface MessageContentProps {
    content: string;
    isStreaming?: boolean;
}

// Markdown components config
const markdownComponents: Components = {
    code({ className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || "");
        const isInline = !className && !String(children).includes("\n");

        if (isInline) {
            return <code className="inline-code" {...props}>{children}</code>;
        }

        return (
            <CodeBlock language={match?.[1]}>
                {String(children).replace(/\n$/, "")}
            </CodeBlock>
        );
    },

    pre({ children }) {
        return <>{children}</>;
    },

    table({ children, ...props }) {
        return (
            <div className="table-wrapper">
                <table {...props}>{children}</table>
            </div>
        );
    },
};

const MessageContent: React.FC<MessageContentProps> = ({ content, isStreaming }) => {
    // Don't parse artifacts while still streaming (marker might be incomplete)
    // Also skip parsing if no artifacts present (optimization)
    if (isStreaming || !hasArtifacts(content)) {
        return (
            <ReactMarkdown
                components={markdownComponents}
                remarkPlugins={[remarkGfm]}
            >
                {content}
            </ReactMarkdown>
        );
    }

    // Parse content into segments
    const segments = parseMessageContent(content);

    return (
        <>
            {segments.map((segment, index) => {
                if (segment.type === 'text') {
                    return (
                        <ReactMarkdown
                            key={index}
                            components={markdownComponents}
                            remarkPlugins={[remarkGfm]}
                        >
                            {segment.content}
                        </ReactMarkdown>
                    );
                }
                
                if (segment.type === 'artifact') {
                    return (
                        <DataArtifactCard
                            key={segment.artifact.id}
                            artifact={segment.artifact}
                        />
                    );
                }
                
                return null;
            })}
        </>
    );
};

export default MessageContent;
