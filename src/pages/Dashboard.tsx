import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FiCheckCircle, FiClock, FiFlag, FiFolder } from 'react-icons/fi'
import { useAppSelector } from '@hooks/useAppRedux'
import TaskItem from '@components/tasks/TaskItem'
import { TaskPriority } from '@/types'

const Dashboard = () => {
  const { tasks } = useAppSelector(state => state.tasks)
  const { projects } = useAppSelector(state => state.projects)
  
  // Calculate task statistics
  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter(task => task.completed).length
    const pending = total - completed
    const urgent = tasks.filter(task => task.priority === TaskPriority.URGENT && !task.completed).length
    
    return { total, completed, pending, urgent }
  }, [tasks])
  
  // Get upcoming tasks (due within the next 7 days)
  const upcomingTasks = useMemo(() => {
    const now = new Date()
    const next7Days = new Date(now)
    next7Days.setDate(now.getDate() + 7)
    
    return tasks
      .filter(task => {
        if (!task.dueDate || task.completed) return false
        const dueDate = new Date(task.dueDate)
        return dueDate >= now && dueDate <= next7Days
      })
      .sort((a, b) => {
        if (!a.dueDate || !b.dueDate) return 0
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })
      .slice(0, 3) // Show only first 3
  }, [tasks])
  
  // Get high priority tasks
  const highPriorityTasks = useMemo(() => {
    return tasks
      .filter(task => 
        (task.priority === TaskPriority.HIGH || task.priority === TaskPriority.URGENT) && 
        !task.completed
      )
      .sort((a, b) => {
        const priorityMap = {
          [TaskPriority.HIGH]: 1,
          [TaskPriority.URGENT]: 2
        }
        return priorityMap[b.priority as TaskPriority.HIGH | TaskPriority.URGENT] - 
               priorityMap[a.priority as TaskPriority.HIGH | TaskPriority.URGENT]
      })
      .slice(0, 3) // Show only first 3
  }, [tasks])
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary-900 dark:text-white mb-6">Dashboard</h1>
      
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card flex items-center">
          <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-900 mr-4">
            <FiCheckCircle className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p className="text-sm text-secondary-500 dark:text-secondary-400">Total Tasks</p>
            <p className="text-xl font-semibold text-secondary-900 dark:text-white">{stats.total}</p>
          </div>
        </div>
        
        <div className="card flex items-center">
          <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 mr-4">
            <FiCheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm text-secondary-500 dark:text-secondary-400">Completed</p>
            <p className="text-xl font-semibold text-secondary-900 dark:text-white">{stats.completed}</p>
          </div>
        </div>
        
        <div className="card flex items-center">
          <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 mr-4">
            <FiClock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-secondary-500 dark:text-secondary-400">Pending</p>
            <p className="text-xl font-semibold text-secondary-900 dark:text-white">{stats.pending}</p>
          </div>
        </div>
        
        <div className="card flex items-center">
          <div className="p-3 rounded-full bg-red-100 dark:bg-red-900 mr-4">
            <FiFlag className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm text-secondary-500 dark:text-secondary-400">Urgent</p>
            <p className="text-xl font-semibold text-secondary-900 dark:text-white">{stats.urgent}</p>
          </div>
        </div>
      </div>
      
      {/* Task Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Upcoming Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">
              Upcoming Tasks
            </h2>
            <Link 
              to="/tasks" 
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              View All
            </Link>
          </div>
          
          {upcomingTasks.length > 0 ? (
            <div className="space-y-4">
              {upcomingTasks.map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <p className="text-secondary-500 dark:text-secondary-400 text-center py-4">
              No upcoming tasks in the next 7 days
            </p>
          )}
        </div>
        
        {/* High Priority Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">
              High Priority Tasks
            </h2>
            <Link 
              to="/tasks" 
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              View All
            </Link>
          </div>
          
          {highPriorityTasks.length > 0 ? (
            <div className="space-y-4">
              {highPriorityTasks.map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <p className="text-secondary-500 dark:text-secondary-400 text-center py-4">
              No high priority tasks
            </p>
          )}
        </div>
      </div>
      
      {/* Projects Section */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">
            Projects
          </h2>
          <Link 
            to="/projects" 
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            View All
          </Link>
        </div>
        
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.slice(0, 6).map(project => {
              const projectTasks = tasks.filter(task => task.projectId === project.id)
              const completedTasksCount = projectTasks.filter(task => task.completed).length
              const progress = projectTasks.length > 0 
                ? Math.round((completedTasksCount / projectTasks.length) * 100) 
                : 0
              
              return (
                <Link key={project.id} to={`/projects/${project.id}`} className="block">
                  <div className="card border border-secondary-200 dark:border-secondary-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
                    <div className="flex items-start">
                      <div 
                        className="w-2 h-10 rounded-full mr-3"
                        style={{ backgroundColor: project.color || '#0ea5e9' }}
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-secondary-900 dark:text-white">
                          {project.name}
                        </h3>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-secondary-600 dark:text-secondary-400">
                              Progress
                            </span>
                            <span className="text-secondary-900 dark:text-white font-medium">
                              {progress}%
                            </span>
                          </div>
                          <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-1.5">
                            <div 
                              className="bg-primary-500 dark:bg-primary-600 h-1.5 rounded-full" 
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-2">
                          {projectTasks.length} tasks, {completedTasksCount} completed
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <p className="text-secondary-500 dark:text-secondary-400 text-center py-4">
            No projects yet. <Link to="/projects" className="text-primary-600 dark:text-primary-400 hover:underline">Create one</Link>
          </p>
        )}
      </div>
    </div>
  )
}

export default Dashboard 