/**
 * Artifact Parser
 * 
 * Parses <artifact /> markers from message content and returns
 * segments for rendering.
 */

import type { EmbeddedArtifact, ArtifactType } from '../types/artifact';

export type MessageSegment = 
    | { type: 'text'; content: string }
    | { type: 'artifact'; artifact: EmbeddedArtifact };

/**
 * Parse message content and extract artifact markers.
 * 
 * Input: "Here's the data:\n<artifact id=\"abc\" type=\"data\" title=\"Job 6516\" />\nLet me know!"
 * Output: [
 *   { type: 'text', content: "Here's the data:\n" },
 *   { type: 'artifact', artifact: { id: 'abc', type: 'data', title: 'Job 6516' } },
 *   { type: 'text', content: "\nLet me know!" }
 * ]
 */
export function parseMessageContent(content: string): MessageSegment[] {
    const segments: MessageSegment[] = [];
    
    // Regex to match <artifact id="..." type="..." title="..." />
    // Handles both self-closing and with optional whitespace
    const artifactRegex = /<artifact\s+id="([^"]+)"\s+type="([^"]+)"\s+title="([^"]+)"\s*\/>/g;
    
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    
    while ((match = artifactRegex.exec(content)) !== null) {
        // Add text before this artifact
        if (match.index > lastIndex) {
            const textContent = content.slice(lastIndex, match.index);
            if (textContent.trim()) {
                segments.push({ type: 'text', content: textContent });
            }
        }
        
        // Add the artifact
        const [, id, type, title] = match;
        segments.push({
            type: 'artifact',
            artifact: {
                id,
                type: type as ArtifactType,
                title: decodeHtmlEntities(title),
            }
        });
        
        lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text after last artifact
    if (lastIndex < content.length) {
        const textContent = content.slice(lastIndex);
        if (textContent.trim()) {
            segments.push({ type: 'text', content: textContent });
        }
    }
    
    // If no artifacts found, return single text segment
    if (segments.length === 0 && content.trim()) {
        segments.push({ type: 'text', content });
    }
    
    return segments;
}

/**
 * Check if message content contains any artifact markers
 */
export function hasArtifacts(content: string): boolean {
    return /<artifact\s+id="[^"]+"\s+type="[^"]+"\s+title="[^"]+"\s*\/>/.test(content);
}

/**
 * Extract just the artifact IDs from content (for prefetching, etc.)
 */
export function extractArtifactIds(content: string): string[] {
    const ids: string[] = [];
    const regex = /<artifact\s+id="([^"]+)"/g;
    let match: RegExpExecArray | null;
    
    while ((match = regex.exec(content)) !== null) {
        ids.push(match[1]);
    }
    
    return ids;
}

/**
 * Decode HTML entities in title (in case LLM escapes quotes, etc.)
 */
function decodeHtmlEntities(text: string): string {
    return text
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}
