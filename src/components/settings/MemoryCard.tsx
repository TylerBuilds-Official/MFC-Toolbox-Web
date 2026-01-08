import React, { useState } from 'react';
import { MEMORY_TYPE_LABELS } from '../../types';
import type {
    Memory,
    MemoryType
} from '../../types';

import {
    FactIcon,
    PreferenceIcon,
    ProjectIcon,
    SkillIcon,
    ContextIcon,
    EditIcon,
    TrashIcon,
    CheckIcon,
    StaleIcon,
} from '../../assets/svg/memories';

interface MemoryCardProps {
    memory: Memory;
    onUpdate: (id: number, updates: { content?: string; memory_type?: MemoryType }) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
    onRefresh?: (id: number) => Promise<void>;
    isStaleMode?: boolean;
}

const MEMORY_TYPE_ICONS: Record<MemoryType, React.FC<{ size?: number; className?: string }>> = {
    fact: FactIcon,
    preference: PreferenceIcon,
    project: ProjectIcon,
    skill: SkillIcon,
    context: ContextIcon,
};

const MemoryCard: React.FC<MemoryCardProps> = ({
    memory,
    onUpdate,
    onDelete,
    onRefresh,
    isStaleMode = false,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(memory.content);
    const [editType, setEditType] = useState<MemoryType>(memory.memory_type);
    const [saving, setSaving] = useState(false);

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'Never';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
        });
    };

    const handleSave = async () => {
        if (!editContent.trim()) return;

        setSaving(true);
        try {
            const updates: { content?: string; memory_type?: MemoryType } = {};
            if (editContent !== memory.content) updates.content = editContent;
            if (editType !== memory.memory_type) updates.memory_type = editType;

            if (Object.keys(updates).length > 0) {
                await onUpdate(memory.id, updates);
            }
            setIsEditing(false);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditContent(memory.content);
        setEditType(memory.memory_type);
        setIsEditing(false);
    };

    const handleDelete = async () => {
        setSaving(true);
        try {
            await onDelete(memory.id);
        } finally {
            setSaving(false);
        }
    };

    const handleKeep = async () => {
        if (onRefresh) {
            setSaving(true);
            try {
                await onRefresh(memory.id);
            } finally {
                setSaving(false);
            }
        }
    };

    const TypeIcon = MEMORY_TYPE_ICONS[memory.memory_type];

    return (
        <div className={`memory-card ${memory.is_stale ? 'memory-card-stale' : ''} ${isEditing ? 'memory-card-editing' : ''}`}>
            {/* Header */}
            <div className="memory-card-header">
                <div className="memory-card-type">
                    <span className="memory-type-icon">
                        <TypeIcon size={16} />
                    </span>
                    <span className="memory-type-label">{MEMORY_TYPE_LABELS[memory.memory_type]}</span>
                    {memory.is_stale && (
                        <span className="memory-stale-badge">
                            <StaleIcon size={12} className="memory-stale-icon" />
                            Stale
                        </span>
                    )}
                </div>

                <div className="memory-card-actions">
                    {isStaleMode ? (
                        <>
                            <button
                                className="memory-btn memory-btn-keep"
                                onClick={handleKeep}
                                disabled={saving}
                                title="Keep this memory"
                            >
                                <CheckIcon size={14} />
                                Keep
                            </button>
                            <button
                                className="memory-btn memory-btn-delete"
                                onClick={handleDelete}
                                disabled={saving}
                                title="Delete this memory"
                            >
                                <TrashIcon size={14} />
                                Delete
                            </button>
                        </>
                    ) : (
                        <>
                            {!isEditing && (
                                <>
                                    <button
                                        className="memory-btn memory-btn-edit"
                                        onClick={() => setIsEditing(true)}
                                        disabled={saving}
                                        title="Edit memory"
                                    >
                                        <EditIcon size={14} />
                                        Edit
                                    </button>
                                    <button
                                        className="memory-btn memory-btn-delete"
                                        onClick={handleDelete}
                                        disabled={saving}
                                        title="Delete memory"
                                    >
                                        <TrashIcon size={14} />
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            {isEditing ? (
                <div className="memory-card-edit">
                    <textarea
                        className="memory-edit-textarea"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="Memory content..."
                        rows={3}
                        disabled={saving}
                    />
                    <div className="memory-edit-controls">
                        <select
                            className="memory-edit-select"
                            value={editType}
                            onChange={(e) => setEditType(e.target.value as MemoryType)}
                            disabled={saving}
                        >
                            {Object.entries(MEMORY_TYPE_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                        <div className="memory-edit-buttons">
                            <button
                                className="memory-btn memory-btn-cancel"
                                onClick={handleCancel}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                className="memory-btn memory-btn-save"
                                onClick={handleSave}
                                disabled={saving || !editContent.trim()}
                            >
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <p className="memory-card-content">{memory.content}</p>
            )}

            {/* Footer / Meta */}
            {!isEditing && (
                <div className="memory-card-meta">
                    <span>Created: {formatDate(memory.created_at)}</span>
                    <span>·</span>
                    <span>Referenced: {memory.reference_count}x</span>
                    {memory.last_referenced_at && (
                        <>
                            <span>·</span>
                            <span>Last: {formatDate(memory.last_referenced_at)}</span>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default MemoryCard;
