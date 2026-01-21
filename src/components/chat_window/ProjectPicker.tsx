/**
 * ProjectPicker - Multi-select project picker for moving conversations
 */

import React, { useState } from 'react';
import { Folder, Check, Plus } from 'lucide-react';
import type { ConversationProject } from '../../types';

interface ProjectPickerProps {
    projects: ConversationProject[];
    selectedProjectIds: number[];
    onChange: (projectIds: number[]) => void;
    onCreateNew?: () => void;
}

const ProjectPicker: React.FC<ProjectPickerProps> = ({
    projects,
    selectedProjectIds,
    onChange,
    onCreateNew,
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleToggle = (projectId: number) => {
        if (selectedProjectIds.includes(projectId)) {
            onChange(selectedProjectIds.filter(id => id !== projectId));
        } else {
            onChange([...selectedProjectIds, projectId]);
        }
    };

    const getProjectColor = (color: string | null): string => {
        return color || '#6366f1';
    };

    return (
        <div className="project-picker">
            {/* Search */}
            <div className="project-picker-search">
                <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="project-picker-input"
                />
            </div>

            {/* Project List */}
            <div className="project-picker-list">
                {filteredProjects.length === 0 && searchQuery && (
                    <div className="project-picker-empty">
                        No projects match "{searchQuery}"
                    </div>
                )}

                {filteredProjects.length === 0 && !searchQuery && (
                    <div className="project-picker-empty">
                        No projects yet
                    </div>
                )}

                {filteredProjects.map((project) => {
                    const isSelected = selectedProjectIds.includes(project.id);
                    
                    return (
                        <button
                            key={project.id}
                            className={`project-picker-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleToggle(project.id)}
                            type="button"
                        >
                            <div 
                                className="project-picker-icon"
                                style={{ backgroundColor: getProjectColor(project.color) }}
                            >
                                <Folder size={14} />
                            </div>
                            
                            <div className="project-picker-info">
                                <span className="project-picker-name">{project.name}</span>
                                {project.description && (
                                    <span className="project-picker-description">
                                        {project.description}
                                    </span>
                                )}
                            </div>

                            <div className={`project-picker-checkbox ${isSelected ? 'checked' : ''}`}>
                                {isSelected && <Check size={12} />}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Create New Project */}
            {onCreateNew && (
                <button
                    className="project-picker-create"
                    onClick={onCreateNew}
                    type="button"
                >
                    <Plus size={16} />
                    <span>Create new project</span>
                </button>
            )}

            {/* Selected count */}
            {selectedProjectIds.length > 0 && (
                <div className="project-picker-footer">
                    {selectedProjectIds.length} project{selectedProjectIds.length !== 1 ? 's' : ''} selected
                </div>
            )}
        </div>
    );
};

export default ProjectPicker;
