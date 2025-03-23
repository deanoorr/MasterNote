import { useState } from 'react';
import { Menu, Button, Avatar, Text, Group, ActionIcon, Tooltip } from '@mantine/core';
import { IconUser, IconLogout, IconSettings } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';

interface UserProfileProps {
  openSettings: () => void;
}

export default function UserProfile({ openSettings }: UserProfileProps) {
  const { user, signOut } = useAuth();
  const [menuOpened, setMenuOpened] = useState(false);

  // Extract first letter of email for avatar
  const getAvatarLetter = () => {
    if (!user || !user.email) return '?';
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <Menu
      opened={menuOpened}
      onChange={setMenuOpened}
      position="bottom-end"
      offset={4}
    >
      <Menu.Target>
        <Tooltip label={user?.email || 'User'} position="bottom">
          <ActionIcon variant="subtle" color="gray" size="lg" radius="xl">
            <Avatar
              size="sm"
              radius="xl"
              color="blue"
              variant="filled"
            >
              {getAvatarLetter()}
            </Avatar>
          </ActionIcon>
        </Tooltip>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Account</Menu.Label>
        <Menu.Item
          leftSection={<IconUser size={16} />}
          disabled
        >
          <Text size="sm" fw={500}>
            {user?.email || 'User'}
          </Text>
        </Menu.Item>
        
        <Menu.Divider />
        
        <Menu.Item
          leftSection={<IconSettings size={16} />}
          onClick={openSettings}
        >
          API Settings
        </Menu.Item>
        
        <Menu.Item
          color="red"
          leftSection={<IconLogout size={16} />}
          onClick={() => signOut()}
        >
          Sign out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
} 