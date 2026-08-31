import './globals.css';
import React from 'react';


export const metadata = {
  title: "UdyamAI",
  description: "AI-Powered Business Feasibility and Scheme Advisor",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}