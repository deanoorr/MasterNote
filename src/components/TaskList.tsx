import { useState, useEffect } from 'react';
import { Paper, Text, Stack, Badge, ActionIcon, Group, Box, TextInput, Button, Tooltip, Modal, Menu, Progress, Select, SimpleGrid, UnstyledButton, useMantineColorScheme, Textarea, Flex, Checkbox } from '@mantine/core';
import { DatePickerInput, DatesProvider } from '@mantine/dates';
import { IconCheck, IconClock, IconTrash, IconListCheck, IconPlus, IconPencil, IconChevronDown, IconCalendar, IconFlag, IconSortAscending, IconCalendarEvent, IconNotes, IconEdit, IconDotsVertical, IconCheckbox, IconSubtask } from '@tabler/icons-react';
import { useStore, SortOption } from '../store';
import { Task } from '../types';

const getPriorityColor = (priority: Task['priority']) => {
  switch (priority) {
    case 'high':
      return 'red';
    case 'medium':
      return 'yellow';
    case 'low':
      return 'blue';
    default:
      return 'gray';
  }
};

// Add this date helper function
const getRelativeDate = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setFullYear(2025); // Set to 2025
  return date;
};

// Add this function to get next occurrence of a weekday
const getNextWeekday = (weekday: number): Date => {
  const date = new Date();
  const currentDay = date.getDay();
  const daysToAdd = (weekday - currentDay + 7) % 7 || 7; // If today, go to next week
  date.setDate(date.getDate() + daysToAdd);
  date.setFullYear(2025); // Set to 2025
  return date;
};

