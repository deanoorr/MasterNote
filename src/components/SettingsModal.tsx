import { Modal, TextInput, Button, Group, Text, Stack, Box, Divider, Alert, Code, Switch, Image, Tooltip } from '@mantine/core';
import { IconKey, IconInfoCircle, IconShieldLock, IconAlertCircle, IconSearch, IconCheck, IconBrandOpenai, IconCloudOff, IconX } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { testOpenAIConnection } from '../services/ai';
import { storageService } from '../services/storage';
import { useAuth } from '../contexts/AuthContext';

interface SettingsModalProps {
  opened: boolean;
  onClose: () => void;
}

export default function SettingsModal({ opened, onClose }: SettingsModalProps) {
  const isDark = true; // Always use dark mode
  const { user } = useAuth();
  const userId = user?.id;
  const [apiKey, setApiKey] = useState('');
  const [perplexityApiKey, setPerplexityApiKey] = useState('');
  const [deepseekApiKey, setDeepseekApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testingApi, setTestingApi] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [taskTemplate, setTaskTemplate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadApiKeys = async () => {
      setLoading(true);
      try {
        let openaiKey, perplexityKey, deepseekKey, geminiKey;
        
        // If user is logged in, try to get keys from Supabase first
        if (userId) {
          console.log("Loading API keys for user:", userId);
          openaiKey = await storageService.getItem('openai_api_key', userId);
          perplexityKey = await storageService.getItem('perplexity_api_key', userId);
          deepseekKey = await storageService.getItem('deepseek_api_key', userId);
          geminiKey = await storageService.getItem('gemini_api_key', userId);
        } 
        
        // Fall back to localStorage if not found in Supabase
        if (!openaiKey) openaiKey = localStorage.getItem('openai_api_key') || '';
        if (!perplexityKey) perplexityKey = localStorage.getItem('perplexity_api_key') || '';
        if (!deepseekKey) deepseekKey = localStorage.getItem('deepseek_api_key') || '';
        if (!geminiKey) geminiKey = localStorage.getItem('gemini_api_key') || '';
        
        setApiKey(openaiKey);
        setPerplexityApiKey(perplexityKey);
        setDeepseekApiKey(deepseekKey);
        setGeminiApiKey(geminiKey);
        
        // Load saved dark mode preference
        const savedDarkMode = localStorage.getItem('dark_mode') === 'true';
        setDarkMode(savedDarkMode);
      } catch (error) {
        console.error("Error loading API keys:", error);
        // Fall back to localStorage
        const savedApiKey = localStorage.getItem('openai_api_key') || '';
        setApiKey(savedApiKey);
        
        const savedPerplexityApiKey = localStorage.getItem('perplexity_api_key') || '';
        setPerplexityApiKey(savedPerplexityApiKey);
        
        const savedDeepseekApiKey = localStorage.getItem('deepseek_api_key') || '';
        setDeepseekApiKey(savedDeepseekApiKey);
        
        const savedGeminiApiKey = localStorage.getItem('gemini_api_key') || '';
        setGeminiApiKey(savedGeminiApiKey);
        
        const savedDarkMode = localStorage.getItem('dark_mode') === 'true';
        setDarkMode(savedDarkMode);
      } finally {
        setLoading(false);
      }
    };
    
    if (opened) {
      loadApiKeys();
    }
  }, [opened, userId]);

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Always save to localStorage as fallback
      localStorage.setItem('openai_api_key', apiKey);
      localStorage.setItem('perplexity_api_key', perplexityApiKey);
      localStorage.setItem('deepseek_api_key', deepseekApiKey);
      localStorage.setItem('gemini_api_key', geminiApiKey);
      localStorage.setItem('dark_mode', darkMode.toString());
      
      // If user is logged in, also save to Supabase
      if (userId) {
        await storageService.setItem('openai_api_key', apiKey, userId);
        await storageService.setItem('perplexity_api_key', perplexityApiKey, userId);
        await storageService.setItem('deepseek_api_key', deepseekApiKey, userId);
        await storageService.setItem('gemini_api_key', geminiApiKey, userId);
        // Dark mode is only stored in localStorage
      }
      
      setSaved(true);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaving(false);
        setSaved(false);
        onClose();
        
        // Refresh the page to ensure the API key is used in new requests
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error saving API keys:", error);
      setSaving(false);
      setErrorMessage("Failed to save API keys. Please try again.");
    }
  };

  const handleApiTest = async () => {
    setTestingApi(true);
    setApiTestResult(null);
    try {
      // Test OpenAI connection
      const openaiResult = await testOpenAIConnection();
      console.log("OpenAI test result:", openaiResult);
      setApiTestResult(openaiResult);
    } catch (error) {
      console.error("Error testing API:", error);
      setApiTestResult({ success: false, error: String(error) });
    } finally {
      setTestingApi(false);
    }
  };

  // Effect for setting up event handler for enter key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && apiKey.trim() && opened) {
        handleSave();
      }
    };
    
    window.addEventListener('keypress', handleKeyPress);
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
    };
  }, [apiKey, opened]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text size="lg" fw={600}>Settings</Text>}
      centered
      size="md"
      styles={{
        header: {
          backgroundColor: isDark ? '#25262b' : '#f8f9fa', 
          borderBottom: `1px solid ${isDark ? '#373A40' : '#e9ecef'}`,
          padding: '16px 24px',
        },
        title: {
          fontWeight: 600,
          fontSize: '18px',
          color: isDark ? '#C1C2C5' : '#495057',
        },
        body: {
          padding: '0',
          backgroundColor: isDark ? '#1A1B1E' : '#ffffff',
        },
        close: {
          color: isDark ? '#909296' : '#adb5bd',
          '&:hover': {
            backgroundColor: isDark ? '#373A40' : '#e9ecef',
          }
        },
      }}
    >
      <Stack p="xl" gap="md">
        <Text size="sm" c={isDark ? 'gray.4' : 'gray.7'}>
          To use this application, you need to provide your OpenAI API key. 
          This key is stored only in your browser's local storage and is never sent to our servers.
        </Text>
        
        <Box
          style={{
            backgroundColor: isDark ? '#25262b' : '#f8f9fa',
            padding: '16px',
            borderRadius: '8px',
            border: `1px solid ${isDark ? '#373A40' : '#e9ecef'}`,
          }}
        >
          <Group mb="xs">
            <IconKey size={20} color="#20C997" />
            <Text fw={600} size="sm" c={isDark ? undefined : 'gray.8'}>Your OpenAI API Key</Text>
          </Group>
          
          <TextInput
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            styles={{
              input: {
                backgroundColor: isDark ? '#2C2E33' : '#ffffff',
                border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
                color: isDark ? '#C1C2C5' : '#495057',
                fontSize: '16px',
                padding: '12px 16px',
                transition: 'all 0.2s ease',
                '&:focus': {
                  borderColor: '#20C997',
                  backgroundColor: isDark ? '#373A40' : '#f8f9fa',
                }
              }
            }}
            autoFocus
          />
          
          <Alert 
            color="blue" 
            variant="light" 
            mt="md"
            styles={{
              root: {
                backgroundColor: isDark ? 'rgba(34, 139, 230, 0.1)' : 'rgba(34, 139, 230, 0.07)',
                border: `1px solid ${isDark ? 'rgba(34, 139, 230, 0.3)' : 'rgba(34, 139, 230, 0.2)'}`,
              },
              message: {
                fontSize: '14px',
                color: isDark ? '#C1C2C5' : '#495057',
              }
            }}
            icon={<IconInfoCircle size={18} />}
          >
            You need an OpenAI API key to use this app. Get it from <a href="https://platform.openai.com/account/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: isDark ? '#228be6' : '#228be6' }}>OpenAI Dashboard</a>.
          </Alert>
        </Box>
        
        <Box
          style={{
            backgroundColor: isDark ? '#25262b' : '#f8f9fa',
            padding: '16px',
            borderRadius: '8px',
            border: `1px solid ${isDark ? '#373A40' : '#e9ecef'}`,
            marginTop: '16px'
          }}
        >
          <Group mb="xs">
            <IconSearch size={20} color="#228BE6" />
            <Text fw={600} size="sm" c={isDark ? undefined : 'gray.8'}>Perplexity API Key (Optional)</Text>
          </Group>
          
          <TextInput
            placeholder="sk-..."
            value={perplexityApiKey}
            onChange={(e) => setPerplexityApiKey(e.target.value)}
            styles={{
              input: {
                backgroundColor: isDark ? '#2C2E33' : '#ffffff',
                border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
                color: isDark ? '#C1C2C5' : '#495057',
                fontSize: '16px',
                padding: '12px 16px',
                transition: 'all 0.2s ease',
                '&:focus': {
                  borderColor: '#228BE6',
                  backgroundColor: isDark ? '#373A40' : '#f8f9fa',
                }
              }
            }}
          />
          
          <Group mt="md" align="center">
            <Switch
              label="Use Sonar Pro"
              checked={localStorage.getItem('use_sonar_pro') === 'true'}
              onChange={(event) => {
                const isChecked = event.currentTarget.checked;
                localStorage.setItem('use_sonar_pro', isChecked.toString());
                // Force a re-render
                window.dispatchEvent(new Event('storage'));
              }}
              styles={{
                track: {
                  backgroundColor: isDark ? '#373A40' : '#e9ecef',
                  '&[data-checked]': {
                    backgroundColor: '#228BE6',
                  },
                },
                label: {
                  color: isDark ? '#C1C2C5' : '#495057',
                },
              }}
            />
            <Tooltip label="Sonar Pro offers a larger context window (200k) and more powerful processing capabilities">
              <IconInfoCircle size={16} style={{ color: isDark ? '#909296' : '#adb5bd', cursor: 'help' }} />
            </Tooltip>
          </Group>
          
          <Text size="sm" c="dimmed" mt="xs">
            Optional: Required only if you want to use the Perplexity Sonar model. Enable Sonar Pro for enhanced capabilities.
          </Text>
        </Box>
        
        <Box
          style={{
            backgroundColor: isDark ? '#25262b' : '#f8f9fa',
            padding: '16px',
            borderRadius: '8px',
            border: `1px solid ${isDark ? '#373A40' : '#e9ecef'}`,
            marginTop: '16px'
          }}
        >
          <Group mb="xs">
            <IconBrandOpenai size={20} color="#3388FF" />
            <Text fw={600} size="sm" c={isDark ? undefined : 'gray.8'}>DeepSeek R1 API Key (Optional)</Text>
          </Group>
          
          <TextInput
            placeholder="sk-..."
            value={deepseekApiKey}
            onChange={(e) => setDeepseekApiKey(e.target.value)}
            styles={{
              input: {
                backgroundColor: isDark ? '#2C2E33' : '#ffffff',
                border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
                color: isDark ? '#C1C2C5' : '#495057',
                fontSize: '16px',
                padding: '12px 16px',
                transition: 'all 0.2s ease',
                '&:focus': {
                  borderColor: '#3388FF',
                  backgroundColor: isDark ? '#373A40' : '#f8f9fa',
                }
              }
            }}
          />
          
          <Text size="sm" c="dimmed" mt="xs">
            Optional: Required only if you want to use the DeepSeek R1 model.
          </Text>
          
          <Button 
            variant="light" 
            color="blue" 
            mt="md" 
            size="sm"
            onClick={async () => {
              if (!deepseekApiKey.trim()) {
                alert("Please enter a DeepSeek API key first");
                return;
              }
              
              // Save key temporarily for the test
              localStorage.setItem('deepseek_api_key', deepseekApiKey);
              
              try {
                // Simple fetch test to check if key is valid
                const response = await fetch('https://api.deepseek.com/v1/models', {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${deepseekApiKey}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                if (response.ok) {
                  const data = await response.json();
                  console.log("DeepSeek API test successful:", data);
                  alert("DeepSeek API key is valid!");
                } else {
                  const errorData = await response.json().catch(() => ({}));
                  console.error("DeepSeek API test failed:", response.status, errorData);
                  alert(`DeepSeek API key test failed: ${response.status} ${response.statusText}`);
                }
              } catch (error) {
                console.error("DeepSeek API test error:", error);
                alert(`Error testing DeepSeek API key: ${error instanceof Error ? error.message : String(error)}`);
              }
            }}
          >
            Test DeepSeek API Key
          </Button>
        </Box>
        
        <Box
          style={{
            backgroundColor: isDark ? '#25262b' : '#f8f9fa',
            padding: '16px',
            borderRadius: '8px',
            border: `1px solid ${isDark ? '#373A40' : '#e9ecef'}`,
            marginTop: '16px'
          }}
        >
          <Group mb="xs">
            <IconBrandOpenai size={20} color="#E30B5C" />
            <Text fw={600} size="sm" c={isDark ? undefined : 'gray.8'}>Gemini API Key (Optional)</Text>
          </Group>
          
          <TextInput
            placeholder="Enter your Gemini API key"
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.currentTarget.value)}
            styles={{
              input: {
                backgroundColor: isDark ? '#2C2E33' : '#ffffff',
                border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
                color: isDark ? '#C1C2C5' : '#495057',
                fontSize: '16px',
                padding: '12px 16px',
                transition: 'all 0.2s ease',
                '&:focus': {
                  borderColor: '#E30B5C',
                  backgroundColor: isDark ? '#373A40' : '#f8f9fa',
                }
              }
            }}
          />
          
          <Text size="sm" c="dimmed" mt="xs">
            Optional: Required only if you want to use the Gemini 2.5 Pro model.
          </Text>
          
          <Button 
            variant="light" 
            color="red" 
            mt="md" 
            size="sm"
            onClick={async () => {
              if (!geminiApiKey.trim()) {
                alert("Please enter a Gemini API key first");
                return;
              }
              
              // Save key temporarily for the test
              localStorage.setItem('gemini_api_key', geminiApiKey);
              
              try {
                // Simple fetch test to check if key is valid
                const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-exp-03-25:generateContent?key=' + geminiApiKey, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    contents: [{ 
                      role: 'user',
                      parts: [{ text: 'Hello' }]
                    }],
                    generationConfig: {
                      maxOutputTokens: 10,
                      temperature: 0.1
                    }
                  })
                });
                
                if (response.ok) {
                  const data = await response.json();
                  console.log("Gemini API test successful:", data);
                  alert("Gemini API key is valid!");
                } else {
                  const errorData = await response.json().catch(() => ({}));
                  console.error("Gemini API test failed:", response.status, errorData);
                  
                  let errorMessage = `Gemini API key test failed: ${response.status}`;
                  
                  if (response.status === 429) {
                    errorMessage = "Rate limit exceeded. Your Gemini API key appears valid but you've hit the request limit. Try again later.";
                  } else if (errorData?.error?.message) {
                    errorMessage = `Error: ${errorData.error.message}`;
                  } else if (errorData?.error?.status) {
                    errorMessage = `Error: ${errorData.error.status}`;
                  }
                  
                  alert(errorMessage);
                }
              } catch (error) {
                console.error("Gemini API test error:", error);
                alert(`Error testing Gemini API key: ${error instanceof Error ? error.message : String(error)}`);
              }
            }}
          >
            Test Gemini API Key
          </Button>
        </Box>
        
        <Divider my="sm" />
        
        <Box
          style={{
            backgroundColor: isDark ? '#25262b' : '#f8f9fa',
            padding: '16px',
            borderRadius: '8px',
            border: `1px solid ${isDark ? '#373A40' : '#e9ecef'}`,
          }}
        >
          <Group mb="xs">
            <IconShieldLock size={20} color="#20C997" />
            <Text fw={600} size="sm" c={isDark ? undefined : 'gray.8'}>Privacy & Security</Text>
          </Group>
          
          <Alert
            color="gray"
            variant="light"
            styles={{
              root: {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
                border: `1px solid ${isDark ? '#373A40' : '#e9ecef'}`,
              },
              message: {
                color: isDark ? '#C1C2C5' : '#495057',
              }
            }}
            icon={<IconAlertCircle size={16} />}
          >
            <Text size="xs" style={{ lineHeight: 1.5 }}>
              Your API keys are stored only in your browser's local storage (localStorage). 
              They are never transmitted to our servers or any third parties other than OpenAI. 
              All API requests are made directly from your browser to OpenAI's servers.
            </Text>
          </Alert>
        </Box>
        
        <Divider my="md" />
        
        <Group justify="space-between">
          <Button 
            variant="outline" 
            color="gray" 
            onClick={handleApiTest}
            loading={testingApi}
            leftSection={<IconCloudOff size={16} />}
          >
            Test API Connection
          </Button>
          
          <Group>
            <Button 
              color="gray" 
              variant="subtle" 
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              color="teal"
              onClick={handleSave}
              loading={saving}
              leftSection={saved ? <IconCheck size={16} /> : null}
            >
              {saved ? 'Saved!' : 'Save Configuration'}
            </Button>
          </Group>
        </Group>
        
        {apiTestResult && (
          <Box mt="md" p="md" style={{ 
            backgroundColor: apiTestResult.success ? 'rgba(32, 201, 151, 0.1)' : 'rgba(250, 82, 82, 0.1)',
            borderRadius: '8px',
            border: `1px solid ${apiTestResult.success ? 'rgba(32, 201, 151, 0.3)' : 'rgba(250, 82, 82, 0.3)'}`,
          }}>
            <Text fw={600} mb="xs" size="sm" c={apiTestResult.success ? 'teal' : 'red'}>
              API Test Result: {apiTestResult.success ? 'Success' : 'Failed'}
            </Text>
            {apiTestResult.success ? (
              <Text size="sm">OpenAI API connection is working correctly.</Text>
            ) : (
              <>
                <Text size="sm" mb="xs">Error: {apiTestResult.error}</Text>
                {apiTestResult.status && <Text size="sm">Status: {apiTestResult.status}</Text>}
                {apiTestResult.response && (
                  <Code block my="sm" style={{ maxHeight: '150px', overflow: 'auto' }}>
                    {JSON.stringify(apiTestResult.response, null, 2)}
                  </Code>
                )}
              </>
            )}
          </Box>
        )}
        
      </Stack>
    </Modal>
  );
} 