import type { Metadata } from 'next';
import { Layout } from '@/components/layout/Layout';
import './globals.css';

export const metadata: Metadata = {
  title: 'Husky Toolkit',
  description: 'Инструмент оценки задач для дизайн-команды SimpleOne',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}