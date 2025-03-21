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
      } else if (/show|list|what|display tasks/i.test(userMessage)) {
        // Handle task listing/summarizing queries
        processTaskListingQuery(userMessage)
      } else if (/analyze|review|summarize task/i.test(userMessage)) {
        // Handle task analysis queries
        await processTaskAnalysisQuery(userMessage)
      } else {
        // Default intelligent response
        processGeneralQuery(userMessage)
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
  
  // Process general queries
  const processGeneralQuery = (message: string) => {
    // Extract the main intent
    const lowerMessage = message.toLowerCase()
    let response = ''
    
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      response = `I can help you manage your tasks in several ways:

1. **Create tasks** - Just tell me what you need to do
2. **List tasks** - Ask me to show your tasks, upcoming tasks, or high priority tasks
3. **Analyze tasks** - I can review specific tasks and offer suggestions
4. **Task stats** - I can give you a summary of your current workload

Try asking something like "Show me my high priority tasks" or "Create a task to finish the report by Friday."
`
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      const pendingCount = tasks.filter(t => !t.completed).length
      const urgentCount = tasks.filter(t => !t.completed && (t.priority === TaskPriority.HIGH || t.priority === TaskPriority.URGENT)).length
      
      response = `Hello! I'm your AI task assistant. ${
        pendingCount > 0 
          ? `You currently have ${pendingCount} active tasks${urgentCount > 0 ? `, including ${urgentCount} high priority or urgent ones` : ''}.` 
          : "You don't have any active tasks at the moment."
      } How can I help you today?`
    } else if (lowerMessage.includes('stats') || lowerMessage.includes('summary') || lowerMessage.includes('overview')) {
      const totalTasks = tasks.length
      const completedTasks = tasks.filter(t => t.completed).length
      const pendingTasks = totalTasks - completedTasks
      const highPriorityTasks = tasks.filter(t => !t.completed && (t.priority === TaskPriority.HIGH || t.priority === TaskPriority.URGENT)).length
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const upcomingTasks = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) >= today).length
      
      response = `**Task Summary:**

• Total tasks: ${totalTasks}
• Completed: ${completedTasks} (${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%)
• Pending: ${pendingTasks}
• High priority/urgent: ${highPriorityTasks}
• With upcoming deadlines: ${upcomingTasks}
`
    } else {
      response = `I can help you with task management. Try asking me to create a task, show your tasks, or analyze a specific task. 

Here are some examples of what you can ask:
• "Create a task to finish the presentation by Friday"
• "Show me my high priority tasks"
• "What tasks do I have today?"
• "Analyze my task about the quarterly report"
`
    }
    
    setConversation(prev => [
      ...prev, 
      { role: 'assistant', content: response }
    ])
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