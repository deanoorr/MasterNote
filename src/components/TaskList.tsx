import { useState, useEffect } from 'react';
import { Paper, Text, Stack, Badge, ActionIcon, Group, Box, TextInput, Button, Tooltip, Modal, Menu, Progress, Select, SimpleGrid, UnstyledButton, useMantineColorScheme, Textarea, Flex } from '@mantine/core';
import { DatePickerInput, DatesProvider } from '@mantine/dates';
import { IconCheck, IconClock, IconTrash, IconListCheck, IconPlus, IconPencil, IconChevronDown, IconCalendar, IconFlag, IconSortAscending, IconCalendarEvent, IconNotes } from '@tabler/icons-react';
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
  return date;
};

// Add this function to get next occurrence of a weekday
const getNextWeekday = (weekday: number): Date => {
  const date = new Date();
  const currentDay = date.getDay();
  const daysToAdd = (weekday - currentDay + 7) % 7 || 7; // If today, go to next week
  date.setDate(date.getDate() + daysToAdd);
  return date;
};

export default function TaskList() {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const { tasks, updateTask, addTask, deleteTask, deleteCompletedTasks, setSortOrder, getSortedTasks, sortOrder } = useStore();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskDueDate, setTaskDueDate] = useState<Date | undefined>(undefined);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskPriority, setEditTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editTaskDueDate, setEditTaskDueDate] = useState<Date | undefined>(undefined);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [dueDateMenuOpened, setDueDateMenuOpened] = useState(false);
  const [taskWithDueDateMenu, setTaskWithDueDateMenu] = useState<string | null>(null);
  const [viewingCompletedTasks, setViewingCompletedTasks] = useState(false);
  const [notesModalOpened, setNotesModalOpened] = useState(false);
  const [currentNotes, setCurrentNotes] = useState('');
  const [noteTaskId, setNoteTaskId] = useState<string | null>(null);

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
      // Mark task as done (don't toggle back to todo in the handler)
      if (task.status !== 'done') {
      updateTask(taskId, { 
          status: 'done',
          updatedAt: new Date()
        });
      } else {
        // If task is already done, we can toggle it back to todo
        updateTask(taskId, { 
          status: 'todo',
        updatedAt: new Date()
      });
      }
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
      
      const task: Task = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title: cleanTitle, // Use the cleaned title
        priority: taskPriority,
        status: 'todo',
        dueDate: taskDueDate,
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
      setEditTaskId(task.id);
      setEditTaskTitle(task.title);
      setEditTaskPriority(task.priority);
      setEditTaskDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
    }
  };

  const saveEditedTask = () => {
    if (editTaskId && editTaskTitle.trim()) {
      updateTask(editTaskId, { 
        title: editTaskTitle,
        priority: editTaskPriority,
        dueDate: editTaskDueDate,
        updatedAt: new Date()
      });
      closeEditModal();
    }
  };

  const closeEditModal = () => {
    setEditTaskId(null);
    setEditTaskTitle('');
    setEditTaskPriority('medium');
    setEditTaskDueDate(undefined);
    setEditModalOpened(false);
  };

  const handleDueDateChange = (taskId: string, dueDate: Date | null, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent propagation to parent elements
    console.log("Changing due date of task", taskId, "to", dueDate);
    updateTask(taskId, {
      dueDate: dueDate || undefined,
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
    
    const diffTime = dueDay.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 2) return 'due-soon';
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
  // otherwise use the regular date format
  const formatDueDate = (dueDate: Date): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dueDay = new Date(dueDate);
    dueDay.setHours(0, 0, 0, 0);
    
    if (dueDay.getTime() === today.getTime()) {
      return 'Today';
    } else if (dueDay.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      return dueDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: dueDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const sortOptions = [
    { value: 'priority-high', label: 'Priority (High to Low)' },
    { value: 'priority-low', label: 'Priority (Low to High)' },
    { value: 'due-date', label: 'Due Date (Earliest First)' },
    { value: 'created-newest', label: 'Recently Created' },
    { value: 'created-oldest', label: 'Oldest Created' },
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
    setEditTaskDueDate(date || undefined);
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
    setNoteTaskId(taskId);
    setCurrentNotes(notes || '');
    setNotesModalOpened(true);
  };

  const saveNotes = () => {
    if (noteTaskId) {
      updateTask(noteTaskId, { 
        notes: currentNotes,
        updatedAt: new Date()
      });
      setNotesModalOpened(false);
    }
  };

  return (
    <DatesProvider settings={{ locale: 'en', firstDayOfWeek: 0 }}>
      <Paper style={{ 
        height: '100%', 
        backgroundColor: isDark ? '#1A1B1E' : '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '12px',
        boxShadow: isDark ? '0 8px 30px rgba(0, 0, 0, 0.2)' : '0 8px 30px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden'
      }}>
        <Box 
          style={{ 
            padding: '20px',
            flex: 1,
            overflowY: 'auto'
          }}
        >
          <Group justify="space-between" mb="md">
            <Text size="xl" fw={600} c={isDark ? undefined : 'gray.8'}>
              {viewingCompletedTasks ? 'Completed Tasks' : 'Tasks'}
            </Text>
            <Group>
              <Button 
                variant={viewingCompletedTasks ? "filled" : "light"}
                color={viewingCompletedTasks ? "blue" : "gray"} 
                size="sm" 
                onClick={() => setViewingCompletedTasks(!viewingCompletedTasks)}
                leftSection={<IconCheck size={16} />}
                style={{
                  transition: 'all 0.2s ease',
                }}
              >
                {viewingCompletedTasks ? 'Back to Tasks' : 'View Completed'}
              </Button>
              {viewingCompletedTasks && completedTasks.length > 0 && (
                <Button
                  variant="light"
                  color="red"
                  size="sm"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete all completed tasks? This action cannot be undone.')) {
                      deleteCompletedTasks();
                    }
                  }}
                  leftSection={<IconTrash size={16} />}
                  style={{
                    transition: 'all 0.2s ease',
                  }}
                >
                  Clear All
                </Button>
              )}
              {!viewingCompletedTasks && (
                <>
              <Select
                placeholder="Sort by"
                data={sortOptions}
                value={sortOrder}
                onChange={handleSortChange}
                rightSection={<IconSortAscending size={16} />}
                size="sm"
                style={{ width: 200 }}
                styles={{
                  input: {
                    backgroundColor: isDark ? '#25262B' : '#f8f9fa',
                    border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
                    borderRadius: '6px',
                  }
                }}
              />
              <Button 
                variant="light" 
                color="teal" 
                size="sm" 
                onClick={() => setAddingTask(true)}
                leftSection={<IconPlus size={16} />}
                style={{
                  transition: 'all 0.2s ease',
                }}
              >
                Add Task
              </Button>
                </>
              )}
            </Group>
          </Group>

          <Stack gap="lg">
            {addingTask && (
              <Paper 
                p="md" 
                style={{
                  backgroundColor: isDark ? '#25262B' : '#f8f9fa',
                  borderRadius: '10px',
                  border: `1px solid ${isDark ? '#373A40' : '#e9ecef'}`,
                  boxShadow: isDark ? '0 4px 15px rgba(0,0,0,0.2)' : '0 4px 15px rgba(0,0,0,0.05)',
                  animation: 'fadeIn 0.3s ease-in-out'
                }}
              >
                <TextInput
                  placeholder="Task title"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  autoFocus
                  mb="sm"
                  styles={{
                    input: {
                      backgroundColor: isDark ? '#2C2E33' : '#ffffff',
                      border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
                      borderRadius: '8px',
                      padding: '12px 16px',
                      fontSize: '16px',
                      transition: 'all 0.2s ease',
                      '&:focus': {
                        borderColor: '#20C997',
                        backgroundColor: isDark ? '#373A40' : '#f1f3f5'
                      }
                    }
                  }}
                />
                <Box mb="sm">
                  {!dueDateMenuOpened ? (
                    <Group style={{ alignItems: 'center' }}>
                      <DatePickerInput
                        valueFormat="MMM D, YYYY"
                        placeholder="Due date (optional)"
                        value={taskDueDate}
                        onChange={handleTaskDueDateChange}
                        clearable
                        maxLevel="month"
                        firstDayOfWeek={0}
                        style={{ flex: 1 }}
                        leftSection={<IconCalendar size={16} color="#20C997" />}
                        styles={{
                          input: {
                            backgroundColor: isDark ? '#2C2E33' : '#ffffff',
                            border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
                            borderRadius: '8px',
                            padding: '12px 16px',
                            fontSize: '16px',
                            transition: 'all 0.2s ease',
                            '&:focus': {
                              borderColor: '#20C997',
                              backgroundColor: isDark ? '#373A40' : '#f1f3f5'
                            }
                          },
                          ...calendarStyles
                        }}
                      />
                      <Button 
                        variant="subtle" 
                        size="xs" 
                        color="teal" 
                        onClick={() => setDueDateMenuOpened(true)}
                        leftSection={<IconCalendarEvent size={14} />}
                        style={{ marginLeft: '4px' }}
                      >
                        Presets
                      </Button>
                    </Group>
                  ) : (
                    <Box style={{ animation: 'fadeIn 0.2s ease' }}>
                      <Text size="xs" fw={500} c="dimmed" mb="xs">Select a date preset:</Text>
                      <SimpleGrid cols={3} spacing="xs" mb="sm">
                        <UnstyledButton 
                          style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            backgroundColor: isDark ? '#2C2E33' : '#f1f3f5',
                            border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            '&:hover': { backgroundColor: isDark ? '#373A40' : '#e9ecef' }
                          }}
                          onClick={() => {
                            handleTaskDueDateChange(getRelativeDate(0));
                            setDueDateMenuOpened(false);
                          }}
                        >
                          <Text size="xs" fw={500}>Today</Text>
                        </UnstyledButton>
                        <UnstyledButton 
                          style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            backgroundColor: isDark ? '#2C2E33' : '#f1f3f5',
                            border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            '&:hover': { backgroundColor: isDark ? '#373A40' : '#e9ecef' }
                          }}
                          onClick={() => {
                            handleTaskDueDateChange(getRelativeDate(1));
                            setDueDateMenuOpened(false);
                          }}
                        >
                          <Text size="xs" fw={500}>Tomorrow</Text>
                        </UnstyledButton>
                        <UnstyledButton 
                          style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            backgroundColor: isDark ? '#2C2E33' : '#f1f3f5',
                            border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            '&:hover': { backgroundColor: isDark ? '#373A40' : '#e9ecef' }
                          }}
                          onClick={() => {
                            handleTaskDueDateChange(getRelativeDate(2));
                            setDueDateMenuOpened(false);
                          }}
                        >
                          <Text size="xs" fw={500}>In 2 days</Text>
                        </UnstyledButton>
                        <UnstyledButton 
                          style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            backgroundColor: isDark ? '#2C2E33' : '#f1f3f5',
                            border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            '&:hover': { backgroundColor: isDark ? '#373A40' : '#e9ecef' }
                          }}
                          onClick={() => {
                            handleTaskDueDateChange(getRelativeDate(7));
                            setDueDateMenuOpened(false);
                          }}
                        >
                          <Text size="xs" fw={500}>Next week</Text>
                        </UnstyledButton>
                        <UnstyledButton 
                          style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            backgroundColor: isDark ? '#2C2E33' : '#f1f3f5',
                            border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            '&:hover': { backgroundColor: isDark ? '#373A40' : '#e9ecef' }
                          }}
                          onClick={() => {
                            handleTaskDueDateChange(getNextWeekday(1)); // Monday
                            setDueDateMenuOpened(false);
                          }}
                        >
                          <Text size="xs" fw={500}>Monday</Text>
                        </UnstyledButton>
                        <UnstyledButton 
                          style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            backgroundColor: isDark ? '#2C2E33' : '#f1f3f5',
                            border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            '&:hover': { backgroundColor: isDark ? '#373A40' : '#e9ecef' }
                          }}
                          onClick={() => {
                            handleTaskDueDateChange(getNextWeekday(5)); // Friday
                            setDueDateMenuOpened(false);
                          }}
                        >
                          <Text size="xs" fw={500}>Friday</Text>
                        </UnstyledButton>
                      </SimpleGrid>
                      <Group justify="space-between">
                        <Button 
                          variant="subtle" 
                          size="xs" 
                          color="gray" 
                          onClick={() => setDueDateMenuOpened(false)}
                        >
                          Custom date
                        </Button>
                        {taskDueDate && (
                          <Button 
                            variant="subtle" 
                            size="xs" 
                            color="red" 
                            onClick={() => {
                              handleTaskDueDateChange(null);
                              setDueDateMenuOpened(false);
                            }}
                          >
                            Clear
                          </Button>
                        )}
                      </Group>
                    </Box>
                  )}
                </Box>
                <Group justify="flex-end">
                  <Button 
                    variant="subtle" 
                    color="gray" 
                    size="sm"
                    onClick={() => setAddingTask(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="filled" 
                    color="teal" 
                    size="sm"
                    onClick={handleAddTask}
                    disabled={!newTaskTitle.trim()}
                    style={{
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(32, 201, 151, 0.25)'
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
                completedTasks.map((task) => (
                  <Paper
                    key={task.id}
                    p="md"
                    mb="md"
                    style={{
                      backgroundColor: isDark ? '#25262B' : '#ffffff',
                      borderRadius: '10px',
                      opacity: 0.7,
                      border: `1px solid ${isDark ? '#373A40' : '#e9ecef'}`,
                      transition: 'all 0.2s ease',
                      boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.05)',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onClick={() => {
                      setNoteTaskId(task.id);
                      setCurrentNotes(task.notes || '');
                      setNotesModalOpened(true);
                    }}
                  >
                    {/* Priority indicator line */}
                    <Box style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '4px',
                      height: '100%',
                      backgroundColor: getPriorityColor(task.priority),
                      opacity: 0.5
                    }} />
                    
                    {/* Main content container */}
                    <Box style={{ marginLeft: '12px' }}>
                      {/* Header row with title and badges */}
                      <Flex justify="space-between" align="flex-start" mb="xs">
                        {/* Task title */}
                        <Text fw={600} size="sm" style={{ 
                          textDecoration: 'line-through',
                          color: isDark ? '#909296' : '#adb5bd',
                          fontSize: '15px',
                          flex: 1
                        }}>
                          {task.title}
                        </Text>
                        
                        {/* Badges container */}
                        <Flex gap="xs" align="center">
                          <Badge 
                            color={getPriorityColor(task.priority)} 
                            size="sm" 
                            variant="light"
                            style={{ 
                              opacity: 0.7,
                              height: '24px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            {task.priority.toUpperCase()}
                          </Badge>
                          
                          {/* Action buttons */}
                          <ActionIcon 
                            size="md" 
                            variant="filled" 
                            color="blue"
                            radius="md"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateTask(task.id, { 
                                status: 'todo',
                                updatedAt: new Date()
                              });
                            }}
                            title="Mark as not done"
                          >
                            <IconClock size={16} />
                          </ActionIcon>
                          
                          <ActionIcon 
                            size="md" 
                            variant="filled" 
                            color={task.notes ? "teal" : "gray"}
                            radius="md"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotesOpen(task.id, task.notes, e);
                            }}
                            title={task.notes ? "View notes" : "Add notes"}
                          >
                            <IconNotes size={16} />
                          </ActionIcon>
                          
                          <ActionIcon 
                            size="md" 
                            variant="filled" 
                            color="red"
                            radius="md"
                            onClick={(e) => handleDeleteTask(task.id, e)}
                            title="Delete task"
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Flex>
                      </Flex>
                      
                      {/* Completion date */}
                      <Text size="xs" c="dimmed" style={{ marginTop: '4px' }}>
                        Completed: {new Date(task.updatedAt).toLocaleDateString()}
                      </Text>
                      
                      {/* Display notes indicator if notes exist */}
                      {task.notes && (
                        <Group gap="xs" mt="xs" onClick={(e) => {
                          e.stopPropagation();
                          handleNotesOpen(task.id, task.notes, e);
                        }} style={{ cursor: 'pointer' }}>
                          <IconNotes size={14} />
                          <Text size="xs" fw={500} c="dimmed" style={{ textDecoration: 'line-through' }}>
                            {task.notes.length > 50 ? `${task.notes.substring(0, 50)}...` : task.notes}
                          </Text>
                        </Group>
                      )}
                    </Box>
                  </Paper>
                ))
              ) : (
                <Text ta="center" mt="xl" c="dimmed">No completed tasks</Text>
              )
            ) : (
              // Active tasks view
              activeTasks.length > 0 ? (
                activeTasks.map((task) => {
              const dueDateStatus = task.dueDate ? getDueDateStatus(new Date(task.dueDate)) : 'ok';
              const dueDateColor = getDueDateColor(dueDateStatus);
              
              return (
                <Paper
                  key={task.id}
                  p="md"
                  style={{
                    backgroundColor: isDark ? '#25262B' : '#ffffff',
                    borderRadius: '10px',
                    border: `1px solid ${
                      task.priority === 'high' ? `rgba(255, 76, 76, ${isDark ? 0.3 : 0.2})` : 
                      task.priority === 'medium' ? `rgba(255, 193, 7, ${isDark ? 0.3 : 0.2})` : 
                      `rgba(3, 102, 214, ${isDark ? 0.3 : 0.2})`}`,
                    transition: 'all 0.2s ease',
                    boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    marginBottom: '12px',
                    '&:hover': {
                      backgroundColor: isDark ? '#2C2E33' : '#f8f9fa',
                      transform: 'translateY(-2px)',
                      boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.25)' : '0 4px 12px rgba(0,0,0,0.1)'
                    }
                  }}
                  onClick={() => {
                    setEditTaskId(task.id);
                    setEditTaskTitle(task.title);
                    setEditTaskPriority(task.priority);
                    setEditTaskDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
                    setEditModalOpened(true);
                  }}
                >
                  {/* Priority indicator line */}
                  <Box style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '4px',
                    height: '100%',
                    backgroundColor: getPriorityColor(task.priority),
                  }} />
                      
                  {/* Task number badge */}
                  <Box style={{
                    position: 'absolute',
                    top: '8px',
                    left: '4px',
                    borderRadius: '0 0 6px 0',
                    padding: '2px 6px',
                    backgroundColor: isDark ? '#1A1B1E' : '#f8f9fa',
                    opacity: 0.9,
                    zIndex: 1
                  }}>
                    <Text size="xs" fw={700} c={isDark ? 'dimmed' : 'gray.6'}>
                      #{activeTasks.indexOf(task) + 1}
                    </Text>
                  </Box>
                  
                  {/* Main content container */}
                  <Box style={{ marginLeft: '28px' }}>
                    {/* Header row with title and badge */}
                    <Flex justify="space-between" align="flex-start" mb="xs">
                      {/* Task title */}
                      <Text 
                        fw={600} 
                        size="sm" 
                        style={{ 
                          textDecoration: task.status === 'done' ? 'line-through' : 'none',
                          color: task.status === 'done' ? (isDark ? '#909296' : '#adb5bd') : (isDark ? '#C1C2C5' : '#495057'),
                          fontSize: '15px',
                          flex: 1,
                          paddingRight: '12px'
                        }}
                      >
                        {task.title}
                      </Text>
                      
                      {/* Badges container */}
                      <Flex gap="xs" align="center">
                        {/* Priority badge */}
                        <Menu shadow="md" width={160} position="bottom-end" offset={12}>
                          <Menu.Target>
                            <Badge 
                              color={getPriorityColor(task.priority)} 
                              size="sm" 
                              variant="filled" 
                              style={{ 
                                cursor: 'pointer',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <IconFlag size={12} style={{ marginRight: '2px' }} />
                              {task.priority.toUpperCase()}
                              <IconChevronDown size={12} />
                            </Badge>
                          </Menu.Target>

                          <Menu.Dropdown style={{ 
                            backgroundColor: isDark ? '#25262B' : '#ffffff', 
                            border: `1px solid ${isDark ? '#373A40' : '#e9ecef'}`,
                            padding: '8px',
                            zIndex: 1000
                          }}>
                            <Menu.Label>Change Priority</Menu.Label>
                            <Menu.Item 
                              color="blue" 
                              onClick={(e) => handlePriorityChange(task.id, 'low', e)}
                              fw={task.priority === 'low' ? 'bold' : 'normal'}
                              leftSection={<IconFlag size={14} />}
                              style={{ borderRadius: '4px', margin: '2px 0' }}
                            >
                              Low
                            </Menu.Item>
                            <Menu.Item 
                              color="yellow" 
                              onClick={(e) => handlePriorityChange(task.id, 'medium', e)}
                              fw={task.priority === 'medium' ? 'bold' : 'normal'}
                              leftSection={<IconFlag size={14} />}
                              style={{ borderRadius: '4px', margin: '2px 0' }}
                            >
                              Medium
                            </Menu.Item>
                            <Menu.Item 
                              color="red" 
                              onClick={(e) => handlePriorityChange(task.id, 'high', e)}
                              fw={task.priority === 'high' ? 'bold' : 'normal'}
                              leftSection={<IconFlag size={14} />}
                              style={{ borderRadius: '4px', margin: '2px 0' }}
                            >
                              High
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>

                        {/* AI Badge */}
                        {task.aiGenerated && (
                          <Badge 
                            color="teal" 
                            size="sm" 
                            variant="filled" 
                            style={{ 
                              height: '24px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            AI
                          </Badge>
                        )}
                      </Flex>
                    </Flex>
                    
                    {/* Task description */}
                    {task.description && (
                      <Text 
                        c="dimmed" 
                        size="sm" 
                        mb="xs" 
                        style={{
                          textDecoration: task.status === 'done' ? 'line-through' : 'none',
                          fontSize: '13px',
                          lineHeight: 1.5
                        }}
                      >
                        {task.description}
                      </Text>
                    )}
                    
                    {/* Due date */}
                    {task.dueDate && (
                      <Flex align="center" mt="xs" mb="xs">
                        <Menu shadow="md" width={280} position="bottom-start">
                          <Menu.Target>
                            <Group style={{ cursor: 'pointer' }}>
                              <IconClock size={14} color={dueDateColor !== 'dimmed' ? `var(--mantine-color-${dueDateColor}-filled)` : undefined} />
                              <Text size="xs" c={dueDateColor} style={{
                                fontWeight: dueDateColor !== 'dimmed' ? 600 : 400
                              }}>
                                {dueDateStatus === 'overdue' ? 'Overdue: ' : 
                                dueDateStatus === 'due-soon' ? 'Due soon: ' : ''}
                                {formatDueDate(new Date(task.dueDate))}
                              </Text>
                            </Group>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Label>Change Due Date</Menu.Label>
                            <Box p="xs">
                              <DatePickerInput
                                valueFormat="MMM D, YYYY"
                                placeholder="Select date"
                                value={task.dueDate ? new Date(task.dueDate) : null}
                                onChange={(date: Date | null) => 
                                  handleDueDateChange(task.id, date, {stopPropagation: () => {}} as any)
                                }
                                clearable
                                maxLevel="month"
                                firstDayOfWeek={0}
                                leftSection={<IconCalendar size={16} />}
                                styles={calendarStyles}
                              />
                            </Box>
                          </Menu.Dropdown>
                        </Menu>
                      </Flex>
                    )}
                    
                    {/* Add due date button */}
                    {!task.dueDate && (
                      <Menu shadow="md" width={280}>
                        <Menu.Target>
                          <Button 
                            variant="subtle" 
                            size="xs" 
                            mt="xs" 
                            leftSection={<IconCalendar size={14} />}
                            style={{ padding: '2px 6px' }}
                          >
                            Add due date
                          </Button>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Label>Set Due Date</Menu.Label>
                          <Box p="xs">
                            <DatePickerInput
                              valueFormat="MMM D, YYYY"
                              placeholder="Select date"
                              value={null}
                              onChange={(date: Date | null) => 
                                handleDueDateChange(task.id, date, {stopPropagation: () => {}} as any)
                              }
                              clearable
                              maxLevel="month"
                              firstDayOfWeek={0}
                              leftSection={<IconCalendar size={16} />}
                              styles={calendarStyles}
                            />
                          </Box>
                        </Menu.Dropdown>
                      </Menu>
                    )}
                    
                    {/* Notes indicator */}
                    {task.notes && (
                      <Group gap="xs" mt="xs" onClick={(e) => {
                        e.stopPropagation();
                        handleNotesOpen(task.id, task.notes, e);
                      }} style={{ cursor: 'pointer' }}>
                        <IconNotes size={14} />
                        <Text size="xs" fw={500}>
                          {task.notes.length > 50 ? `${task.notes.substring(0, 50)}...` : task.notes}
                        </Text>
                      </Group>
                    )}
                    
                    {/* Action buttons */}
                    <Flex justify="flex-end" gap="sm" mt="md">
                      <ActionIcon 
                        color={task.status === 'done' ? 'orange' : 'teal'} 
                        variant="filled"
                        radius="md"
                        size="md"
                        onClick={(e) => handleStatusChange(task.id, e)}
                        title={task.status === 'done' ? 'Mark as not done' : 'Mark as done'}
                      >
                        {task.status === 'done' ? <IconClock size={16} /> : <IconCheck size={16} />}
                      </ActionIcon>
                      
                      <ActionIcon 
                        color="blue" 
                        variant="filled"
                        radius="md"
                        size="md"
                        onClick={(e) => handleEditTask(task.id, e)}
                        title="Edit task"
                      >
                        <IconPencil size={16} />
                      </ActionIcon>

                      <ActionIcon 
                        color={task.notes ? "teal" : "gray"} 
                        variant="filled"
                        radius="md"
                        size="md"
                        onClick={(e) => handleNotesOpen(task.id, task.notes, e)}
                        title={task.notes ? "Edit notes" : "Add notes"}
                      >
                        <IconNotes size={16} />
                      </ActionIcon>
                      
                      <ActionIcon 
                        color="red" 
                        variant="filled"
                        radius="md"
                        size="md"
                        onClick={(e) => handleDeleteTask(task.id, e)}
                        title="Delete task"
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Flex>
                  </Box>
                </Paper>
              );
                })
              ) : (
                <Text ta="center" mt="xl" c="dimmed">No tasks to display. Add a new task to get started!</Text>
              )
            )}
          </Stack>
        </Box>
        
        {!addingTask && tasks.length > 0 && (
          <Box 
            p="md" 
            style={{ 
              borderTop: `1px solid ${isDark ? '#2C2E33' : '#e9ecef'}`,
              textAlign: 'center',
              backgroundColor: isDark ? '#1A1B1E' : '#f8f9fa'
            }}
          >
            <Button
              variant="light"
              color="teal"
              size="sm"
              leftSection={<IconPlus size={16} />}
              onClick={() => setAddingTask(true)}
              data-add-task-btn="true"
              style={{
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(32, 201, 151, 0.25)'
                }
              }}
            >
              Add Task
            </Button>
          </Box>
        )}

        {/* Edit Task Modal */}
        <Modal
          opened={!!editTaskId}
          onClose={closeEditModal}
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
            value={editTaskTitle}
            onChange={(e) => setEditTaskTitle(e.target.value)}
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
                valueFormat="MMMM D, YYYY"
                placeholder="Select due date"
              value={editTaskDueDate}
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
                value={editTaskPriority}
                onChange={(value) => setEditTaskPriority(value as 'low' | 'medium' | 'high')}
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
                onClick={closeEditModal}
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
              onClick={saveEditedTask}
              disabled={!editTaskTitle.trim()}
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
              value={currentNotes}
              onChange={(e) => setCurrentNotes(e.target.value)}
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