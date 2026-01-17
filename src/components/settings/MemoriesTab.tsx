import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../auth';
import { useToast } from '../Toast';
import { useConfirm } from '../ConfirmDialog';
import MemoryCard from './MemoryCard';
import LoadingSpinner from '../loadingSpinner';
import {
    MEMORY_TYPE_LABELS } from '../../types';

import type {
    Memory,
    MemoryType,
    MemoriesResponse,
    StaleMemoriesResponse,
} from '../../types';

import {
    AlertIcon,
    PlusIcon,
    CheckIcon,
    TrashIcon,
} from '../../assets/svg/memories';

const MemoriesTab: React.FC = () => {
    const api = useApi();
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    // State
    const [memories, setMemories] = useState<Memory[]>([]);
    const [staleMemories, setStaleMemories] = useState<Memory[]>([]);
    const [loading, setLoading] = useState(true);
    const [staleCount, setStaleCount] = useState(0);
    const [filterType, setFilterType] = useState<MemoryType | 'all'>('all');
    const [isStaleMode, setIsStaleMode] = useState(false);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newContent, setNewContent] = useState('');
    const [newType, setNewType] = useState<MemoryType>('fact');
    const [savingNew, setSavingNew] = useState(false);

    // Load memories
    const loadMemories = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (filterType !== 'all') {
                params.append('memory_type', filterType);
            }

            const data = await api.get<MemoriesResponse>(`/memories?${params.toString()}`);
            setMemories(data.memories);
        } catch (error) {
            console.error('Failed to load memories:', error);
            showToast('Failed to load memories', 'error');
        }
    }, [api, filterType, showToast]);

    // Load stale count (for banner)
    const loadStaleCount = useCallback(async () => {
        try {
            const data = await api.get<StaleMemoriesResponse>('/memories/stale');
            setStaleCount(data.count);
            setStaleMemories(data.memories);
        } catch (error) {
            console.error('Failed to load stale count:', error);
        }
    }, [api]);

    // Initial load
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await Promise.all([loadMemories(), loadStaleCount()]);
            setLoading(false);
        };
        load();
    }, [loadMemories, loadStaleCount]);

    // Reload when filter changes
    useEffect(() => {
        if (!loading) {
            loadMemories();
        }
    }, [filterType]);

    // Handlers
    const handleUpdate = async (id: number, updates: { content?: string; memory_type?: MemoryType }) => {
        try {
            await api.patch(`/memories/${id}`, updates);
            showToast('Memory updated', 'success');

            // Update local state
            setMemories((prev) =>
                prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
            );

            if (isStaleMode) {
                setStaleMemories((prev) =>
                    prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
                );
            }
        } catch (error) {
            console.error('Failed to update memory:', error);
            showToast('Failed to update memory', 'error');
            throw error;
        }
    };

    const handleDelete = async (id: number) => {
        const confirmed = await confirm({
            title: 'Delete Memory',
            message: 'Are you sure you want to delete this memory? This cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            variant: 'danger',
        });

        if (!confirmed) return;

        try {
            await api.delete(`/memories/${id}`);
            showToast('Memory deleted', 'success');

            // Update local state
            setMemories((prev) => prev.filter((m) => m.id !== id));
            setStaleMemories((prev) => prev.filter((m) => m.id !== id));
            setStaleCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to delete memory:', error);
            showToast('Failed to delete memory', 'error');
            throw error;
        }
    };

    const handleRefresh = async (id: number) => {
        try {
            await api.post(`/memories/${id}/refresh`, {});
            showToast('Memory marked as relevant', 'success');

            // Update local state - remove stale flag
            setMemories((prev) =>
                prev.map((m) =>
                    m.id === id
                        ? { ...m, is_stale: false, last_referenced_at: new Date().toISOString() }
                        : m
                )
            );

            // Remove from stale list
            setStaleMemories((prev) => prev.filter((m) => m.id !== id));
            setStaleCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to refresh memory:', error);
            showToast('Failed to refresh memory', 'error');
            throw error;
        }
    };

    const handleKeepAll = async () => {
        const confirmed = await confirm({
            title: 'Keep All Stale Memories',
            message: `Mark all ${staleMemories.length} stale memories as still relevant?`,
            confirmText: 'Keep All',
            cancelText: 'Cancel',
            variant: 'default',
        });

        if (!confirmed) return;

        try {
            await Promise.all(staleMemories.map((m) => api.post(`/memories/${m.id}/refresh`, {})));
            showToast(`${staleMemories.length} memories marked as relevant`, 'success');

            // Update state
            setMemories((prev) =>
                prev.map((m) => ({
                    ...m,
                    is_stale: false,
                    last_referenced_at: new Date().toISOString(),
                }))
            );
            setStaleMemories([]);
            setStaleCount(0);
            setIsStaleMode(false);
        } catch (error) {
            console.error('Failed to keep all memories:', error);
            showToast('Failed to update some memories', 'error');
        }
    };

    const handleDeleteAll = async () => {
        const confirmed = await confirm({
            title: 'Delete All Stale Memories',
            message: `Permanently delete all ${staleMemories.length} stale memories? This cannot be undone.`,
            confirmText: 'Delete All',
            cancelText: 'Cancel',
            variant: 'danger',
        });

        if (!confirmed) return;

        try {
            await Promise.all(staleMemories.map((m) => api.delete(`/memories/${m.id}`)));
            showToast(`${staleMemories.length} memories deleted`, 'success');

            // Update state
            const staleIds = new Set(staleMemories.map((m) => m.id));
            setMemories((prev) => prev.filter((m) => !staleIds.has(m.id)));
            setStaleMemories([]);
            setStaleCount(0);
            setIsStaleMode(false);
        } catch (error) {
            console.error('Failed to delete all memories:', error);
            showToast('Failed to delete some memories', 'error');
        }
    };

    const handleAddNew = async () => {
        if (!newContent.trim()) return;

        setSavingNew(true);
        try {
            const newMemory = await api.post<Memory>('/memories', {
                content: newContent.trim(),
                memory_type: newType,
            });
            showToast('Memory created', 'success');

            // Add to list
            setMemories((prev) => [newMemory, ...prev]);
            setNewContent('');
            setNewType('fact');
            setIsAddingNew(false);
        } catch (error) {
            console.error('Failed to create memory:', error);
            showToast('Failed to create memory', 'error');
        } finally {
            setSavingNew(false);
        }
    };

    // Display list
    const displayMemories = isStaleMode ? staleMemories : memories;

    if (loading) {
        return (
            <div className="memories-loading">
                <LoadingSpinner size="small" message="Loading memories..." variant="secondary" />
            </div>
        );
    }

    return (
        <div className="memories-tab">
            {/* Stale Warning Banner */}
            {staleCount > 0 && !isStaleMode && (
                <div className="memories-stale-banner">
                    <div className="memories-stale-banner-content">
                        <span className="memories-stale-banner-icon">
                            <AlertIcon size={20} />
                        </span>
                        <span className="memories-stale-banner-text">
                            {staleCount} {staleCount === 1 ? 'memory hasn\'t' : 'memories haven\'t'} been used in 90+ days
                        </span>
                    </div>
                    <button
                        className="memories-stale-banner-btn"
                        onClick={() => setIsStaleMode(true)}
                    >
                        Review Stale
                    </button>
                </div>
            )}

            {/* Actions Bar */}
            <div className="memories-actions-bar">
                {isStaleMode ? (
                    <>
                        <button
                            className="memories-back-btn"
                            onClick={() => setIsStaleMode(false)}
                        >
                            ← Back to All
                        </button>
                        <div className="memories-bulk-actions">
                            <button
                                className="memory-btn memory-btn-keep"
                                onClick={handleKeepAll}
                                disabled={staleMemories.length === 0}
                            >
                                <CheckIcon size={14} />
                                Keep All
                            </button>
                            <button
                                className="memory-btn memory-btn-delete-all"
                                onClick={handleDeleteAll}
                                disabled={staleMemories.length === 0}
                            >
                                <TrashIcon size={14} />
                                Delete All
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <button
                            className="memories-add-btn"
                            onClick={() => setIsAddingNew(true)}
                            disabled={isAddingNew}
                        >
                            <PlusIcon size={14} />
                            Add Memory
                        </button>
                        <div className="memories-filter">
                            <label>Filter:</label>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as MemoryType | 'all')}
                            >
                                <option value="all">All Types</option>
                                {Object.entries(MEMORY_TYPE_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </>
                )}
            </div>

            {/* Add New Memory Form */}
            {isAddingNew && (
                <div className="memory-card memory-card-new">
                    <div className="memory-card-header">
                        <span className="memory-card-title">New Memory</span>
                    </div>
                    <div className="memory-card-edit">
                        <textarea
                            className="memory-edit-textarea"
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                            placeholder="Enter memory content..."
                            rows={3}
                            disabled={savingNew}
                            autoFocus
                        />
                        <div className="memory-edit-controls">
                            <select
                                className="memory-edit-select"
                                value={newType}
                                onChange={(e) => setNewType(e.target.value as MemoryType)}
                                disabled={savingNew}
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
                                    onClick={() => {
                                        setIsAddingNew(false);
                                        setNewContent('');
                                        setNewType('fact');
                                    }}
                                    disabled={savingNew}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="memory-btn memory-btn-save"
                                    onClick={handleAddNew}
                                    disabled={savingNew || !newContent.trim()}
                                >
                                    {savingNew ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Memory List */}
            <div className="memories-list">
                {displayMemories.length === 0 ? (
                    <div className="memories-empty">
                        {isStaleMode ? (
                            <p>No stale memories to review!</p>
                        ) : filterType !== 'all' ? (
                            <p>No memories of type "{MEMORY_TYPE_LABELS[filterType]}" found.</p>
                        ) : (
                            <p>No memories yet. Atlas will save important facts as you chat.</p>
                        )}
                    </div>
                ) : (
                    displayMemories.map((memory) => (
                        <MemoryCard
                            key={memory.id}
                            memory={memory}
                            onUpdate={handleUpdate}
                            onDelete={handleDelete}
                            onRefresh={handleRefresh}
                            isStaleMode={isStaleMode}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default MemoriesTab;
