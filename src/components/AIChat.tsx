import { useState, useRef, useEffect } from 'react';
import { Paper, TextInput, ScrollArea, Text, Stack, Group, Avatar, Loader, Box, Button, Textarea, Tooltip, useMantineColorScheme, SegmentedControl, Badge, Image, Popover, ActionIcon, Switch } from '@mantine/core';
import { IconSend, IconRobot, IconUser, IconBrandOpenai, IconList, IconMessage, IconCheck, IconAlertCircle, IconBulb, IconMicrophone, IconSearch, IconArrowRight, IconEraser } from '@tabler/icons-react';
import { AIModel, Message, Task } from '../types';
import { useStore } from '../store';
import { getAIResponse } from '../services/ai';
import MarkdownRenderer from './MarkdownRenderer';
import { useAuth } from '../contexts/AuthContext';

interface AIChatProps {
  model: AIModel;
  onModelChange?: (model: AIModel) => void;
}

export default function AIChat({ model, onModelChange }: AIChatProps) {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  const userId = user?.id;
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingReasoning, setLoadingReasoning] = useState<string[]>([]);
  const [mode, setMode] = useState<'chat' | 'agent'>('agent');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { messages, addMessage, addTask, clearMessages } = useStore();
  
  // Add state for Ultra Search toggle
  const [ultraSearch, setUltraSearch] = useState(() => 
    localStorage.getItem('use_sonar_pro') === 'true'
  );
  
  // Track previous model to detect changes
  const prevModelRef = useRef<AIModel | null>(null);

  // Effect to update localStorage when Ultra Search toggle changes
  useEffect(() => {
    localStorage.setItem('use_sonar_pro', ultraSearch ? 'true' : 'false');
  }, [ultraSearch]);

  // Initialize on component mount - make sure conversation context is properly set up
  useEffect(() => {
    // Initialize conversation maintenance
    const initializeConversation = async () => {
      try {
        // Ensure the current model is saved to localStorage
        localStorage.setItem('selected_model', model);
        
        // Set up a basic context if none exists
        if (!localStorage.getItem('current_conversation_topic')) {
          localStorage.setItem('current_conversation_topic', 'general assistant help');
        }
        
        // Clear any corrupted history
        const storageKey = `conversation_history_${userId || 'guest'}`;
        try {
          const history = localStorage.getItem(storageKey);
          if (history) {
            // Check if history is valid JSON
            JSON.parse(history);
          }
        } catch (e) {
          console.warn("Found corrupted conversation history, resetting");
          localStorage.removeItem(storageKey);
        }
      } catch (error) {
        console.error("Error during conversation initialization:", error);
      }
    };
    
    initializeConversation();
  }, [model, userId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loadingReasoning]);

  // Effect to handle model changes
  useEffect(() => {
    // Check if model has changed since last render
    if (prevModelRef.current && prevModelRef.current !== model) {
      console.log(`Model changed from ${prevModelRef.current} to ${model}`);
      
      // Clear conversation history in localStorage to prevent context mixups
      if (userId) {
        localStorage.removeItem(`conversation_history_${userId}`);
      } else {
        localStorage.removeItem(`conversation_history_guest`);
      }
      
      // Clear the current conversation topic
      localStorage.removeItem('current_conversation_topic');
      
      // Clear the UI messages when model changes
      if (messages.length > 0) {
        clearMessages();
      }
    }
    
    // Update the reference for next comparison
    prevModelRef.current = model;
  }, [model, userId, messages.length, clearMessages]);

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
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: 999999, behavior: 'smooth' });
      }
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loadingReasoning]);

  // Add effect to handle mode changes
  useEffect(() => {
    // This effect runs whenever the mode changes
    console.log(`Mode changed to: ${mode}`);
    
    // Focus the input when mode changes
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode]);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    
    const trimmedInput = input.trim();
    const inputValue = trimmedInput;
    setInput('');
    setIsLoading(true);
    
    try {
      console.log(`Submitting message to ${model} in ${mode} mode`);
      
      // Add the user's message to the messages list immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        content: inputValue,
        timestamp: new Date(),
        role: 'user',
        model: model,
      };
      addMessage(userMessage);
      
      // Make sure we scroll to see the new message
      scrollToBottom();
      
      // Add a slight delay for the API call to simulate more natural typing
      // This also helps ensure the message is saved to history before getting the response
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Get response from the AI
      const response = await getAIResponse(inputValue, userId || 'guest', mode);
      
      // Additional logging for subtask-related messages
      if (response.includes("subtask") || response.includes("Subtask")) {
        console.log("AI Response contains subtask information:", response);
      }
      
      // Add the AI's response to the messages list
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        timestamp: new Date(),
        role: 'assistant',
        model: model,
      };
      addMessage(aiMessage);
      
      // Scroll to the bottom to show the new message
      scrollToBottom();
    } catch (error) {
      console.error("Error getting AI response:", error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error. Please try again or check your settings.",
        timestamp: new Date(),
        role: 'assistant',
        model: model,
      };
      addMessage(errorMessage);
      
      // Scroll to show the error message
      scrollToBottom();
    } finally {
      setIsLoading(false);
    }
  };

  // Get model name for display
  const getModelDisplayName = () => {
    switch(model) {
      case 'gpt4o': return 'GPT-4o';
      case 'perplexity-sonar': 
        return ultraSearch ? 'Sonar Pro' : 'Sonar';
      case 'deepseek-r1': return 'DeepSeek R1';
      case 'gpt-o3-mini': return 'GPT o3 mini';
      case 'deepseek-v3': return 'DeepSeek V3';
      case 'gemini-2.5-pro-exp-03-25': return 'Gemini 2.5 Pro';
      default: return 'AI Assistant';
    }
  };

  // Get model name from saved model in message
  const getModelDisplayNameFromModel = (messageModel: AIModel) => {
    switch(messageModel) {
      case 'gpt4o': return 'GPT-4o';
      case 'perplexity-sonar': 
        return ultraSearch ? 'Sonar Pro' : 'Sonar';
      case 'deepseek-r1': return 'DeepSeek R1';
      case 'gpt-o3-mini': return 'GPT o3 mini';
      case 'deepseek-v3': return 'DeepSeek V3';
      case 'gemini-2.5-pro-exp-03-25': return 'Gemini 2.5 Pro';
      default: return 'AI Assistant';
    }
  };

  // Get model color for UI elements and dot color
  const getModelColor = () => {
    switch(model) {
      case 'gpt4o': return '#CCCCCC'; // Light grey for GPT-4o
      case 'perplexity-sonar': return '#3B82F6'; // Blue for Sonar
      case 'deepseek-r1': return '#7F56D9'; // Purple for DeepSeek R1
      case 'gpt-o3-mini': return '#FFA94D'; // Orange for GPT o3 mini
      case 'deepseek-v3': return '#10B981'; // Green for DeepSeek V3
      case 'gemini-2.5-pro-exp-03-25': return '#E30B5C'; // Crimson/Ruby for Gemini
      default: return '#20C997';
    }
  };
  
  // Get model color for a specific message's model
  const getModelColorFromModel = (messageModel?: AIModel) => {
    if (!messageModel) return '#20C997'; // Default color
    
    switch(messageModel) {
      case 'gpt4o': return '#CCCCCC'; // Light grey for GPT-4o
      case 'perplexity-sonar': return '#3B82F6'; // Blue for Sonar
      case 'deepseek-r1': return '#7F56D9'; // Purple for DeepSeek R1
      case 'gpt-o3-mini': return '#FFA94D'; // Orange for GPT o3 mini
      case 'deepseek-v3': return '#10B981'; // Green for DeepSeek V3
      case 'gemini-2.5-pro-exp-03-25': return '#E30B5C'; // Crimson/Ruby for Gemini
      default: return '#20C997';
    }
  };

  // Check if model has a PRO badge
  const hasProBadge = (modelName: AIModel) => {
    return ['gpt4o'].includes(modelName);
  };

  // Get model description for UI
  const getModelDescription = () => {
    switch(model) {
      case 'gpt4o': return 'All-purpose AI assistant';
      case 'perplexity-sonar': 
        return ultraSearch
          ? 'Sonar Deep Research model'
          : 'Sonar Online search assistant';
      case 'deepseek-r1': return 'Reasoning-focused AI assistant';
      case 'gpt-o3-mini': return 'Fast, efficient AI assistant';
      case 'deepseek-v3': return 'Advanced reasoning AI';
      default: return 'Intelligent Assistant';
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Or if there's a function that handles AI responses, add logging there:
  const handleAIMessage = (message: string) => {
    // Add subtask debugging
    if (message.includes("subtask") || message.includes("Subtask")) {
      console.log("AI Message contains subtask information:", message);
    }
  };

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Box 
        p="md" 
        style={{ 
          borderBottom: `1px solid ${isDark ? '#2C2E33' : '#E9ECEF'}`,
          backgroundColor: isDark ? 'rgba(37, 38, 43, 0.8)' : 'rgba(248, 249, 250, 0.9)',
          backdropFilter: 'blur(8px)',
          position: 'relative',
          zIndex: 10,
          flexShrink: 0 // Prevent header from shrinking
        }}
      >
        <Group justify="space-between">
          <Group>
            <Avatar size="sm" radius="xl" color={
              model === 'perplexity-sonar' ? 'blue' : 
              model === 'deepseek-r1' ? 'violet' : 
              model === 'gpt-o3-mini' ? 'orange' : 
              model === 'deepseek-v3' ? 'teal' : 
              model === 'gemini-2.5-pro-exp-03-25' ? 'red' :
              'gray'
            } style={{ boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}>
              {model === 'perplexity-sonar' ? <IconSearch size={18} /> : <IconRobot size={18} />}
            </Avatar>
            <div>
              <Group gap={4} align="center">
                <Text fw={700} size="sm" style={{ lineHeight: 1.2 }}>{getModelDisplayName()}</Text>
                <Badge 
                  size="xs" 
                  variant="light" 
                  color={mode === 'agent' ? 'orange' : 'blue'}
                >
                  {mode === 'agent' ? 'Agent' : 'Chat'}
                </Badge>
                {model === 'perplexity-sonar' && ultraSearch && (
                  <Badge 
                    size="xs" 
                    variant="filled" 
                    color="blue"
                    style={{ 
                      background: 'linear-gradient(45deg, #4C6EF5, #3D5BF5)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    ULTRA
                  </Badge>
                )}
              </Group>
              <Text size="xs" c="dimmed" style={{ lineHeight: 1.2 }}>{getModelDescription()}</Text>
            </div>
          </Group>
          
          <Group>
            {/* Add Ultra Search toggle when Perplexity Sonar is selected */}
            {model === 'perplexity-sonar' && (
              <Group mr="xs">
                <Tooltip label="Enable Ultra Search to use Perplexity's Sonar Deep Research model for enhanced research capabilities">
                  <Badge
                    size="sm"
                    variant={ultraSearch ? "filled" : "outline"}
                    color="blue"
                    style={{ 
                      cursor: 'pointer', 
                      transition: 'all 0.2s ease',
                      opacity: ultraSearch ? 1 : 0.7,
                      border: `1px solid ${isDark ? '#4C6EF5' : '#4C6EF5'}`,
                    }}
                    onClick={() => setUltraSearch(!ultraSearch)}
                  >
                    <Group gap={4}>
                      <IconSearch size={12} />
                      <Text size="xs">Ultra Search {ultraSearch ? 'ON' : 'OFF'}</Text>
                    </Group>
                  </Badge>
                </Tooltip>
              </Group>
            )}

            <SegmentedControl
              data={[
                { 
                  label: (
                    <Group gap={6} wrap="nowrap">
                      <IconMessage size={16} />
                      <Text size="xs">Chat</Text>
                    </Group>
                  ), 
                  value: 'chat' 
                },
                { 
                  label: (
                    <Group gap={6} wrap="nowrap">
                      <IconList size={16} />
                      <Text size="xs">Agent</Text>
                    </Group>
                  ), 
                  value: 'agent' 
                }
              ]}
              value={mode}
              onChange={(value) => setMode(value as 'chat' | 'agent')}
              size="xs"
              radius="xl"
              styles={{
                root: {
                  border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
                  backgroundColor: isDark ? 'rgba(37, 38, 43, 0.8)' : 'rgba(255, 255, 255, 0.7)',
                },
                indicator: {
                  backgroundColor: isDark ? 'rgba(44, 46, 51, 0.9)' : 'white',
                },
                label: {
                  padding: '4px 12px',
                }
              }}
            />
          </Group>
        </Group>
      </Box>
      
      <ScrollArea
        style={{ 
          flex: 1, 
          padding: '4px 0', 
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0
        }}
        scrollbarSize={6}
        scrollHideDelay={500}
        type="always"
        viewportRef={scrollRef}
        offsetScrollbars
      >
        <Box p="md" style={{ 
          minHeight: messages.length === 0 ? 'auto' : 'unset',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1
        }}>
          {messages.length === 0 ? (
            <Box 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '10px 20px',
                maxHeight: 'calc(100vh - 240px)' // More compact height
              }}
            >
              <Box 
                style={{
                  width: '100%',
                  maxWidth: '560px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <Text size="xl" fw={700} ta="center" mb="xs" c={isDark ? "gray.3" : "gray.8"}>
                  MasterNote AI
                </Text>
                
                <Text size="sm" c={isDark ? "dimmed" : "gray.6"} ta="center" mb="sm" maw={450} style={{ lineHeight: 1.5 }}>
                  Type a message to start a conversation.
                  Use the toggle above to switch between <b>Chat</b> mode for general questions and task discussions, or <b>Agent</b> mode for task management operations.
                </Text>
                
                <Box mb="sm" w="100%">
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" fw={600} c={isDark ? "gray.4" : "gray.7"}>Examples</Text>
                  </Group>
                  
                  <Stack gap="xs">
                    {mode === 'agent' ? (
                      // Agent mode examples
                      <>
                        <Button 
                          variant="outline" 
                          color="gray" 
                          onClick={() => setInput("Create a task for buying groceries tomorrow")}
                          fullWidth
                          h={36}
                          styles={{
                            root: {
                              border: `1px solid ${isDark ? 'rgba(70, 75, 90, 0.5)' : '#e9ecef'}`,
                              color: isDark ? 'white' : 'black',
                              '&:hover': {
                                backgroundColor: isDark ? 'rgba(44, 46, 51, 0.5)' : 'rgba(241, 243, 245, 0.7)'
                              },
                              marginBottom: '4px'
                            },
                            inner: {
                              justifyContent: 'flex-start',
                              fontSize: '13px'
                            }
                          }}
                        >
                          Create a task for buying groceries tomorrow
                        </Button>
                        <Button 
                          variant="outline" 
                          color="gray" 
                          onClick={() => setInput("Break down task 1 into subtasks")}
                          fullWidth
                          h={36}
                          styles={{
                            root: {
                              border: `1px solid ${isDark ? 'rgba(70, 75, 90, 0.5)' : '#e9ecef'}`,
                              color: isDark ? 'white' : 'black',
                              '&:hover': {
                                backgroundColor: isDark ? 'rgba(44, 46, 51, 0.5)' : 'rgba(241, 243, 245, 0.7)'
                              },
                              marginBottom: '4px'
                            },
                            inner: {
                              justifyContent: 'flex-start',
                              fontSize: '13px'
                            }
                          }}
                        >
                          Break down task 1 into subtasks
                        </Button>
                        <Button 
                          variant="outline" 
                          color="gray" 
                          onClick={() => setInput("Add subtasks to task 2: research competitors, analyze market trends, create presentation")}
                          fullWidth
                          h={36}
                          styles={{
                            root: {
                              border: `1px solid ${isDark ? 'rgba(70, 75, 90, 0.5)' : '#e9ecef'}`,
                              color: isDark ? 'white' : 'black',
                              '&:hover': {
                                backgroundColor: isDark ? 'rgba(44, 46, 51, 0.5)' : 'rgba(241, 243, 245, 0.7)'
                              },
                              marginBottom: '4px'
                            },
                            inner: {
                              justifyContent: 'flex-start',
                              fontSize: '13px'
                            }
                          }}
                        >
                          Add subtasks to task 2: research competitors, analyze market trends, create presentation
                        </Button>
                        <Button 
                          variant="outline" 
                          color="gray" 
                          onClick={() => setInput("Mark subtask 1.2 as completed")}
                          fullWidth
                          h={36}
                          styles={{
                            root: {
                              border: `1px solid ${isDark ? 'rgba(70, 75, 90, 0.5)' : '#e9ecef'}`,
                              color: isDark ? 'white' : 'black',
                              '&:hover': {
                                backgroundColor: isDark ? 'rgba(44, 46, 51, 0.5)' : 'rgba(241, 243, 245, 0.7)'
                              }
                            },
                            inner: {
                              justifyContent: 'flex-start',
                              fontSize: '13px'
                            }
                          }}
                        >
                          Mark subtask 1.2 as completed
                        </Button>
                      </>
                    ) : (
                      // Chat mode examples
                      <>
                        <Button 
                          variant="outline" 
                          color="gray" 
                          onClick={() => setInput("What's the best way to learn programming?")}
                          fullWidth
                          h={36}
                          styles={{
                            root: {
                              border: `1px solid ${isDark ? 'rgba(70, 75, 90, 0.5)' : '#e9ecef'}`,
                              color: isDark ? 'white' : 'black',
                              '&:hover': {
                                backgroundColor: isDark ? 'rgba(44, 46, 51, 0.5)' : 'rgba(241, 243, 245, 0.7)'
                              },
                              marginBottom: '4px'
                            },
                            inner: {
                              justifyContent: 'flex-start',
                              fontSize: '13px'
                            }
                          }}
                        >
                          What's the best way to learn programming?
                        </Button>
                        <Button 
                          variant="outline" 
                          color="gray" 
                          onClick={() => setInput("Can you explain how blockchain works?")}
                          fullWidth
                          h={36}
                          styles={{
                            root: {
                              border: `1px solid ${isDark ? 'rgba(70, 75, 90, 0.5)' : '#e9ecef'}`,
                              color: isDark ? 'white' : 'black',
                              '&:hover': {
                                backgroundColor: isDark ? 'rgba(44, 46, 51, 0.5)' : 'rgba(241, 243, 245, 0.7)'
                              },
                              marginBottom: '4px'
                            },
                            inner: {
                              justifyContent: 'flex-start',
                              fontSize: '13px'
                            }
                          }}
                        >
                          Can you explain how blockchain works?
                        </Button>
                        <Button 
                          variant="outline" 
                          color="gray" 
                          onClick={() => setInput("Give me some tips for effective note-taking")}
                          fullWidth
                          h={36}
                          styles={{
                            root: {
                              border: `1px solid ${isDark ? 'rgba(70, 75, 90, 0.5)' : '#e9ecef'}`,
                              color: isDark ? 'white' : 'black',
                              '&:hover': {
                                backgroundColor: isDark ? 'rgba(44, 46, 51, 0.5)' : 'rgba(241, 243, 245, 0.7)'
                              }
                            },
                            inner: {
                              justifyContent: 'flex-start',
                              fontSize: '13px'
                            }
                          }}
                        >
                          Give me some tips for effective note-taking
                        </Button>
                      </>
                    )}
                  </Stack>
                </Box>
                
                <Group justify="space-between" style={{ width: '100%' }} mb="xs">
                  <Text size="sm" fw={600} c={isDark ? "gray.4" : "gray.7"}>Capabilities</Text>
                </Group>
                <Box 
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '10px',
                    width: '100%'
                  }}
                >
                  <Box style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <IconBulb size={14} stroke={1.5} color={isDark ? '#909296' : '#868e96'} style={{ marginTop: 2 }} />
                    <Text size="xs" c="dimmed">Remembers previous context</Text>
                  </Box>
                  <Box style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <IconBulb size={14} stroke={1.5} color={isDark ? '#909296' : '#868e96'} style={{ marginTop: 2 }} />
                    <Text size="xs" c="dimmed">{mode === 'agent' ? 'Manages tasks & to-dos' : 'Can discuss tasks, but not modify them'}</Text>
                  </Box>
                  <Box style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <IconBulb size={14} stroke={1.5} color={isDark ? '#909296' : '#868e96'} style={{ marginTop: 2 }} />
                    <Text size="xs" c="dimmed">{mode === 'agent' ? 'Task operations only' : 'Answers general questions'}</Text>
                  </Box>
                  <Box style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <IconBulb size={14} stroke={1.5} color={isDark ? '#909296' : '#868e96'} style={{ marginTop: 2 }} />
                    <Text size="xs" c="dimmed">{model === 'perplexity-sonar' ? 'Enhanced search' : model === 'deepseek-r1' ? 'Detailed reasoning' : 'Balanced capabilities'}</Text>
                  </Box>
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
                        ? (msg.model === 'perplexity-sonar' ? 'blue.6' : 
                           msg.model === 'deepseek-r1' ? 'violet.6' : 
                           msg.model === 'gpt-o3-mini' ? 'orange.6' :
                           msg.model === 'deepseek-v3' ? 'teal.6' : 'gray.6') 
                        : (isDark ? 'blue.7' : 'blue.5')}
                      style={{ 
                        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {msg.role === 'assistant' 
                        ? (msg.model === 'perplexity-sonar' ? <IconSearch size={14} /> : <IconRobot size={14} />) 
                        : <IconUser size={14} />}
                    </Avatar>
                    <Text fw={600} size="sm" c={msg.role === 'assistant' 
                      ? (msg.model === 'perplexity-sonar' ? 'blue.5' : 
                         msg.model === 'deepseek-r1' ? 'violet.5' : 
                         msg.model === 'gpt-o3-mini' ? 'orange.5' :
                         msg.model === 'deepseek-v3' ? 'teal.5' : 'gray.5') 
                      : (isDark ? 'blue.4' : 'blue.6')}>
                      {msg.role === 'assistant' 
                        ? (msg.model ? getModelDisplayNameFromModel(msg.model) : getModelDisplayName())
                        : 'You'}
                    </Text>
                  </Group>
                  
                  {/* Message content */}
                  <Box 
                    style={{
                      backgroundColor: msg.role === 'assistant' 
                        ? (isDark ? 'rgba(37, 38, 43, 0.9)' : 'rgba(255, 255, 255, 0.95)') 
                        : 'transparent',
                      borderRadius: '0 12px 12px 12px',
                      padding: msg.role === 'assistant' ? '12px 16px' : '0px 8px 12px 34px',
                      marginBottom: '24px',
                      border: msg.role === 'assistant' ? `1px solid ${isDark ? '#373A40' : '#dee2e6'}` : 'none',
                      boxShadow: msg.role === 'assistant' ? '0 2px 6px rgba(0, 0, 0, 0.08)' : 'none'
                    }}
                  >
                    {msg.role === 'assistant' ? (
                      <MarkdownRenderer content={msg.content} />
                    ) : (
                      <div 
                        style={{ 
                          whiteSpace: 'pre-wrap', 
                          wordBreak: 'break-word',
                          maxWidth: '100%',
                          fontSize: '15px',
                          lineHeight: 1.7,
                          color: isDark ? '#E9ECEF' : '#212529',
                        }}
                      >
                        {msg.content}
                      </div>
                    )}
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
                      bg={model === 'perplexity-sonar' ? 'blue.6' : 
                         model === 'deepseek-r1' ? 'violet.6' : 
                         model === 'gpt-o3-mini' ? 'orange.6' :
                         model === 'deepseek-v3' ? 'teal.6' : 
                         model === 'gemini-2.5-pro-exp-03-25' ? 'red.6' :
                         'gray.6'} 
                      style={{ boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)' }}
                    >
                      {model === 'perplexity-sonar' ? <IconSearch size={14} /> : <IconRobot size={14} />}
                    </Avatar>
                    <Text fw={600} size="sm" c={model === 'perplexity-sonar' ? 'blue.5' : 
                         model === 'deepseek-r1' ? 'violet.5' : 
                         model === 'gpt-o3-mini' ? 'orange.5' :
                         model === 'deepseek-v3' ? 'teal.5' :
                         model === 'gemini-2.5-pro-exp-03-25' ? 'red.5' :
                         'gray.5'}>
                      {getModelDisplayName()}
                    </Text>
                  </Group>
                  
                  {/* Loading indicator */}
                  <Box 
                    style={{ 
                      backgroundColor: isDark ? 'rgba(37, 38, 43, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '0 12px 12px 12px',
                      padding: '16px 20px',
                      marginBottom: '24px',
                      border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Loader color={model === 'perplexity-sonar' ? "blue" : 
                         model === 'deepseek-r1' ? 'violet' : 
                         model === 'gpt-o3-mini' ? 'orange' :
                         model === 'deepseek-v3' ? 'teal' :
                         model === 'gemini-2.5-pro-exp-03-25' ? 'red' :
                         'gray'} size="sm" />
                      <Text size="xs" c="dimmed" style={{ animation: 'pulse 2s infinite' }}>
                        {model === 'perplexity-sonar' ? 'Searching...' : 
                         model === 'deepseek-r1' ? 'Analyzing...' : 
                         model === 'gemini-2.5-pro-exp-03-25' ? 'Processing...' :
                         'Thinking...'}
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
          padding: '12px 16px',
          backgroundColor: isDark ? 'rgba(33, 35, 38, 0.9)' : 'rgba(248, 249, 250, 0.9)',
          backdropFilter: 'blur(8px)',
          position: 'relative',
          zIndex: 10,
          flexShrink: 0 // Prevent input from shrinking
        }}
      >
        <Group align="center" gap="sm" style={{ flexWrap: 'nowrap' }}>
          <Popover width={320} position="top" withArrow shadow="md">
            <Popover.Target>
              <Button 
                variant="subtle" 
                size="sm" 
                color={isDark ? "gray.4" : "gray.7"}
                leftSection={
                  <div style={{ 
                    width: 10, 
                    height: 10, 
                    borderRadius: '50%',
                    backgroundColor: getModelColor(),
                    marginRight: -5
                  }} />
                }
                rightSection={<IconArrowRight size={14} style={{ transform: 'rotate(90deg)' }} />}
                styles={{
                  root: {
                    padding: '6px 10px',
                    border: `1px solid ${isDark ? 'rgba(44, 46, 51, 0.8)' : '#dee2e6'}`,
                    backgroundColor: isDark ? 'rgba(37, 38, 43, 0.9)' : 'rgba(255, 255, 255, 0.7)',
                    height: '38px',
                    minWidth: '90px',
                    flexShrink: 0,
                    borderRadius: '10px',
                  },
                  section: { marginRight: 6 }
                }}
              >
                {getModelDisplayName()}
              </Button>
            </Popover.Target>
            <Popover.Dropdown 
              style={{ 
                backgroundColor: isDark ? '#25262B' : '#fff',
                border: `1px solid ${isDark ? '#373A40' : '#e9ecef'}`,
                padding: '8px 0'
              }}
            >
              <Stack gap={0}>
                <Button
                  variant="subtle"
                  color={isDark ? "gray.4" : "gray.7"}
                  fullWidth
                  justify="flex-start"
                  leftSection={
                    <div style={{ 
                      width: 10, 
                      height: 10, 
                      borderRadius: '50%',
                      backgroundColor: '#CCCCCC', // Light grey
                      marginRight: 5
                    }} />
                  }
                  rightSection={
                    hasProBadge('gpt4o') && (
                      <Badge size="xs" color="blue" variant="filled">PRO</Badge>
                    )
                  }
                  onClick={() => onModelChange && onModelChange('gpt4o')}
                  style={{ height: 44, borderRadius: 0 }}
                >
                  GPT-4o
                </Button>
                
                <Button
                  variant="subtle"
                  color={isDark ? "gray.4" : "gray.7"}
                  fullWidth
                  justify="flex-start"
                  leftSection={
                    <div style={{ 
                      width: 10, 
                      height: 10, 
                      borderRadius: '50%',
                      backgroundColor: '#FFA94D', // Orange
                      marginRight: 5
                    }} />
                  }
                  onClick={() => onModelChange && onModelChange('gpt-o3-mini')}
                  style={{ height: 44, borderRadius: 0 }}
                >
                  GPT o3 mini
                </Button>
                
                <Box>
                  <Button
                    variant="subtle"
                    color={isDark ? "gray.4" : "gray.7"}
                    fullWidth
                    justify="flex-start"
                    leftSection={
                      <div style={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: '50%',
                        backgroundColor: '#3B82F6', // Blue
                        marginRight: 5
                      }} />
                    }
                    rightSection={
                      model === 'perplexity-sonar' && ultraSearch && (
                        <Badge size="xs" color="blue" variant="filled">ULTRA</Badge>
                      )
                    }
                    onClick={() => onModelChange && onModelChange('perplexity-sonar')}
                    style={{ height: 44, borderRadius: 0 }}
                  >
                    Sonar
                  </Button>
                  
                  {/* Show Ultra Search option when Sonar is selected */}
                  {model === 'perplexity-sonar' && (
                    <Box px={12} py={8} style={{ borderTop: '1px dotted rgba(0,0,0,0.05)' }}>
                      <Group justify="space-between" align="center">
                        <Text size="xs">Ultra Search</Text>
                        <Switch 
                          size="xs"
                          checked={ultraSearch}
                          onChange={() => setUltraSearch(!ultraSearch)}
                          color="blue"
                        />
                      </Group>
                      <Text size="xs" c="dimmed" mt={5} style={{ fontSize: '10px' }}>
                        Enables Sonar Medium model (sonar-medium-online) for enhanced research capabilities
                      </Text>
                    </Box>
                  )}
                </Box>
                
                <Button
                  variant="subtle"
                  color={isDark ? "gray.4" : "gray.7"}
                  fullWidth
                  justify="flex-start"
                  leftSection={
                    <div style={{ 
                      width: 10, 
                      height: 10, 
                      borderRadius: '50%',
                      backgroundColor: '#10B981', // Green
                      marginRight: 5
                    }} />
                  }
                  onClick={() => onModelChange && onModelChange('deepseek-v3')}
                  style={{ height: 44, borderRadius: 0 }}
                >
                  DeepSeek V3
                </Button>
                
                <Button
                  variant="subtle"
                  color={isDark ? "gray.4" : "gray.7"}
                  fullWidth
                  justify="flex-start"
                  leftSection={
                    <div style={{ 
                      width: 10, 
                      height: 10, 
                      borderRadius: '50%',
                      backgroundColor: '#7F56D9', // Purple
                      marginRight: 5
                    }} />
                  }
                  onClick={() => onModelChange && onModelChange('deepseek-r1')}
                  style={{ height: 44, borderRadius: 0 }}
                >
                  DeepSeek R1
                </Button>
              </Stack>
            </Popover.Dropdown>
          </Popover>
          
          <div
            style={{
              display: 'flex',
              flex: '1 1 auto',
              alignItems: 'center',
              position: 'relative',
              backgroundColor: isDark ? 'rgba(44, 46, 51, 0.8)' : 'rgba(255, 255, 255, 0.9)',
              border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
              borderRadius: '10px',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              width: '100%'
            }}
            className="ai-input-container"
          >
            <Textarea
              key={`textarea-input-${isLoading ? 'loading' : 'ready'}`}
              ref={inputRef}
              placeholder={mode === 'agent' 
                ? "Tell me about your tasks or ask me to manage them..." 
                : "Ask me anything, including questions about your tasks..."}
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              onKeyDown={handleInputKeyDown}
              autosize
              minRows={1}
              maxRows={4}
              classNames={{ root: 'ai-textarea-root' }}
              disabled={isLoading}
            />
            
            <Button
              color={mode === 'agent' ? "orange" : (
                model === 'perplexity-sonar' ? "blue" : 
                model === 'deepseek-r1' ? 'violet' : 
                model === 'gpt-o3-mini' ? 'orange' :
                model === 'deepseek-v3' ? 'teal' :
                model === 'gemini-2.5-pro-exp-03-25' ? 'red' :
                'gray'
              )}
              type="submit"
              style={{
                height: '30px',
                width: '30px',
                minWidth: '30px', 
                borderRadius: '8px',
                padding: 0,
                margin: '0 4px',
                flexShrink: 0
              }}
              disabled={isLoading || !input.trim()}
            >
              <IconSend size={14} />
            </Button>
          </div>
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
          
          .ai-input-container:focus-within {
            border-color: ${mode === 'agent' ? '#fd7e14' : getModelColor()} !important;
            box-shadow: 0 0 0 1px ${mode === 'agent' ? '#fd7e1420' : getModelColor() + '20'} !important;
          }
          
          .ai-input-container:hover:not(:focus-within) {
            border-color: ${isDark ? '#4d5154' : '#ced4da'} !important;
          }
          
          .ai-textarea-root {
            display: flex;
            flex: 1;
            width: 100%;
          }
          
          .ai-textarea-root textarea, 
          .ai-textarea-root .mantine-Textarea-input,
          .ai-textarea-root .mantine-Textarea-wrapper,
          .ai-textarea-root .mantine-InputWrapper-root {
            width: 100% !important;
            flex: 1 !important;
          }
          
          .mantine-Textarea-root {
            width: 100% !important;
            flex: 1 !important;
          }
          
          .ai-textarea-root textarea {
            height: auto !important;
            min-height: auto !important;
            width: 100% !important;
          }
          
          .ai-textarea-root .mantine-Textarea-input:focus {
            outline: none !important;
            box-shadow: none !important;
            border: none !important;
          }
          
          .ai-textarea-root .mantine-Textarea-input::placeholder {
            color: ${isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)'} !important;
          }
          
          .ai-textarea-root .mantine-Textarea-wrapper {
            border: none !important;
            width: 100% !important;
          }
          
          .ai-textarea-root .mantine-Textarea-input {
            min-height: 38px !important;
            padding: 10px 16px !important;
            background-color: transparent !important;
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          
          .ai-textarea-root .mantine-Textarea-input:focus {
            outline: none !important;
            box-shadow: none !important;
            border: none !important;
          }
        `}
      </style>
    </Box>
  );
}