/**
 * SessionContextMenu - Right-click context menu for session actions
 * Includes options to move to group, remove from group, delete, etc.
 */

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { DataGroup } from '../../types/data';
import DataIcons from '../../assets/svg/data/dataIcons';
import styles from '../../styles/data_page/DataGroups.module.css';

interface SessionContextMenuProps {
    isOpen: boolean;
    position: { x: number; y: number };
    sessionId: number;
    currentGroupId: number | null;
    groups: DataGroup[];
    onClose: () => void;
    onMoveToGroup: (sessionId: number, groupId: number) => void;
    onRemoveFromGroup: (sessionId: number) => void;
    onDelete: (sessionId: number) => void;
}

const SessionContextMenu = ({
    isOpen,
    position,
    sessionId,
    currentGroupId,
    groups,
    onClose,
    onMoveToGroup,
    onRemoveFromGroup,
    onDelete,
}: SessionContextMenuProps) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [showSubmenu, setShowSubmenu] = useState(false);
    const [adjustedPosition, setAdjustedPosition] = useState(position);

    // Adjust position to keep menu in viewport
    useEffect(() => {
        if (isOpen && menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            const viewport = {
                width: window.innerWidth,
                height: window.innerHeight,
            };

            let x = position.x;
            let y = position.y;

            // Adjust horizontal position
            if (x + rect.width > viewport.width - 16) {
                x = viewport.width - rect.width - 16;
            }

            // Adjust vertical position
            if (y + rect.height > viewport.height - 16) {
                y = viewport.height - rect.height - 16;
            }

            setAdjustedPosition({ x, y });
        }
    }, [isOpen, position]);

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const availableGroups = groups.filter(g => g.id !== currentGroupId);

    return createPortal(
        <div
            ref={menuRef}
            className={styles.contextMenu}
            style={{
                left: adjustedPosition.x,
                top: adjustedPosition.y,
            }}
        >
            {/* Move to Group */}
            {availableGroups.length > 0 && (
                <div
                    className={styles.submenuContainer}
                    onMouseEnter={() => setShowSubmenu(true)}
                    onMouseLeave={() => setShowSubmenu(false)}
                >
                    <button className={styles.contextMenuItem}>
                        <svg 
                            width="12" 
                            height="12" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2"
                        >
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                        <DataIcons.moveToFolder />
                        <span>Move to group</span>
                    </button>

                    {/* Submenu */}
                    {showSubmenu && (
                        <div className={styles.submenu}>
                            {availableGroups.map(group => (
                                <button
                                    key={group.id}
                                    className={styles.contextMenuItem}
                                    onClick={() => {
                                        onMoveToGroup(sessionId, group.id);
                                        onClose();
                                    }}
                                >
                                    <DataIcons.folderClosed 
                                        width={14} 
                                        height={14} 
                                        style={group.color ? { color: group.color } : undefined}
                                    />
                                    <span>{group.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Remove from Group */}
            {currentGroupId && (
                <button
                    className={styles.contextMenuItem}
                    onClick={() => {
                        onRemoveFromGroup(sessionId);
                        onClose();
                    }}
                >
                    {/* Spacer to align with "Move to group" which has a chevron */}
                    {availableGroups.length > 0 && <span style={{ width: 12 }} />}
                    <DataIcons.removeFromFolder />
                    <span>Remove from group</span>
                </button>
            )}

            {(availableGroups.length > 0 || currentGroupId) && (
                <div className={styles.contextMenuDivider} />
            )}

            {/* Delete */}
            <button
                className={`${styles.contextMenuItem} ${styles.danger}`}
                onClick={() => {
                    onDelete(sessionId);
                    onClose();
                }}
            >
                {/* Spacer to align with "Move to group" which has a chevron */}
                {availableGroups.length > 0 && <span style={{ width: 12 }} />}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                <span>Delete session</span>
            </button>
        </div>,
        document.body
    );
};

export default SessionContextMenu;
