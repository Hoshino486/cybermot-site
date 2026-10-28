import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Download, TriangleAlert, WandSparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import i18n from '@/i18n';
import { useSoundEventStore } from '@/store/useSoundEventStore';
import { copyToClipboard } from '@/utils/clipboard';
import {
  MAX_BATCH_EVENTS,
  generateBatchCode,
  parseBatchInput,
  type BatchIssue,
} from '@/domain/batch/batch';

interface BatchGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TEXTAREA_CLASS =
  'w-full min-h-[220px] resize-y bg-transparent border border-gray-200 dark:border-gray-800 rounded-sm px-3 py-2 font-mono text-xs leading-relaxed text-gray-900 dark:text-gray-100 outline-hidden focus:border-black dark:focus:border-white transition-colors placeholder:text-gray-400';

const ACTION_CLASS =
  'h-8 px-3 inline-flex items-center justify-center gap-1.5 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded-sm font-mono text-xs font-medium transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed';

export const BatchGenerateModal: React.FC<BatchGenerateModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const enabledProperties = useSoundEventStore((s) => s.enabledProperties);
  const propertyValues = useSoundEventStore((s) => s.propertyValues);
  const customProperties = useSoundEventStore((s) => s.customProperties);
  const includeComments = useSoundEventStore((s) => s.includeComments);

  const [input, setInput] = useState('');
  const [prefix, setPrefix] = useState('');
  const [includeHeader, setIncludeHeader] = useState(false);
  const [result, setResult] = useState('');
  const [count, setCount] = useState(0);
  const [issues, setIssues] = useState<BatchIssue[]>([]);
  const [prefixInvalid, setPrefixInvalid] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 80);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const issueMessage = (issue: BatchIssue): string => {
    if (issue.code === 'tooMany') {
      return t('batch.tooMany', { max: MAX_BATCH_EVENTS });
    }
    return t(`batch.error_${issue.code}` as any, { line: issue.line });
  };

  const handleGenerate = () => {
    const parsed = parseBatchInput(input, prefix);
    setIssues(parsed.issues);
    setPrefixInvalid(parsed.prefixInvalid);

    if (parsed.prefixInvalid) {
      toast.error(t('batch.error_prefix'));
      setResult('');
      setCount(0);
      return;
    }

    if (parsed.rows.length === 0) {
      toast.error(t('batch.errorNoRows'));
      setResult('');
      setCount(0);
      return;
    }

    if (parsed.issues.length > 0) {
      toast.error(t('batch.errorLines', { count: parsed.issues.length }));
      setResult('');
      setCount(0);
      return;
    }

    const properties: Record<string, any> = {};
    for (const key of enabledProperties) {
      if (key in propertyValues) properties[key] = propertyValues[key];
    }

    try {
      const code = generateBatchCode(parsed.rows, {
        properties,
        customProperties,
        includeComments,
        includeHeader,
        commentLookup: (key) => {
          const tooltip = String(i18n.t(`tooltips.${key}`));
          if (tooltip && tooltip !== `tooltips.${key}`) return tooltip;
          const label = String(i18n.t(`labels.${key}`));
          if (label && label !== `labels.${key}`) return label;
          return undefined;
        },
      });

      setResult(code);
      setCount(parsed.rows.length);
      toast.success(t('batch.generated', { count: parsed.rows.length }));
    } catch {
      setResult('');
      setCount(0);
      toast.error(t('batch.generateFailed'));
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const ok = await copyToClipboard(result);
    if (ok) toast.success(t('batch.copied'));
    else toast.error(t('batch.copyFailed'));
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'soundevents_batch.vsndevts';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setInput('');
    setResult('');
    setIssues([]);
    setCount(0);
    setPrefixInvalid(false);
    inputRef.current?.focus();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="batch-modal-title"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-3 sm:p-6 backdrop-blur-xs"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-5xl max-h-[92dvh] flex flex-col bg-white dark:bg-[#0B0F17] border border-gray-300 dark:border-gray-700 shadow-2xl rounded-sm overflow-hidden">
        <header className="flex items-start justify-between gap-4 px-4 sm:px-5 py-3 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div className="min-w-0">
            <h2
              id="batch-modal-title"
              className="text-sm font-bold uppercase tracking-widest text-black dark:text-white flex items-center gap-2"
            >
              <span className="inline-block w-2 h-2 bg-black dark:bg-white" aria-hidden="true" />
              {t('batch.title')}
            </h2>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
              {t('batch.subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 inline-flex items-center justify-center border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded-sm transition-colors shrink-0"
            aria-label={t('batch.close')}
            title={t('batch.close')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto grid lg:grid-cols-2 gap-4 p-4 sm:p-5">
          <section className="flex flex-col gap-2 min-w-0">
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
              {t('batch.desc')}
            </p>

            <label
              htmlFor="batch-prefix"
              className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              {t('batch.prefixLabel')}
            </label>
            <input
              id="batch-prefix"
              type="text"
              value={prefix}
              onChange={(event) => setPrefix(event.target.value)}
              placeholder={t('batch.prefixPlaceholder')}
              className="h-8 w-full bg-transparent border border-gray-200 dark:border-gray-800 rounded-sm px-2.5 font-mono text-xs text-gray-900 dark:text-gray-100 outline-hidden focus:border-black dark:focus:border-white transition-colors placeholder:text-gray-400"
              spellCheck={false}
            />

            <label
              htmlFor="batch-input"
              className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              {t('batch.inputLabel')}
            </label>
            <textarea
              id="batch-input"
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t('batch.placeholder')}
              className={TEXTAREA_CLASS}
              spellCheck={false}
            />
            <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed">
              {t('batch.pathHint')}
            </p>

            <label className="inline-flex items-start gap-2 text-[11px] text-gray-600 dark:text-gray-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeHeader}
                onChange={(event) => setIncludeHeader(event.target.checked)}
                className="custom-checkbox mt-0.5"
              />
              <span>
                {t('batch.includeHeader')}
                <span className="block text-[10px] text-gray-400 dark:text-gray-500">
                  {t('batch.includeHeaderHint')}
                </span>
              </span>
            </label>

            {(prefixInvalid || issues.length > 0) && (
              <div className="border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/50 px-3 py-2 text-[11px] text-red-700 dark:text-red-300 leading-relaxed space-y-1">
                {prefixInvalid && <p>{t('batch.error_prefix')}</p>}
                {issues.slice(0, 8).map((issue, index) => (
                  <p key={`${issue.code}-${issue.line}-${index}`}>{issueMessage(issue)}</p>
                ))}
                {issues.length > 8 && <p>+{issues.length - 8}</p>}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-1">
              <button
                type="button"
                onClick={handleGenerate}
                className="h-8 px-3 inline-flex items-center justify-center gap-1.5 bg-black text-white dark:bg-white dark:text-black rounded-sm font-mono text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                <WandSparkles className="w-3.5 h-3.5" />
                {t('batch.generate')}
              </button>
              <button type="button" onClick={handleClear} className={ACTION_CLASS}>
                {t('batch.clear')}
              </button>
            </div>
          </section>

          <section className="flex flex-col gap-2 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('batch.resultLabel')}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                  {count > 0 ? t('batch.resultCount', { count }) : t('batch.resultEmpty')}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!result}
                  className={ACTION_CLASS}
                  title={t('batch.copy')}
                >
                  <Copy className="w-3.5 h-3.5" />
                  {t('batch.copy')}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!result}
                  className="h-8 px-3 inline-flex items-center justify-center gap-1.5 bg-black text-white dark:bg-white dark:text-black rounded-sm font-mono text-xs font-medium transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                  title={t('batch.download')}
                >
                  <Download className="w-3.5 h-3.5" />
                  {t('batch.download')}
                </button>
              </div>
            </div>

            <textarea
              value={result}
              readOnly
              spellCheck={false}
              placeholder={t('batch.resultEmpty')}
              className={`${TEXTAREA_CLASS} flex-1 min-h-[260px] bg-gray-50/60 dark:bg-gray-950/40`}
            />

            {issues.length > 0 && !prefixInvalid && (
              <p className="inline-flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400">
                <TriangleAlert className="w-3 h-3" />
                {t('batch.errorLines', { count: issues.length })}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
