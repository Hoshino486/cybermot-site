import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ListPlus, Moon, Sun } from 'lucide-react';
import { useSoundEventStore } from '@/store/useSoundEventStore';
import { BatchGenerateModal } from '@/components/batch/BatchGenerateModal';

const HEADER_ACTION_CLASS =
  'h-7 px-2.5 inline-flex items-center justify-center gap-1.5 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded-sm font-mono text-xs font-medium text-black dark:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer no-underline';

export const HeaderBar: React.FC = () => {
  const { t } = useTranslation();
  const lang = useSoundEventStore((s) => s.lang);
  const theme = useSoundEventStore((s) => s.theme);
  const setLang = useSoundEventStore((s) => s.setLang);
  const setTheme = useSoundEventStore((s) => s.setTheme);
  const [isBatchOpen, setIsBatchOpen] = useState(false);

  const handleLangToggle = () => {
    const next = lang === 'zh' ? 'en' : 'zh';
    setLang(next);
  };

  const handleThemeToggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <>
      <header className="min-h-[calc(3.5rem+env(safe-area-inset-top,0px))] pt-[calc(0.5rem+env(safe-area-inset-top,0px))] pb-2 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-[#0B0F17]/90 backdrop-blur-sm sticky top-0 z-40 pl-[calc(1rem+env(safe-area-inset-left,0px))] pr-[calc(1rem+env(safe-area-inset-right,0px))] lg:px-6 flex items-center justify-between shrink-0">
        {/* Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <a
            href="/toolbox"
            target="_top"
            className="h-7 w-7 inline-flex items-center justify-center border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors shrink-0"
            title="返回 CyberMot 工具列表"
            aria-label="返回 CyberMot 工具列表"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
          <h1 className="text-xs font-bold uppercase tracking-widest text-black dark:text-white flex items-center gap-2 whitespace-nowrap m-0 font-sans">
            <span className="inline-block w-2 h-2 bg-black dark:bg-white rounded-none" aria-hidden="true" />
            CS2 SOUNDEVENT
          </h1>
        </div>

        {/* Preferences: [Batch] [EN/中文] [Theme] */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setIsBatchOpen(true)}
            className={HEADER_ACTION_CLASS}
            title={t('batch.open')}
            aria-label={t('batch.open')}
          >
            <ListPlus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">{t('batch.open')}</span>
          </button>

          {/* Language Toggle Button */}
          <button
            type="button"
            onClick={handleLangToggle}
            className={HEADER_ACTION_CLASS}
            title={t('ui.langToggle')}
            aria-label={t('ui.langToggle')}
          >
            {lang === 'zh' ? 'EN' : '中文'}
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={handleThemeToggle}
            className={HEADER_ACTION_CLASS}
            title={t('ui.themeToggle')}
            aria-label={t('ui.themeToggle')}
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <Moon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      <BatchGenerateModal isOpen={isBatchOpen} onClose={() => setIsBatchOpen(false)} />
    </>
  );
};
