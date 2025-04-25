"use client";

import { AppShell, Button, Container, Group, Title, Text, Card, SimpleGrid } from '@mantine/core';
import { useState } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [opened, setOpened] = useState(false);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Title order={3}>NPL Telegram Admin</Title>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Group>
          <Title order={4}>Navigation</Title>
        </Group>
        <div style={{ marginTop: 20 }}>
          <Button variant="subtle" fullWidth component={Link} href="/">
            Dashboard
          </Button>
          <Button variant="subtle" fullWidth component={Link} href="/users">
            Users
          </Button>
          <Button variant="subtle" fullWidth component={Link} href="/workflows">
            Workflows
          </Button>
          <Button variant="subtle" fullWidth component={Link} href="/settings">
            Settings
          </Button>
        </div>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container>
          <Title my="lg">Dashboard</Title>
          
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
            <Card shadow="xs" padding="lg" radius="md" withBorder>
              <Title order={3}>0</Title>
              <Text>Active Users</Text>
            </Card>
            
            <Card shadow="xs" padding="lg" radius="md" withBorder>
              <Title order={3}>0</Title>
              <Text>Active Workflows</Text>
            </Card>
            
            <Card shadow="xs" padding="lg" radius="md" withBorder>
              <Title order={3}>0</Title>
              <Text>Pending Tasks</Text>
            </Card>
            
            <Card shadow="xs" padding="lg" radius="md" withBorder>
              <Title order={3}>0</Title>
              <Text>Completed Tasks</Text>
            </Card>
          </SimpleGrid>

          <Title order={2} mt="xl">Recent Activity</Title>
          <Card shadow="xs" padding="lg" radius="md" withBorder mt="md">
            <Text>No recent activity</Text>
          </Card>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
} 