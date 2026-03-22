import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NextFlow — LLM Workflow Builder',
  description: 'Visual LLM workflow builder powered by Gemini and Trigger.dev',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "'Geist', -apple-system, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
