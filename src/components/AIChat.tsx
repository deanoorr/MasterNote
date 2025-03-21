import { useState, useRef, useEffect } from 'react';
import { Paper, TextInput, ScrollArea, Text, Stack, Group, Avatar, Loader, Box, Button, Textarea, Tooltip, useMantineColorScheme, SegmentedControl, Badge, Image } from '@mantine/core';
import { IconSend, IconRobot, IconUser, IconBrandOpenai, IconList, IconMessage, IconCheck, IconAlertCircle, IconBulb } from '@tabler/icons-react';
import { AIModel, Message, Task } from '../types';
import { useStore, AIModeType } from '../store';
import { getAIResponse } from '../services/ai';

interface AIChatProps {
  model: AIModel;
}

export default function AIChat({ model }: AIChatProps) {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingReasoning, setLoadingReasoning] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, addMessage, addTask, aiMode, setAIMode } = useStore();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loadingReasoning]);

  // Simulated reasoning process for the DeepSeek R1 model
  useEffect(() => {
    // No need for interval variable anymore since we don't use setInterval
    
    // Remove the DeepSeek R1 reasoning simulation entirely
    if (isLoading && model === 'deepseek-r1') {
      // Don't do anything special for DeepSeek R1, treat it like other models
      setLoadingReasoning([]);
    } else {
      setLoadingReasoning([]);
    }
    
    // No interval to clear since we don't use it
    return () => {
      // No interval to clean up
    };
  }, [isLoading, model, messages]);

  // Helper function to scroll to the bottom of the chat
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading || !input.trim()) return;

    console.log("Submitting input:", input);
    setIsLoading(true);
    setLoadingReasoning([]);

    // Add user message to store
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user' as const,
      timestamp: new Date(),
    };
    addMessage(userMessage);
    setInput('');

    try {
      const userID = "user123"; // Replace with actual user ID if available
      console.log(`Processing message in ${aiMode} mode with input: ${input}`);
      // Get response as string from the updated function
      const response = await getAIResponse(input, aiMode as 'normal' | 'task', userID);
      console.log("AI response received:", response);

      // Add AI response to store
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant' as const,
        timestamp: new Date(),
      };
      addMessage(assistantMessage);

      // Look for task creation patterns in the response
      // Adding direct task handling here instead of relying solely on the AI service
      if (aiMode === 'task') {
        const taskRegex = /TASK:\s*([^|]+)(?:\|(.+))?/g;
        let match;
        
        // Find and process all task matches in the AI response
        while ((match = taskRegex.exec(response)) !== null) {
          let fullTitle = match[1]?.trim() || '';
          const description = match[2]?.trim() || '';
          
          // Clean the task title - remove any leading numbers/formats like "1. " or "3."
          fullTitle = fullTitle.replace(/^\d+\.\s*/, '');
          
          if (fullTitle) {
            const task: Task = {
              id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              title: fullTitle,
              description,
              priority: 'medium',
              status: 'todo',
              createdAt: new Date(),
              updatedAt: new Date(),
              aiGenerated: true,
              dueDate: undefined
            };
            
            console.log('Adding task from AIChat component:', task);
            addTask(task);
          }
        }
        
        // Also look for direct task references in the format "1. task name", "2. another task"
        // This handles cases where the AI gives a numbered list of tasks
        const numberedTaskRegex = /^\s*(\d+)\.\s+(.+)$/gm;
        while ((match = numberedTaskRegex.exec(response)) !== null) {
          const taskText = match[2]?.trim();
          
          // Skip if it's too short or already handled by the TASK: format
          if (taskText && taskText.length > 2 && !taskText.startsWith('TASK:')) {
            const task: Task = {
              id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              title: taskText,
              description: '',
              priority: 'medium',
              status: 'todo',
              createdAt: new Date(),
              updatedAt: new Date(),
              aiGenerated: true,
              dueDate: undefined
            };
            
            console.log('Adding numbered task from AIChat component:', task);
            addTask(task);
          }
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: model === 'deepseek-r1' 
          ? "I encountered an error processing your request. Please try again or check your API settings."
          : "Sorry, I encountered an error processing your request. Please try again.",
        role: 'assistant' as const,
        timestamp: new Date(),
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  return (
    <Paper style={{ 
      height: '100%', 
      backgroundColor: isDark ? '#1A1B1E' : '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '12px',
      boxShadow: isDark ? '0 8px 30px rgba(0, 0, 0, 0.2)' : '0 8px 30px rgba(0, 0, 0, 0.05)',
      overflow: 'hidden'
    }}>
      {/* Mode Switch Header */}
      <Box 
        p="md" 
        style={{ 
          borderBottom: `1px solid ${isDark ? '#2C2E33' : '#E9ECEF'}`,
          backgroundColor: isDark ? '#25262B' : '#F8F9FA'
        }}
      >
        <Group justify="space-between">
          <Group>
            <IconRobot size={20} style={{ color: isDark ? '#C1C2C5' : '#5c5f66' }} />
            <Text size="sm" fw={600} c={isDark ? undefined : "gray.7"}>MasterNote AI</Text>
            
            {aiMode === 'task' && (
              <Badge 
                color="teal" 
                variant="light"
                size="sm"
                style={{ marginLeft: 10 }}
              >
                Task Mode
              </Badge>
            )}
          </Group>
          
          <SegmentedControl
            size="xs"
            data={[
              { label: 'Normal Mode', value: 'normal' },
              { label: 'Task Mode', value: 'task' }
            ]}
            value={aiMode}
            onChange={(value) => {
              const newMode = value as AIModeType;
              setAIMode(newMode);
            }}
            styles={{
              root: {
                background: isDark ? '#2C2E33' : '#f1f3f5',
                border: `1px solid ${isDark ? '#3f4245' : '#dee2e6'}`
              },
              indicator: {
                backgroundColor: isDark ? '#20C997' : '#20C997'
              },
              label: {
                color: isDark ? '#C1C2C5' : '#495057',
                '&[data-active]': {
                  color: isDark ? 'white' : 'white'
                }
              }
            }}
          />
        </Group>
      </Box>
      
      <ScrollArea
        style={{ flex: 1, padding: '10px 5px' }}
        scrollbarSize={8}
        scrollHideDelay={500}
        type="hover"
        viewportRef={scrollRef}
      >
        <Box p="md">
          {messages.length === 0 ? (
            <Box 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '60vh',
                opacity: 0.8,
                padding: '0 20px'
              }}
            >
              <img src="/favicon.svg" alt="MasterNote Logo" width="64" height="64" style={{ marginBottom: '24px', opacity: 0.9 }} />
              <Text size="xl" fw={600} ta="center" c={isDark ? "dimmed" : "gray.7"}>
                Welcome to MasterNote AI
                {aiMode === 'task' ? ' - Task Mode' : ''}
              </Text>
              <Text size="sm" c={isDark ? "dimmed" : "gray.6"} ta="center" mt="md" maw={450} style={{ lineHeight: 1.6 }}>
                {aiMode === 'task' 
                  ? "I can help you create and manage tasks from natural language. Just describe what you need to do, and I'll handle the rest."
                  : "Type a message to start a conversation. I can answer questions, provide information, and help with a variety of tasks."}
              </Text>
            </Box>
          ) : (
            <Stack gap="md">
              {messages.map((msg, i) => (
                <Box 
                  key={msg.id} 
                  style={{
                    animation: 'fadeIn 0.3s ease-out',
                    animationFillMode: 'both',
                    animationDelay: `${i * 0.1}s`
                  }}
                >
                  <Group align="flex-start" wrap="nowrap" gap="xs">
                    <Avatar 
                      size="md" 
                      radius="xl" 
                      bg={msg.role === 'assistant' ? 'teal' : (isDark ? 'blue.8' : 'blue.5')}
                      style={{ 
                        marginTop: '4px',
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {msg.role === 'assistant' ? <IconRobot size={18} /> : <IconUser size={18} />}
                    </Avatar>
                    <Box 
                      style={{ 
                        flex: 1,
                        backgroundColor: msg.role === 'assistant' 
                          ? (isDark ? 'rgba(32, 201, 151, 0.1)' : 'rgba(32, 201, 151, 0.08)')
                          : (isDark ? '#25262B' : '#f1f3f5'),
                        padding: '12px 16px',
                        borderRadius: '14px',
                        borderTopLeftRadius: msg.role === 'assistant' ? '4px' : '14px',
                        borderTopRightRadius: msg.role === 'user' ? '4px' : '14px',
                        marginBottom: '4px'
                      }}
                    >
                      <div 
                        style={{ 
                          whiteSpace: 'pre-wrap', 
                          wordBreak: 'break-word',
                          maxWidth: '100%',
                          fontSize: '15px',
                          lineHeight: 1.7,
                          color: isDark ? '#C1C2C5' : '#212529',
                        }}
                      >
                        {/* Display DeepSeek responses like normal responses */}
                        {model === 'deepseek-r1' && msg.role === 'assistant' ? (
                          <div style={{ 
                            whiteSpace: 'pre-wrap', 
                            wordBreak: 'break-word',
                            lineHeight: 1.7,
                          }}>
                            {msg.content}
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>
                    </Box>
                  </Group>
                </Box>
              ))}
              {isLoading && (
                <Group align="flex-start" wrap="nowrap" gap="xs">
                  <Avatar 
                    size="md" 
                    radius="xl" 
                    bg="teal" 
                    style={{ 
                      marginTop: '4px',
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <IconRobot size={18} />
                  </Avatar>
                  <Box 
                    style={{ 
                      flex: 1,
                      borderRadius: '14px',
                      borderTopLeftRadius: '4px',
                      backgroundColor: isDark ? 'rgba(32, 201, 151, 0.1)' : 'rgba(32, 201, 151, 0.08)',
                      padding: '20px 20px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <Loader color="teal" size="sm" />
                    </div>
                  </Box>
                </Group>
              )}
            </Stack>
          )}
        </Box>
      </ScrollArea>

      <Box
        component="form"
        onSubmit={handleSubmit}
        style={{
          borderTop: `1px solid ${isDark ? '#2C2E33' : '#e9ecef'}`,
          padding: '14px 16px',
          backgroundColor: isDark ? '#212326' : '#f8f9fa',
        }}
      >
        <Group align="flex-end">
          <Textarea
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            autosize
            minRows={1}
            maxRows={4}
            style={{ flex: 1 }}
            styles={{
              input: {
                backgroundColor: isDark ? '#2C2E33' : '#fff',
                border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '15px',
                transition: 'all 0.2s ease',
                '&:focus': {
                  borderColor: '#20C997',
                  backgroundColor: isDark ? '#373A40' : '#f8f9fa'
                }
              }
            }}
            disabled={isLoading}
          />
          <Tooltip label="Send message">
            <Button
              color="teal"
              type="submit"
              style={{ 
                height: '40px', 
                width: '40px',
                borderRadius: '12px',
                padding: 0,
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)'
                }
              }}
              disabled={isLoading || !input.trim()}
            >
              <IconSend size={18} />
            </Button>
          </Tooltip>
        </Group>
      </Box>
      
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes blink {
            from, to { opacity: 1; }
            50% { opacity: 0; }
          }
          
          @keyframes pulse {
            0% { opacity: 0.4; }
            50% { opacity: 1; }
            100% { opacity: 0.4; }
          }
        `}
      </style>
    </Paper>
  );
}