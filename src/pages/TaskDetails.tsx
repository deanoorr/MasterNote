import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@hooks/useAppRedux'
import { updateTask, deleteTask } from '@features/tasks/tasksSlice'
import { FiArrowLeft, FiClock, FiTag, FiCalendar, FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi'
import { TaskPriority } from '@/types'

const TaskDetails = () => {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  
  const { tasks } = useAppSelector(state => state.tasks)
  const { projects } = useAppSelector(state => state.projects)
  
  const task = tasks.find(t => t.id === taskId)
  const project = task?.projectId ? projects.find(p => p.id === task.projectId) : null
  
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  
  useEffect(() => {
    if (task) {
      setEditTitle(task.title)
      setEditDescription(task.description)
    }
  }, [task])
  
  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2">Task not found</h2>
          <p className="text-secondary-600 dark:text-secondary-400 mb-6">The task you're looking for doesn't exist or has been deleted.</p>
          <button 
            onClick={() => navigate(-1)}
            className="btn btn-primary"
          >
            <FiArrowLeft className="mr-2" />
            Go back
          </button>
        </div>
      </div>
    )
  }
  
  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      dispatch(updateTask({
        id: task.id,
        title: editTitle,
        description: editDescription
      }))
      setIsEditing(false)
    }
  }
  
  const handleToggleComplete = () => {
    dispatch(updateTask({
      id: task.id,
      completed: !task.completed
    }))
  }
  
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      dispatch(deleteTask(task.id))
      navigate('/tasks')
    }
  }
  
  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case TaskPriority.MEDIUM:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case TaskPriority.HIGH:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      case TaskPriority.URGENT:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-secondary-100 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-300'
    }
  }
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-2 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800"
        >
          <FiArrowLeft className="text-secondary-500 dark:text-secondary-400" />
        </button>
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-white flex-grow">
          Task Details
        </h1>
        
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="btn btn-secondary flex items-center"
              >
                <FiX className="mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="btn btn-primary flex items-center"
                disabled={!editTitle.trim()}
              >
                <FiCheck className="mr-2" />
                Save
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-secondary flex items-center"
              >
                <FiEdit2 className="mr-2" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-danger flex items-center"
              >
                <FiTrash2 className="mr-2" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="card p-6 mb-6 flex-grow overflow-auto">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="input w-full"
                placeholder="Task title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Description
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="input w-full min-h-[100px]"
                placeholder="Task description (optional)"
                rows={4}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center mb-6">
              <div 
                className="flex-shrink-0 w-6 h-6 rounded-md border-2 border-secondary-300 dark:border-secondary-600 cursor-pointer flex items-center justify-center"
                onClick={handleToggleComplete}
              >
                {task.completed && (
                  <FiCheck className="text-primary-600 dark:text-primary-400" />
                )}
              </div>
              <h2 className={`ml-3 text-2xl font-semibold ${task.completed ? 'line-through text-secondary-500 dark:text-secondary-400' : 'text-secondary-900 dark:text-white'}`}>
                {task.title}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-3">
                  Details
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      <FiClock className="mr-1" />
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                    </div>
                  </div>
                  
                  {task.dueDate && (
                    <div className="flex items-center text-secondary-700 dark:text-secondary-300">
                      <FiCalendar className="mr-2" />
                      <span>Due {formatDate(task.dueDate)}</span>
                    </div>
                  )}
                  
                  {project && (
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: project.color }}
                      ></div>
                      <span className="text-secondary-700 dark:text-secondary-300">
                        {project.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {task.tags && task.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-3">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map(tag => (
                      <div
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-300"
                      >
                        <FiTag className="mr-1" />
                        {tag}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {task.description && (
              <div>
                <h3 className="text-sm font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-3">
                  Description
                </h3>
                <div className="prose max-w-none text-secondary-700 dark:text-secondary-300">
                  {task.description.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-4' : ''}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )}
            
            {task.subtasks && task.subtasks.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-3">
                  Subtasks
                </h3>
                <ul className="space-y-2">
                  {task.subtasks.map(subtask => (
                    <li key={subtask.id} className="flex items-center">
                      <div className="flex-shrink-0 w-5 h-5 rounded-md border-2 border-secondary-300 dark:border-secondary-600 flex items-center justify-center">
                        {subtask.completed && (
                          <FiCheck className="text-primary-600 dark:text-primary-400 h-3 w-3" />
                        )}
                      </div>
                      <span className={`ml-2 ${subtask.completed ? 'line-through text-secondary-500 dark:text-secondary-400' : 'text-secondary-700 dark:text-secondary-300'}`}>
                        {subtask.title}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default TaskDetails 