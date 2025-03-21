import { useState } from 'react'
import { FiMenu, FiSearch, FiPlus, FiBell } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@hooks/useAppRedux'
import { addTask } from '@features/tasks/tasksSlice'
import { TaskPriority } from '@/types'

interface HeaderProps {
  toggleSidebar: () => void
}

const Header = ({ toggleSidebar }: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // TODO: Implement search functionality
      console.log('Searching for:', searchQuery)
    }
  }

  const handleQuickAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (taskTitle.trim()) {
      dispatch(addTask({
        title: taskTitle,
        description: '',
        priority: TaskPriority.MEDIUM,
        completed: false,
        dueDate: null,
        projectId: null,
        tags: [],
        subtasks: [],
      }))
      setTaskTitle('')
      setIsQuickAddOpen(false)
    }
  }

  return (
    <header className="bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700 px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200 lg:hidden"
        >
          <FiMenu size={24} />
        </button>
        <form onSubmit={handleSearch} className="ml-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FiSearch className="text-secondary-400 dark:text-secondary-500" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="py-2 pl-10 pr-4 block w-full rounded-md border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
            />
          </div>
        </form>
      </div>

      <div className="flex items-center">
        <div className="relative">
          <button
            onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
            className="btn btn-primary flex items-center"
          >
            <FiPlus className="mr-2" />
            <span>Add Task</span>
          </button>

          {isQuickAddOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-secondary-800 shadow-lg rounded-md p-4 z-50">
              <h3 className="text-lg font-medium mb-2 text-secondary-900 dark:text-white">Quick Add Task</h3>
              <form onSubmit={handleQuickAddTask}>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Task title"
                  className="input mb-3"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsQuickAddOpen(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">Add</button>
                </div>
              </form>
            </div>
          )}
        </div>

        <button
          className="ml-4 text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200 relative"
        >
          <FiBell size={24} />
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
        </button>
      </div>
    </header>
  )
}

export default Header 