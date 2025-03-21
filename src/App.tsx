import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@hooks/useAppRedux'
import { setThemeMode } from '@features/theme/themeSlice'

// Layouts
import MainLayout from '@components/layouts/MainLayout'

// Pages
import Dashboard from '@pages/Dashboard'
import Projects from '@pages/Projects'
import Tasks from '@pages/Tasks'
import TaskDetails from '@pages/TaskDetails'
import Settings from '@pages/Settings'
import AIAssistant from '@pages/AIAssistant'
import NotFound from '@pages/NotFound'

const App = () => {
  const dispatch = useAppDispatch()
  const { mode } = useAppSelector(state => state.theme)
  
  // Initialize theme
  useEffect(() => {
    dispatch(setThemeMode(mode))
    
    // Add system theme change listener
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (mode === 'system') {
        dispatch(setThemeMode('system'))
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [dispatch, mode])

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:projectId" element={<Tasks />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="tasks/:taskId" element={<TaskDetails />} />
        <Route path="ai-assistant" element={<AIAssistant />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App 