import { useState, useEffect } from 'react';
import { Modal, TextInput, Button, Group, Text, Stack, Box, Divider, Alert, useMantineColorScheme } from '@mantine/core';
import { IconKey, IconInfoCircle, IconShieldLock, IconAlertCircle, IconSearch, IconCheck } from '@tabler/icons-react';

interface SettingsModalProps {
  opened: boolean;
  onClose: () => void;
}

export default function SettingsModal({ opened, onClose }: SettingsModalProps) {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const [apiKey, setApiKey] = useState('');
  const [perplexityApiKey, setPerplexityApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load saved API key from localStorage
    const savedApiKey = localStorage.getItem('openai_api_key') || '';
    setApiKey(savedApiKey);
    
    // Load saved Perplexity API key from localStorage
    const savedPerplexityApiKey = localStorage.getItem('perplexity_api_key') || '';
    setPerplexityApiKey(savedPerplexityApiKey);
  }, []);

  const handleSave = () => {
    setSaving(true);
    // Save API key to localStorage
    localStorage.setItem('openai_api_key', apiKey);
    
    // Save Perplexity API key to localStorage
    localStorage.setItem('perplexity_api_key', perplexityApiKey);
    
    setSaved(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(false);
      onClose();
      
      // Refresh the page to ensure the API key is used in new requests
      window.location.reload();
    }, 1500);
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
                color: isDark ? '#90CAF9' : '#1c7ed6',
              }
            }}
            icon={<IconInfoCircle size={16} />} 
          >
            <Text size="xs" style={{ lineHeight: 1.5 }}>
              To get an API key, sign up for an account at <a href="https://platform.openai.com" target="_blank" rel="noreferrer" style={{ color: '#20C997', textDecoration: 'none' }}>platform.openai.com</a> and create a key in the API section.
            </Text>
          </Alert>
        </Box>
        
        <Box mt="md">
          <Text fw={500} size="sm" mb="xs">Perplexity API Key</Text>
          <TextInput
            value={perplexityApiKey}
            onChange={(e) => setPerplexityApiKey(e.target.value)}
            placeholder="Enter your Perplexity API key"
            leftSection={<IconSearch size="1rem" />}
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
          />
          <Text size="xs" color="dimmed" mt={6}>
            Required for Perplexity Sonar model. Get your API key from <a href="https://docs.perplexity.ai" target="_blank" rel="noopener noreferrer" style={{ color: isDark ? '#20C997' : '#0ca678' }}>Perplexity</a>.
          </Text>
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
        
        <Group justify="flex-end" mt="xl">
          {apiKey && (
            <Button 
              variant="subtle" 
              onClick={onClose}
              styles={{
                root: {
                  transition: 'all 0.2s ease',
                  color: isDark ? '#C1C2C5' : '#495057',
                }
              }}
            >
              Cancel
            </Button>
          )}
          <Button 
            onClick={handleSave} 
            loading={saving}
            disabled={!apiKey.trim()}
            color="teal"
            styles={{
              root: {
                transition: 'all 0.2s ease',
                '&:not(:disabled):hover': {
                  backgroundColor: '#12B886',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(32, 201, 151, 0.25)'
                }
              }
            }}
          >
            {saved ? 'Saved!' : 'Save Configuration'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
} 