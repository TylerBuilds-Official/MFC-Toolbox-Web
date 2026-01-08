/**
 * ProjectModal - Create/Edit project modal
 */

import { useState, useEffect } from 'react';
import { X, Lock, Users, User } from 'lucide-react';
import type { ConversationProject, ProjectType, ProjectPermissions, PermissionLevel } from '../../types';
import styles from '../../styles/ConversationProjects.module.css';

// Available accent colors
const COLORS = [
    null,        // No color
    '#ef4444',   // Red
    '#f97316',   // Orange
    '#f59e0b',   // Amber
    '#84cc16',   // Lime
    '#22c55e',   // Green
    '#14b8a6',   // Teal
    '#06b6d4',   // Cyan
    '#3b82f6',   // Blue
    '#6366f1',   // Indigo
    '#8b5cf6',   // Violet
    '#a855f7',   // Purple
    '#ec4899',   // Pink
];

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: ProjectFormData) => Promise<void>;
    project?: ConversationProject | null;  // If provided, we're editing
    isLoading?: boolean;
}

export interface ProjectFormData {
    name: string;
    description: string;
    color: string | null;
    custom_instructions: string;
    project_type: ProjectType;
    permissions: ProjectPermissions;
}

const DEFAULT_PERMISSIONS: ProjectPermissions = {
    canChat: 'anyone',
    canCreateConversations: 'anyone',
    canEditInstructions: 'owner_only',
    canInviteMembers: 'owner_only',
    canRemoveConversations: 'anyone',
};

