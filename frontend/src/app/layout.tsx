import './globals.css';
import React from 'react';
import AuthProvider from '@/components/auth/AuthProvider';
import ChatWidget from '@/components/chat/ChatWidget';
import LanguageProvider from '@/components/i18n/LanguageProvider';
import ThemeProvider from '@/components/theme/ThemeProvider';

export const metadata = {
  title: "UdyamAI — Rural FinTech & Business Feasibility Platform",
  description: "AI-Powered Business Feasibility, Rural Finance & Government Scheme Intelligence",
  icons: {
    icon: "/logo-icon.svg",
    apple: "/logo-icon.svg",
  },
};

const themeScript = `
  (function() {
    try {
      var stored = localStorage.getItem('udyam_theme');
      var isDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      }
    } catch(e) {}
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              {children}
              <ChatWidget />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
