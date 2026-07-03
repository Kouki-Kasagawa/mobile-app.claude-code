import type { ScheduleEntry, ScheduleTag } from '@/types/fatigue';
import type { ReactionTimeResult, StudySession, SubjectiveEntry } from '@/types/studyLog';

export interface ExportBundle {
  sessions: StudySession[];
  subjectiveEntries: SubjectiveEntry[];
  reactionResults: ReactionTimeResult[];
  activityEntries: ScheduleEntry[];
  activityTags: ScheduleTag[];
}

type CsvCell = string | number | boolean | null | undefined;

function csvEscape(value: CsvCell): string {
  if (value == null) return '';
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: CsvCell[][]): string {
  return rows.map(row => row.map(csvEscape).join(',')).join('\n');
}

export function buildSessionsCsv(bundle: ExportBundle): string {
  const header: CsvCell[] = [
    'id', 'userId', 'subject', 'startedAt', 'endedAt', 'durationMinutes',
    'interest', 'importance', 'hasDeadline', 'deadlineUrgency',
    'subjectivePreScore', 'subjectivePostScore',
    'reactionPreAvgMs', 'reactionPreAccuracy',
    'reactionPostAvgMs', 'reactionPostAccuracy',
    'plannedFor',
  ];
  const rows: CsvCell[][] = bundle.sessions.map(s => {
    const subjPre = bundle.subjectiveEntries.find(e => e.id === s.subjectivePreId);
    const subjPost = bundle.subjectiveEntries.find(e => e.id === s.subjectivePostId);
    const reactPre = bundle.reactionResults.find(r => r.id === s.reactionPreId);
    const reactPost = bundle.reactionResults.find(r => r.id === s.reactionPostId);
    return [
      s.id, s.userId, s.subject ?? '', s.startedAt, s.endedAt ?? '', s.durationMinutes,
      s.reward?.interest ?? '', s.reward?.importance ?? '', s.reward?.hasDeadline ?? '', s.reward?.deadlineUrgency ?? '',
      subjPre?.score ?? '', subjPost?.score ?? '',
      reactPre?.avgReactionMs ?? '', reactPre?.accuracy ?? '',
      reactPost?.avgReactionMs ?? '', reactPost?.accuracy ?? '',
      s.plannedFor ?? '',
    ];
  });
  return toCsv([header, ...rows]);
}

export function buildActivityCsv(bundle: ExportBundle): string {
  const header: CsvCell[] = ['id', 'tagId', 'tagName', 'axis', 'date', 'durationMinutes', 'source'];
  const rows: CsvCell[][] = bundle.activityEntries.map(e => {
    const tag = bundle.activityTags.find(t => t.id === e.tagId);
    return [e.id, e.tagId, tag?.name ?? '', tag?.axis ?? '', e.date, e.durationMinutes, e.source];
  });
  return toCsv([header, ...rows]);
}

export function buildExportJson(bundle: ExportBundle): string {
  return JSON.stringify(bundle, null, 2);
}
