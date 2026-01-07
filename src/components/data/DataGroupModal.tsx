/**
 * DataGroupModal - Modal for creating or editing data session groups
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { type DataGroup } from '../../types';
import styles from '../../styles/data_page/DataGroups.module.css';

interface DataGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { name: string; description: string; color: string }) => void;
    group?: DataGroup | null;  // If provided, we're editing; otherwise creating
    isLoading?: boolean;
}

// Predefined color options
const COLOR_OPTIONS = [
    null,           // No color
    '#ef4444',      // Red
    '#f97316',      // Orange
    '#eab308',      // Yellow
    '#22c55e',      // Green
    '#14b8a6',      // Teal
    '#3b82f6',      // Blue
    '#8b5cf6',      // Purple
    '#ec4899',      // Pink
    '#6b7280',      // Gray
];

const DataGroupModal = ({ 
    isOpen, 
    onClose, 
    onSave, 
    group,
    isLoading = false 
}: DataGroupModalProps) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState<string | null>(null);

    // Reset form when modal opens/closes or group changes
    useEffect(() => {
        if (isOpen) {
            if (group) {
                setName(group.name);
                setDescription(group.description || '');
                setColor(group.color);
            } else {
                setName('');
                setDescription('');
                setColor(null);
            }
        }
    }, [isOpen, group]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name.trim()) return;
        
        onSave({
            name: name.trim(),
            description: description.trim(),
            color: color || '',  // Empty string to clear
        });
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    const isEditing = !!group;
    const title = isEditing ? 'Edit Group' : 'New Group';
    const submitText = isEditing ? 'Save Changes' : 'Create Group';

    return createPortal(
        <div 
            className={styles.modalOverlay} 
            onClick={handleOverlayClick}
            onKeyDown={handleKeyDown}
        >
            <div className={styles.modal} role="dialog" aria-modal="true">
                {/* Header */}
                <div className={styles.modalHeader}>
                    <h3>{title}</h3>
                    <button 
                        className={styles.modalCloseBtn}
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit}>
                    <div className={styles.modalBody}>
                        {/* Name */}
                        <div className={styles.formGroup}>
                            <label htmlFor="groupName">Name</label>
                            <input
                                id="groupName"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Q4 Analysis"
                                autoFocus
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className={styles.formGroup}>
                            <label htmlFor="groupDescription">Description (optional)</label>
                            <textarea
                                id="groupDescription"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief description of this group..."
                            />
                        </div>

                        {/* Color */}
                        <div className={styles.formGroup}>
                            <label>Color (optional)</label>
                            <div className={styles.colorPicker}>
                                {COLOR_OPTIONS.map((c, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        className={`${styles.colorOption} ${c === null ? styles.none : ''} ${color === c ? styles.selected : ''}`}
                                        style={c ? { backgroundColor: c } : undefined}
                                        onClick={() => setColor(c)}
                                        title={c || 'No color'}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className={styles.modalFooter}>
                        <button
                            type="button"
                            className={`${styles.modalBtn} ${styles.modalBtnCancel}`}
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                            disabled={!name.trim() || isLoading}
                        >
                            {isLoading ? 'Saving...' : submitText}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default DataGroupModal;
