import { useState } from 'react'
import { FiCheck, FiPlus, FiTrash2 } from 'react-icons/fi'
import { useAppDispatch } from '@hooks/useAppRedux'
import { updateSubtask, deleteSubtask, addSubtask } from '@features/tasks/tasksSlice'
import { SubTask } from '@/types'

interface SubTaskListProps {
  taskId: string
  subtasks: SubTask[]
}

const SubTaskList = ({ taskId, subtasks }: SubTaskListProps) => {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const dispatch = useAppDispatch()

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault()
    if (newSubtaskTitle.trim()) {
      dispatch(addSubtask({
        taskId,
        title: newSubtaskTitle
      }))
      setNewSubtaskTitle('')
    }
  }

  const handleToggleSubtask = (subtaskId: string) => {
    const subtask = subtasks.find(st => st.id === subtaskId)
    if (subtask) {
      dispatch(updateSubtask({
        taskId,
        subtaskId,
        completed: !subtask.completed
      }))
    }
  }

  const handleDeleteSubtask = (subtaskId: string) => {
    dispatch(deleteSubtask({
      taskId,
      subtaskId
    }))
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-secondary-900 dark:text-white">Subtasks</h4>
      
      <ul className="space-y-2">
        {subtasks.map(subtask => (
          <li key={subtask.id} className="flex items-center group">
            <button
              onClick={() => handleToggleSubtask(subtask.id)}
              className={`flex-shrink-0 w-5 h-5 rounded-full border-2 border-secondary-300 dark:border-secondary-600 flex items-center justify-center ${
                subtask.completed ? 'bg-primary-500 border-primary-500 dark:bg-primary-600 dark:border-primary-600' : ''
              }`}
            >
              {subtask.completed && <FiCheck className="text-white" size={12} />}
            </button>
            
            <span 
              className={`ml-2 text-sm ${
                subtask.completed ? 'text-secondary-500 dark:text-secondary-400 line-through' : 'text-secondary-900 dark:text-white'
              }`}
            >
              {subtask.title}
            </span>
            
            <button
              onClick={() => handleDeleteSubtask(subtask.id)}
              className="ml-auto text-secondary-400 hover:text-red-500 dark:text-secondary-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <FiTrash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
      
      <form onSubmit={handleAddSubtask} className="flex items-center mt-2">
        <span className="w-5 h-5 flex items-center justify-center">
          <FiPlus size={14} className="text-secondary-400 dark:text-secondary-500" />
        </span>
        <input
          type="text"
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          placeholder="Add a subtask..."
          className="ml-2 text-sm bg-transparent border-none outline-none focus:ring-0 text-secondary-900 dark:text-white placeholder-secondary-500 dark:placeholder-secondary-400 w-full"
        />
        <button
          type="submit"
          disabled={!newSubtaskTitle.trim()}
          className="text-xs text-primary-600 dark:text-primary-400 font-medium disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </div>
  )
}

export default SubTaskList 