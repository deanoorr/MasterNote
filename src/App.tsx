import { useState, useEffect, ErrorInfo, useCallback, useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
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

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <div style={{ 
      padding: '2rem',
      backgroundColor: '#FFF5F5',
      borderRadius: '8px',
      border: '1px solid #FFE3E3',
      margin: '1rem'
    }}>
      <Text fw={700} c="red.7" mb="sm">Something went wrong</Text>
      <Text c="red.6" mb="md">{error.message}</Text>
      <Button 
        variant="light" 
        color="red" 
        onClick={resetErrorBoundary}
      >
        Try again
      </Button>
    </div>
  );
}

// Log errors to error tracking service
const logError = (error: Error, info: ErrorInfo) => {
  console.error('Error:', error, 'Info:', info);
  // TODO: Add error tracking service integration
};

// Main App Component
function AppContent() {
  const [selectedModel, setSelectedModel] = useState<AIModel>('gpt-o3-mini');
  const [settingsOpened, setSettingsOpened] = useState(false);
  const [authModalOpened, setAuthModalOpened] = useState(false);
  const [apiKeySet, setApiKeySet] = useState(false);
  const { messages, clearMessages, setUserId, syncWithSupabase } = useStore();
  const { user, loading } = useAuth();

  // Memoize model options to prevent unnecessary re-renders
  const modelOptions = useMemo(() => [
    { value: 'gpt-o3-mini', label: 'GPT-o3 Mini' },
    { value: 'gpt4o', label: 'GPT-4o' },
    { value: 'deepseek-v3', label: 'DeepSeek V3' },
  ], []);

  // Save the selected model to localStorage whenever it changes
  const saveModelToStorage = useCallback((model: AIModel) => {
    localStorage.setItem('selected_model', model);
    if (process.env.NODE_ENV === 'development') {
      console.log('Saved model to localStorage:', model);
    }
  }, []);

  useEffect(() => {
    saveModelToStorage(selectedModel);
  }, [selectedModel, saveModelToStorage]);

  // Open settings modal if no API key is set
  const [apiKeyLoading, setApiKeyLoading] = useState(true);
  
  const checkApiKey = useCallback(async () => {
    setApiKeyLoading(true);
    let apiKeyFound = false;
    
    try {
      if (user?.id) {
        // Try Supabase first for authenticated users
        try {
          const apiKeyFromSupabase = await storageService.getItem('openai_api_key', user.id);
          if (apiKeyFromSupabase) {
            apiKeyFound = true;
            setApiKeySet(true);
            return;
          }
        } catch (supabaseError) {
          console.warn("Supabase API key check failed, falling back to localStorage:", supabaseError);
        }
      }
      
      // Fall back to localStorage check
      const apiKey = localStorage.getItem('openai_api_key');
      apiKeyFound = !!apiKey;
      setApiKeySet(apiKeyFound);
      
      if (!apiKeyFound) {
        setSettingsOpened(true);
      }
    } catch (error) {
      console.error("Error checking API key:", error);
      setApiKeySet(false);
    } finally {
      setApiKeyLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timeoutId = setTimeout(checkApiKey, 1000);
    return () => clearTimeout(timeoutId);
  }, [checkApiKey]);

  // Retry API key check every 5 minutes if not found
  useEffect(() => {
    if (apiKeySet || apiKeyLoading) return;
    
    const retryInterval = setInterval(checkApiKey, 300000); // 5 minutes
    return () => clearInterval(retryInterval);
  }, [apiKeySet, apiKeyLoading, checkApiKey]);

  // Load model preference
  const loadModelFromStorage = useCallback(() => {
    const savedModel = localStorage.getItem('selected_model');
    const validModels: AIModel[] = ['gpt4o', 'perplexity-sonar', 'deepseek-r1', 'gpt-o3-mini', 'deepseek-v3'];
    
    if (savedModel && validModels.includes(savedModel as AIModel)) {
      setSelectedModel(savedModel as AIModel);
    } else {
      setSelectedModel('gpt-o3-mini');
      saveModelToStorage('gpt-o3-mini');
    }
  }, [saveModelToStorage]);

  useEffect(() => {
    loadModelFromStorage();
  }, [loadModelFromStorage]);

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
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onError={logError}
        onReset={() => window.location.reload()}
      >
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
                  <Tooltip label="Select AI model" position="bottom" withArrow>
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
                      styles={(theme) => ({
                        input: {
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          borderColor: '#DEE2E6',
                          fontWeight: 'bold',
                          borderRadius: '6px',
                          color: '#495057',
                          transition: 'all 0.2s ease',
                          '&:focus': {
                            borderColor: '#20C997',
                            backgroundColor: '#FFFFFF',
                            boxShadow: '0 0 0 2px rgba(32, 201, 151, 0.2)'
                          },
                          '&:hover': {
                            borderColor: '#ADB5BD'
                          }
                        },
                        dropdown: {
                          border: '1px solid #DEE2E6',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          borderRadius: '8px',
                          transition: 'pop 200ms ease-out'
                        },
                        option: {
                          '&[data-selected]': {
                            backgroundColor: '#E6FCF5',
                            color: '#087F5B',
                            fontWeight: '600'
                          },
                          '&[data-hovered]': {
                            backgroundColor: '#F8F9FA',
                            transition: 'background-color 200ms ease-out'
                          }
                        }
                      })}
                    />
                  </Tooltip>
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
      </ErrorBoundary>
      
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
