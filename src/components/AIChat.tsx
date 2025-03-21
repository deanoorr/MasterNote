import { useState, useRef, useEffect } from 'react';
import { Paper, TextInput, ScrollArea, Text, Stack, Group, Avatar, Loader, Box, Button, Textarea, Tooltip, useMantineColorScheme } from '@mantine/core';
import { IconSend, IconRobot, IconUser, IconBrandOpenai } from '@tabler/icons-react';
import { AIModel, Message, Task } from '../types';
import { useStore } from '../store';
import { getAIResponse } from '../services/ai';

interface AIChatProps {
  model: AIModel;
}

export default function AIChat({ model }: AIChatProps) {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, addMessage, addTask } = useStore();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading || !input.trim()) return;

    console.log("Submitting input:", input);
    setIsLoading(true);

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
      console.log("Calling getAIResponse with model:", model, "and input:", input);
      const aiResponse = await getAIResponse(model, input);
      console.log("AI response received:", aiResponse);

      // Add AI response to store
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse.content,
        role: 'assistant' as const,
        timestamp: new Date(),
      };
      addMessage(assistantMessage);

      // Check for suggested tasks
      if (aiResponse.suggestedTasks && aiResponse.suggestedTasks.length > 0) {
        console.log("Found suggested tasks:", aiResponse.suggestedTasks);
        aiResponse.suggestedTasks.forEach(suggestedTask => {
          const newTask: Task = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
            title: suggestedTask.title,
            description: suggestedTask.description || '',
            priority: suggestedTask.priority || 'medium',
            status: 'todo' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
            aiGenerated: true,
            dueDate: suggestedTask.dueDate
          };
          console.log("Adding new task from suggestedTasks:", newTask);
          addTask(newTask);
          
          // Add confirmation message if not already in the AI response
          if (!aiResponse.content.includes('Task created') && !aiResponse.content.includes('added')) {
            const taskMessage: Message = {
              id: (Date.now() + 2).toString(),
              content: `Task created: ${newTask.title}`,
              role: 'assistant' as const,
              timestamp: new Date(),
            };
            addMessage(taskMessage);
          }
        });
      } else {
        console.log("No suggested tasks in AI response");
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Error: Unable to get AI response. Please check your API key and try again.',
        role: 'assistant' as const,
        timestamp: new Date(),
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
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
              <IconBrandOpenai size={64} color="#20C997" style={{ marginBottom: '24px', opacity: 0.6 }} />
              <Text size="xl" fw={600} ta="center" c={isDark ? "dimmed" : "gray.7"}>Welcome to MasterNote AI</Text>
              <Text size="sm" c={isDark ? "dimmed" : "gray.6"} ta="center" mt="md" maw={450} style={{ lineHeight: 1.6 }}>
                Type a message to start a conversation with your AI assistant. You can ask for help, create tasks, set priorities, deadlines, and more.
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
                      <Text size="sm" style={{ 
                        whiteSpace: 'pre-wrap', 
                        lineHeight: '1.6',
                        color: msg.role === 'assistant' 
                          ? (isDark ? '#C1C2C5' : '#1A1B1E')
                          : (isDark ? '#C1C2C5' : '#1A1B1E')
                      }}>
                        {msg.content}
                      </Text>
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
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '20px 20px',
                      borderRadius: '14px',
                      borderTopLeftRadius: '4px',
                      backgroundColor: isDark ? 'rgba(32, 201, 151, 0.1)' : 'rgba(32, 201, 151, 0.08)',
                    }}
                  >
                    <Loader color="teal" size="sm" />
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
        `}
      </style>
    </Paper>
  );
} 