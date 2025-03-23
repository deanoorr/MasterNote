import { useState, useRef, useEffect } from 'react';
import { Paper, TextInput, ScrollArea, Text, Stack, Group, Avatar, Loader, Box, Button, Textarea, Tooltip, useMantineColorScheme, SegmentedControl, Badge, Image, Popover } from '@mantine/core';
import { IconSend, IconRobot, IconUser, IconBrandOpenai, IconList, IconMessage, IconCheck, IconAlertCircle, IconBulb, IconMicrophone, IconSearch, IconArrowRight } from '@tabler/icons-react';
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
  const [loadingReasoning, setLoadingReasoning] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { messages, addMessage, addTask } = useStore();

  // Remove keyboard shortcut for mode switching since we no longer have modes
  
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
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: 999999, behavior: 'smooth' });
      }
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loadingReasoning]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading || !input.trim()) return;

    console.log("Submitting input:", input);
    setIsLoading(true);
    setLoadingReasoning([]);

    // Store the input before clearing
    const currentInput = input;

    // Add user message to store
    const userMessage: Message = {
      id: Date.now().toString(),
      content: currentInput,
      role: 'user' as const,
      timestamp: new Date(),
    };
    addMessage(userMessage);
    
    // Clear input immediately
    setInput('');
    
    // Focus the input field
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);

    try {
      const userID = "user123"; // Replace with actual user ID if available
      console.log(`Processing message with input: ${currentInput}`);
      // Get response from the updated function (now without mode parameter)
      const response = await getAIResponse(currentInput, userID);
      console.log("AI response received:", response);

      // Add AI response to store
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant' as const,
        timestamp: new Date(),
      };
      addMessage(assistantMessage);
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

  // Get model name for display
  const getModelDisplayName = () => {
    switch(model) {
      case 'gpt4o': return 'GPT-4o';
      case 'perplexity-sonar': return 'Perplexity Sonar';
      case 'deepseek-r1': return 'DeepSeek R1';
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

  // Get model description for UI
  const getModelDescription = () => {
    switch(model) {
      case 'gpt4o': return 'All-purpose AI assistant';
      case 'perplexity-sonar': return 'Search-focused AI assistant';
      case 'deepseek-r1': return 'Reasoning-focused AI assistant';
      default: return 'Intelligent Assistant';
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
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
            <Avatar size="sm" radius="xl" color={model === 'perplexity-sonar' ? 'blue' : model === 'deepseek-r1' ? 'red' : 'teal'} style={{ boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}>
              {model === 'perplexity-sonar' ? <IconSearch size={14} /> : <IconRobot size={14} />}
            </Avatar>
            <div>
              <Group gap={8}>
                <Text size="sm" fw={600} c={isDark ? undefined : "gray.7"}>{getModelDisplayName()}</Text>
                <Badge 
                  color={model === 'perplexity-sonar' ? 'blue' : model === 'deepseek-r1' ? 'red' : 'teal'}
                  variant="light"
                  size="xs"
                  radius="sm"
                >
                  {getModelDescription()}
                </Badge>
              </Group>
              <Text size="xs" c="dimmed">Powered by {model === 'perplexity-sonar' ? 'Perplexity' : model === 'deepseek-r1' ? 'DeepSeek' : model.includes('claude') ? 'Anthropic' : 'OpenAI'}</Text>
            </div>
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
                </Text>
                
                <Box mb="sm" w="100%">
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" fw={600} c={isDark ? "gray.4" : "gray.7"}>Examples</Text>
                  </Group>
                  
                  <Stack gap="xs">
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
                      onClick={() => setInput("What tasks do I have this week?")}
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
                      What tasks do I have this week?
                    </Button>
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
                    <Text size="xs" c="dimmed">Creates and manages tasks</Text>
                  </Box>
                  <Box style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <IconBulb size={14} stroke={1.5} color={isDark ? '#909296' : '#868e96'} style={{ marginTop: 2 }} />
                    <Text size="xs" c="dimmed">Answers general questions</Text>
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
                        ? getModelDisplayName()
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
                      {getModelDisplayName()}
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
                        {model === 'perplexity-sonar' ? 'Searching...' : model === 'deepseek-r1' ? 'Analyzing...' : 'Thinking...'}
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
          zIndex: 10,
          flexShrink: 0 // Prevent input from shrinking
        }}
      >
        <Group align="flex-end" gap="sm">
          <Textarea
            key={`textarea-input-${isLoading ? 'loading' : 'ready'}`}
            ref={inputRef}
            placeholder="Ask me anything or tell me about your tasks..."
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
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
    </Box>
  );
}