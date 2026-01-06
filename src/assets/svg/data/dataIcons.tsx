/**
 * Data Page Icons
 * SVG icons for data sessions, groups, and related UI elements
 */

import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;
type IconComponent = React.FC<IconProps>;

const DataIcons: {
    folderClosed: IconComponent;
    folderOpen: IconComponent;
    folderPlus: IconComponent;
    folderEdit: IconComponent;
    chevronRight: IconComponent;
    chevronDown: IconComponent;
    moveToFolder: IconComponent;
    removeFromFolder: IconComponent;
    colorPalette: IconComponent;
} = {
    // Closed folder icon
    folderClosed: (props) => (
        <svg {...props} width="20" height="20" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
    ),

    // Open folder icon
    folderOpen: (props) => (
        <svg {...props} width="20" height="20" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v1" />
            <path d="M5 12h14a2 2 0 0 1 2 2v5" />
        </svg>
    ),

    // Create new folder
    folderPlus: (props) => (
        <svg {...props} width="20" height="20" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            <line x1="12" y1="11" x2="12" y2="17" />
            <line x1="9" y1="14" x2="15" y2="14" />
        </svg>
    ),

    // Edit folder
    folderEdit: (props) => (
        <svg {...props} width="20" height="20" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2z" />
            <path d="M18 10l-4 4" />
            <path d="M14 14l4-4 2 2-4 4-2.5.5.5-2.5z" />
        </svg>
    ),

    // Expand/collapse chevrons
    chevronRight: (props) => (
        <svg {...props} width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    ),

    chevronDown: (props) => (
        <svg {...props} width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
        </svg>
    ),

    // Move session to folder
    moveToFolder: (props) => (
        <svg {...props} width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            <polyline points="12 11 12 17" />
            <polyline points="9 14 12 11 15 14" />
        </svg>
    ),

    // Remove from folder
    removeFromFolder: (props) => (
        <svg {...props} width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            <line x1="9" y1="14" x2="15" y2="14" />
        </svg>
    ),

    // Color palette for group color
    colorPalette: (props) => (
        <svg {...props} width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="8" r="2" fill="currentColor" />
            <circle cx="8" cy="14" r="2" fill="currentColor" />
            <circle cx="16" cy="14" r="2" fill="currentColor" />
        </svg>
    ),
};

export default DataIcons;
