import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiCheck, FiChevronRight, FiFlag, FiTag, FiCalendar, FiCpu } from 'react-icons/fi'
import { Draggable } from 'react-beautiful-dnd'
import { Task, TaskPriority } from '@/types'
import { useAppDispatch } from '@hooks/useAppRedux'
import { toggleTaskCompleted, updateTask, deleteTask } from '@features/tasks/tasksSlice'
import SubTaskList from './SubTaskList'

// Helper to get priority color
const getPriorityColor = (priority: TaskPriority) => {
  switch (priority) {
    case TaskPriority.URGENT:
      return 'text-red-600 dark:text-red-500'
    case TaskPriority.HIGH:
      return 'text-orange-600 dark:text-orange-500'
    case TaskPriority.MEDIUM:
      return 'text-blue-600 dark:text-blue-500'
    case TaskPriority.LOW:
      return 'text-green-600 dark:text-green-500'
    default:
      return 'text-blue-600 dark:text-blue-500'
  }
}

interface TaskItemProps {
  task: Task
  index: number
}

const TaskItem: React.FC<TaskItemProps> = ({ task, index }) => {
  const [expanded, setExpanded] = useState(false)
  const [showAISuggestions, setShowAISuggestions] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const dispatch = useAppDispatch()
  
  // Handle auto-remove when task is completed
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    if (task.completed) {
      // Set removing state first for animation
      setIsRemoving(true)
      
      // Then remove after delay
      timeoutId = setTimeout(() => {
        dispatch(deleteTask(task.id))
      }, 800) // Adjust time to match CSS transition duration
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [task.completed, task.id, dispatch])
  
  const toggleExpand = () => {
    setExpanded(!expanded)
  }
  
  const toggleComplete = () => {
    dispatch(toggleTaskCompleted(task.id))
  }
  
  const formattedDate = task.dueDate 
    ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null

  const hasAISuggestions = task.aiSuggestions && task.aiSuggestions.length > 0 && 
    task.aiSuggestions.some(s => !s.applied)

  const handleApplySuggestion = (suggestionId: string) => {
    if (!task.aiSuggestions) return
    
    const suggestion = task.aiSuggestions.find(s => s.id === suggestionId)
    if (!suggestion) return
    
    // Apply the suggestion to the task
    const updatedTask = { ...task }
    
    switch (suggestion.type) {
      case 'priority':
        updatedTask.priority = suggestion.content as TaskPriority
        break
      case 'category': 
        updatedTask.tags = [...task.tags, ...suggestion.content.split(', ')]
        break
      case 'deadline':
        updatedTask.dueDate = suggestion.content
        break
    }
    
    // Mark suggestion as applied
    updatedTask.aiSuggestions = task.aiSuggestions.map(s => 
      s.id === suggestionId ? { ...s, applied: true } : s
    )
    
    dispatch(updateTask(updatedTask))
  }

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`task-item card mb-3 overflow-visible transition-all duration-700 ${
            isRemoving ? 'opacity-0 transform translate-x-full' : 'opacity-100'
          }`}
        >
          <div className="flex items-start">
            <button
              className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 
                ${task.completed 
                  ? 'bg-primary-500 border-primary-500 text-white' 
                  : 'border-secondary-300 dark:border-secondary-600'}`}
              onClick={toggleComplete}
              aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
            >
              {task.completed && <FiCheck size={14} />}
            </button>
            
            <div className="flex-grow min-w-0">
              <div className="flex items-center">
                <h3 
                  className={`font-medium text-lg ${
                    task.completed ? 'line-through text-secondary-500 dark:text-secondary-400' : 'text-secondary-900 dark:text-white'
                  }`}
                >
                  {task.title}
                </h3>
                {hasAISuggestions && (
                  <button 
                    onClick={() => setShowAISuggestions(!showAISuggestions)}
                    className="ml-2 text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
                    title="AI Suggestions available"
                  >
                    <FiCpu size={16} />
                  </button>
                )}
              </div>
              
              {/* Show task details */}
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-secondary-600 dark:text-secondary-400">
                {task.priority && (
                  <span className={`flex items-center ${getPriorityColor(task.priority)}`}>
                    <FiFlag size={14} className="mr-1" />
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </span>
                )}
                
                {formattedDate && (
                  <span className="flex items-center">
                    <FiCalendar size={14} className="mr-1" /> 
                    {formattedDate}
                  </span>
                )}
                
                {task.tags.length > 0 && (
                  <div className="flex items-center flex-wrap gap-1">
                    <FiTag size={14} className="mr-1" />
                    {task.tags.map((tag, i) => (
                      <span 
                        key={i} 
                        className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-300 rounded-full px-2 py-0.5 text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Suggestions */}
              {showAISuggestions && task.aiSuggestions && (
                <div className="mt-3 bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 rounded-md p-3">
                  <h4 className="text-sm font-medium flex items-center text-primary-800 dark:text-primary-300 mb-2">
                    <FiCpu className="mr-2" /> AI Suggestions
                  </h4>
                  <ul className="space-y-2">
                    {task.aiSuggestions.filter(s => !s.applied).map(suggestion => (
                      <li key={suggestion.id} className="flex items-start">
                        <button
                          onClick={() => handleApplySuggestion(suggestion.id)}
                          className="mt-0.5 mr-2 text-xs bg-primary-500 hover:bg-primary-600 text-white px-2 py-0.5 rounded"
                        >
                          Apply
                        </button>
                        <div>
                          <span className="text-sm">
                            {suggestion.type === 'priority' && (
                              <>Set priority to <strong>{suggestion.content}</strong></>
                            )}
                            {suggestion.type === 'category' && (
                              <>Add tag{suggestion.content.includes(',') ? 's' : ''}: <strong>{suggestion.content}</strong></>
                            )}
                            {suggestion.type === 'deadline' && (
                              <>Set deadline to <strong>{new Date(suggestion.content).toLocaleDateString()}</strong></>
                            )}
                            {suggestion.type === 'workflow' && suggestion.content}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {task.description && (
                <p className={`mt-2 text-sm ${
                  task.completed ? 'text-secondary-400 dark:text-secondary-500' : 'text-secondary-600 dark:text-secondary-400'
                }`}>
                  {task.description.length > 100 && !expanded 
                    ? `${task.description.substring(0, 100)}...` 
                    : task.description}
                </p>
              )}
              
              {task.description && task.description.length > 100 && (
                <button 
                  onClick={toggleExpand}
                  className="text-xs text-primary-600 dark:text-primary-400 mt-1"
                >
                  {expanded ? 'Show less' : 'Show more'}
                </button>
              )}
              
              {task.subtasks.length > 0 && (
                <div className="mt-3">
                  <SubTaskList 
                    taskId={task.id} 
                    subtasks={task.subtasks} 
                  />
                </div>
              )}
            </div>
            
            <Link 
              to={`/tasks/${task.id}`}
              className="flex-shrink-0 ml-2 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
              aria-label="View task details"
            >
              <FiChevronRight size={20} />
            </Link>
          </div>
        </div>
      )}
    </Draggable>
  )
}

export default TaskItem 