import { useState } from 'react';
import { Modal, TextInput, PasswordInput, Button, Group, Text, Tabs, Stack, Box, Divider } from '@mantine/core';
import { IconRocket, IconInfoCircle, IconLogin, IconUserPlus } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import classes from './Auth.module.css';

interface AuthModalProps {
  opened: boolean;
  onClose: () => void;
  onAuthSuccess: (userId: string) => void;
}

export default function AuthModal({ opened, onClose, onAuthSuccess }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const { setDemoUser, isDemoMode } = useAuth();

  const handleAuth = async (type: 'login' | 'signup') => {
    setLoading(true);
    setError(null);

    try {
      let result;
      if (type === 'login') {
        result = await supabase.auth.signInWithPassword({ email, password });
      } else {
        result = await supabase.auth.signUp({ email, password });
      }

      if (result.error) {
        setError(result.error.message);
      } else if (result.data.user) {
        onAuthSuccess(result.data.user.id);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = () => {
    const demoUserId = `demo-${Math.random().toString(36).substr(2, 9)}`;
    setDemoUser(demoUserId);
    onAuthSuccess(demoUserId);
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Authentication" centered>
      <Stack>
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value as 'login' | 'signup')}>
          <Tabs.List grow>
            <Tabs.Tab value="login" leftSection={<IconLogin size={14} />}>
              Login
            </Tabs.Tab>
            <Tabs.Tab value="signup" leftSection={<IconUserPlus size={14} />}>
              Sign Up
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="login" pt="md">
            <form onSubmit={(e) => { e.preventDefault(); handleAuth('login'); }}>
              <TextInput
                label="Email"
                placeholder="your@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                mb="md"
              />
              <PasswordInput
                label="Password"
                placeholder="Your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                mb="md"
              />
              {error && <Text c="red" size="sm" mb="md">{error}</Text>}
              <Button type="submit" fullWidth loading={loading}>
                Login
              </Button>
            </form>
          </Tabs.Panel>

          <Tabs.Panel value="signup" pt="md">
            <form onSubmit={(e) => { e.preventDefault(); handleAuth('signup'); }}>
              <TextInput
                label="Email"
                placeholder="your@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                mb="md"
              />
              <PasswordInput
                label="Password"
                placeholder="Create a password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                mb="md"
              />
              {error && <Text c="red" size="sm" mb="md">{error}</Text>}
              <Button type="submit" fullWidth loading={loading}>
                Sign Up
              </Button>
            </form>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Modal>
  );
} 