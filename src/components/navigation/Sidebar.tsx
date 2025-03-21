import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FiHome, FiFolder, FiCheckSquare, FiSettings, FiX, FiCpu, FiSun, FiMoon } from 'react-icons/fi'
import { useAppDispatch, useAppSelector } from '@hooks/useAppRedux'
import { setThemeMode } from '@features/theme/themeSlice'

interface SidebarProps {
  isOpen: boolean
  isMobile: boolean
  onClose: () => void
}

const Sidebar = ({ isOpen, isMobile, onClose }: SidebarProps) => {
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { mode } = useAppSelector(state => state.theme)

  // Close sidebar on route change in mobile
  useEffect(() => {
    if (isMobile) {
      onClose()
    }
  }, [location.pathname, isMobile, onClose])

  const toggleTheme = () => {
    const newMode = mode === 'dark' ? 'light' : 'dark'
    dispatch(setThemeMode(newMode))
  }

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  if (!isOpen) {
    return null
  }

  return (
    <div 
      className={`fixed inset-0 z-20 transition-opacity ${isMobile ? 'block' : 'hidden'}`}
      onClick={onClose}
    >
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-secondary-800 shadow-lg transform transition-transform ease-in-out duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isMobile ? 'block' : 'hidden'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-secondary-200 dark:border-secondary-700">
          <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">MasterNote</h1>
          {isMobile && (
            <button 
              onClick={onClose} 
              className="text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200"
            >
              <FiX size={24} />
            </button>
          )}
        </div>

        <nav className="mt-5 px-2">
          <ul className="space-y-2">
            <li>
              <Link
                to="/"
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  isActive('/') 
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' 
                    : 'text-secondary-700 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-700'
                }`}
              >
                <FiHome className="mr-3 h-5 w-5" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                to="/projects"
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  isActive('/projects') 
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' 
                    : 'text-secondary-700 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-700'
                }`}
              >
                <FiFolder className="mr-3 h-5 w-5" />
                Projects
              </Link>
            </li>
            <li>
              <Link
                to="/tasks"
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  isActive('/tasks') 
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' 
                    : 'text-secondary-700 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-700'
                }`}
              >
                <FiCheckSquare className="mr-3 h-5 w-5" />
                Tasks
              </Link>
            </li>
            <li>
              <Link
                to="/ai-assistant"
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  isActive('/ai-assistant') 
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' 
                    : 'text-secondary-700 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-700'
                }`}
              >
                <FiCpu className="mr-3 h-5 w-5" />
                AI Assistant
              </Link>
            </li>
            <li>
              <Link
                to="/settings"
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  isActive('/settings') 
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' 
                    : 'text-secondary-700 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-700'
                }`}
              >
                <FiSettings className="mr-3 h-5 w-5" />
                Settings
              </Link>
            </li>
          </ul>
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-secondary-200 dark:border-secondary-700">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-700"
          >
            {mode === 'dark' ? (
              <>
                <FiSun className="mr-3 h-5 w-5" />
                Light Mode
              </>
            ) : (
              <>
                <FiMoon className="mr-3 h-5 w-5" />
                Dark Mode
              </>
            )}
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div
        className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-64 lg:bg-white lg:dark:bg-secondary-800 lg:shadow-lg lg:flex lg:flex-col ${
          isOpen ? 'lg:block' : 'lg:hidden'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-secondary-200 dark:border-secondary-700">
          <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">MasterNote</h1>
        </div>

        <nav className="mt-5 px-2 flex-1">
          <ul className="space-y-2">
            <li>
              <Link
                to="/"
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  isActive('/') 
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' 
                    : 'text-secondary-700 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-700'
                }`}
              >
                <FiHome className="mr-3 h-5 w-5" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                to="/projects"
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  isActive('/projects') 
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' 
                    : 'text-secondary-700 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-700'
                }`}
              >
                <FiFolder className="mr-3 h-5 w-5" />
                Projects
              </Link>
            </li>
            <li>
              <Link
                to="/tasks"
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  isActive('/tasks') 
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' 
                    : 'text-secondary-700 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-700'
                }`}
              >
                <FiCheckSquare className="mr-3 h-5 w-5" />
                Tasks
              </Link>
            </li>
            <li>
              <Link
                to="/ai-assistant"
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  isActive('/ai-assistant') 
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' 
                    : 'text-secondary-700 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-700'
                }`}
              >
                <FiCpu className="mr-3 h-5 w-5" />
                AI Assistant
              </Link>
            </li>
            <li>
              <Link
                to="/settings"
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  isActive('/settings') 
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' 
                    : 'text-secondary-700 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-700'
                }`}
              >
                <FiSettings className="mr-3 h-5 w-5" />
                Settings
              </Link>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-secondary-200 dark:border-secondary-700">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-700"
          >
            {mode === 'dark' ? (
              <>
                <FiSun className="mr-3 h-5 w-5" />
                Light Mode
              </>
            ) : (
              <>
                <FiMoon className="mr-3 h-5 w-5" />
                Dark Mode
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Sidebar 