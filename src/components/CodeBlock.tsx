import React, { useState, useEffect, useRef } from "react";
import Prism from "prismjs";

// Import Prism CSS theme (choose one)
import "prismjs/themes/prism-tomorrow.css"; // Dark theme

import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-powershell";

interface CodeBlockProps {
    children: string;
    language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ children, language }) => {
    const [copied, setCopied] = useState(false);
    const codeRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (codeRef.current) {
            Prism.highlightElement(codeRef.current);
        }
    }, [children, language]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(children);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    // Map common aliases to Prism language names
    const getPrismLanguage = (lang?: string): string => {
        if (!lang) return "plaintext";

        const languageMap: Record<string, string> = {
            "js": "javascript",
            "ts": "typescript",
            "py": "python",
            "cs": "csharp",
            "sh": "bash",
            "shell": "bash",
            "yml": "yaml",
        };

        return languageMap[lang.toLowerCase()] || lang.toLowerCase();
    };

    const prismLanguage = getPrismLanguage(language);

    return (
        <div className="code-block-wrapper">
            <div className="code-block-header">
                <span className="code-block-language">{language || "code"}</span>
                <button
                    className="code-copy-btn"
                    onClick={handleCopy}
                    aria-label={copied ? "Copied!" : "Copy code"}
                >
                    {copied ? (
                        <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <span>Copied!</span>
                        </>
                    ) : (
                        <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>
            <pre className="code-block-content">
                <code ref={codeRef} className={`language-${prismLanguage}`}>
                    {children}
                </code>
            </pre>
        </div>
    );
};

export default CodeBlock;