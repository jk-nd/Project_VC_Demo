import type { Metadata } from "next";
import { MantineProvider, createTheme } from "@mantine/core";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import '@mantine/core/styles.css';
import React from "react";

export const metadata: Metadata = {
  title: "NPL Telegram Admin",
  description: "Admin interface for NPL Telegram integration",
};

// Create a theme with your preferred colors and settings
const theme = createTheme({
  primaryColor: 'blue',
  defaultRadius: 'md',
});

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          <MantineProvider theme={theme}>
            {children}
          </MantineProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </body>
    </html>
  );
} 