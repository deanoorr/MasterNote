import { useState, useEffect } from 'react';
import { Paper, Text, Stack, Badge, ActionIcon, Group, Box, TextInput, Button, Tooltip, Modal, Menu, Progress, Select, SimpleGrid, UnstyledButton, useMantineColorScheme } from '@mantine/core';
import { DatePickerInput, DatesProvider } from '@mantine/dates';
import { IconCheck, IconClock, IconTrash, IconListCheck, IconPlus, IconPencil, IconChevronDown, IconCalendar, IconFlag, IconSortAscending, IconCalendarEvent } from '@tabler/icons-react';
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
  const { tasks, updateTask, addTask, deleteTask, setSortOrder, getSortedTasks, sortOrder } = useStore();
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

  // Calendar styles for the date picker
  const calendarStyles = {
    calendarHeader: { 
      background: isDark ? '#25262b' : '#f8f9fa', 
      borderBottom: `1px solid ${isDark ? '#373A40' : '#e9ecef'}`,
      color: isDark ? '#C1C2C5' : '#495057',
    },
    monthCell: { color: isDark ? '#C1C2C5' : '#495057' },
    day: { 
      color: isDark ? '#C1C2C5' : '#495057',
      '&:hover': { background: isDark ? '#373A40' : '#e9ecef' },
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
    },
    yearPicker: { 
      background: isDark ? '#25262b' : '#ffffff',
      color: isDark ? '#C1C2C5' : '#495057',
    },
    monthPicker: { 
      background: isDark ? '#25262b' : '#ffffff',
      color: isDark ? '#C1C2C5' : '#495057', 
    },
    weekday: { color: isDark ? '#909296' : '#adb5bd' },
    yearPickerControl: { 
      color: isDark ? '#C1C2C5' : '#495057',
      '&:hover': { backgroundColor: isDark ? '#373A40' : '#e9ecef' },
    },
    monthPickerControl: { 
      color: isDark ? '#C1C2C5' : '#495057',
      '&:hover': { backgroundColor: isDark ? '#373A40' : '#e9ecef' },
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
      // Simply toggle between todo and done for simplicity
      const newStatus = task.status === 'done' ? 'todo' : 'done';
      updateTask(taskId, { 
        status: newStatus,
        updatedAt: new Date()
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
    if (!newTaskTitle.trim()) return;
    
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      priority: taskPriority,
      status: 'todo',
      createdAt: new Date(),
      updatedAt: new Date(),
      aiGenerated: false,
      dueDate: taskDueDate,
    };
    
    addTask(newTask);
    setNewTaskTitle('');
    setTaskDueDate(undefined);
    setAddingTask(false);
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
            <Text size="xl" fw={600} c={isDark ? undefined : 'gray.8'}>Tasks</Text>
            <Group>
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

            {sortedTasks.map((task) => {
              const dueDateStatus = task.dueDate ? getDueDateStatus(new Date(task.dueDate)) : 'ok';
              const dueDateColor = getDueDateColor(dueDateStatus);
              
              return (
                <Paper
                  key={task.id}
                  p="md"
                  style={{
                    backgroundColor: isDark ? '#25262B' : '#ffffff',
                    borderRadius: '10px',
                    opacity: task.status === 'done' ? 0.7 : 1,
                    border: `1px solid ${task.status === 'done' ? (isDark ? '#373A40' : '#e9ecef') : 
                      task.priority === 'high' ? `rgba(255, 76, 76, ${isDark ? 0.3 : 0.2})` : 
                      task.priority === 'medium' ? `rgba(255, 193, 7, ${isDark ? 0.3 : 0.2})` : 
                      `rgba(3, 102, 214, ${isDark ? 0.3 : 0.2})`}`,
                    transition: 'all 0.2s ease',
                    boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      backgroundColor: isDark ? '#2C2E33' : '#f8f9fa',
                      transform: 'translateY(-2px)',
                      boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.25)' : '0 4px 12px rgba(0,0,0,0.1)'
                    }
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
                    opacity: task.status === 'done' ? 0.4 : 0.8
                  }} />
                  
                  <Group justify="space-between" align="flex-start" style={{ marginLeft: '6px' }}>
                    <Box style={{ flex: 1 }}>
                      <Group justify="space-between" mb="xs">
                        <Text fw={600} size="sm" style={{ 
                          textDecoration: task.status === 'done' ? 'line-through' : 'none',
                          color: task.status === 'done' ? (isDark ? '#909296' : '#adb5bd') : (isDark ? '#C1C2C5' : '#495057'),
                          fontSize: '16px'
                        }}>
                          {task.title}
                        </Text>
                        <Group gap="xs">
                          <Menu shadow="md" width={160} position="bottom-end">
                            <Menu.Target>
                              <Badge color={getPriorityColor(task.priority)} size="sm" variant="light" 
                                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }} 
                                rightSection={<IconChevronDown size={12} />}
                                leftSection={<IconFlag size={12} />}>
                                {task.priority}
                              </Badge>
                            </Menu.Target>

                            <Menu.Dropdown style={{ backgroundColor: isDark ? '#25262B' : '#ffffff', border: `1px solid ${isDark ? '#373A40' : '#e9ecef'}` }}>
                              <Menu.Label>Change Priority</Menu.Label>
                              <Menu.Item 
                                color="blue" 
                                onClick={(e) => handlePriorityChange(task.id, 'low', e)}
                                fw={task.priority === 'low' ? 'bold' : 'normal'}
                                leftSection={<IconFlag size={14} />}
                              >
                                Low
                              </Menu.Item>
                              <Menu.Item 
                                color="yellow" 
                                onClick={(e) => handlePriorityChange(task.id, 'medium', e)}
                                fw={task.priority === 'medium' ? 'bold' : 'normal'}
                                leftSection={<IconFlag size={14} />}
                              >
                                Medium
                              </Menu.Item>
                              <Menu.Item 
                                color="red" 
                                onClick={(e) => handlePriorityChange(task.id, 'high', e)}
                                fw={task.priority === 'high' ? 'bold' : 'normal'}
                                leftSection={<IconFlag size={14} />}
                              >
                                High
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                          
                          {task.aiGenerated && (
                            <Badge color="teal" size="sm" variant={isDark ? "light" : "outline"} 
                              style={{ transition: 'all 0.2s ease' }}>
                              AI
                            </Badge>
                          )}
                        </Group>
                      </Group>
                      {task.description && (
                        <Text c="dimmed" size="sm" mt="xs" mb="xs" style={{
                          textDecoration: task.status === 'done' ? 'line-through' : 'none',
                          fontSize: '14px',
                          lineHeight: 1.5
                        }}>
                          {task.description}
                        </Text>
                      )}
                      {task.dueDate && (
                        <Group gap="xs" mt="xs">
                          <Menu shadow="md" width={280}>
                            <Menu.Target>
                              <Group style={{ cursor: 'pointer' }}>
                                <IconClock size={14} color={dueDateColor !== 'dimmed' ? `var(--mantine-color-${dueDateColor}-filled)` : undefined} />
                                <Text size="xs" c={dueDateColor} style={{
                                  fontWeight: dueDateColor !== 'dimmed' ? 600 : 400
                                }}>
                                  {dueDateStatus === 'overdue' ? 'Overdue: ' : 
                                   dueDateStatus === 'due-soon' ? 'Due soon: ' : ''}
                                  {new Date(task.dueDate).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: new Date(task.dueDate).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                                  })}
                                </Text>
                              </Group>
                            </Menu.Target>
                            <Menu.Dropdown style={{ backgroundColor: isDark ? '#25262B' : '#ffffff', border: `1px solid ${isDark ? '#373A40' : '#e9ecef'}` }}>
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
                                  leftSection={<IconCalendar size={16} />}
                                  styles={calendarStyles}
                                />
                              </Box>
                            </Menu.Dropdown>
                          </Menu>
                        </Group>
                      )}
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
                                leftSection={<IconCalendar size={16} />}
                                styles={calendarStyles}
                              />
                            </Box>
                          </Menu.Dropdown>
                        </Menu>
                      )}
                    </Box>
                    <Group gap="xs">
                      <Tooltip label={task.status === 'done' ? 'Mark as todo' : 'Mark as done'} position="top">
                        <ActionIcon
                          color={task.status === 'done' ? 'teal' : 'gray'}
                          variant={task.status === 'done' ? 'filled' : 'light'}
                          onClick={(e) => handleStatusChange(task.id, e)}
                          radius="xl"
                          style={{ transition: 'all 0.2s ease', transform: task.status === 'done' ? 'scale(1.1)' : 'scale(1)' }}
                        >
                          <IconCheck size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Edit task" position="top">
                        <ActionIcon 
                          color="blue" 
                          variant="light"
                          radius="xl"
                          onClick={(e) => handleEditTask(task.id, e)}
                        >
                          <IconPencil size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete task" position="top">
                        <ActionIcon 
                          color="red" 
                          variant="light"
                          radius="xl"
                          onClick={(e) => handleDeleteTask(task.id, e)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Group>
                </Paper>
              );
            })}
            
            {tasks.length === 0 && !addingTask && (
              <Box 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '50vh',
                  opacity: 0.7
                }}
              >
                <IconListCheck size={64} color="#20C997" style={{ marginBottom: '24px', opacity: 0.5 }} />
                <Text size="xl" c={isDark ? "dimmed" : "gray.7"} fw={500} ta="center">No tasks yet</Text>
                <Text size="sm" c={isDark ? "dimmed" : "gray.6"} ta="center" mt="xs" maw={400} style={{ lineHeight: 1.6 }}>
                  Start chatting with the AI to create some tasks or add them manually.
                </Text>
                <Button 
                  variant="light" 
                  color="teal" 
                  size="md" 
                  leftSection={<IconPlus size={18} />}
                  onClick={() => setAddingTask(true)}
                  data-add-task-btn="true"
                  mt="xl"
                  style={{
                    transition: 'all 0.3s ease',
                    padding: '8px 20px',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 15px rgba(32, 201, 151, 0.25)'
                    }
                  }}
                >
                  Add Task
                </Button>
              </Box>
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
          title="Edit Task"
          centered
          size="sm"
          styles={{
            header: {
              backgroundColor: isDark ? '#25262B' : '#f8f9fa',
              borderBottom: `1px solid ${isDark ? '#373A40' : '#e9ecef'}`,
              padding: '16px 24px',
              fontWeight: 600
            },
            content: {
              backgroundColor: isDark ? '#1A1B1E' : '#ffffff',
            },
            body: {
              padding: '24px'
            }
          }}
        >
          <TextInput
            placeholder="Task title"
            value={editTaskTitle}
            onChange={(e) => setEditTaskTitle(e.target.value)}
            autoFocus
            mb="md"
            styles={{
              input: {
                backgroundColor: isDark ? '#2C2E33' : '#f8f9fa',
                border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '16px',
                transition: 'all 0.2s ease',
                '&:focus': {
                  borderColor: '#20C997',
                  backgroundColor: isDark ? '#373A40' : '#ffffff'
                }
              }
            }}
          />
          <Box mb="lg">
            <Text size="xs" fw={500} c="dimmed" mb="xs">Due date (optional):</Text>
            <DatePickerInput
              valueFormat="MMM D, YYYY"
              placeholder="Select date"
              value={editTaskDueDate}
              onChange={handleEditTaskDueDateChange}
              clearable
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
            <SimpleGrid cols={4} spacing="xs" mt="sm">
              <UnstyledButton 
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  backgroundColor: isDark ? '#2C2E33' : '#f1f3f5',
                  border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': { backgroundColor: isDark ? '#373A40' : '#e9ecef' }
                }}
                onClick={() => handleEditTaskDueDateChange(getRelativeDate(0))}
              >
                <Text size="xs" fw={500}>Today</Text>
              </UnstyledButton>
              <UnstyledButton 
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  backgroundColor: isDark ? '#2C2E33' : '#f1f3f5',
                  border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': { backgroundColor: isDark ? '#373A40' : '#e9ecef' }
                }}
                onClick={() => handleEditTaskDueDateChange(getRelativeDate(1))}
              >
                <Text size="xs" fw={500}>Tomorrow</Text>
              </UnstyledButton>
              <UnstyledButton 
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  backgroundColor: isDark ? '#2C2E33' : '#f1f3f5',
                  border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': { backgroundColor: isDark ? '#373A40' : '#e9ecef' }
                }}
                onClick={() => handleEditTaskDueDateChange(getNextWeekday(1))}
              >
                <Text size="xs" fw={500}>Monday</Text>
              </UnstyledButton>
              <UnstyledButton 
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  backgroundColor: isDark ? '#2C2E33' : '#f1f3f5',
                  border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': { backgroundColor: isDark ? '#373A40' : '#e9ecef' }
                }}
                onClick={() => handleEditTaskDueDateChange(getNextWeekday(5))}
              >
                <Text size="xs" fw={500}>Friday</Text>
              </UnstyledButton>
            </SimpleGrid>
          </Box>
          <Group justify="flex-end">
            <Button 
              variant="subtle" 
              color="gray" 
              onClick={closeEditModal}
            >
              Cancel
            </Button>
            <Button 
              variant="filled" 
              color="teal" 
              onClick={saveEditedTask}
              disabled={!editTaskTitle.trim()}
              style={{
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(32, 201, 151, 0.3)'
                }
              }}
            >
              Save Changes
            </Button>
          </Group>
        </Modal>
      </Paper>
    </DatesProvider>
  );
} 