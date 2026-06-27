import Link from 'next/link';
import { LayoutGrid, FileText, CheckSquare, Info, ClipboardCheck, ScanSearch } from 'lucide-react';
import styles from './home.module.css';

const SECTIONS = [
  {
    label: 'Оценка задачи',
    single: true,
    items: [
      {
        href: '/builder',
        icon: <LayoutGrid size={16} />,
        title: 'Билд и оценка ЭБ',
        desc: '4-шаговый визард: опросник, артефакты, оценка трудозатрат и итоговый отчёт',
      },
    ],
  },
  {
    label: 'Чек-листы',
    single: false,
    items: [
      {
        href: '/checklist/us',
        icon: <FileText size={16} />,
        title: 'User Story',
        desc: 'Критерии качества пользовательской истории',
      },
      {
        href: '/checklist/uc',
        icon: <CheckSquare size={16} />,
        title: 'Use Case',
        desc: 'Проверка варианта использования с обязательными критериями',
      },
      {
        href: '/checklist/ex',
        icon: <Info size={16} />,
        title: 'Экспертная оценка',
        desc: 'Экспертная проверка задачи перед проектированием',
      },
      {
        href: '/checklist/dq',
        icon: <ClipboardCheck size={16} />,
        title: 'Проверка макетов',
        desc: 'Качество макетов перед передачей в разработку',
      },
    ],
  },
  {
    label: 'Аудит',
    single: true,
    items: [
      {
        href: '/audit',
        icon: <ScanSearch size={16} />,
        title: 'ИИ-аудит задачи',
        desc: 'Автоматический анализ описания задачи через Claude AI с оценкой и рекомендациями',
      },
    ],
  },
];

export default function HomePage() {
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroTitle}>Husky Toolkit</div>
        <div className={styles.heroSub}>Инструмент дизайн-команды SimpleOne для оценки задач перед проектированием</div>
      </div>

      {SECTIONS.map(section => (
        <div key={section.label} className={styles.section}>
          <div className={styles.sectionLabel}>{section.label}</div>
          <div className={section.single ? styles.gridSingle : styles.grid}>
            {section.items.map(item => (
              <Link key={item.href} href={item.href} className={styles.card}>
                <div className={styles.cardIcon}>{item.icon}</div>
                <div>
                  <div className={styles.cardTitle}>{item.title}</div>
                  <div className={styles.cardDesc}>{item.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
