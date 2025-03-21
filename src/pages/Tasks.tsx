import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { FiPlus } from 'react-icons/fi'
import { useAppSelector } from '@hooks/useAppRedux'
import TaskList from '@components/tasks/TaskList'
import TaskForm from '@components/tasks/TaskForm'

const Tasks = () => {
  const [isAddingTask, setIsAddingTask] = useState(false)
  const { projectId } = useParams<{ projectId?: string }>()
  
  const { projects } = useAppSelector(state => state.projects)
  const project = projectId ? projects.find(p => p.id === projectId) : null
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            {project ? project.name : 'All Tasks'}
          </h1>
          {project && (
            <p className="text-secondary-600 dark:text-secondary-400 mt-1">
              {project.description}
            </p>
          )}
        </div>
        
        <button
          onClick={() => setIsAddingTask(!isAddingTask)}
          className="btn btn-primary flex items-center mt-4 sm:mt-0"
        >
          <FiPlus className="mr-2" />
          {isAddingTask ? 'Cancel' : 'Add Task'}
        </button>
      </div>
      
      {isAddingTask ? (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-white mb-4">
            Create New Task
          </h2>
          <TaskForm 
            projectId={projectId || null} 
            onSubmit={() => setIsAddingTask(false)}
          />
        </div>
      ) : null}
      
      <TaskList projectId={projectId || null} />
    </div>
  )
}

export default Tasks 