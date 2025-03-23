import { useState, useEffect } from 'react';
import { MantineProvider, createTheme, AppShell, Group, ActionIcon, Select, Text, Container, Title, Box, Tooltip } from '@mantine/core';
import { IconSettings, IconBrandOpenai, IconListCheck, IconPlus, IconNotes, IconChecklist, IconSearch, IconEraser, IconBulb } from '@tabler/icons-react';
import AIChat from './components/AIChat';
import TaskList from './components/TaskList';
import SettingsModal from './components/SettingsModal';
import { AIModel } from './types';
import { useStore } from './store';

// Add CSS for animations
const cssStyles = `
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(250, 82, 82, 0.6);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(250, 82, 82, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(250, 82, 82, 0);
    }
  }
  
  @keyframes reasoningGlow {
    0% {
      box-shadow: 0 0 0 0 rgba(250, 82, 82, 0.4);
    }
    50% {
      box-shadow: 0 0 8px 2px rgba(250, 82, 82, 0.6);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(250, 82, 82, 0.4);
    }
  }
  
  @keyframes searchGlow {
    0% {
      box-shadow: 0 0 0 0 rgba(82, 130, 255, 0.4);
    }
    50% {
      box-shadow: 0 0 8px 2px rgba(82, 130, 255, 0.6);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(82, 130, 255, 0.4);
    }
  }
  
  .reasoning-active {
    animation: reasoningGlow 2s infinite;
  }
  
  .search-active {
    animation: searchGlow 2s infinite;
  }
  
  .logo-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: linear-gradient(135deg, #12B886 0%, #087F5B 100%);
    box-shadow: 0 2px 8px rgba(32, 201, 151, 0.3);
    position: relative;
    transition: all 0.3s ease;
  }
  
  .logo-container:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(32, 201, 151, 0.4);
  }
  
  .logo-checkmark {
    position: absolute;
    top: 4px;
    right: 4px;
    background-color: white;
    border-radius: 50%;
    width: 12px;
    height: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .logo-checkmark::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #12B886;
  }
`;

// Create a custom theme
const theme = createTheme({
  defaultRadius: 'md',
  primaryColor: 'teal',
  colors: {
    dark: [
      '#C1C2C5',
      '#A6A7AB',
      '#909296',
      '#5C5F66',
      '#373A40',
      '#2C2E33',
      '#25262B',
      '#1A1B1E',
      '#141517',
      '#101113',
    ],
    teal: [
      '#E6FCF5',
      '#C3FAE8',
      '#96F2D7',
      '#63E6BE',
      '#38D9A9',
      '#20C997',
      '#12B886',
      '#0CA678',
      '#099268',
      '#087F5B',
    ],
  },
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  fontFamilyMonospace: 'Monaco, Courier, monospace',
  headings: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    fontWeight: '600',
  },
});

function App() {
  const [selectedModel, setSelectedModel] = useState<AIModel>('gpt-o3-mini');
  const [settingsOpened, setSettingsOpened] = useState(false);
  const [apiKeySet, setApiKeySet] = useState(false);
  const { messages, clearMessages } = useStore();

  // Save the selected model to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('selected_model', selectedModel);
    console.log('Saved model to localStorage:', selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    // Check if API key is set in localStorage
    const apiKey = localStorage.getItem('openai_api_key');
    setApiKeySet(!!apiKey);
    
    // Load the saved model preference from localStorage
    const savedModel = localStorage.getItem('selected_model');
    // Allow gpt4o, perplexity-sonar, deepseek-r1, or gpt-o3-mini
    if (savedModel && (savedModel === 'gpt4o' || savedModel === 'perplexity-sonar' || 
        savedModel === 'deepseek-r1' || savedModel === 'gpt-o3-mini')) {
      setSelectedModel(savedModel as AIModel);
    } else {
      // Default to gpt-o3-mini
      setSelectedModel('gpt-o3-mini');
      localStorage.setItem('selected_model', 'gpt-o3-mini');
    }
    
    // If no API key is set, open settings modal automatically
    if (!apiKey) {
      setSettingsOpened(true);
    }
  }, []);

  const handleClearChat = () => {
    if (messages.length > 0) {
      clearMessages();
    }
  };

  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <style>{cssStyles}</style>
      <AppShell
        padding="md"
        style={{ 
          height: '100vh', 
          backgroundColor: '#1A1B1E',
          backgroundImage: 'radial-gradient(circle at 40% 20%, rgba(15, 95, 95, 0.07) 0%, rgba(15, 95, 95, 0) 60%), radial-gradient(circle at 80% 80%, rgba(15, 95, 95, 0.05) 0%, rgba(15, 95, 95, 0) 50%)',
          overflow: 'hidden' // Prevent outer scrolling
        }}
      >
        <Container fluid style={{ height: '100%', padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <Box 
            mb="lg" 
            style={{
              borderRadius: '12px',
              padding: '12px 20px',
              backgroundColor: 'rgba(37, 38, 43, 0.6)',
              backdropFilter: 'blur(12px)',
              border: '1px solid #373A40',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              flexShrink: 0
            }}
          >
            <Group justify="space-between" align="center">
              <Group>
                <div className="logo-container">
                  <IconNotes size={22} color="white" stroke={2} />
                  <div className="logo-checkmark"></div>
                </div>
                <Title order={3} c="gray.1">MasterNote</Title>
              </Group>
              <Group>
                <Text size="sm" c="dimmed">AI Task Management</Text>
                <ActionIcon 
                  onClick={() => setSettingsOpened(true)} 
                  variant="subtle" 
                  radius="xl"
                  color="gray"
                  size="lg"
                >
                  <IconSettings size={20} />
                </ActionIcon>
              </Group>
            </Group>
          </Box>
          
          <div style={{ 
            display: 'flex', 
            height: 'calc(100% - 80px)', 
            gap: '1.5rem',
            position: 'relative',
            flex: 1,
            minHeight: 0 // Important for Firefox
          }}>
            {/* Left Panel - AI Chat */}
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              minWidth: 0,
              minHeight: 0, // Important for proper scrolling
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              border: '1px solid #373A40',
              backdropFilter: 'blur(12px)',
              backgroundColor: 'rgba(37, 38, 43, 0.5)'
            }}>
              <Group 
                justify="space-between" 
                mb={0} 
                p="sm" 
                style={{ 
                  backgroundColor: 'rgba(37, 38, 43, 0.9)', 
                  borderBottom: '1px solid #373A40'
                }}
              >
                <Group>
                  <Select
                    placeholder="AI Model"
                    data={[
                      { value: 'gpt-o3-mini', label: 'GPT-o3 Mini (Faster)' },
                      { value: 'gpt4o', label: 'GPT-4o (All-purpose)' },
                    ]}
                    value={selectedModel}
                    onChange={(value) => value && setSelectedModel(value as AIModel)}
                    style={{ width: 230 }}
                    styles={{
                      input: {
                        backgroundColor: 'rgba(37, 38, 43, 0.9)',
                        borderColor: 'rgba(37, 38, 43, 0.9)',
                        fontWeight: 'bold',
                        borderRadius: '6px',
                        transition: 'all 0.2s ease',
                        '&:focus': {
                          borderColor: '#FA5252',
                          backgroundColor: '#373A40'
                        }
                      }
                    }}
                  />
                </Group>
                
                <Group>
                  <Tooltip label="Use search-focused AI (Perplexity Sonar) - still handles tasks">
                    <ActionIcon
                      variant="subtle"
                      size="md"
                      radius="md"
                      color={selectedModel === 'perplexity-sonar' ? "blue" : "gray"}
                      className={selectedModel === 'perplexity-sonar' ? 'search-active' : ''}
                      onClick={() => {
                        // Toggle Perplexity Sonar model
                        if (selectedModel === 'perplexity-sonar') {
                          // Store the previous model in localStorage
                          const previousModel = localStorage.getItem('search_previous_model') || 'gpt-o3-mini';
                          setSelectedModel(previousModel as AIModel);
                          localStorage.setItem('selected_model', previousModel);
                          console.log(`Switched back to ${previousModel} model`);
                        } else {
                          // Save current model before switching to search mode
                          localStorage.setItem('search_previous_model', selectedModel);
                          setSelectedModel('perplexity-sonar');
                          localStorage.setItem('selected_model', 'perplexity-sonar');
                          console.log("Switched to Perplexity Sonar Search mode");
                        }
                      }}
                    >
                      <IconSearch size={18} />
                    </ActionIcon>
                  </Tooltip>
                   
                  <Tooltip label="Use reasoning-focused AI (DeepSeek R1) - still handles tasks">
                    <ActionIcon
                      variant="subtle"
                      size="md"
                      radius="md"
                      color={selectedModel === 'deepseek-r1' ? "red" : "gray"}
                      className={selectedModel === 'deepseek-r1' ? 'reasoning-active' : ''}
                      onClick={() => {
                        // Toggle DeepSeek R1 model
                        if (selectedModel === 'deepseek-r1') {
                          // Store the previous model in localStorage
                          const previousModel = localStorage.getItem('reasoning_previous_model') || 'gpt-o3-mini';
                          setSelectedModel(previousModel as AIModel);
                          localStorage.setItem('selected_model', previousModel);
                          console.log(`Switched back to ${previousModel} model`);
                        } else {
                          // Save current model before switching to reasoning mode
                          localStorage.setItem('reasoning_previous_model', selectedModel);
                          setSelectedModel('deepseek-r1');
                          localStorage.setItem('selected_model', 'deepseek-r1');
                          console.log("Switched to DeepSeek R1 Reasoning mode");
                        }
                      }}
                    >
                      <IconBulb size={18} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
              
              <AIChat model={selectedModel} />
            </div>
            
            {/* Right Panel - Task List */}
            <div style={{ 
              flex: 1, 
              minHeight: 0, // Important for proper scrolling
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid #373A40',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              backdropFilter: 'blur(12px)',
              backgroundColor: 'rgba(37, 38, 43, 0.5)'
            }}>
              <Group 
                justify="space-between" 
                mb={0} 
                p="sm" 
                style={{ 
                  backgroundColor: 'rgba(37, 38, 43, 0.9)', 
                  borderBottom: '1px solid #373A40'
                }}
              >
                <Group>
                  <IconListCheck size={20} color="#20C997" stroke={2.5} />
                  <Text fw={600} size="sm" c="gray.1">Task List</Text>
                </Group>
              </Group>
              
              <TaskList />
            </div>
          </div>
        </Container>
      </AppShell>
      
      <SettingsModal
        opened={settingsOpened}
        onClose={() => setSettingsOpened(false)}
      />
    </MantineProvider>
  );
}

export default App; 