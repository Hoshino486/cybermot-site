import {
  KV3_HEADER,
  normalizeVsndPath,
  serializeSoundEvent,
} from '@/domain/kv3/serializer';

export const MAX_BATCH_EVENTS = 200;

const NAME_PATTERN = /^[A-Za-z0-9_.-]+$/;
const PATH_FORBIDDEN_PATTERN = /["\r\n{}]/;

export type BatchIssueCode =
  | 'emptyName'
  | 'invalidName'
  | 'duplicate'
  | 'invalidPath'
  | 'tooMany';

export interface BatchIssue {
  line: number;
  code: BatchIssueCode;
}

export interface BatchRow {
  line: number;
  name: string;
  path?: string;
}

export interface BatchParseResult {
  rows: BatchRow[];
  issues: BatchIssue[];
  prefixInvalid: boolean;
}

/**
 * Parses one event per line. Supported formats:
 *   Event.Name
 *   Event.Name | path/to/file.vsnd
 *   Event.Name <TAB> path/to/file.vsnd
 *
 * Empty lines and lines starting with # are ignored.
 */
export function parseBatchInput(text: string, prefix = ''): BatchParseResult {
  const rows: BatchRow[] = [];
  const issues: BatchIssue[] = [];
  const seen = new Set<string>();
  const cleanPrefix = prefix.trim().replace(/\.+$/, '');
  const prefixInvalid = Boolean(cleanPrefix) && !NAME_PATTERN.test(cleanPrefix);

  if (prefixInvalid) {
    return { rows, issues, prefixInvalid };
  }

  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index] ?? '';
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    if (rows.length >= MAX_BATCH_EVENTS) {
      issues.push({ line: 0, code: 'tooMany' });
      break;
    }

    let name = line;
    let path: string | undefined;
    const separator = line.search(/[|\t]/);
    if (separator >= 0) {
      name = line.slice(0, separator).trim();
      const rawPath = line.slice(separator + 1).trim();
      path = rawPath || undefined;
    }

    const lineNo = index + 1;
    if (!name) {
      issues.push({ line: lineNo, code: 'emptyName' });
      continue;
    }

    const fullName = cleanPrefix ? `${cleanPrefix}.${name}` : name;
    if (!NAME_PATTERN.test(fullName)) {
      issues.push({ line: lineNo, code: 'invalidName' });
      continue;
    }

    const dedupeKey = fullName.toLowerCase();
    if (seen.has(dedupeKey)) {
      issues.push({ line: lineNo, code: 'duplicate' });
      continue;
    }

    if (path && PATH_FORBIDDEN_PATTERN.test(path)) {
      issues.push({ line: lineNo, code: 'invalidPath' });
      continue;
    }

    seen.add(dedupeKey);
    rows.push({ line: lineNo, name: fullName, path });
  }

  return { rows, issues, prefixInvalid };
}

export interface BatchGenerateOptions {
  properties: Record<string, any>;
  customProperties: Record<string, any>;
  includeComments: boolean;
  includeHeader: boolean;
  commentLookup?: (key: string) => string | undefined;
}

/**
 * Clones the current visual configuration for every row and serializes the
 * resulting SoundEvent blocks into one pasteable KV3 document fragment.
 */
export function generateBatchCode(rows: BatchRow[], options: BatchGenerateOptions): string {
  const blocks = rows.map((row) => {
    const properties: Record<string, any> = { ...options.properties };
    if (row.path) {
      properties.vsnd_files_track_01 = [normalizeVsndPath(row.path)];
    }

    return serializeSoundEvent(row.name, properties, {
      includeComments: options.includeComments,
      customProperties: options.customProperties,
      commentLookup: options.commentLookup,
    });
  });

  const body = blocks.join('\n\n');
  return options.includeHeader ? `${KV3_HEADER}\n\n${body}` : body;
}
