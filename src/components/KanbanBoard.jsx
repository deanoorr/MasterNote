
import React, { useMemo } from 'react';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { MoreVertical, Calendar, Clock, Edit2, Trash2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("KanbanBoard Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 bg-red-50 text-red-900 border border-red-200 rounded m-4">
                    <h2 className="font-bold">Kanban Board Crashed</h2>
                    <pre className="mt-2 text-xs overflow-auto">{this.state.error && this.state.error.toString()}</pre>
                    <pre className="mt-2 text-xs overflow-auto">{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}

// --- Sortable Item Component ---
function SortableTaskItem({ task, project, onEdit, onDelete }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date)) return dateStr;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none mb-3">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all cursor-grab active:cursor-grabbing"
            >
                <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                        {project && (
                            <span
                                className="inline-block text-[10px] px-2 py-0.5 rounded-full mb-2 font-medium"
                                style={{ backgroundColor: `${project.color}20`, color: project.color }}
                            >
                                {project.name}
                            </span>
                        )}
                        <h3 className={`font-medium text-sm text-zinc-800 dark:text-zinc-100 ${task.status === 'completed' ? 'line-through text-zinc-400 dark:text-zinc-600' : ''}`}>
                            {task.title}
                        </h3>
                        {task.description && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                                {task.description}
                            </p>
                        )}

                        <div className="flex items-center gap-2 mt-3 text-xs text-zinc-400">
                            {task.date && (
                                <span className="flex items-center gap-1">
                                    <Calendar size={12} /> {formatDisplayDate(task.date)}
                                </span>
                            )}
                            {task.priority === 'high' && <span className="text-rose-500 font-bold">!!!</span>}
                            {task.priority === 'medium' && <span className="text-orange-500 font-bold">!!</span>}

                        </div>
                    </div>
                </div>

                {/* Hover Actions (Desktop) */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-500"
                    >
                        <Edit2 size={12} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-rose-500"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// --- Column Component ---
function KanbanColumn({ id, title, tasks, projects, onEdit, onDelete }) {
    // Use useDroppable instead of useSortable for fixed columns
    const { setNodeRef } = useDroppable({ id: id });

    return (
        <div ref={setNodeRef} className="flex-1 min-w-[300px] flex flex-col h-full bg-zinc-50/50 dark:bg-black/20 rounded-2xl border border-zinc-200/50 dark:border-white/5 backdrop-blur-sm p-3">
            <div className="flex items-center justify-between mb-4 px-2 pt-2">
                <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    {title}
                    <span className="bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] px-2 py-0.5 rounded-full">
                        {tasks.length}
                    </span>
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-1">
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => {
                        const project = projects.find(p => p.id === task.projectId);
                        return (
                            <SortableTaskItem
                                key={task.id}
                                task={task}
                                project={project}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        );
                    })}
                </SortableContext>
                {tasks.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-center text-xs text-zinc-400">
                        No tasks
                    </div>
                )}
            </div>
        </div>
    );
}

function KanbanBoardContent({ tasks = [], projects = [], onUpdateStatus, onEdit, onDelete }) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const safeProjects = Array.isArray(projects) ? projects : [];

    const columns = useMemo(() => ({
        pending: safeTasks.filter(t => !t.status || t.status === 'pending'),
        in_progress: safeTasks.filter(t => t.status === 'in_progress'),
        completed: safeTasks.filter(t => t.status === 'completed')
    }), [safeTasks]);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        const activeTask = safeTasks.find(t => t.id === activeId);
        if (!activeTask) return;

        let newStatus = null;
        if (['pending', 'in_progress', 'completed'].includes(overId)) {
            newStatus = overId;
        } else {
            const overTask = safeTasks.find(t => t.id === overId);
            if (overTask) {
                newStatus = overTask.status;
            }
        }

        if (newStatus && activeTask.status !== newStatus) {
            onUpdateStatus(activeId, newStatus);
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-full gap-6 overflow-x-auto pb-4 items-start">
                <KanbanColumn
                    id="pending"
                    title="To Do"
                    tasks={columns.pending}
                    projects={safeProjects}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
                <KanbanColumn
                    id="in_progress"
                    title="In Progress"
                    tasks={columns.in_progress}
                    projects={safeProjects}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
                <KanbanColumn
                    id="completed"
                    title="Done"
                    tasks={columns.completed}
                    projects={safeProjects}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            </div>
        </DndContext>
    );
}

export default function KanbanBoard(props) {
    return (
        <ErrorBoundary>
            <KanbanBoardContent {...props} />
        </ErrorBoundary>
    );
}
