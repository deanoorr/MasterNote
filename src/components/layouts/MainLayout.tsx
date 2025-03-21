import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '@components/navigation/Sidebar'
import Header from '@components/navigation/Header'
import { useAppSelector } from '@hooks/useAppRedux'

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const { mode } = useAppSelector(state => state.theme)

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsMobile(true)
        setIsSidebarOpen(false)
      } else {
        setIsMobile(false)
        setIsSidebarOpen(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-secondary-900">
      <Sidebar isOpen={isSidebarOpen} isMobile={isMobile} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header toggleSidebar={toggleSidebar} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default MainLayout 