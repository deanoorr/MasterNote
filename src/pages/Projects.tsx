import { useState, useMemo } from 'react'
import { FiPlus, FiFolder, FiEdit2, FiTrash2 } from 'react-icons/fi'
import { useAppSelector, useAppDispatch } from '@hooks/useAppRedux'
import { addProject, updateProject, deleteProject } from '@features/projects/projectsSlice'
import { Link } from 'react-router-dom'
import { Project } from '@/types'

const Projects = () => {
  const { projects } = useAppSelector(state => state.projects)
  const { tasks } = useAppSelector(state => state.tasks)
  const dispatch = useAppDispatch()
  
  const [showNewForm, setShowNewForm] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectColor, setNewProjectColor] = useState('#3B82F6') // Default blue
  const [editingProject, setEditingProject] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  
  // Calculate task counts for each project
  const projectTaskCounts = useMemo(() => {
    const counts: Record<string, { total: number, completed: number }> = {};
    
    projects.forEach((project: Project) => {
      counts[project.id] = { total: 0, completed: 0 };
    });
    
    tasks.forEach((task) => {
      if (task.projectId && counts[task.projectId]) {
        counts[task.projectId].total++;
        if (task.completed) {
          counts[task.projectId].completed++;
        }
      }
    });
    
    return counts;
  }, [projects, tasks]);
  
  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      dispatch(addProject({
        name: newProjectName.trim(),
        color: newProjectColor,
        description: ''
      }));
      setNewProjectName('');
      setNewProjectColor('#3B82F6');
      setShowNewForm(false);
    }
  };
  
  const handleStartEdit = (project: Project) => {
    setEditingProject(project.id);
    setEditName(project.name);
    setEditColor(project.color);
  };
  
  const handleSaveEdit = () => {
    if (editingProject && editName.trim()) {
      dispatch(updateProject({
        id: editingProject,
        name: editName.trim(),
        color: editColor
      }));
      setEditingProject(null);
    }
  };
  
  const handleDeleteProject = (id: string) => {
    if (window.confirm('Are you sure you want to delete this project? This will not delete the tasks in this project.')) {
      dispatch(deleteProject(id));
    }
  };
  
  const colorOptions = [
    { color: '#EF4444', name: 'Red' },
    { color: '#F97316', name: 'Orange' },
    { color: '#F59E0B', name: 'Amber' },
    { color: '#84CC16', name: 'Lime' },
    { color: '#10B981', name: 'Emerald' },
    { color: '#06B6D4', name: 'Cyan' },
    { color: '#3B82F6', name: 'Blue' },
    { color: '#8B5CF6', name: 'Violet' },
    { color: '#EC4899', name: 'Pink' },
  ];
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Projects</h1>
        <button 
          onClick={() => setShowNewForm(true)}
          className="btn btn-primary flex items-center"
        >
          <FiPlus className="mr-2" />
          New Project
        </button>
      </div>
      
      {showNewForm && (
        <div className="card mb-6 p-4">
          <h2 className="text-lg font-semibold mb-4">Create New Project</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="input w-full"
                placeholder="Enter project name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((option) => (
                  <div 
                    key={option.color}
                    onClick={() => setNewProjectColor(option.color)}
                    className={`h-8 w-8 rounded-full cursor-pointer flex items-center justify-center border-2 ${
                      newProjectColor === option.color ? 'border-secondary-600 dark:border-white' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: option.color }}
                    title={option.name}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setShowNewForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateProject}
                className="btn btn-primary"
                disabled={!newProjectName.trim()}
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.length === 0 ? (
          <div className="col-span-full text-center p-8 border border-dashed border-secondary-300 dark:border-secondary-700 rounded-lg">
            <FiFolder className="mx-auto h-12 w-12 text-secondary-400 dark:text-secondary-600" />
            <h3 className="mt-2 text-sm font-medium text-secondary-900 dark:text-white">No projects</h3>
            <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">Get started by creating a new project.</p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowNewForm(true)}
                className="btn btn-primary"
              >
                <FiPlus className="mr-2 h-4 w-4" />
                New Project
              </button>
            </div>
          </div>
        ) : (
          projects.map((project: Project) => (
            <div 
              key={project.id} 
              className="card overflow-hidden"
            >
              {editingProject === project.id ? (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                      Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((option) => (
                        <div 
                          key={option.color}
                          onClick={() => setEditColor(option.color)}
                          className={`h-8 w-8 rounded-full cursor-pointer flex items-center justify-center border-2 ${
                            editColor === option.color ? 'border-secondary-600 dark:border-white' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: option.color }}
                          title={option.name}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button 
                      onClick={() => setEditingProject(null)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveEdit}
                      className="btn btn-primary"
                      disabled={!editName.trim()}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="h-2" style={{ backgroundColor: project.color }}></div>
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                        {project.name}
                      </h3>
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => handleStartEdit(project)}
                          className="p-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteProject(project.id)}
                          className="p-1 text-secondary-400 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-2 flex items-center text-sm text-secondary-500 dark:text-secondary-400">
                      <div className="flex-1">
                        {projectTaskCounts[project.id]?.total || 0} tasks
                        {projectTaskCounts[project.id]?.total > 0 && (
                          <span className="ml-2">
                            ({projectTaskCounts[project.id]?.completed || 0} completed)
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {project.description && (
                      <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
                        {project.description}
                      </p>
                    )}
                    
                    <div className="mt-4">
                      <Link
                        to={`/tasks?projectId=${project.id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        View Tasks
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Projects; 