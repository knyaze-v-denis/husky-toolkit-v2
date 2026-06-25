import type { Metadata } from 'next';
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
      <body>{children}</body>
    </html>
  );
}