export default function TaskList() {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const { tasks, updateTask, addTask, deleteTask, deleteCompletedTasks, setSortOrder, getSortedTasks, sortOrder, bulkUpdateTasks } = useStore();
  
  // Set initial sort order to due date
  useEffect(() => {
    setSortOrder('due-date');
  }, [setSortOrder]);
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskDueDate, setTaskDueDate] = useState<Date | undefined>(undefined);
  const [taskWithDueDateMenu, setTaskWithDueDateMenu] = useState<string | null>(null);
  const [dueDateMenuOpened, setDueDateMenuOpened] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [taskEditId, setTaskEditId] = useState<string | null>(null);
  const [editedTaskTitle, setEditedTaskTitle] = useState('');
  const [notesModalOpened, setNotesModalOpened] = useState(false);
  const [taskWithNotes, setTaskWithNotes] = useState<string | null>(null);
  const [taskNotes, setTaskNotes] = useState('');
  const [viewingCompletedTasks, setViewingCompletedTasks] = useState(false);
  const [expandedSubtasks, setExpandedSubtasks] = useState<Set<string>>(new Set());
  const [subtaskInput, setSubtaskInput] = useState<{ [key: string]: string }>({});
  const [addingSubtask, setAddingSubtask] = useState<string | null>(null);
  const [editingSubtask, setEditingSubtask] = useState<{ parentId: string; subtaskId: string } | null>(null);
  const [editedSubtaskTitle, setEditedSubtaskTitle] = useState('');
  
  // Calendar styles for the date picker
  const calendarStyles = {
    calendarHeader: { 
      background: isDark ? '#25262b' : '#f8f9fa', 
      borderBottom: `1px solid ${isDark ? '#373A40' : '#e9ecef'}`,
      color: isDark ? '#C1C2C5' : '#495057',
      position: 'relative' as const,
      padding: '12px 16px',
      zIndex: 5,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    monthCell: { color: isDark ? '#C1C2C5' : '#495057' },
    day: { 
      color: isDark ? '#C1C2C5' : '#495057',
      '&:hover': { background: isDark ? '#373A40' : '#e9ecef' },
      fontSize: '14px',
      height: '40px',
      width: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '1px',
      borderRadius: '8px'
    },
    weekend: { color: isDark ? '#909296' : '#adb5bd' },
    selected: { 
      backgroundColor: '#20C997 !important', 
      color: 'white !important',
      fontWeight: 600,
    },
    outside: { color: isDark ? '#5C5F66' : '#ced4da' },
    inRange: { 
      backgroundColor: isDark ? 'rgba(32, 201, 151, 0.2)' : 'rgba(32, 201, 151, 0.1)', 
      color: isDark ? '#C1C2C5' : '#495057',
    },
    root: { 
      border: `1px solid ${isDark ? '#373A40' : '#e9ecef'}`,
      borderRadius: '8px',
      background: isDark ? '#25262b' : '#ffffff',
      position: 'relative' as const,
      overflow: 'visible' as const,
      minWidth: '340px',
      padding: '12px'
    },
    yearPicker: { 
      background: isDark ? '#25262b' : '#ffffff',
      color: isDark ? '#C1C2C5' : '#495057',
      padding: '16px'
    },
    monthPicker: { 
      background: isDark ? '#25262b' : '#ffffff',
      color: isDark ? '#C1C2C5' : '#495057', 
      padding: '16px'
    },
    weekday: { 
      color: isDark ? '#909296' : '#adb5bd', 
      fontSize: '13px',
      fontWeight: 600,
      padding: '10px 0',
      textTransform: 'uppercase' as const
    },
    yearPickerControl: { 
      color: isDark ? '#C1C2C5' : '#495057',
      '&:hover': { backgroundColor: isDark ? '#373A40' : '#e9ecef' },
      borderRadius: '6px',
      padding: '10px',
      margin: '3px',
      fontSize: '14px'
    },
    monthPickerControl: { 
      color: isDark ? '#C1C2C5' : '#495057',
      '&:hover': { backgroundColor: isDark ? '#373A40' : '#e9ecef' },
      borderRadius: '6px',
      padding: '10px',
      margin: '3px',
      fontSize: '14px'
    },
    calendarHeaderControl: {
      width: '36px',
      height: '36px',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: isDark ? '#C1C2C5' : '#495057',
      '&:hover': {
        backgroundColor: isDark ? '#373A40' : '#e9ecef'
      }
    },
    calendarHeaderLevel: {
      fontSize: '16px',
      fontWeight: 600,
      padding: '0 20px',
      cursor: 'pointer',
      color: isDark ? '#C1C2C5' : '#495057',
      '&:hover': {
        textDecoration: 'underline',
      }
    },
    dropdown: {
      zIndex: 1000,
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
      border: `1px solid ${isDark ? '#373A40' : '#e9ecef'}`,
      borderRadius: '8px'
    },
    // Add a time section style
    timeInput: {
      backgroundColor: isDark ? '#25262B' : '#f8f9fa',
      borderTop: `1px solid ${isDark ? '#373A40' : '#e9ecef'}`,
      padding: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  };

  // Debug log for tasks
  useEffect(() => {
    console.log("Current tasks in TaskList:", tasks);
  }, [tasks]);

  const handleStatusChange = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent propagation to parent elements
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      console.log("Changing task status from", task.status, "to", task.status !== 'done' ? 'done' : 'todo');
      
      // Mark task as done or back to todo
      updateTask(taskId, { 
        status: task.status !== 'done' ? 'done' : 'todo',
        updatedAt: new Date() // Ensure timestamp is updated
      });
    }
  };

  const handlePriorityChange = (taskId: string, priority: 'low' | 'medium' | 'high', e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent propagation to parent elements
    console.log("Changing priority of task", taskId, "to", priority);
    updateTask(taskId, {
      priority,
      updatedAt: new Date()
    });
  };

  const handleDeleteTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("TaskList - Deleting task with ID:", taskId);
    deleteTask(taskId);
  };

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      // Clean the task title - remove any leading numbers/formats like "1. " or "3."
      const cleanTitle = newTaskTitle.trim().replace(/^\d+\.\s*/, '');
      
      // Use the actual date selected by the user, don't force to 2025
      let dueDate = taskDueDate ? new Date(taskDueDate) : undefined;
      console.log("Creating task with due date:", dueDate);
      
      const task: Task = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title: cleanTitle, // Use the cleaned title
        priority: taskPriority,
        status: 'todo',
        dueDate: dueDate,
        createdAt: new Date(),
        updatedAt: new Date(),
        aiGenerated: false
      };
      
      console.log("Adding new task with title:", cleanTitle);
      addTask(task);
      setNewTaskTitle('');
      setTaskPriority('medium');
      setTaskDueDate(undefined);
      setAddingTask(false);
    }
  };

  const handleEditTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent propagation to parent elements
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setTaskEditId(task.id);
      setEditedTaskTitle(task.title);
    }
  };

  const handleDueDateChange = (taskId: string, dueDate: Date | null, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent propagation to parent elements
    console.log("Changing due date of task", taskId, "to", dueDate);
    
    // Don't set a fixed year to 2025, use the actual date selected
    let newDueDate = dueDate ? new Date(dueDate) : null;
    console.log("New due date object:", newDueDate);
    
    updateTask(taskId, {
      dueDate: newDueDate || undefined,
      updatedAt: new Date()
    });
  };

  // Calculate due date status - return 'overdue', 'due-soon', or 'ok'
  const getDueDateStatus = (dueDate: Date | undefined): 'overdue' | 'due-soon' | 'ok' => {
    if (!dueDate) return 'ok';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDay = new Date(dueDate);
    dueDay.setHours(0, 0, 0, 0);
    
    // Compare month and day only for dynamic checking
    // This ignores the year difference for dynamic display
    if (dueDay.getMonth() < today.getMonth() || 
        (dueDay.getMonth() === today.getMonth() && dueDay.getDate() < today.getDate())) {
      return 'overdue';
    }
    
    // For due soon, check if it's today or tomorrow
    if (dueDay.getMonth() === today.getMonth() && dueDay.getDate() === today.getDate()) {
      return 'due-soon'; // Due today
    }
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (dueDay.getMonth() === tomorrow.getMonth() && dueDay.getDate() === tomorrow.getDate()) {
      return 'due-soon'; // Due tomorrow
    }
    
    return 'ok';
  };

  const getDueDateColor = (status: 'overdue' | 'due-soon' | 'ok'): string => {
    switch (status) {
      case 'overdue': return 'red';
      case 'due-soon': return 'orange';
      default: return 'dimmed';
    }
  };

  // Format due date as "Today" or "Tomorrow" for those dates,
  // otherwise use the regular date format without year
  const formatDueDate = (dueDate: Date): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dueDay = new Date(dueDate);
    dueDay.setHours(0, 0, 0, 0);
    
    // Only compare month and day to determine if it's Today or Tomorrow
    // This makes dates dynamic regardless of the year stored internally
    if (dueDay.getDate() === today.getDate() && 
        dueDay.getMonth() === today.getMonth()) {
      return 'Today';
    } else if (dueDay.getDate() === tomorrow.getDate() && 
               dueDay.getMonth() === tomorrow.getMonth()) {
      return 'Tomorrow';
    } else {
      return dueDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      });
    }
  };

  const sortOptions = [
    { value: 'due-date', label: 'By Due Date' },
    { value: 'priority-high', label: 'By Priority' },
    { value: 'created-newest', label: 'Recently Added' },
    { value: 'alphabetical', label: 'Alphabetical' },
  ];

  const handleSortChange = (value: string | null) => {
    if (value) {
      setSortOrder(value as SortOption);
    }
  };

  // Get the sorted tasks for display
  const sortedTasks = getSortedTasks();

  // Create handler functions to safely handle DatePickerInput values
  const handleTaskDueDateChange = (date: Date | null) => {
    setTaskDueDate(date || undefined);
  };
  
  const handleEditTaskDueDateChange = (date: Date | null) => {
    setTaskDueDate(date || undefined);
  };

  useEffect(() => {
    // Fix the date picker dropdown positioning issue
    const fixCalendarDropdown = () => {
      const dropdowns = document.querySelectorAll('.mantine-Popover-dropdown');
      dropdowns.forEach(dropdown => {
        if (dropdown instanceof HTMLElement) {
          dropdown.style.zIndex = '1000';
          dropdown.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.15)';
          
          // Make days larger and more clickable
          const days = dropdown.querySelectorAll('.mantine-Calendar-day');
          days.forEach(day => {
            if (day instanceof HTMLElement) {
              day.style.height = '40px';
              day.style.width = '40px';
              day.style.fontSize = '14px';
              day.style.margin = '2px';
              day.style.display = 'flex';
              day.style.alignItems = 'center';
              day.style.justifyContent = 'center';
              day.style.borderRadius = '8px';
            }
          });
          
          // Add spacing between weeks
          const weekRows = dropdown.querySelectorAll('.mantine-Month-weekRow');
          weekRows.forEach(row => {
            if (row instanceof HTMLElement) {
              row.style.marginBottom = '4px';
            }
          });
          
          // Improve weekday headers
          const weekdays = dropdown.querySelectorAll('.mantine-Calendar-weekday');
          weekdays.forEach(weekday => {
            if (weekday instanceof HTMLElement) {
              weekday.style.fontSize = '12px';
              weekday.style.fontWeight = '600';
              weekday.style.padding = '10px 0';
              weekday.style.color = isDark ? '#909296' : '#adb5bd';
            }
          });
          
          // Improve month selection
          const monthControls = dropdown.querySelectorAll('.mantine-MonthPicker-monthPickerControl');
          monthControls.forEach(control => {
            if (control instanceof HTMLElement) {
              control.style.padding = '14px';
              control.style.margin = '4px';
              control.style.borderRadius = '8px';
            }
          });
          
          // Improve year selection
          const yearControls = dropdown.querySelectorAll('.mantine-YearPicker-yearPickerControl');
          yearControls.forEach(control => {
            if (control instanceof HTMLElement) {
              control.style.padding = '14px';
              control.style.margin = '4px';
              control.style.borderRadius = '8px';
            }
          });
          
          // Add padding to month picker
          const monthPickerControls = dropdown.querySelectorAll('.mantine-MonthPicker-monthsListControl');
          if (monthPickerControls.length > 0) {
            const monthPickerWrapper = monthPickerControls[0].parentElement;
            if (monthPickerWrapper instanceof HTMLElement) {
              monthPickerWrapper.style.padding = '10px';
            }
          }
          
          // Add padding to year picker
          const yearPickerControls = dropdown.querySelectorAll('.mantine-YearPicker-yearsListControl');
          if (yearPickerControls.length > 0) {
            const yearPickerWrapper = yearPickerControls[0].parentElement;
            if (yearPickerWrapper instanceof HTMLElement) {
              yearPickerWrapper.style.padding = '10px';
            }
          }
        }
      });
    };
    
    // Apply fix when component mounts and whenever tasks change (which might trigger UI updates)
    fixCalendarDropdown();
    
    // Set up a mutation observer to catch dynamically added dropdowns
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length) {
          fixCalendarDropdown();
        }
      });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => observer.disconnect();
  }, [isDark]); // Add isDark as a dependency

  // Filter tasks based on completed status
  const activeTasks = sortedTasks.filter(task => task.status !== 'done');
  const completedTasks = sortedTasks.filter(task => task.status === 'done');

  const handleNotesOpen = (taskId: string, notes: string | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    setTaskWithNotes(taskId);
    setTaskNotes(notes || '');
    setNotesModalOpened(true);
  };

  const saveNotes = () => {
    if (taskWithNotes) {
      updateTask(taskWithNotes, { 
        notes: taskNotes,
        updatedAt: new Date()
      });
      setNotesModalOpened(false);
    }
  };

  const cssAnimations = `
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    
    @keyframes taskCardAnimation {
      0% {
        opacity: 0;
        transform: translateY(10px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .task-card {
      animation: taskCardAnimation 0.3s ease forwards;
    }
    
    .task-card:nth-child(1) { animation-delay: 0.05s; }
    .task-card:nth-child(2) { animation-delay: 0.1s; }
    .task-card:nth-child(3) { animation-delay: 0.15s; }
    .task-card:nth-child(4) { animation-delay: 0.2s; }
    .task-card:nth-child(5) { animation-delay: 0.25s; }
    .task-card:nth-child(6) { animation-delay: 0.3s; }
    .task-card:nth-child(7) { animation-delay: 0.35s; }
    .task-card:nth-child(8) { animation-delay: 0.4s; }
    .task-card:nth-child(9) { animation-delay: 0.45s; }
    .task-card:nth-child(10) { animation-delay: 0.5s; }
  `;

  // Add this function to group tasks by date
  const groupTasksByDate = (tasks: Task[]) => {
    // Group tasks by date
    const grouped = new Map<string, Task[]>();
    
    tasks.forEach(task => {
      // Format the date as a string to use as a key
      let dateKey = task.dueDate ? formatDueDate(new Date(task.dueDate)) : 'No Due Date';
      
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)?.push(task);
    });
    
    // Sort the groups by date
    const sortedGroups = Array.from(grouped.entries()).sort((a, b) => {
      if (a[0] === 'No Due Date') return 1;
      if (b[0] === 'No Due Date') return -1;
      if (a[0] === 'Today') return -1;
      if (b[0] === 'Today') return 1;
      if (a[0] === 'Tomorrow') return -1;
      if (b[0] === 'Tomorrow') return 1;
      return a[0].localeCompare(b[0]);
    });
    
    return sortedGroups;
  };

  const toggleSubtasks = (taskId: string) => {
    setExpandedSubtasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleAddSubtask = (parentTaskId: string) => {
    if (!parentTaskId) {
      console.log("No parent task ID provided");
      return;
    }
    
    const inputText = subtaskInput[parentTaskId];
    if (!inputText || !inputText.trim()) {
      console.log("Empty subtask title");
      return;
    }
    
    try {
      const subtask: Task = {
        id: `subtask-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        title: inputText.trim(),
        priority: 'medium',
        status: 'todo',
        createdAt: new Date(),
        updatedAt: new Date(),
        aiGenerated: false
      };
      
      console.log("Adding subtask:", subtask);
      useStore.getState().addSubtask(parentTaskId, subtask);
      
      // Reset input after successful addition
      setSubtaskInput(prev => ({
        ...prev,
        [parentTaskId]: ''
      }));
    } catch (error) {
      console.error("Failed to add subtask:", error);
    }
  };

  const handleSubtaskStatusChange = (parentTaskId: string, subtaskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const parentTask = tasks.find(t => t.id === parentTaskId);
    if (!parentTask) return;

    const subtask = parentTask.subtasks?.find(st => st.id === subtaskId);
    if (!subtask) return;

    const newStatus = subtask.status === 'done' ? 'todo' : 'done';
    useStore.getState().updateSubtask(parentTaskId, subtaskId, { status: newStatus });
  };

  const handleEditSubtask = (parentTaskId: string, subtaskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const parentTask = tasks.find(t => t.id === parentTaskId);
    if (!parentTask) return;

    const subtask = parentTask.subtasks?.find(st => st.id === subtaskId);
    if (!subtask) return;

    setEditingSubtask({ parentId: parentTaskId, subtaskId });
    setEditedSubtaskTitle(subtask.title);
  };

  const handleSaveSubtaskEdit = () => {
    if (!editingSubtask) return;
    
    const { parentId, subtaskId } = editingSubtask;
    if (editedSubtaskTitle.trim()) {
      useStore.getState().updateSubtask(parentId, subtaskId, { 
        title: editedSubtaskTitle.trim() 
      });
    }
    setEditingSubtask(null);
    setEditedSubtaskTitle('');
  };

  const handleCancelSubtaskEdit = () => {
    setEditingSubtask(null);
    setEditedSubtaskTitle('');
  };

  const handleDeleteSubtask = (parentTaskId: string, subtaskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    useStore.getState().deleteSubtask(parentTaskId, subtaskId);
  };

  const renderSubtasks = (task: Task) => {
    // Show subtasks section if task has subtasks OR if we're currently adding a subtask to this task
    if ((!task || !task.subtasks || !Array.isArray(task.subtasks) || task.subtasks.length === 0) && addingSubtask !== task.id) {
      return null;
    }

    const isExpanded = expandedSubtasks.has(task.id);
    const hasSubtasks = task.subtasks && Array.isArray(task.subtasks) && task.subtasks.length > 0;
    const subtasksCount = hasSubtasks && task.subtasks ? task.subtasks.length : 0;
    
    // Debug log to see what's in the subtasks data
    console.log("Rendering subtasks for task:", task.title);
    console.log("Is adding subtask:", addingSubtask === task.id);
    console.log("Subtasks data:", task.subtasks);

    return (
      <Box ml={20} mt={8}>
        <Group justify="space-between" mb={8}>
          <Text size="sm" c="dimmed" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <IconSubtask size={14} />
            Subtasks ({subtasksCount})
          </Text>
          <Group gap={8}>
            <ActionIcon 
              size="sm" 
              variant="subtle"
              color="teal"
              onClick={(e) => {
                e.stopPropagation();
                setAddingSubtask(task.id);
                setSubtaskInput(prev => ({
                  ...prev,
                  [task.id]: prev[task.id] || ''
                }));
              }}
              title="Add Subtask"
            >
              <IconPlus size={14} />
            </ActionIcon>
            <ActionIcon 
              size="sm" 
              variant="subtle" 
              onClick={(e) => {
                e.stopPropagation();
                toggleSubtasks(task.id);
              }}
            >
              <IconChevronDown 
                size={16} 
                style={{ 
                  transform: isExpanded ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s'
                }} 
              />
            </ActionIcon>
          </Group>
        </Group>

        {isExpanded && hasSubtasks && task.subtasks && (
          <Stack gap={8}>
            {task.subtasks.map(subtask => {
              if (!subtask) return null;
              
              console.log("Rendering subtask:", subtask);
              return (
                <Paper
                  key={subtask.id || `temp-${Math.random()}`}
                  p={8}
                  radius="sm"
                  style={{
                    backgroundColor: isDark ? 'rgba(44, 46, 51, 0.5)' : 'rgba(248, 249, 250, 0.5)',
                    border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`
                  }}
                >
                  {editingSubtask && editingSubtask.subtaskId === subtask.id ? (
                    <Group justify="space-between">
                      <TextInput
                        size="xs"
                        value={editedSubtaskTitle}
                        onChange={(e) => setEditedSubtaskTitle(e.currentTarget.value)}
                        style={{ flex: 1 }}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveSubtaskEdit();
                          } else if (e.key === 'Escape') {
                            handleCancelSubtaskEdit();
                          }
                        }}
                      />
                      <Group gap={4}>
                        <ActionIcon 
                          size="xs" 
                          color="teal" 
                          variant="filled" 
                          onClick={handleSaveSubtaskEdit}
                        >
                          <IconCheck size={12} />
                        </ActionIcon>
                        <ActionIcon 
                          size="xs" 
                          color="gray" 
                          variant="subtle" 
                          onClick={handleCancelSubtaskEdit}
                        >
                          <IconTrash size={12} />
                        </ActionIcon>
                      </Group>
                    </Group>
                  ) : (
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap={8}>
                        <Checkbox
                          checked={!!subtask.status && subtask.status === 'done'}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSubtaskStatusChange(task.id, subtask.id, e as any);
                          }}
                        />
                        <Text size="sm" style={{ textDecoration: subtask.status === 'done' ? 'line-through' : 'none' }}>
                          {/* Fix for subtasks showing "Title" placeholder with additional null checks */}
                          {subtask.title === "Title" 
                            ? (subtask.description || "Subtask") 
                            : (subtask.title || 'Untitled Subtask')}
                        </Text>
                      </Group>
                      <Group gap={4}>
                        <ActionIcon
                          size="sm"
                          color="blue"
                          variant="subtle"
                          onClick={(e) => handleEditSubtask(task.id, subtask.id, e)}
                        >
                          <IconEdit size={14} />
                        </ActionIcon>
                        <ActionIcon
                          size="sm"
                          color="red"
                          variant="subtle"
                          onClick={(e) => handleDeleteSubtask(task.id, subtask.id, e)}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    </Group>
                  )}
                </Paper>
              );
            })}
          </Stack>
        )}

        {addingSubtask === task.id && (
          <Group mt={8} gap={8}>
            <TextInput
              size="xs"
              placeholder="Add subtask..."
              value={subtaskInput[task.id] || ''}
              onChange={(e) => {
                // Completely rewrite this handler to be bulletproof
                if (e && e.currentTarget && task && task.id) {
                  const val = e.currentTarget.value || '';
                  setSubtaskInput((prevState) => {
                    const newState = { ...prevState };
                    newState[task.id] = val;
                    return newState;
                  });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && task && task.id) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddSubtask(task.id);
                }
              }}
              autoFocus
              style={{ flex: 1 }}
            />
            <ActionIcon
              size="sm"
              color="teal"
              variant="light"
              onClick={() => {
                if (task && task.id) {
                  handleAddSubtask(task.id);
                }
              }}
            >
              <IconPlus size={14} />
            </ActionIcon>
            <ActionIcon
              size="sm"
              color="gray"
              variant="subtle"
              onClick={() => {
                setAddingSubtask(null);
                if (task && task.id) {
                  setSubtaskInput(prev => {
                    const newState = { ...prev };
                    newState[task.id] = '';
                    return newState;
                  });
                }
              }}
            >
              <IconTrash size={14} />
            </ActionIcon>
          </Group>
        )}
      </Box>
    );
  };

  const renderTasks = (tasksToRender: Task[]) => {
    if (tasksToRender.length === 0) {
      return (
        <Box 
          style={{ 
            padding: '20px', 
            textAlign: 'center', 
            color: isDark ? '#909296' : '#6c757d',
            border: `1px dashed ${isDark ? '#373A40' : '#dee2e6'}`,
            borderRadius: '8px',
            backgroundColor: isDark ? 'rgba(26, 27, 30, 0.4)' : 'rgba(248, 249, 250, 0.4)'
          }}
        >
          <IconNotes style={{ width: 40, height: 40, opacity: 0.4, margin: '0 auto 10px' }} />
          <Text size="sm">No tasks here yet</Text>
        </Box>
      );
    }

    // Sort by date and group tasks
    const groupedTasks = groupTasksByDate(tasksToRender);
    let taskNumber = 1; // Initialize task numbering counter

    return (
      <>
        {groupedTasks.map(([dateKey, tasks]) => (
          <Box key={dateKey} mb="md">
            <Box
              style={{
                marginBottom: '8px',
                borderBottom: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <IconCalendar size={16} style={{ opacity: 0.7 }} />
              <Text size="sm" fw={600} c={isDark ? '#909296' : '#6c757d'}>
                {dateKey}
              </Text>
            </Box>
            
            {/* Tasks for this date */}
            <Stack gap="xs">
              {tasks.map((task) => {
                const currentTaskNumber = taskNumber++;
                return (
                  <Box key={task.id}>
                    <Paper
                      p="sm"
                      radius="md"
                      className="task-card"
                      style={{
                        backgroundColor: isDark ? 'rgba(44, 46, 51, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                        border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }
                      }}
                      onClick={() => {
                        if (task.subtasks?.length) {
                          toggleSubtasks(task.id);
                        }
                      }}
                    >
                      <Group align="flex-start" justify="space-between" style={{ flexWrap: 'nowrap' }}>
                        <Box style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                          <Box style={{ 
                            minWidth: '24px',
                            height: '24px',
                            display: 'flex', 
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: isDark ? '#25262b' : '#f1f3f5',
                            borderRadius: '50%',
                            marginRight: '2px'
                          }}>
                            <Text 
                              size="xs" 
                              fw={600} 
                              style={{ 
                                color: isDark ? '#c1c2c5' : '#495057',
                                lineHeight: 1,
                                userSelect: 'none'
                              }}
                            >
                              {currentTaskNumber}
                            </Text>
                          </Box>
                          <Checkbox
                            checked={task.status === 'done'}
                            onChange={(e) => handleStatusChange(task.id, e as any)}
                            styles={{
                              input: {
                                cursor: 'pointer',
                                backgroundColor: isDark ? '#25262B' : '#ffffff',
                                border: `1px solid ${isDark ? '#373A40' : '#ced4da'}`,
                                borderRadius: '4px',
                                '&:checked': {
                                  backgroundColor: '#20C997',
                                  borderColor: '#20C997'
                                },
                                transition: 'all 0.2s ease',
                              },
                              icon: {
                                color: 'white'
                              }
                            }}
                            size="sm"
                          />
                          <Box style={{ flex: 1, minWidth: 0, marginTop: '2px' }}>
                            <Text 
                              size="sm"
                              fw={500}
                              lineClamp={2}
                              style={{ 
                                textDecoration: task.status === 'done' ? 'line-through' : 'none',
                                opacity: task.status === 'done' ? 0.7 : 1,
                                fontSize: '14px',
                                wordBreak: 'break-word',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              {task.title}
                            </Text>
                            
                            <Group mt={6} gap="xs">
                              {/* Remove the date badge since we're using date dividers */}
                              <Badge 
                                variant="filled"
                                size="xs"
                                style={{ 
                                  padding: '4px 10px',
                                  fontWeight: 500,
                                  borderRadius: '50px',
                                  textTransform: 'uppercase',
                                  fontSize: '10px',
                                  border: 'none',
                                  backgroundColor: 
                                    task.priority === 'high' ? '#862e2e' : 
                                    task.priority === 'medium' ? '#8c6d1f' : 
                                    '#1864ab',
                                  color: '#fff'
                                }}
                              >
                                {task.priority}
                              </Badge>
                              
                              {task.notes && (
                                <Badge 
                                  color="teal" 
                                  variant="light"
                                  size="xs"
                                  leftSection={<IconNotes size={12} />}
                                  style={{ 
                                    padding: '3px 7px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      backgroundColor: isDark ? '#0CA678' : '#20C997',
                                      color: 'white'
                                    }
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNotesOpen(task.id, task.notes, e);
                                  }}
                                >
                                  Notes
                                </Badge>
                              )}
                            </Group>
                          </Box>
                        </Box>
                        
                        <Menu position="bottom-end" shadow="md">
                          <Menu.Target>
                            <ActionIcon size="sm" variant="subtle" onClick={(e) => e.stopPropagation()}>
                              <IconDotsVertical size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Label>Status</Menu.Label>
                            <Menu.Item 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(task.id, e);
                              }}
                            >
                              {task.status === 'done' ? 'Mark as Todo' : 'Mark as Done'}
                            </Menu.Item>
                            
                            <Menu.Divider />
                            <Menu.Label>Priority</Menu.Label>
                            <Menu.Item 
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePriorityChange(task.id, 'high', e);
                              }}
                            >
                              High Priority
                            </Menu.Item>
                            <Menu.Item 
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePriorityChange(task.id, 'medium', e);
                              }}
                            >
                              Medium Priority
                            </Menu.Item>
                            <Menu.Item 
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePriorityChange(task.id, 'low', e);
                              }}
                            >
                              Low Priority
                            </Menu.Item>
                            
                            <Menu.Divider />
                            <Menu.Item 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTask(task.id, e);
                              }}
                            >
                              Edit Task
                            </Menu.Item>
                            <Menu.Item 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotesOpen(task.id, task.notes, e);
                              }}
                            >
                              {task.notes ? 'Edit Notes' : 'Add Notes'}
                            </Menu.Item>
                            <Menu.Item 
                              onClick={(e) => {
                                e.stopPropagation();
                                setTaskWithDueDateMenu(task.id);
                                setDueDateMenuOpened(true);
                              }}
                            >
                              {task.dueDate ? 'Change Due Date' : 'Add Due Date'}
                            </Menu.Item>
                            
                            <Menu.Item
                              onClick={(e) => {
                                e.stopPropagation();
                                // Initialize subtaskInput if it doesn't exist for this task
                                setSubtaskInput(prev => ({
                                  ...prev,
                                  [task.id]: prev[task.id] || ''
                                }));
                                // Set the state to show the input field
                                setAddingSubtask(task.id);
                                // Ensure subtasks are expanded
                                setExpandedSubtasks(prev => {
                                  const newSet = new Set(prev);
                                  newSet.add(task.id);
                                  return newSet;
                                });
                                console.log("Add Subtask clicked for task ID:", task.id);
                              }}
                              leftSection={<IconSubtask size={14} />}
                            >
                              Add Subtask
                            </Menu.Item>
                            
                            <Menu.Divider />
                            <Menu.Item 
                              color="red"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTask(task.id, e);
                              }}
                            >
                              Delete Task
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Paper>
                    {renderSubtasks(task)}
                  </Box>
                );
              })}
            </Stack>
          </Box>
        ))}
      </>
    );
  };

  return (
    <DatesProvider settings={{ locale: 'en', firstDayOfWeek: 0 }}>
      <Paper style={{ 
        height: '100%', 
        backgroundColor: isDark ? '#1A1B1E' : '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '8px',
        boxShadow: isDark ? '0 2px 10px rgba(0, 0, 0, 0.15)' : '0 2px 10px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden'
      }}>
        {/* Add CSS animations */}
        <style>{cssAnimations}</style>
        
        <Box 
          style={{ 
            padding: '16px',
            flex: 1,
            overflowY: 'auto'
          }}
        >
          <Group justify="space-between" mb="md" style={{ borderBottom: `1px solid ${isDark ? '#2C2E33' : '#e9ecef'}`, paddingBottom: '12px' }}>
            <Text size="lg" fw={600} c={isDark ? undefined : 'gray.8'}>
              {viewingCompletedTasks ? 'Completed Tasks' : 'Tasks'}
            </Text>
            <Group>
              <Button 
                variant={viewingCompletedTasks ? "filled" : "subtle"}
                color={viewingCompletedTasks ? "blue" : "gray"} 
                size="xs" 
                onClick={() => setViewingCompletedTasks(!viewingCompletedTasks)}
                leftSection={<IconCheck size={14} />}
              >
                {viewingCompletedTasks ? 'Back to Tasks' : 'View Completed'}
              </Button>
              {viewingCompletedTasks && completedTasks.length > 0 && (
                <Button
                  variant="subtle"
                  color="red"
                  size="xs"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete all completed tasks? This action cannot be undone.')) {
                      deleteCompletedTasks();
                    }
                  }}
                  leftSection={<IconTrash size={14} />}
                >
                  Clear All
                </Button>
              )}
              {!viewingCompletedTasks && (
                <Button 
                  variant="filled" 
                  color="teal" 
                  size="xs" 
                  onClick={() => setAddingTask(true)}
                  leftSection={<IconPlus size={14} />}
                >
                  Add
                </Button>
              )}
            </Group>
          </Group>

          <Stack gap="lg">
            {addingTask && (
              <Paper 
                p="md" 
                mb="xl"
                style={{
                  backgroundColor: isDark ? '#25262B' : '#f8f9fa',
                  borderRadius: '12px',
                  border: `1px solid ${isDark ? '#2C2E33' : '#e9ecef'}`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  marginBottom: '24px',
                  transform: 'translateY(0)',
                  animation: 'slideDown 0.3s ease'
                }}
              >
                <Text fw={600} mb="sm" size="md">New Task</Text>
                <TextInput
                  placeholder="Task title"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  mb="md"
                  variant="filled"
                  radius="md"
                  required
                  styles={{
                    input: {
                      fontSize: '15px',
                      padding: '12px 16px'
                    }
                  }}
                />
                
                <Group grow mb="md">
                  <Select
                    label="Priority"
                    value={taskPriority}
                    onChange={(value) => setTaskPriority(value as 'low' | 'medium' | 'high')}
                    data={[
                      { value: 'high', label: 'High' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'low', label: 'Low' },
                    ]}
                    styles={{
                      input: {
                        backgroundColor: isDark ? '#1A1B1E' : '#ffffff',
                        borderRadius: '8px',
                      }
                    }}
                  />
                  <DatePickerInput
                    label="Due Date"
                    placeholder="Optional"
                    value={taskDueDate}
                    onChange={handleTaskDueDateChange}
                    clearable
                    styles={calendarStyles}
                  />
                </Group>
                
                <Group justify="flex-end" mt="lg">
                  <Button 
                    variant="subtle" 
                    onClick={() => setAddingTask(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    color="teal" 
                    onClick={handleAddTask}
                    disabled={!newTaskTitle.trim()}
                    style={{
                      background: 'linear-gradient(135deg, #20C997 0%, #0CA678 100%)',
                      boxShadow: '0 4px 10px rgba(32, 201, 151, 0.3)',
                      '&:hover': {
                        boxShadow: '0 6px 14px rgba(32, 201, 151, 0.4)'
                      }
                    }}
                  >
                    Add Task
                  </Button>
                </Group>
              </Paper>
            )}

            {viewingCompletedTasks ? (
              // Completed tasks view
              completedTasks.length > 0 ? (
                renderTasks(completedTasks)
              ) : (
                <Text ta="center" mt="xl" c="dimmed">No completed tasks</Text>
              )
            ) : (
              // Active tasks view
              activeTasks.length > 0 ? (
                renderTasks(activeTasks)
              ) : (
                <Text ta="center" mt="xl" c="dimmed">No tasks to display. Add a new task to get started!</Text>
              )
            )}
          </Stack>
        </Box>
        
        {!viewingCompletedTasks && (
          <Box style={{ 
            borderTop: `1px solid ${isDark ? '#373A40' : '#e9ecef'}`,
            padding: '10px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: isDark ? '#1e1f22' : '#f8f9fa'
          }}>
            <Group gap="xs">
              <Text size="xs" c="dimmed">
                {activeTasks.length} {activeTasks.length === 1 ? 'task' : 'tasks'} active
              </Text>
              <Text size="xs" c="dimmed" style={{ opacity: 0.7 }}>•</Text>
              <Text size="xs" c="dimmed">
                {completedTasks.length} completed
              </Text>
            </Group>
          </Box>
        )}

        {/* Edit Task Modal */}
        <Modal
          opened={!!taskEditId}
          onClose={() => setTaskEditId(null)}
          title={<Text fw={600} size="lg">Edit Task</Text>}
          centered
          radius="md"
          size="md"
          padding="xl"
          styles={{
            header: {
              backgroundColor: isDark ? '#25262B' : '#f8f9fa',
              borderBottom: `1px solid ${isDark ? '#373A40' : '#e9ecef'}`,
              padding: '20px 24px',
              marginBottom: '10px'
            },
            title: {
              fontSize: '20px',
              fontWeight: 600
            },
            content: {
              backgroundColor: isDark ? '#1A1B1E' : '#ffffff',
              borderRadius: '12px',
              overflow: 'hidden'
            },
            body: {
              padding: '10px 24px 24px'
            },
            close: {
              color: isDark ? '#909296' : '#495057',
              '&:hover': {
                backgroundColor: isDark ? '#2C2E33' : '#e9ecef'
              }
            }
          }}
        >
          <Stack gap="lg">
            <Box>
              <Text size="sm" fw={500} mb="xs">Task Title</Text>
          <TextInput
                placeholder="Enter task title"
            value={editedTaskTitle}
            onChange={(e) => setEditedTaskTitle(e.target.value)}
            autoFocus
            styles={{
              input: {
                    backgroundColor: isDark ? '#25262B' : '#f8f9fa',
                border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '16px',
                    height: '50px',
                transition: 'all 0.2s ease',
                '&:focus': {
                  borderColor: '#20C997',
                      backgroundColor: isDark ? '#2C2E33' : '#ffffff'
                }
                  },
                  wrapper: {
                    marginBottom: '8px'
              }
            }}
          />
            </Box>

            <Box>
              <Text size="sm" fw={500} mb="xs">Due Date</Text>
            <DatePickerInput
                valueFormat="MMM D"
                placeholder="Select due date"
              value={taskDueDate}
              onChange={handleEditTaskDueDateChange}
              clearable
                leftSectionWidth={42}
                leftSection={<IconCalendar size={18} color="#20C997" />}
                maxLevel="month"
                firstDayOfWeek={0}
              styles={{
                input: {
                    backgroundColor: isDark ? '#25262B' : '#f8f9fa',
                  border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
                  borderRadius: '8px',
                  padding: '12px 16px 12px 42px',
                  fontSize: '16px',
                    height: '50px',
                  transition: 'all 0.2s ease',
                  '&:focus': {
                    borderColor: '#20C997',
                      backgroundColor: isDark ? '#2C2E33' : '#ffffff'
                  }
                },
                ...calendarStyles
              }}
            />
            </Box>

            <Box>
              <Text size="sm" fw={500} mb="xs">Priority Level</Text>
              <Select
                value={taskPriority}
                onChange={(value) => setTaskPriority(value as 'low' | 'medium' | 'high')}
                data={[
                  { value: 'low', label: '🟢 Low Priority' },
                  { value: 'medium', label: '🟡 Medium Priority' },
                  { value: 'high', label: '🔴 High Priority' }
                ]}
                leftSectionWidth={42}
                leftSection={<IconFlag size={18} color="#20C997" />}
                style={{ position: 'relative', zIndex: 1 }}
                styles={{
                  input: {
                    backgroundColor: isDark ? '#25262B' : '#f8f9fa',
                  border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
                    borderRadius: '8px',
                    padding: '12px 16px 12px 42px',
                    fontSize: '16px',
                    height: '50px',
                    transition: 'all 0.2s ease',
                    '&:focus': {
                      borderColor: '#20C997',
                      backgroundColor: isDark ? '#2C2E33' : '#ffffff'
                    }
                  },
                  dropdown: {
                    backgroundColor: isDark ? '#25262B' : '#ffffff',
                  border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    padding: '6px',
                    zIndex: 1000
                  },
                  option: {
                    fontSize: '15px',
                    padding: '10px 16px',
                    borderRadius: '4px',
                    margin: '2px 0',
                    '&[data-selected]': {
                      backgroundColor: '#20C997',
                      color: 'white'
                    },
                    '&[data-hovered]': {
                      backgroundColor: isDark ? '#2C2E33' : '#f1f3f5'
                    }
                  }
                }}
              />
          </Box>

          <Group justify="space-between" mt="md">
            <Button 
                variant="default" 
                onClick={() => setTaskEditId(null)}
              style={{ 
                  fontSize: '15px',
                  fontWeight: 500,
                  padding: '8px 20px',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                backgroundColor: isDark ? '#25262b' : '#f1f3f5',
                color: isDark ? '#909296' : '#495057'
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (taskEditId && editedTaskTitle.trim()) {
                  updateTask(taskEditId, {
                    title: editedTaskTitle,
                    priority: taskPriority,
                    dueDate: taskDueDate,
                    updatedAt: new Date()
                  });
                  setTaskEditId(null);
                }
              }}
                style={{ 
                  backgroundColor: '#20C997', 
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: 500,
                  padding: '8px 20px',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(32, 201, 151, 0.2)'
                }}
                rightSection={<IconCheck size={18} />}
            >
              Save Changes
            </Button>
          </Group>
          </Stack>
        </Modal>

        {/* Notes Modal */}
        <Modal
          opened={!!notesModalOpened}
          onClose={() => setNotesModalOpened(false)}
          title={<Text fw={600} size="lg">Edit Notes</Text>}
          centered
          radius="md"
          size="md"
          padding="xl"
          styles={{
            header: {
              backgroundColor: isDark ? '#25262B' : '#f8f9fa',
              borderBottom: `1px solid ${isDark ? '#373A40' : '#e9ecef'}`,
              padding: '20px 24px',
              marginBottom: '10px'
            },
            title: {
              fontSize: '20px',
              fontWeight: 600
            },
            content: {
              backgroundColor: isDark ? '#1A1B1E' : '#ffffff',
              borderRadius: '12px',
              overflow: 'hidden'
            },
            body: {
              padding: '10px 24px 24px'
            },
            close: {
              color: isDark ? '#909296' : '#495057',
              '&:hover': {
                backgroundColor: isDark ? '#2C2E33' : '#e9ecef'
              }
            }
          }}
        >
          <Stack gap="lg">
            <Textarea
              placeholder="Enter notes"
              value={taskNotes}
              onChange={(e) => setTaskNotes(e.target.value)}
              autoFocus
              styles={{
                input: {
                  backgroundColor: isDark ? '#25262B' : '#f8f9fa',
                  border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontSize: '16px',
                  height: '200px',
                  transition: 'all 0.2s ease',
                  '&:focus': {
                    borderColor: '#20C997',
                    backgroundColor: isDark ? '#2C2E33' : '#ffffff'
                  }
                }
              }}
            />
            <Group justify="space-between" mt="md">
              <Button 
                variant="default" 
                onClick={() => setNotesModalOpened(false)}
                style={{ 
                  fontSize: '15px',
                  fontWeight: 500,
                  padding: '8px 20px',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  backgroundColor: isDark ? '#25262b' : '#f1f3f5',
                  color: isDark ? '#909296' : '#495057'
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={saveNotes}
                style={{ 
                  backgroundColor: '#20C997', 
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: 500,
                  padding: '8px 20px',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(32, 201, 151, 0.2)'
                }}
                rightSection={<IconCheck size={18} />}
              >
                Save Changes
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Paper>
    </DatesProvider>
  );
} 