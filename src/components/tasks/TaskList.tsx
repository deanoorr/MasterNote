import { useState, useMemo } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { useAppSelector, useAppDispatch } from '@hooks/useAppRedux'
import { reorderTasks } from '@features/tasks/tasksSlice'
import TaskItem from './TaskItem'
import { Task, TaskPriority } from '@/types'

interface TaskListProps {
  projectId?: string | null;
  tasks?: Task[];
  hideFilters?: boolean;
}

type FilterOption = 'all' | 'active' | 'completed'
type SortOption = 'priority' | 'dueDate' | 'createdAt' | 'alphabetical'

const TaskList = ({ projectId, tasks: propTasks, hideFilters = false }: TaskListProps) => {
  const [filter, setFilter] = useState<FilterOption>('all')
  const [sort, setSort] = useState<SortOption>('createdAt')
  const [searchTerm, setSearchTerm] = useState('')
  
  const { tasks: storeTasks } = useAppSelector(state => state.tasks)
  const dispatch = useAppDispatch()

  // Use tasks from props if provided, otherwise use from store
  const allTasks = propTasks || storeTasks;

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    // First filter by project if specified
    let result = projectId 
      ? allTasks.filter(task => task.projectId === projectId) 
      : allTasks

    // Then filter by completion status
    if (filter === 'active') {
      result = result.filter(task => !task.completed)
    } else if (filter === 'completed') {
      result = result.filter(task => task.completed)
    }

    // Then filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        task => 
          task.title.toLowerCase().includes(term) || 
          task.description.toLowerCase().includes(term) ||
          task.tags.some(tag => tag.toLowerCase().includes(term))
      )
    }

    // Then sort
    return [...result].sort((a, b) => {
      switch (sort) {
        case 'priority':
          // Map priority to numeric value for sorting
          const priorityMap = {
            [TaskPriority.LOW]: 0,
            [TaskPriority.MEDIUM]: 1,
            [TaskPriority.HIGH]: 2,
            [TaskPriority.URGENT]: 3
          }
          return priorityMap[b.priority] - priorityMap[a.priority]
        
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        
        case 'alphabetical':
          return a.title.localeCompare(b.title)
        
        case 'createdAt':
        default:
          return a.position - b.position
      }
    })
  }, [allTasks, projectId, filter, sort, searchTerm])

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result

    // Dropped outside the list
    if (!destination) return

    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    // Only reorder if we're using store tasks (not custom tasks)
    if (!propTasks) {
      dispatch(reorderTasks({
        taskId: draggableId,
        newPosition: destination.index
      }))
    }
  }

  return (
    <div>
      {!hideFilters && (
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'all' 
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' 
                  : 'bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'active' 
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' 
                  : 'bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'completed' 
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' 
                  : 'bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300'
              }`}
            >
              Completed
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <label htmlFor="sort" className="text-sm text-secondary-700 dark:text-secondary-300">
              Sort by:
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="text-sm rounded-md bg-white dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-600 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
            >
              <option value="createdAt">Default</option>
              <option value="priority">Priority</option>
              <option value="dueDate">Due Date</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </div>
      )}

      {filteredTasks.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-secondary-700 dark:text-secondary-300">No tasks found</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="tasks">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-3"
              >
                {filteredTasks.map((task, index) => (
                  <TaskItem key={task.id} task={task} index={index} />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  )
}

export default TaskList 