import { useState, useEffect } from 'react';
import { MantineProvider, createTheme, AppShell, Group, ActionIcon, Select, Text, Container, Title, Box, Tooltip, Button } from '@mantine/core';
import { IconSettings, IconBrandOpenai, IconListCheck, IconPlus, IconNotes, IconChecklist, IconSearch, IconEraser, IconBulb } from '@tabler/icons-react';
import AIChat from './components/AIChat';
import TaskList from './components/TaskList';
import SettingsModal from './components/SettingsModal';
import { AIModel } from './types';
import { useStore } from './store';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthModal from './components/Auth/AuthModal';
import UserProfile from './components/Auth/UserProfile';
import { isSupabaseConfigured } from './lib/supabase';
import { storageService } from './services/storage';

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
      '#F8F9FA', // Lightest (previously darkest)
      '#E9ECEF',
      '#DEE2E6',
      '#CED4DA',
      '#ADB5BD',
      '#868E96',
      '#495057',
      '#343A40',
      '#212529',
      '#121416',
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

// Main App Component
function AppContent() {
  const [selectedModel, setSelectedModel] = useState<AIModel>('gpt-o3-mini');
  const [settingsOpened, setSettingsOpened] = useState(false);
  const [authModalOpened, setAuthModalOpened] = useState(false);
  const [apiKeySet, setApiKeySet] = useState(false);
  const { messages, clearMessages, setUserId, syncWithSupabase, tasks } = useStore();
  const { user, loading, setDemoUser, isDemoMode } = useAuth();

  // Save the selected model to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('selected_model', selectedModel);
    console.log('Saved model to localStorage:', selectedModel);
  }, [selectedModel]);

  // Open settings modal if no API key is set
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        // First check if we're logged in
        if (user && user.id) {
          // Try to load API key from Supabase via the storage service
          const apiKeyFromSupabase = await storageService.getItem('openai_api_key', user.id);
          setApiKeySet(!!apiKeyFromSupabase);
          
          // Only open settings if we've confirmed no API key exists in Supabase
          if (!apiKeyFromSupabase) {
            setSettingsOpened(true);
          }
        } else {
          // Not logged in, check localStorage directly
          const apiKey = localStorage.getItem('openai_api_key');
          setApiKeySet(!!apiKey);
          if (!apiKey) {
            setSettingsOpened(true);
          }
        }
      } catch (error) {
        console.error("Error checking API key:", error);
        // On error, fall back to localStorage check
        const apiKey = localStorage.getItem('openai_api_key');
        setApiKeySet(!!apiKey);
        if (!apiKey) {
          setSettingsOpened(true);
        }
      }
    };
    
    // Run the check after a short delay to allow auth to complete
    const timeoutId = setTimeout(checkApiKey, 1000);
    return () => clearTimeout(timeoutId);
  }, [user]);

  // Load model preference
  useEffect(() => {
    // Load the saved model preference from localStorage
    const savedModel = localStorage.getItem('selected_model');
    // Allow gpt4o, perplexity-sonar, deepseek-r1, gpt-o3-mini, or deepseek-v3
    if (savedModel && (savedModel === 'gpt4o' || savedModel === 'perplexity-sonar' || 
        savedModel === 'deepseek-r1' || savedModel === 'gpt-o3-mini' || savedModel === 'deepseek-v3')) {
      setSelectedModel(savedModel as AIModel);
    } else {
      // Default to gpt-o3-mini
      setSelectedModel('gpt-o3-mini');
      localStorage.setItem('selected_model', 'gpt-o3-mini');
    }
  }, []);

  // Show authentication modal if no user is logged in
  useEffect(() => {
    if (!loading && !user) {
      // Show auth modal - never use demo mode automatically
      setAuthModalOpened(true);
    }
  }, [loading, user]);

  // Update user ID in store when auth changes
  useEffect(() => {
    if (user) {
      setUserId(user.id);
      // Always sync with Supabase, but our improved sync logic will
      // intelligently merge the data, preserving local modifications
      console.log("User authenticated, syncing with Supabase using smart merge...");
      syncWithSupabase();
    }
  }, [user, setUserId, syncWithSupabase]);

  // Set up periodic sync to keep multiple browsers in sync
  useEffect(() => {
    if (!user) return; // Only sync when user is logged in
    
    console.log("Setting up periodic sync with Supabase");
    
    // Sync every 60 seconds to catch any changes from other browsers
    const syncInterval = setInterval(() => {
      console.log("Running periodic sync with Supabase");
      syncWithSupabase();
    }, 60000); // 60 seconds
    
    // Clean up interval on unmount
    return () => {
      console.log("Clearing periodic sync interval");
      clearInterval(syncInterval);
    };
  }, [user, syncWithSupabase]);

  // Show auth modal only if explicitly requested now
  // We've removed the auto-popup of auth modal

  const handleAuthSuccess = (userId: string) => {
    setUserId(userId);
    // Always sync on auth success, we're using smart merge now
    console.log("Auth success, syncing with Supabase...");
    syncWithSupabase();
    setAuthModalOpened(false);
  };

  const handleClearChat = () => {
    if (messages.length > 0) {
      clearMessages();
    }
  };

  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <style>{cssStyles}</style>
      <AppShell
        padding="md"
        style={{ 
          height: '100vh', 
          backgroundColor: '#F8F9FA',
          backgroundImage: 'radial-gradient(circle at 40% 20%, rgba(15, 95, 95, 0.05) 0%, rgba(15, 95, 95, 0) 60%), radial-gradient(circle at 80% 80%, rgba(15, 95, 95, 0.03) 0%, rgba(15, 95, 95, 0) 50%)',
          overflow: 'hidden' // Prevent outer scrolling
        }}
      >
        <Container fluid style={{ height: '100%', padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <Box 
            mb="lg" 
            style={{
              borderRadius: '12px',
              padding: '12px 20px',
              backgroundColor: 'rgba(245, 246, 248, 0.8)',
              backdropFilter: 'blur(12px)',
              border: '1px solid #DEE2E6',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              flexShrink: 0
            }}
          >
            <Group justify="space-between" align="center">
              <Group>
                <div className="logo-container">
                  <IconNotes size={22} color="white" stroke={2} />
                  <div className="logo-checkmark"></div>
                </div>
                <Title order={3} c="gray.7">MasterNote</Title>
              </Group>
              <Group>
                <Text size="sm" c="gray.6">AI Task Management</Text>
                {user ? (
                  <UserProfile openSettings={() => setSettingsOpened(true)} />
                ) : (
                  <Button 
                    variant="subtle"
                    onClick={() => setAuthModalOpened(true)}
                    size="sm"
                  >
                    Login
                  </Button>
                )}
                {!user && (
                  <ActionIcon 
                    onClick={() => setSettingsOpened(true)} 
                    variant="subtle" 
                    radius="xl"
                    color="gray"
                    size="lg"
                  >
                    <IconSettings size={20} />
                  </ActionIcon>
                )}
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
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              border: '1px solid #DEE2E6',
              backdropFilter: 'blur(12px)',
              backgroundColor: 'rgba(255, 255, 255, 0.7)'
            }}>
              <Group 
                justify="space-between" 
                mb={0} 
                p="sm" 
                style={{ 
                  backgroundColor: 'rgba(245, 246, 248, 0.95)', 
                  borderBottom: '1px solid #DEE2E6'
                }}
              >
                <Group>
                  <Select
                    placeholder="AI Model"
                    data={[
                      { value: 'gpt-o3-mini', label: 'GPT-o3 Mini' },
                      { value: 'gpt4o', label: 'GPT-4o' },
                      { value: 'deepseek-v3', label: 'DeepSeek V3' },
                    ]}
                    value={selectedModel}
                    onChange={(value) => value && setSelectedModel(value as AIModel)}
                    style={{ width: 230 }}
                    styles={{
                      input: {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderColor: '#DEE2E6',
                        fontWeight: 'bold',
                        borderRadius: '6px',
                        color: '#495057',
                        transition: 'all 0.2s ease',
                        '&:focus': {
                          borderColor: '#20C997',
                          backgroundColor: '#FFFFFF'
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
              display: 'flex', 
              flexDirection: 'column',
              minHeight: 0, // Important for proper scrolling
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid #DEE2E6',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(12px)',
              backgroundColor: 'rgba(255, 255, 255, 0.7)'
            }}>
              <Group 
                justify="space-between" 
                mb={0} 
                p="sm" 
                style={{ 
                  backgroundColor: 'rgba(245, 246, 248, 0.95)', 
                  borderBottom: '1px solid #DEE2E6'
                }}
              >
                <Group>
                  <IconListCheck size={20} color="#20C997" stroke={2.5} />
                  <Text fw={600} size="sm" c="gray.7">Task List</Text>
                </Group>
              </Group>
              
              <TaskList />
            </div>
          </div>
        </Container>
      </AppShell>
      
      {/* Modals */}
      <SettingsModal
        opened={settingsOpened}
        onClose={() => setSettingsOpened(false)}
      />
      <AuthModal 
        opened={authModalOpened} 
        onClose={() => setAuthModalOpened(false)} 
        onAuthSuccess={handleAuthSuccess}
      />
    </MantineProvider>
  );
}

// Wrapper component that provides auth context
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App; 