import { useState, useRef, useEffect } from 'react'
import { FiSend, FiSettings, FiLoader, FiCpu, FiZap, FiClock, FiTag, FiFlag, FiPlus, FiCheckSquare } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@hooks/useAppRedux'
import { addTask } from '@features/tasks/tasksSlice'
import { TaskPriority } from '@/types'
import { analyzeTaskWithAI } from '@services/ai'
import TaskList from '@components/tasks/TaskList'

const AIAssistant = () => {
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { 
      role: 'assistant', 
      content: 'Hello! I\'m your AI task assistant. I can help you create tasks, analyze them, and suggest improvements. What would you like to do today?' 
    }
  ])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
  const { apiKey, provider, model, features } = useAppSelector(state => state.aiSettings)
  const { tasks } = useAppSelector(state => state.tasks)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [conversation])
  
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim() || isProcessing) return
    
    // Update conversation with user message
    const userMessage = input.trim()
    setConversation(prev => [...prev, { role: 'user', content: userMessage }])
    setInput('')
    setIsProcessing(true)
    
    // Check if we have an API key
    if (!apiKey) {
      setConversation(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: 'I need an API key to help you with AI features. Would you like to go to the settings page to set up your AI integration?' 
        }
      ])
      setIsProcessing(false)
      return
    }
    
    try {
      // Detect task creation intent
      if (detectTaskCreationIntent(userMessage)) {
        // Try to parse the task from natural language
        const taskInfo = await processTaskCreation(userMessage)
        
        setConversation(prev => [
          ...prev, 
          { 
            role: 'assistant', 
            content: `I've created a task "${taskInfo.title}" for you. ${
              taskInfo.priority !== TaskPriority.MEDIUM ? `I've set the priority to ${taskInfo.priority}.` : ''
            } ${
              taskInfo.dueDate ? `It's due on ${new Date(taskInfo.dueDate).toLocaleDateString()}.` : ''
            } ${
              taskInfo.tags.length > 0 ? `I've added the following tags: ${taskInfo.tags.join(', ')}.` : ''
            }` 
          }
        ])
      } else {
        // Generic response for other queries
        setConversation(prev => [
          ...prev, 
          { 
            role: 'assistant', 
            content: `I can help you with task management. Try asking me to create a task, for example:
            
"Create a task to finish the presentation by Friday"
"Add a high priority task to call John about the meeting"
"I need to buy groceries tomorrow"

I'll understand what you mean and create the appropriate task with all the details.` 
          }
        ])
      }
    } catch (error) {
      console.error('Error processing message:', error)
      setConversation(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error while processing your request. Please try again.' 
        }
      ])
    } finally {
      setIsProcessing(false)
    }
  }
  
  const detectTaskCreationIntent = (message: string): boolean => {
    const taskCreationPatterns = [
      /create\s+(?:a\s+)?task/i,
      /add\s+(?:a\s+)?task/i,
      /remind\s+(?:me\s+)?to/i,
      /need\s+to/i,
      /have\s+to/i,
      /should/i,
    ]
    
    return taskCreationPatterns.some(pattern => pattern.test(message))
  }
  
  const processTaskCreation = async (message: string) => {
    // Default task values
    const taskData = {
      title: "",
      description: "",
      priority: TaskPriority.MEDIUM,
      dueDate: null as string | null,
      projectId: null,
      tags: [],
      completed: false,
      subtasks: [],
    }
    
    try {
      // Extract task title - simple heuristic
      const titleMatch = message.match(/(create|add) (?:a )?task (?:to|for|about) (.*?)(?:by|due|on|with priority|$)/i)
      const reminderMatch = message.match(/remind (?:me )?to (.*?)(?:by|due|on|with priority|$)/i)
      const needToMatch = message.match(/(?:need|have) to (.*?)(?:by|due|on|with priority|$)/i)
      
      if (titleMatch) {
        taskData.title = titleMatch[2].trim()
      } else if (reminderMatch) {
        taskData.title = reminderMatch[1].trim()
      } else if (needToMatch) {
        taskData.title = needToMatch[1].trim()
      } else {
        // If no clear pattern, use the message as the title
        taskData.title = message.trim()
      }
      
      // Extract due date
      const dueDateMatch = message.match(/(?:by|due|on) (tomorrow|next week|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December|[0-9]{1,2}(?:st|nd|rd|th)?(?:\s+of)?(?:\s+[A-Za-z]+)?(?:\s+[0-9]{4})?)/i)
      
      if (dueDateMatch) {
        const dateText = dueDateMatch[1]
        let dueDate: Date | null = null
        
        if (dateText.toLowerCase() === 'tomorrow') {
          dueDate = new Date()
          dueDate.setDate(dueDate.getDate() + 1)
        } else if (dateText.toLowerCase() === 'next week') {
          dueDate = new Date()
          dueDate.setDate(dueDate.getDate() + 7)
        } else {
          // Try to parse the date
          const parsedDate = new Date(dateText)
          if (!isNaN(parsedDate.getTime())) {
            dueDate = parsedDate
          }
        }
        
        if (dueDate) {
          taskData.dueDate = dueDate.toISOString()
        }
      }
      
      // Extract priority
      const priorityMatch = message.match(/(?:with )?(?:priority|important|urgent) (low|medium|high|urgent)/i)
      
      if (priorityMatch) {
        const priorityText = priorityMatch[1].toLowerCase()
        switch (priorityText) {
          case 'low':
            taskData.priority = TaskPriority.LOW
            break
          case 'medium':
            taskData.priority = TaskPriority.MEDIUM
            break
          case 'high':
            taskData.priority = TaskPriority.HIGH
            break
          case 'urgent':
            taskData.priority = TaskPriority.URGENT
            break
        }
      } else if (message.match(/urgent|asap|immediately|right away/i)) {
        taskData.priority = TaskPriority.URGENT
      } else if (message.match(/important|significant|crucial/i)) {
        taskData.priority = TaskPriority.HIGH
      }
      
      // If AI analysis is enabled, use it for further improvements
      if (apiKey && features.taskCategorization) {
        // Use AI to analyze and improve the task
        const result = await analyzeTaskWithAI(
          {
            id: 'temp-id',
            title: taskData.title,
            description: taskData.description,
            priority: taskData.priority,
            dueDate: taskData.dueDate,
            projectId: null,
            tags: [],
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
            taskData.tags = newTags as string[];
          }
          
          // Apply priority if not already set and available
          if (features.prioritization && taskData.priority === TaskPriority.MEDIUM && result.data.priority) {
            if (Object.values(TaskPriority).includes(result.data.priority as TaskPriority)) {
              taskData.priority = result.data.priority as TaskPriority
            }
          }
          
          // Apply deadline if not already set and available
          if (features.suggestions && !taskData.dueDate && result.data.deadline) {
            try {
              const suggestedDate = new Date(result.data.deadline)
              if (!isNaN(suggestedDate.getTime())) {
                taskData.dueDate = suggestedDate.toISOString()
              }
            } catch (e) {
              console.error('Error parsing suggested deadline:', e)
            }
          }
          
          // Add description from AI analysis if available
          if (result.data.reasoning) {
            taskData.description = result.data.reasoning
          }
        }
      }
      
      // Create the task
      dispatch(addTask(taskData))
      
      return taskData
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  }
  
  const handleGoToSettings = () => {
    navigate('/settings')
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">AI Assistant</h1>
        {!apiKey && (
          <button 
            onClick={handleGoToSettings}
            className="btn btn-primary flex items-center"
          >
            <FiSettings className="mr-2" />
            Configure AI
          </button>
        )}
      </div>
      
      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
        {/* AI Chat Panel */}
        <div className="flex-1 card overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {conversation.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-3/4 rounded-lg p-3 ${
                    message.role === 'user' 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-900 dark:text-white'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center mb-1">
                      <FiCpu className="mr-2 text-primary-500 dark:text-primary-400" />
                      <span className="font-medium">Assistant</span>
                    </div>
                  )}
                  {message.content.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-secondary-100 dark:bg-secondary-800 rounded-lg p-3 flex items-center">
                  <FiLoader className="animate-spin mr-2 text-primary-500 dark:text-primary-400" />
                  <span>Processing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="border-t border-secondary-200 dark:border-secondary-700 p-4">
            <form onSubmit={handleSubmit} className="flex items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask the AI to create tasks for you..."
                className="flex-1 input resize-none min-h-[60px]"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isProcessing}
                className="btn btn-primary ml-3 h-[60px] w-[60px] flex items-center justify-center"
              >
                <FiSend size={20} />
              </button>
            </form>
            
            {!apiKey && (
              <div className="mt-4 text-center text-secondary-500 dark:text-secondary-400 text-sm">
                To enable advanced AI features, please configure your API key in settings.
              </div>
            )}
          </div>
        </div>
        
        {/* Tasks Panel */}
        <div className="flex-1 card overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-secondary-200 dark:border-secondary-700">
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">Your Tasks</h2>
            <button 
              onClick={() => navigate('/tasks/new')}
              className="btn btn-sm btn-primary flex items-center"
            >
              <FiPlus className="mr-1" size={14} />
              New Task
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {tasks.length > 0 ? (
              <TaskList 
                tasks={tasks.slice(0, 10)} 
                hideFilters={true} 
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <FiCheckSquare size={48} className="text-secondary-400 dark:text-secondary-600 mb-4" />
                <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">No tasks yet</h3>
                <p className="text-secondary-600 dark:text-secondary-400 max-w-sm">
                  Try asking the assistant to create a task for you, or click the "New Task" button to create one manually.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 card">
        <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
          Example prompts
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            className="p-3 bg-secondary-50 dark:bg-secondary-800/50 rounded-md border border-secondary-200 dark:border-secondary-700 cursor-pointer hover:bg-secondary-100 dark:hover:bg-secondary-800"
            onClick={() => setInput("Create a task to prepare presentation slides for the quarterly review by next Friday")}
          >
            <p className="text-secondary-800 dark:text-secondary-200">Create a task to prepare presentation slides for the quarterly review by next Friday</p>
          </div>
          
          <div 
            className="p-3 bg-secondary-50 dark:bg-secondary-800/50 rounded-md border border-secondary-200 dark:border-secondary-700 cursor-pointer hover:bg-secondary-100 dark:hover:bg-secondary-800"
            onClick={() => setInput("I need to call client about project updates with high priority")}
          >
            <p className="text-secondary-800 dark:text-secondary-200">I need to call client about project updates with high priority</p>
          </div>
          
          <div 
            className="p-3 bg-secondary-50 dark:bg-secondary-800/50 rounded-md border border-secondary-200 dark:border-secondary-700 cursor-pointer hover:bg-secondary-100 dark:hover:bg-secondary-800"
            onClick={() => setInput("Remind me to send invoice by tomorrow")}
          >
            <p className="text-secondary-800 dark:text-secondary-200">Remind me to send invoice by tomorrow</p>
          </div>
          
          <div 
            className="p-3 bg-secondary-50 dark:bg-secondary-800/50 rounded-md border border-secondary-200 dark:border-secondary-700 cursor-pointer hover:bg-secondary-100 dark:hover:bg-secondary-800"
            onClick={() => setInput("Add a task to review project requirements with urgent priority")}
          >
            <p className="text-secondary-800 dark:text-secondary-200">Add a task to review project requirements with urgent priority</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIAssistant 