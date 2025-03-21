import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiCheck, FiClock, FiEdit2, FiTrash2, FiChevronDown, FiChevronUp, FiTag } from 'react-icons/fi'
import { useAppDispatch } from '@hooks/useAppRedux'
import { toggleTaskCompleted, deleteTask, updateTask } from '@features/tasks/tasksSlice'
import { Task, TaskPriority } from '@/types'
import SubTaskList from './SubTaskList'

interface TaskItemProps {
  task: Task
}

const TaskItem = ({ task }: TaskItemProps) => {
  const [expanded, setExpanded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const dispatch = useAppDispatch()

  const handleToggleCompleted = () => {
    dispatch(toggleTaskCompleted(task.id))
  }

  const handleDeleteTask = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      dispatch(deleteTask(task.id))
    }
  }

  const toggleExpand = () => {
    setExpanded(!expanded)
  }

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'bg-green-500'
      case TaskPriority.MEDIUM:
        return 'bg-blue-500'
      case TaskPriority.HIGH:
        return 'bg-yellow-500'
      case TaskPriority.URGENT:
        return 'bg-red-500'
      default:
        return 'bg-blue-500'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  return (
    <div 
      className="card mb-3 transition-all duration-200 hover:shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start">
        <button 
          onClick={handleToggleCompleted}
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 border-secondary-300 dark:border-secondary-600 flex items-center justify-center ${
            task.completed ? 'bg-primary-500 border-primary-500 dark:bg-primary-600 dark:border-primary-600' : ''
          }`}
        >
          {task.completed && <FiCheck className="text-white" size={14} />}
        </button>

        <div className="ml-3 flex-grow">
          <div className="flex items-start justify-between">
            <div>
              <h3 
                className={`font-medium ${
                  task.completed ? 'text-secondary-500 dark:text-secondary-400 line-through' : 'text-secondary-900 dark:text-white'
                }`}
              >
                <Link to={`/tasks/${task.id}`}>{task.title}</Link>
              </h3>
              
              {task.description && (
                <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>
            
            <div className="flex items-center ml-4 space-x-2">
              {isHovered && (
                <>
                  <Link
                    to={`/tasks/${task.id}/edit`}
                    className="text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-300"
                  >
                    <FiEdit2 size={16} />
                  </Link>
                  <button
                    onClick={handleDeleteTask}
                    className="text-secondary-500 hover:text-red-500 dark:text-secondary-400 dark:hover:text-red-400"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </>
              )}
              <button
                onClick={toggleExpand}
                className="text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-300"
              >
                {expanded ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center mt-2 text-xs text-secondary-500 dark:text-secondary-400 gap-3">
            {task.dueDate && (
              <div className="flex items-center">
                <FiClock size={14} className="mr-1" />
                <span>{formatDate(task.dueDate)}</span>
              </div>
            )}
            
            <div className="flex items-center">
              <span className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)} mr-1`}></span>
              <span className="capitalize">{task.priority}</span>
            </div>
            
            {task.tags.length > 0 && (
              <div className="flex items-center flex-wrap gap-1">
                <FiTag size={14} className="mr-1" />
                {task.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="bg-secondary-200 dark:bg-secondary-700 px-2 py-0.5 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pl-9">
          {task.subtasks.length > 0 ? (
            <SubTaskList taskId={task.id} subtasks={task.subtasks} />
          ) : (
            <p className="text-sm text-secondary-500 dark:text-secondary-400">No subtasks</p>
          )}
          
          {task.aiSuggestions && task.aiSuggestions.length > 0 && (
            <div className="mt-3 border-t border-secondary-200 dark:border-secondary-700 pt-3">
              <h4 className="text-sm font-medium text-secondary-900 dark:text-white mb-2">AI Suggestions</h4>
              <ul className="space-y-2">
                {task.aiSuggestions.map(suggestion => (
                  <li 
                    key={suggestion.id}
                    className="text-sm bg-secondary-100 dark:bg-secondary-800 p-2 rounded-md"
                  >
                    <p className="text-secondary-800 dark:text-secondary-300 mb-1">
                      <span className="font-medium capitalize">{suggestion.type}</span>: {suggestion.content}
                    </p>
                    {!suggestion.applied && (
                      <button 
                        className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                        onClick={() => {
                          // Apply suggestion logic will be implemented in a separate component
                        }}
                      >
                        Apply suggestion
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TaskItem 