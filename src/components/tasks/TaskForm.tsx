import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiCalendar, FiTag, FiHash, FiCpu } from 'react-icons/fi'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useAppDispatch, useAppSelector } from '@hooks/useAppRedux'
import { addTask, updateTask, addAISuggestion } from '@features/tasks/tasksSlice'
import { analyzeTaskWithAI } from '@services/ai'
import { Task, TaskPriority, Project } from '@/types'

interface TaskFormProps {
  task?: Task
  projectId?: string | null
  onSubmit?: () => void
}

const TaskForm = ({ task, projectId, onSubmit }: TaskFormProps) => {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || TaskPriority.MEDIUM)
  const [dueDate, setDueDate] = useState<Date | null>(task?.dueDate ? new Date(task.dueDate) : null)
  const [selectedProject, setSelectedProject] = useState<string | null>(task?.projectId || projectId || null)
  const [tags, setTags] = useState<string[]>(task?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  const { projects } = useAppSelector(state => state.projects)
  const { apiKey, provider, model, features } = useAppSelector(state => state.aiSettings)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  
  const isEditing = !!task
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const taskData = {
      title,
      description,
      priority,
      dueDate: dueDate ? dueDate.toISOString() : null,
      projectId: selectedProject,
      tags,
      completed: task?.completed || false,
      subtasks: task?.subtasks || [],
    }
    
    if (isEditing) {
      dispatch(updateTask({
        id: task.id,
        ...taskData
      }))
    } else {
      dispatch(addTask(taskData))
    }
    
    if (onSubmit) {
      onSubmit()
    } else {
      navigate('/tasks')
    }
  }
  
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()])
      }
      
      setTagInput('')
    }
  }
  
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }
  
  const handleAIAnalysis = async () => {
    if (!apiKey || !title) return
    
    setIsAnalyzing(true)
    
    try {
      const result = await analyzeTaskWithAI(
        {
          id: task?.id || 'temp-id',
          title,
          description,
          priority,
          dueDate: dueDate ? dueDate.toISOString() : null,
          projectId: selectedProject,
          tags,
          completed: false,
          createdAt: new Date().toISOString(),
          subtasks: [],
          position: 0
        },
        { apiKey, provider, model, features }
      )
      
      if (result.success && result.data) {
        // Apply tags if available
        if (features.taskCategorization && result.data.tags) {
          const newTags = Array.isArray(result.data.tags) ? result.data.tags : [result.data.tags]
          
          for (const tag of newTags) {
            if (!tags.includes(tag)) {
              setTags(prevTags => [...prevTags, tag])
            }
          }
          
          if (isEditing && task.id) {
            dispatch(addAISuggestion({
              taskId: task.id,
              type: 'category',
              content: newTags.join(', ')
            }))
          }
        }
        
        // Suggest priority if available
        if (features.prioritization && result.data.priority && Object.values(TaskPriority).includes(result.data.priority as TaskPriority)) {
          setPriority(result.data.priority as TaskPriority)
          
          if (isEditing && task.id) {
            dispatch(addAISuggestion({
              taskId: task.id,
              type: 'priority',
              content: result.data.priority
            }))
          }
        }
        
        // Suggest deadline if available
        if (features.suggestions && result.data.deadline && !dueDate) {
          try {
            const suggestedDate = new Date(result.data.deadline)
            if (!isNaN(suggestedDate.getTime())) {
              setDueDate(suggestedDate)
              
              if (isEditing && task.id) {
                dispatch(addAISuggestion({
                  taskId: task.id,
                  type: 'deadline',
                  content: suggestedDate.toISOString()
                }))
              }
            }
          } catch (e) {
            console.error('Error parsing suggested deadline:', e)
          }
        }
      }
    } catch (error) {
      console.error('Error analyzing task:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-secondary-900 dark:text-white mb-1">
          Task Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input"
          placeholder="Enter task title"
          required
        />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-secondary-900 dark:text-white mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input min-h-[120px]"
          placeholder="Enter task description"
          rows={4}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-secondary-900 dark:text-white mb-1">
            Priority
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="input"
          >
            <option value={TaskPriority.LOW}>Low</option>
            <option value={TaskPriority.MEDIUM}>Medium</option>
            <option value={TaskPriority.HIGH}>High</option>
            <option value={TaskPriority.URGENT}>Urgent</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-secondary-900 dark:text-white mb-1">
            Due Date
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FiCalendar className="text-secondary-400 dark:text-secondary-500" />
            </div>
            <input
              type="date"
              value={dueDate ? dueDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value) : null)}
              className="input pl-10"
            />
          </div>
        </div>
      </div>
      
      <div>
        <label htmlFor="project" className="block text-sm font-medium text-secondary-900 dark:text-white mb-1">
          Project
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FiHash className="text-secondary-400 dark:text-secondary-500" />
          </div>
          <select
            id="project"
            value={selectedProject || ''}
            onChange={(e) => setSelectedProject(e.target.value || null)}
            className="input pl-10"
          >
            <option value="">No Project</option>
            {projects.map((project: Project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-secondary-900 dark:text-white mb-1">
          Tags
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FiTag className="text-secondary-400 dark:text-secondary-500" />
          </div>
          <input
            id="tags"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            className="input pl-10"
            placeholder="Add a tag and press Enter"
          />
        </div>
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-primary-500 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-800"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      
      {apiKey && (
        <div>
          <button
            type="button"
            onClick={handleAIAnalysis}
            disabled={isAnalyzing || !title}
            className="flex items-center justify-center w-full btn btn-secondary mb-6"
          >
            <FiCpu className="mr-2" />
            {isAnalyzing ? 'Analyzing...' : 'Analyze with AI Assistant'}
          </button>
        </div>
      )}
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => navigate('/tasks')}
          className="btn btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!title}
          className="btn btn-primary"
        >
          {isEditing ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </form>
  )
}

export default TaskForm 