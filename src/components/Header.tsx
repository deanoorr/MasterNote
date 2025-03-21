import { Group, Text, Button, Box, rem, useMantineColorScheme, Tooltip, ActionIcon } from '@mantine/core';
import { IconSettings, IconPlus, IconSun, IconMoon } from '@tabler/icons-react';
import { useState } from 'react';
import SettingsModal from './SettingsModal';

interface HeaderProps {
  toggleAddTask: () => void;
}

export default function Header({ toggleAddTask }: HeaderProps) {
  const [settingsOpened, setSettingsOpened] = useState(false);
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  
  const toggleColorScheme = () => {
    const newColorScheme = isDark ? 'light' : 'dark';
    setColorScheme(newColorScheme);
    localStorage.setItem('color_scheme', newColorScheme);
  };

  return (
    <>
      <Box 
        py="md" 
        px="md"
        style={{
          borderBottom: `1px solid ${isDark ? '#373A40' : '#e9ecef'}`,
          backgroundColor: isDark ? '#25262b' : '#f8f9fa',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Group justify="space-between">
          <Group>
            <Text 
              fw={700} 
              size="xl" 
              style={{ 
                background: isDark 
                  ? 'linear-gradient(90deg, #20C997, #15aabf)' 
                  : 'linear-gradient(90deg, #087f5b, #0ca678)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              MasterNote
            </Text>
            <Text c={isDark ? 'gray.5' : 'gray.6'} size="sm" mt={5}>
              AI-powered task management
            </Text>
          </Group>
          
          <Group>
            <Tooltip 
              label={isDark ? "Switch to light mode" : "Switch to dark mode"} 
              position="bottom"
              openDelay={300}
            >
              <ActionIcon
                onClick={toggleColorScheme}
                variant="subtle"
                color={isDark ? "gray" : "dark"}
                size="lg"
                radius="md"
                aria-label="Toggle color scheme"
              >
                {isDark ? (
                  <IconSun size={20} stroke={1.5} />
                ) : (
                  <IconMoon size={20} stroke={1.5} />
                )}
              </ActionIcon>
            </Tooltip>
            
            <Button
              onClick={toggleAddTask}
              leftSection={<IconPlus size={rem(16)} />}
              color="teal"
              variant="filled"
              styles={{
                root: {
                  backgroundColor: isDark ? '#20C997' : '#12b886',
                  transition: 'transform 0.2s ease',
                  '&:hover': {
                    backgroundColor: isDark ? '#12B886' : '#0ca678',
                    transform: 'translateY(-2px)'
                  }
                }
              }}
            >
              Add Task
            </Button>
            
            <Tooltip 
              label="Configure API Key" 
              position="bottom"
              openDelay={300}
            >
              <ActionIcon
                onClick={() => setSettingsOpened(true)}
                variant="subtle"
                color={isDark ? "gray" : "dark"}
                size="lg"
                radius="md"
                aria-label="Settings"
              >
                <IconSettings size={20} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Box>
      
      <SettingsModal 
        opened={settingsOpened} 
        onClose={() => setSettingsOpened(false)} 
      />
    </>
  );
} 