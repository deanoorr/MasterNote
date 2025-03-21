import { useState, useRef, useEffect } from 'react'
import { FiSend, FiSettings, FiLoader, FiCpu, FiZap, FiClock, FiTag, FiFlag, FiPlus, FiCheckSquare } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@hooks/useAppRedux'
import { addTask } from '@features/tasks/tasksSlice'
import { updateAISettings } from '@features/aiSettings/aiSettingsSlice'
import { TaskPriority } from '@/types'
import { analyzeTaskWithAI, getAIResponse } from '@services/ai'
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
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
  const { apiKey, provider, model, features } = useAppSelector(state => state.aiSettings)
  const { tasks } = useAppSelector(state => state.tasks)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  
  // Set initial model from store
  useEffect(() => {
    if (model) {
      setSelectedModel(model)
    }
  }, [model])
  
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

  // Set model and update in the store
  const handleModelChange = (modelName: string) => {
    setSelectedModel(modelName)
    dispatch(updateAISettings({ model: modelName }))
  }
  
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
      // Check for task-related commands first
      if (detectTaskCreationIntent(userMessage)) {
        // Handle task creation
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
      } else if (/show|list|what|display tasks/i.test(userMessage)) {
        // Handle task listing
        processTaskListingQuery(userMessage)
      } else if (/analyze|review|summarize task/i.test(userMessage)) {
        // Handle task analysis
        await processTaskAnalysisQuery(userMessage)
      } else {
        // Handle general conversation
        const response = await getAIResponse(userMessage, { apiKey, provider, model, features })
        if (response.success && response.data) {
          setConversation(prev => [
            ...prev,
            { role: 'assistant', content: response.data }
          ])
        } else {
          throw new Error(response.error || 'Failed to get AI response')
        }
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
      tags: [] as string[],
      completed: false,
      subtasks: [],
    }
    
    try {
      // Extract task title - simple heuristic
      const titleMatch = message.match(/(create|add) (?:a )?task (?:to|for|about) (.*?)(?:by|due|on|with priority|$)/i)
      const reminderMatch = message.match(/remind (?:me )?to (.*?)(?:by|due|on|with priority|$)/i)
      const needToMatch = message.match(/(?:need|have) to (.*?)(?:by|due|on|with priority|$)/i)
      
      if (titleMatch && titleMatch[2] && titleMatch[2].trim().length > 0) {
        taskData.title = titleMatch[2].trim()
      } else if (reminderMatch && reminderMatch[1] && reminderMatch[1].trim().length > 0) {
        taskData.title = reminderMatch[1].trim()
      } else if (needToMatch && needToMatch[1] && needToMatch[1].trim().length > 0) {
        taskData.title = needToMatch[1].trim()
      } else {
        // If no clear pattern, use the message as the title but remove common prefixes
        const cleanMessage = message.replace(/^(create|add) a task (to|for|about) /i, '')
                                    .replace(/^remind me to /i, '')
                                    .replace(/^(need|have) to /i, '')
                                    .trim()
        taskData.title = cleanMessage
      }

      // Make sure we have a complete title
      if (!taskData.title || taskData.title.length === 0) {
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
            const newTags = Array.isArray(result.data.tags) ? result.data.tags : [result.data.tags];
            taskData.tags = newTags as Array<string>;
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
  
  // Process task listing queries
  const processTaskListingQuery = (message: string) => {
    const today = new Date()
    const pendingTasks = tasks.filter(t => !t.completed)
    const upcomingTasks = pendingTasks.filter(t => t.dueDate && new Date(t.dueDate) > today)
    const overdueTasks = pendingTasks.filter(t => t.dueDate && new Date(t.dueDate) < today)
    const highPriorityTasks = pendingTasks.filter(t => t.priority === TaskPriority.HIGH || t.priority === TaskPriority.URGENT)
    
    let response = ''
    
    if (/today|current/i.test(message)) {
      response = formatTasksResponse("Here's what you need to work on today", pendingTasks.slice(0, 5))
    } else if (/upcoming|next|future/i.test(message)) {
      response = formatTasksResponse("Here are your upcoming tasks", upcomingTasks.slice(0, 5))
    } else if (/overdue|late|missed/i.test(message)) {
      response = formatTasksResponse("Here are your overdue tasks", overdueTasks)
    } else if (/urgent|important|priority/i.test(message)) {
      response = formatTasksResponse("Here are your high priority tasks", highPriorityTasks)
    } else if (/completed|finished|done/i.test(message)) {
      response = formatTasksResponse("Here are your completed tasks", tasks.filter(t => t.completed).slice(0, 5))
    } else {
      response = formatTasksResponse("Here are your active tasks", pendingTasks.slice(0, 5))
    }
    
    setConversation(prev => [
      ...prev, 
      { role: 'assistant', content: response }
    ])
  }
  
  // Format tasks into a readable response
  const formatTasksResponse = (intro: string, taskList: Array<any>): string => {
    if (taskList.length === 0) {
      return `${intro}, but I don't see any matching tasks.`
    }
    
    const tasksText = taskList.map(task => {
      const dueText = task.dueDate ? ` (due ${new Date(task.dueDate).toLocaleDateString()})` : ''
      const priorityText = task.priority !== TaskPriority.MEDIUM ? ` [${task.priority}]` : ''
      return `• ${task.title}${priorityText}${dueText}`
    }).join('\n')
    
    return `${intro}:\n\n${tasksText}\n\nYou have ${tasks.length} tasks total (${tasks.filter(t => !t.completed).length} active).`
  }
  
  // Process task analysis queries
  const processTaskAnalysisQuery = async (message: string) => {
    const taskMatch = message.match(/analyze|review|summarize task (?:about |for |related to )?(.*)/i)
    let matchedTask = null
    
    if (taskMatch && taskMatch[1]) {
      const searchTerm = taskMatch[1].trim().toLowerCase()
      matchedTask = tasks.find(t => 
        t.title.toLowerCase().includes(searchTerm) || 
        t.description.toLowerCase().includes(searchTerm)
      )
    }
    
    if (!matchedTask) {
      setConversation(prev => [
        ...prev, 
        { role: 'assistant', content: "I couldn't find a task matching that description. Could you provide more details or the exact task name?" }
      ])
      return
    }
    
    // Use AI to analyze the task
    if (apiKey && features.taskCategorization) {
      try {
        const result = await analyzeTaskWithAI(
          matchedTask,
          { apiKey, provider, model, features }
        )
        
        if (result.success && result.data) {
          const analysis: string[] = []
          analysis.push(`**Task Analysis: "${matchedTask.title}"**\n`)
          
          if (result.data.priority && result.data.priority !== matchedTask.priority) {
            analysis.push(`• Suggested priority: ${result.data.priority} (currently ${matchedTask.priority})`)
          }
          
          if (result.data.deadline && (!matchedTask.dueDate || new Date(result.data.deadline).toDateString() !== new Date(matchedTask.dueDate).toDateString())) {
            analysis.push(`• Suggested deadline: ${new Date(result.data.deadline).toLocaleDateString()}${
              matchedTask.dueDate ? ` (currently ${new Date(matchedTask.dueDate).toLocaleDateString()})` : ''
            }`)
          }
          
          if (result.data.tags) {
            const newTags = Array.isArray(result.data.tags) ? result.data.tags : [result.data.tags]
            const suggestedTags = newTags.filter(tag => !matchedTask.tags.includes(tag))
            if (suggestedTags.length > 0) {
              analysis.push(`• Suggested additional tags: ${suggestedTags.join(', ')}`)
            }
          }
          
          if (result.data.reasoning) {
            analysis.push(`\n**Analysis:**\n${result.data.reasoning}`)
          }
          
          setConversation(prev => [
            ...prev, 
            { role: 'assistant', content: analysis.join('\n') }
          ])
          return
        }
      } catch (error) {
        console.error('Error analyzing task:', error)
      }
    }
    
    // Fallback if AI analysis failed
    const taskInfo: string[] = []
    taskInfo.push(`**Task: "${matchedTask.title}"**\n`)
    taskInfo.push(`• Priority: ${matchedTask.priority}`)
    if (matchedTask.dueDate) {
      taskInfo.push(`• Due: ${new Date(matchedTask.dueDate).toLocaleDateString()}`)
    }
    if (matchedTask.tags.length > 0) {
      taskInfo.push(`• Tags: ${matchedTask.tags.join(', ')}`)
    }
    if (matchedTask.description) {
      taskInfo.push(`\n**Description:**\n${matchedTask.description}`)
    }
    
    setConversation(prev => [
      ...prev, 
      { role: 'assistant', content: taskInfo.join('\n') }
    ])
  }
  
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Main content container */}
      <div className="flex flex-1 h-full overflow-hidden">
        {/* Left side - AI Assistant */}
        <div className="w-1/2 h-full flex flex-col border-r dark:border-secondary-700">
          {/* Model selector */}
          <div className="p-4 bg-white dark:bg-secondary-800 border-b dark:border-secondary-700 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <FiCpu className="text-primary-600 dark:text-primary-400" />
              <span className="font-medium text-secondary-900 dark:text-white">AI Assistant</span>
            </div>
            
            <div className="flex space-x-2">
              <button 
                onClick={() => handleModelChange('gpt-4o')}
                className={`px-3 py-1 text-sm rounded-md ${
                  selectedModel === 'gpt-4o' 
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' 
                    : 'bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 border dark:border-secondary-700'
                }`}
              >
                GPT-4o
              </button>
              <button 
                onClick={() => handleModelChange('gpt-3.5-turbo')}
                className={`px-3 py-1 text-sm rounded-md ${
                  selectedModel === 'gpt-3.5-turbo' 
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' 
                    : 'bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 border dark:border-secondary-700'
                }`}
              >
                GPT-3.5
              </button>
              <button 
                onClick={() => navigate('/settings')}
                className="p-1 text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200 transition-colors"
              >
                <FiSettings />
              </button>
            </div>
          </div>
          
          {/* Messages container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary-50 dark:bg-secondary-900">
            {conversation.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user' 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input area */}
          <div className="p-4 bg-white dark:bg-secondary-800 border-t dark:border-secondary-700">
            <form onSubmit={handleSubmit} className="flex items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 h-10 min-h-[2.5rem] max-h-32 p-2 bg-secondary-100 dark:bg-secondary-700 border-none rounded-lg resize-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 dark:text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
              />
              <button
                type="submit"
                disabled={isProcessing || !input.trim()}
                className="ml-2 p-2 rounded-full bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? <FiLoader className="animate-spin" /> : <FiSend />}
              </button>
            </form>
          </div>
        </div>
        
        {/* Right side - Tasks */}
        <div className="w-1/2 h-full flex flex-col overflow-hidden">
          <div className="p-4 bg-white dark:bg-secondary-800 border-b dark:border-secondary-700 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <FiCheckSquare className="text-primary-600 dark:text-primary-400" />
              <span className="font-medium text-secondary-900 dark:text-white">Active Tasks</span>
            </div>
            <button
              onClick={() => navigate('/tasks')}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              View All Tasks
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <TaskList tasks={tasks.filter(task => !task.completed)} hideFilters={true} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIAssistant 