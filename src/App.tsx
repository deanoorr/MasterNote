import { useState, useEffect } from 'react';
import { MantineProvider, createTheme, AppShell, Group, ActionIcon, Select, Text, Container, Title, Box, useMantineColorScheme, Tooltip } from '@mantine/core';
import { IconSettings, IconBrandOpenai, IconListCheck, IconPlus, IconSun, IconMoon, IconNotes, IconChecklist, IconSearch, IconEraser } from '@tabler/icons-react';
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
  const [selectedModel, setSelectedModel] = useState<AIModel>('gpt4o');
  const [settingsOpened, setSettingsOpened] = useState(false);
  const [apiKeySet, setApiKeySet] = useState(false);
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('dark');
  const { messages, clearMessages } = useStore();

  const toggleColorScheme = () => {
    setColorScheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    // Check if API key is set in localStorage
    const apiKey = localStorage.getItem('openai_api_key');
    setApiKeySet(!!apiKey);
    
    // If no API key is set, open settings modal automatically
    if (!apiKey) {
      setSettingsOpened(true);
    }
    
    // Check if color scheme preference is stored
    const savedColorScheme = localStorage.getItem('color_scheme');
    if (savedColorScheme === 'light' || savedColorScheme === 'dark') {
      setColorScheme(savedColorScheme);
    }
  }, []);
  
  // Save color scheme preference when it changes
  useEffect(() => {
    localStorage.setItem('color_scheme', colorScheme);
  }, [colorScheme]);

  const isDark = colorScheme === 'dark';

  const handleClearChat = () => {
    if (messages.length > 0) {
      clearMessages();
    }
  };

  return (
    <MantineProvider theme={theme} defaultColorScheme={colorScheme}>
      <style>{cssStyles}</style>
      <AppShell
        padding="md"
        style={{ 
          height: '100vh', 
          backgroundColor: isDark ? '#1A1B1E' : '#f8f9fa',
          backgroundImage: isDark 
            ? 'radial-gradient(circle at 40% 20%, rgba(15, 95, 95, 0.07) 0%, rgba(15, 95, 95, 0) 60%), radial-gradient(circle at 80% 80%, rgba(15, 95, 95, 0.05) 0%, rgba(15, 95, 95, 0) 50%)'
            : 'radial-gradient(circle at 40% 20%, rgba(15, 95, 95, 0.03) 0%, rgba(15, 95, 95, 0) 60%), radial-gradient(circle at 80% 80%, rgba(15, 95, 95, 0.02) 0%, rgba(15, 95, 95, 0) 50%)'
        }}
      >
        <Container fluid style={{ height: '100%', padding: '16px' }}>
          <Box 
            mb="lg" 
            style={{
              borderRadius: '12px',
              padding: '12px 20px',
              backgroundColor: isDark ? 'rgba(37, 38, 43, 0.6)' : 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${isDark ? '#373A40' : '#e9ecef'}`,
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.15)' : '0 4px 20px rgba(0,0,0,0.05)'
            }}
          >
            <Group justify="space-between" align="center">
              <Group>
                <div className="logo-container">
                  <IconNotes size={22} color="white" stroke={2} />
                  <div className="logo-checkmark"></div>
                </div>
                <Title order={3} c={isDark ? "gray.1" : "gray.8"}>MasterNote</Title>
              </Group>
              <Group>
                <Text size="sm" c="dimmed">AI Task Management</Text>
                <Tooltip label={isDark ? "Switch to light mode" : "Switch to dark mode"}>
                  <ActionIcon 
                    onClick={toggleColorScheme} 
                    variant="subtle" 
                    radius="xl"
                    color={isDark ? "yellow" : "blue"}
                    size="lg"
                  >
                    {isDark ? <IconSun size={20} /> : <IconMoon size={20} />}
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
          </Box>
          
          <div style={{ 
            display: 'flex', 
            height: 'calc(100% - 80px)', 
            gap: '1.5rem',
            position: 'relative'
          }}>
            {/* Left Panel - AI Chat */}
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              minWidth: 0,
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.08)',
              border: `1px solid ${isDark ? '#373A40' : '#e9ecef'}`,
              backdropFilter: 'blur(12px)',
              backgroundColor: isDark ? 'rgba(37, 38, 43, 0.5)' : 'rgba(255, 255, 255, 0.7)'
            }}>
              <Group 
                justify="space-between" 
                mb={0} 
                p="sm" 
                style={{ 
                  backgroundColor: isDark ? 'rgba(37, 38, 43, 0.9)' : 'rgba(245, 247, 250, 0.9)', 
                  borderBottom: `1px solid ${isDark ? '#373A40' : '#e9ecef'}`
                }}
              >
                <Group>
                  <Select
                    value={selectedModel}
                    onChange={(value) => value && setSelectedModel(value as AIModel)}
                    data={[
                      { value: 'gpt4o', label: 'GPT-4o' },
                      { value: 'o3-mini', label: 'GPT-3.5 Turbo' },
                      { value: 'perplexity-sonar', label: 'Perplexity Sonar' },
                    ]}
                    style={{ width: 180 }}
                    styles={{
                      input: {
                        backgroundColor: isDark ? '#2C2E33' : '#f1f3f5',
                        border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
                        borderRadius: '6px',
                        transition: 'all 0.2s ease',
                        '&:focus': {
                          borderColor: '#20C997',
                          backgroundColor: isDark ? '#373A40' : '#e9ecef'
                        }
                      }
                    }}
                    rightSection={
                      selectedModel === 'perplexity-sonar' ? 
                        <IconSearch size={16} color="#20C997" /> : 
                        <IconBrandOpenai size={16} color="#20C997" />
                    }
                  />
                </Group>
                <Group>
                  {messages.length > 0 && (
                    <Tooltip label="Clear chat">
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        radius="xl"
                        onClick={handleClearChat}
                      >
                        <IconEraser size={18} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                  <ActionIcon 
                    variant={apiKeySet ? "subtle" : "filled"} 
                    color={apiKeySet ? (isDark ? "gray" : "gray") : "red"}
                    onClick={() => setSettingsOpened(true)}
                    radius="xl"
                    data-settings-btn="true"
                    style={{ 
                      transition: 'all 0.2s ease',
                      animation: apiKeySet ? 'none' : 'pulse 1.5s infinite'
                    }}
                  >
                    <IconSettings size={18} />
                  </ActionIcon>
                </Group>
              </Group>
              <AIChat model={selectedModel} />
            </div>

            {/* Right Panel - Task List */}
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              minWidth: 0,
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.08)',
              border: `1px solid ${isDark ? '#373A40' : '#e9ecef'}`,
              backdropFilter: 'blur(12px)',
              backgroundColor: isDark ? 'rgba(37, 38, 43, 0.5)' : 'rgba(255, 255, 255, 0.7)'
            }}>
              <Group 
                justify="space-between" 
                mb={0} 
                p="sm" 
                style={{ 
                  backgroundColor: isDark ? 'rgba(37, 38, 43, 0.9)' : 'rgba(245, 247, 250, 0.9)', 
                  borderBottom: `1px solid ${isDark ? '#373A40' : '#e9ecef'}`
                }}
              >
                <Group>
                  <IconListCheck size={18} color="#20C997" />
                  <Text fw={600} size="sm">Tasks</Text>
                </Group>
                <Group>
                  <ActionIcon 
                    variant="subtle" 
                    color="teal" 
                    radius="xl"
                    onClick={() => {
                      // Find and trigger the Add Task button in the TaskList component
                      const addTaskBtn = document.querySelector('[data-add-task-btn="true"]');
                      if (addTaskBtn) {
                        (addTaskBtn as HTMLButtonElement).click();
                      }
                    }}
                  >
                    <IconPlus size={18} />
                  </ActionIcon>
                </Group>
              </Group>
              <TaskList />
            </div>
          </div>
        </Container>
      </AppShell>
      
      {/* Settings Modal */}
      <SettingsModal
        opened={settingsOpened}
        onClose={() => setSettingsOpened(false)}
      />
    </MantineProvider>
  );
}

export default App; 