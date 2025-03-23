import { useState, useRef, useEffect } from 'react';
import { Paper, TextInput, ScrollArea, Text, Stack, Group, Avatar, Loader, Box, Button, Textarea, Tooltip, useMantineColorScheme, SegmentedControl, Badge, Image, Popover } from '@mantine/core';
import { IconSend, IconRobot, IconUser, IconBrandOpenai, IconList, IconMessage, IconCheck, IconAlertCircle, IconBulb, IconMicrophone, IconSearch, IconArrowRight } from '@tabler/icons-react';
import { AIModel, Message, Task } from '../types';
import { useStore, AIModeType } from '../store';
import { getAIResponse, detectTaskIntent, shouldSuggestModeSwitch } from '../services/ai';

interface AIChatProps {
  model: AIModel;
}

export default function AIChat({ model }: AIChatProps) {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingReasoning, setLoadingReasoning] = useState<string[]>([]);
  const [showModeSwitchPrompt, setShowModeSwitchPrompt] = useState(false);
  const [suggestedMode, setSuggestedMode] = useState<AIModeType | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, addMessage, addTask, aiMode, setAIMode } = useStore();

  // Replace the entire keyboard shortcut handling with this one simpler version
  useEffect(() => {
    function handleKeyPress(event: KeyboardEvent) {
      // Use keyCode for better cross-browser compatibility
      const key = event.key.toLowerCase();
      
      // Check for Command+M (metaKey on Mac)
      if (event.metaKey && key === 'm') {
        event.preventDefault();
        console.log('Keyboard shortcut detected:', key, 
          'meta:', event.metaKey, 
          'alt:', event.altKey, 
          'ctrl:', event.ctrlKey, 
          'shift:', event.shiftKey
        );
        
        // Toggle mode without using the current state directly
        const newMode = aiMode === 'normal' ? 'task' : 'normal';
        console.log('Switching mode from', aiMode, 'to', newMode);
        setAIMode(newMode);
      }
    }
    
    // Add event listener directly to document body
    document.body.addEventListener('keydown', handleKeyPress);
    console.log('Added keyboard shortcut listener to document body');
    
    // Cleanup 
    return () => {
      document.body.removeEventListener('keydown', handleKeyPress);
      console.log('Removed keyboard shortcut listener from document body');
    };
  }, [aiMode, setAIMode]);

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

  // Check message intent as user types and suggest mode switch if needed
  useEffect(() => {
    if (input.trim() && !input.startsWith('/')) {
      const { shouldSwitch, suggestedMode } = shouldSuggestModeSwitch(input, aiMode);
      if (shouldSwitch && suggestedMode !== aiMode) {
        setSuggestedMode(suggestedMode);
        setShowModeSwitchPrompt(true);
      } else {
        setShowModeSwitchPrompt(false);
      }
    } else {
      setShowModeSwitchPrompt(false);
    }
  }, [input, aiMode]);

  // Helper function to scroll to the bottom of the chat
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading || !input.trim()) return;

    // Check for mode switching commands
    if (input.trim().startsWith('/')) {
      const command = input.trim().toLowerCase();
      
      if (command === '/task' || command === '/tasks') {
        setAIMode('task');
        setInput('');
        return;
      } else if (command === '/normal' || command === '/chat') {
        setAIMode('normal');
        setInput('');
        return;
      }
      // Continue with regular submission if not a recognized command
    }

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

  // Handle mode switch from prompt
  const handleSwitchMode = () => {
    if (suggestedMode) {
      setAIMode(suggestedMode);
      setShowModeSwitchPrompt(false);
    }
  };

  // Function to dismiss the mode switch prompt
  const dismissModeSwitchPrompt = () => {
    setShowModeSwitchPrompt(false);
  };

  // Get model name for display
  const getModelDisplayName = () => {
    switch(model) {
      case 'gpt4o': return 'GPT-4o';
      case 'o3-mini': return 'GPT-3.5 Turbo';
      case 'perplexity-sonar': return 'Search Mode';
      case 'deepseek-r1': return 'Reasoning Mode';
      default: return 'AI Assistant';
    }
  };

  // Get model color for UI elements
  const getModelColor = () => {
    switch(model) {
      case 'perplexity-sonar': return '#5282FF';
      case 'deepseek-r1': return '#FA5252';
      default: return '#20C997';
    }
  };

  // Get mode switching text based on current mode
  const getModeSwitchingText = () => {
    return aiMode === 'normal' 
      ? 'Click the Switch Mode button or use Command+M to change to Task Mode'
      : 'Click the Switch Mode button or use Command+M to change to Normal Mode';
  };

  // Add this directly in the component for the input element
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    console.log('Textarea keydown event detected:', e.key, e.altKey, e.metaKey, e.ctrlKey);
    
    // Command+M on Mac
    if (e.metaKey && e.key.toLowerCase() === 'm') {
      e.preventDefault(); // Prevent browser default behavior
      console.log('Input Command+M shortcut triggered - Before mode change:', aiMode);
      setAIMode(aiMode === 'normal' ? 'task' : 'normal');
      console.log('Input Command+M shortcut triggered - After mode change:', aiMode === 'normal' ? 'task' : 'normal');
    }
    
    // Keep the existing Enter key handling
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Paper 
      style={{ 
        height: '100%', 
        backgroundColor: isDark ? '#1A1B1E' : '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '12px',
        boxShadow: isDark ? '0 8px 30px rgba(0, 0, 0, 0.2)' : '0 8px 30px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        position: 'relative',
        backgroundImage: isDark ? 
          'linear-gradient(to bottom, rgba(17, 75, 95, 0.05) 0%, rgba(0, 0, 0, 0) 100%)' : 
          'linear-gradient(to bottom, rgba(32, 201, 151, 0.03) 0%, rgba(255, 255, 255, 0) 100%)'
      }}
      onKeyDown={(e) => {
        console.log('Paper keydown event detected:', e.key, e.altKey, e.metaKey, e.ctrlKey);
      }}
      tabIndex={0} // Make the paper focusable
    >
      {/* Mode Switch Header */}
      <Box 
        p="md" 
        style={{ 
          borderBottom: `1px solid ${isDark ? '#2C2E33' : '#E9ECEF'}`,
          backgroundColor: isDark ? 'rgba(37, 38, 43, 0.8)' : 'rgba(248, 249, 250, 0.9)',
          backdropFilter: 'blur(8px)',
          position: 'relative',
          zIndex: 10
        }}
      >
        <Group justify="space-between">
          <Group>
            <Avatar size="sm" radius="xl" color={model === 'perplexity-sonar' ? 'blue' : model === 'deepseek-r1' ? 'red' : 'teal'} style={{ boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}>
              {model === 'perplexity-sonar' ? <IconSearch size={14} /> : <IconRobot size={14} />}
            </Avatar>
            <div>
              <Group gap={8}>
                <Text size="sm" fw={600} c={isDark ? undefined : "gray.7"}>{getModelDisplayName()}</Text>
                {aiMode === 'task' && (
                  <Badge 
                    color="teal" 
                    variant="light"
                    size="xs"
                    radius="sm"
                    style={{ cursor: 'help' }}
                    title={getModeSwitchingText()}
                  >
                    Task Mode
                  </Badge>
                )}
                {aiMode === 'normal' && (
                  <Badge 
                    color="blue" 
                    variant="light"
                    size="xs"
                    radius="sm"
                    style={{ cursor: 'help' }}
                    title={getModeSwitchingText()}
                  >
                    Normal Mode
                  </Badge>
                )}
              </Group>
              <Text size="xs" c="dimmed">Powered by {model === 'perplexity-sonar' ? 'Perplexity' : model === 'deepseek-r1' ? 'DeepSeek' : model.includes('claude') ? 'Anthropic' : 'OpenAI'}</Text>
            </div>
          </Group>
          
          <Group gap="sm">
            <Tooltip 
              label="Switch modes with one click (or use Command+M keyboard shortcut)" 
              position="bottom"
            >
              <Button 
                variant="filled" 
                color={aiMode === 'normal' ? 'teal' : 'blue'}
                size="xs"
                onClick={() => setAIMode(aiMode === 'normal' ? 'task' : 'normal')}
                style={{ 
                  height: '28px', 
                  padding: '0 12px',
                  fontWeight: 'bold',
                }}
              >
                Switch to {aiMode === 'normal' ? 'Task' : 'Normal'} Mode
              </Button>
            </Tooltip>
          </Group>
        </Group>
      </Box>
      
      <ScrollArea
        style={{ flex: 1, padding: '4px 0' }}
        scrollbarSize={6}
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
                height: '70vh',
                padding: '0 20px'
              }}
            >
              <Box 
                style={{
                  width: '560px',
                  maxWidth: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <Text size="xl" fw={700} ta="center" mb="md" c={isDark ? "gray.3" : "gray.8"}>
                  MasterNote AI
                </Text>
                
                <Text size="sm" c={isDark ? "dimmed" : "gray.6"} ta="center" mb="xl" maw={450} style={{ lineHeight: 1.6 }}>
                  {aiMode === 'task' 
                    ? "I can help you create and manage tasks from natural language. Just describe what you need to do, and I'll handle the rest."
                    : "Type a message to start a conversation. I can answer questions, provide information, and help with a variety of tasks."}
                </Text>
                
                <Box mb="xl" w="100%">
                  <Group justify="space-between" mb="lg">
                    <Text size="sm" fw={600} c={isDark ? "gray.4" : "gray.7"}>Examples</Text>
                  </Group>
                  
                  <Stack gap="sm">
                    {aiMode === 'task' ? (
                      <>
                        <Button 
                          variant="outline" 
                          color="gray" 
                          onClick={() => setInput("Create a task for buying groceries tomorrow")}
                          fullWidth
                          h={54}
                          styles={{
                            root: {
                              border: `1px solid ${isDark ? 'rgba(70, 75, 90, 0.5)' : '#e9ecef'}`,
                              color: isDark ? 'white' : 'black',
                              '&:hover': {
                                backgroundColor: isDark ? 'rgba(44, 46, 51, 0.5)' : 'rgba(241, 243, 245, 0.7)'
                              }
                            },
                            inner: {
                              justifyContent: 'flex-start'
                            }
                          }}
                        >
                          Create a task for buying groceries tomorrow
                        </Button>
                        <Button 
                          variant="outline" 
                          color="gray" 
                          onClick={() => setInput("I need to finish my project report by Friday")}
                          fullWidth
                          h={54}
                          styles={{
                            root: {
                              border: `1px solid ${isDark ? 'rgba(70, 75, 90, 0.5)' : '#e9ecef'}`,
                              color: isDark ? 'white' : 'black',
                              '&:hover': {
                                backgroundColor: isDark ? 'rgba(44, 46, 51, 0.5)' : 'rgba(241, 243, 245, 0.7)'
                              }
                            },
                            inner: {
                              justifyContent: 'flex-start'
                            }
                          }}
                        >
                          I need to finish my project report by Friday
                        </Button>
                        <Button 
                          variant="outline" 
                          color="gray" 
                          onClick={() => setInput("What tasks do I have today?")}
                          fullWidth
                          h={54}
                          styles={{
                            root: {
                              border: `1px solid ${isDark ? 'rgba(70, 75, 90, 0.5)' : '#e9ecef'}`,
                              color: isDark ? 'white' : 'black',
                              '&:hover': {
                                backgroundColor: isDark ? 'rgba(44, 46, 51, 0.5)' : 'rgba(241, 243, 245, 0.7)'
                              }
                            },
                            inner: {
                              justifyContent: 'flex-start'
                            }
                          }}
                        >
                          What tasks do I have today?
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="outline" 
                          color="gray" 
                          onClick={() => setInput("What's the best way to learn programming?")}
                          fullWidth
                          h={54}
                          styles={{
                            root: {
                              border: `1px solid ${isDark ? 'rgba(70, 75, 90, 0.5)' : '#e9ecef'}`,
                              color: isDark ? 'white' : 'black',
                              '&:hover': {
                                backgroundColor: isDark ? 'rgba(44, 46, 51, 0.5)' : 'rgba(241, 243, 245, 0.7)'
                              }
                            },
                            inner: {
                              justifyContent: 'flex-start'
                            }
                          }}
                        >
                          What's the best way to learn programming?
                        </Button>
                        <Button 
                          variant="outline" 
                          color="gray" 
                          onClick={() => setInput("Explain quantum computing in simple terms")}
                          fullWidth
                          h={54}
                          styles={{
                            root: {
                              border: `1px solid ${isDark ? 'rgba(70, 75, 90, 0.5)' : '#e9ecef'}`,
                              color: isDark ? 'white' : 'black',
                              '&:hover': {
                                backgroundColor: isDark ? 'rgba(44, 46, 51, 0.5)' : 'rgba(241, 243, 245, 0.7)'
                              }
                            },
                            inner: {
                              justifyContent: 'flex-start'
                            }
                          }}
                        >
                          Explain quantum computing in simple terms
                        </Button>
                        <Button 
                          variant="outline" 
                          color="gray" 
                          onClick={() => setInput("Give me a healthy meal plan for the week")}
                          fullWidth
                          h={54}
                          styles={{
                            root: {
                              border: `1px solid ${isDark ? 'rgba(70, 75, 90, 0.5)' : '#e9ecef'}`,
                              color: isDark ? 'white' : 'black',
                              '&:hover': {
                                backgroundColor: isDark ? 'rgba(44, 46, 51, 0.5)' : 'rgba(241, 243, 245, 0.7)'
                              }
                            },
                            inner: {
                              justifyContent: 'flex-start'
                            }
                          }}
                        >
                          Give me a healthy meal plan for the week
                        </Button>
                      </>
                    )}
                  </Stack>
                </Box>
                
                <Group justify="space-between" style={{ width: '100%' }}>
                  <Text size="sm" fw={600} c={isDark ? "gray.4" : "gray.7"}>Capabilities</Text>
                </Group>
                <Box 
                  mt="md" 
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                    gap: '10px',
                    width: '100%'
                  }}
                >
                  <Box style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <IconBulb size={16} stroke={1.5} color={isDark ? '#909296' : '#868e96'} style={{ marginTop: 4 }} />
                    <Text size="sm" c="dimmed">Remembers what's said earlier in conversations</Text>
                  </Box>
                  <Box style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <IconBulb size={16} stroke={1.5} color={isDark ? '#909296' : '#868e96'} style={{ marginTop: 4 }} />
                    <Text size="sm" c="dimmed">Allows follow-up corrections and conversations</Text>
                  </Box>
                  {aiMode === 'task' && (
                    <Box style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <IconBulb size={16} stroke={1.5} color={isDark ? '#909296' : '#868e96'} style={{ marginTop: 4 }} />
                      <Text size="sm" c="dimmed">Creates and manages tasks from natural language</Text>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          ) : (
            <Stack gap="md">
              {messages.map((msg, i) => (
                <Box 
                  key={msg.id} 
                  style={{
                    animation: 'fadeIn 0.3s ease-out',
                    animationFillMode: 'both',
                    animationDelay: `${i * 0.1}s`,
                    width: '100%'
                  }}
                >
                  {/* Message header with role */}
                  <Group 
                    gap={8} 
                    style={{
                      padding: '4px 0 6px 0',
                      alignItems: 'center',
                      backgroundColor: msg.role === 'assistant' ? 'transparent' : 'transparent',
                      borderRadius: '8px 8px 0 0'
                    }}
                  >
                    <Avatar 
                      size="sm" 
                      radius="xl" 
                      bg={msg.role === 'assistant' 
                        ? (model === 'perplexity-sonar' ? 'blue.6' : model === 'deepseek-r1' ? 'red.6' : 'teal.6') 
                        : (isDark ? 'blue.7' : 'blue.5')}
                      style={{ 
                        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {msg.role === 'assistant' 
                        ? (model === 'perplexity-sonar' ? <IconSearch size={14} /> : <IconRobot size={14} />) 
                        : <IconUser size={14} />}
                    </Avatar>
                    <Text fw={600} size="sm" c={msg.role === 'assistant' 
                      ? (model === 'perplexity-sonar' ? 'blue.5' : model === 'deepseek-r1' ? 'red.5' : 'teal.5') 
                      : (isDark ? 'blue.4' : 'blue.6')}>
                      {msg.role === 'assistant' 
                        ? (model === 'perplexity-sonar' ? 'Search' : getModelDisplayName()) 
                        : 'You'}
                    </Text>
                  </Group>
                  
                  {/* Message content */}
                  <Box 
                    style={{
                      backgroundColor: msg.role === 'assistant' 
                        ? (isDark ? 'rgba(37, 38, 43, 0.4)' : 'white') 
                        : 'transparent',
                      borderRadius: '0 12px 12px 12px',
                      padding: msg.role === 'assistant' ? '12px 16px' : '0px 8px 12px 34px',
                      marginBottom: '24px',
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
                </Box>
              ))}
              {isLoading && (
                <Box style={{ width: '100%' }}>
                  {/* Loading message header */}
                  <Group 
                    gap={8} 
                    style={{
                      padding: '4px 0 6px 0',
                      alignItems: 'center',
                    }}
                  >
                    <Avatar 
                      size="sm" 
                      radius="xl" 
                      bg={model === 'perplexity-sonar' ? 'blue.6' : model === 'deepseek-r1' ? 'red.6' : 'teal.6'} 
                      style={{ boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)' }}
                    >
                      {model === 'perplexity-sonar' ? <IconSearch size={14} /> : <IconRobot size={14} />}
                    </Avatar>
                    <Text fw={600} size="sm" c={model === 'perplexity-sonar' ? 'blue.5' : model === 'deepseek-r1' ? 'red.5' : 'teal.5'}>
                      {model === 'perplexity-sonar' ? 'Search' : model === 'deepseek-r1' ? 'Reasoning' : getModelDisplayName()}
                    </Text>
                  </Group>
                  
                  {/* Loading indicator */}
                  <Box 
                    style={{ 
                      backgroundColor: isDark ? 'rgba(37, 38, 43, 0.4)' : 'white',
                      borderRadius: '0 12px 12px 12px',
                      padding: '16px 20px',
                      marginBottom: '24px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Loader color={model === 'perplexity-sonar' ? "blue" : model === 'deepseek-r1' ? 'red' : 'teal'} size="sm" />
                      <Text size="xs" c="dimmed" style={{ animation: 'pulse 2s infinite' }}>
                        {model === 'perplexity-sonar' ? 'Searching...' : model === 'deepseek-r1' ? 'Reasoning...' : 'Thinking...'}
                      </Text>
                    </div>
                  </Box>
                </Box>
              )}
            </Stack>
          )}
        </Box>
      </ScrollArea>

      <Box
        component="form"
        onSubmit={handleSubmit}
        style={{
          borderTop: `1px solid ${isDark ? 'rgba(44, 46, 51, 0.8)' : 'rgba(233, 236, 239, 0.8)'}`,
          padding: '16px 18px',
          backgroundColor: isDark ? 'rgba(33, 35, 38, 0.9)' : 'rgba(248, 249, 250, 0.9)',
          backdropFilter: 'blur(8px)',
          position: 'relative',
          zIndex: 10
        }}
      >
        {showModeSwitchPrompt && suggestedMode && (
          <Box 
            mb="xs" 
            p="xs" 
            style={{ 
              backgroundColor: isDark ? 'rgba(32, 201, 151, 0.15)' : 'rgba(32, 201, 151, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(32, 201, 151, 0.3)',
              animation: 'fadeIn 0.3s ease-out'
            }}
          >
            <Group justify="space-between" align="center">
              <Group>
                <IconBulb size={16} color="#20C997" />
                <Text size="xs">This looks like a {suggestedMode === 'task' ? 'task' : 'conversation'}. Switch to {suggestedMode} mode?</Text>
              </Group>
              <Group gap="xs">
                <Button 
                  variant="subtle" 
                  color="gray" 
                  size="xs" 
                  onClick={dismissModeSwitchPrompt}
                >
                  Dismiss
                </Button>
                <Button 
                  variant="light" 
                  color="teal" 
                  size="xs" 
                  onClick={handleSwitchMode} 
                  rightSection={<IconArrowRight size={12} />}
                >
                  Switch
                </Button>
              </Group>
            </Group>
          </Box>
        )}
        
        <Group align="flex-end" gap="sm">
          <Textarea
            placeholder={aiMode === 'task' 
              ? "Create a task, ask about tasks, or type /normal to switch modes..." 
              : "Type your message, or type /task to switch to Task Mode..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            autosize
            minRows={1}
            maxRows={4}
            style={{ flex: 1 }}
            styles={{
              input: {
                backgroundColor: isDark ? 'rgba(44, 46, 51, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
                borderRadius: '12px',
                padding: '14px 18px',
                fontSize: '15px',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                backdropFilter: 'blur(8px)',
                '&:focus': {
                  borderColor: getModelColor(),
                  boxShadow: `0 0 0 1px ${getModelColor()}20`
                }
              }
            }}
            disabled={isLoading}
          />
          <Button
            color={model === 'perplexity-sonar' ? "blue" : model === 'deepseek-r1' ? 'red' : 'teal'}
            type="submit"
            style={{ 
              height: '44px', 
              width: '44px',
              borderRadius: '12px',
              padding: 0,
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s ease',
            }}
            styles={{
              root: {
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)'
                }
              }
            }}
            disabled={isLoading || !input.trim()}
          >
            <IconSend size={18} />
          </Button>
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
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
          
          .ai-welcome-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, ${model === 'deepseek-r1' ? 'rgba(250, 82, 82, 0.15) 0%, rgba(250, 82, 82, 0.05)' : 'rgba(32, 201, 151, 0.15) 0%, rgba(32, 201, 151, 0.05)'} 100%);
            border-radius: 20px;
            padding: 16px;
            margin-bottom: 24px;
            animation: fadeIn 0.5s ease-out;
          }
        `}
      </style>
    </Paper>
  );
}