export function ProjectModal({
    isOpen,
    onClose,
    onSave,
    project,
    isLoading = false,
}: ProjectModalProps) {
    const isEditing = !!project;

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState<string | null>(null);
    const [customInstructions, setCustomInstructions] = useState('');
    const [projectType, setProjectType] = useState<ProjectType>('private');
    const [permissions, setPermissions] = useState<ProjectPermissions>(DEFAULT_PERMISSIONS);

    // Reset form when modal opens/closes or project changes
    useEffect(() => {
        if (isOpen) {
            if (project) {
                setName(project.name);
                setDescription(project.description || '');
                setColor(project.color);
                setCustomInstructions(project.custom_instructions || '');
                setProjectType(project.project_type);
                setPermissions(project.permissions || DEFAULT_PERMISSIONS);
            } else {
                setName('');
                setDescription('');
                setColor(null);
                setCustomInstructions('');
                setProjectType('private');
                setPermissions(DEFAULT_PERMISSIONS);
            }
        }
    }, [isOpen, project]);

    const handleSubmit = async () => {
        if (!name.trim()) return;

        await onSave({
            name: name.trim(),
            description: description.trim(),
            color,
            custom_instructions: customInstructions.trim(),
            project_type: projectType,
            permissions,
        });
    };

    const updatePermission = (key: keyof ProjectPermissions, value: PermissionLevel) => {
        setPermissions(prev => ({ ...prev, [key]: value }));
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    <h3>{isEditing ? 'Edit Project' : 'New Project'}</h3>
                    <button className={styles.modalCloseBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className={styles.modalBody}>
                    {/* Name */}
                    <div className={styles.formGroup}>
                        <label>Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Project name"
                            autoFocus
                        />
                    </div>

                    {/* Description */}
                    <div className={styles.formGroup}>
                        <label>Description (optional)</label>
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Brief description"
                        />
                    </div>

                    {/* Color */}
                    <div className={styles.formGroup}>
                        <label>Color</label>
                        <div className={styles.colorPicker}>
                            {COLORS.map((c, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className={`${styles.colorOption} ${c === color ? styles.selected : ''} ${c === null ? styles.none : ''}`}
                                    style={c ? { backgroundColor: c } : undefined}
                                    onClick={() => setColor(c)}
                                    title={c || 'No color'}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Project Type */}
                    <div className={styles.formGroup}>
                        <label>Sharing</label>
                        <div className={styles.typeSelector}>
                            <button
                                type="button"
                                className={`${styles.typeOption} ${projectType === 'private' ? styles.selected : ''}`}
                                onClick={() => setProjectType('private')}
                            >
                                <User size={20} className={styles.typeIcon} />
                                <span className={styles.typeLabel}>Private</span>
                                <span className={styles.typeDescription}>Only you</span>
                            </button>
                            <button
                                type="button"
                                className={`${styles.typeOption} ${projectType === 'shared_locked' ? styles.selected : ''}`}
                                onClick={() => setProjectType('shared_locked')}
                            >
                                <Lock size={20} className={styles.typeIcon} />
                                <span className={styles.typeLabel}>View Only</span>
                                <span className={styles.typeDescription}>Members can view</span>
                            </button>
                            <button
                                type="button"
                                className={`${styles.typeOption} ${projectType === 'shared_open' ? styles.selected : ''}`}
                                onClick={() => setProjectType('shared_open')}
                            >
                                <Users size={20} className={styles.typeIcon} />
                                <span className={styles.typeLabel}>Collaborative</span>
                                <span className={styles.typeDescription}>Custom permissions</span>
                            </button>
                        </div>
                    </div>

                    {/* Permissions (only for shared_open) */}
                    {projectType === 'shared_open' && (
                        <div className={styles.formGroup}>
                            <label>Permissions</label>
                            <div className={styles.permissionsSection}>
                                <PermissionRow
                                    label="Chat in conversations"
                                    value={permissions.canChat}
                                    onChange={(v) => updatePermission('canChat', v)}
                                />
                                <PermissionRow
                                    label="Create conversations"
                                    value={permissions.canCreateConversations}
                                    onChange={(v) => updatePermission('canCreateConversations', v)}
                                />
                                <PermissionRow
                                    label="Edit instructions"
                                    value={permissions.canEditInstructions}
                                    onChange={(v) => updatePermission('canEditInstructions', v)}
                                />
                                <PermissionRow
                                    label="Invite members"
                                    value={permissions.canInviteMembers}
                                    onChange={(v) => updatePermission('canInviteMembers', v)}
                                />
                                <PermissionRow
                                    label="Remove conversations"
                                    value={permissions.canRemoveConversations}
                                    onChange={(v) => updatePermission('canRemoveConversations', v)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Custom Instructions */}
                    <div className={styles.formGroup}>
                        <label>Custom Instructions (optional)</label>
                        <textarea
                            value={customInstructions}
                            onChange={e => setCustomInstructions(e.target.value)}
                            placeholder="Add instructions that will be included in the AI system prompt for conversations in this project..."
                            rows={3}
                        />
                        <span className={styles.formHint}>
                            These instructions supplement the default system prompt when chatting within this project.
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div className={styles.modalFooter}>
                    <button
                        className={`${styles.modalBtn} ${styles.modalBtnCancel}`}
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                        onClick={handleSubmit}
                        disabled={!name.trim() || isLoading}
                    >
                        {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Project'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Permission row component
function PermissionRow({
    label,
    value,
    onChange,
}: {
    label: string;
    value: PermissionLevel;
    onChange: (value: PermissionLevel) => void;
}) {
    return (
        <div className={styles.permissionRow}>
            <span className={styles.permissionLabel}>{label}</span>
            <div className={styles.permissionToggle}>
                <button
                    type="button"
                    className={`${styles.permissionBtn} ${value === 'owner_only' ? styles.active : ''}`}
                    onClick={() => onChange('owner_only')}
                >
                    Owner
                </button>
                <button
                    type="button"
                    className={`${styles.permissionBtn} ${value === 'anyone' ? styles.active : ''}`}
                    onClick={() => onChange('anyone')}
                >
                    Anyone
                </button>
            </div>
        </div>
    );
}

export default ProjectModal;
