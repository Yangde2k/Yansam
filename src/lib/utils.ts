import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MOOD_OPTIONS, type MoodKind } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value?: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return 'Not set yet';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  }).format(new Date(value));
}

export function formatRelativeDate(value?: string | null) {
  if (!value) return '';
  const target = new Date(value).getTime();
  const diffDays = Math.round((target - Date.now()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1) return `In ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
}

export function getMoodMeta(mood?: MoodKind | null) {
  return MOOD_OPTIONS.find((item) => item.value === mood) ?? MOOD_OPTIONS[0];
}

export function getInitials(name?: string | null) {
  if (!name) return 'Y';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function reorderBySwap<T extends { id: string; position: number }>(items: T[], id: string, direction: -1 | 1) {
  const sorted = [...items].sort((a, b) => a.position - b.position);
  const index = sorted.findIndex((item) => item.id === id);
  const targetIndex = index + direction;

  if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return sorted;

  const current = sorted[index];
  const target = sorted[targetIndex];
  const next = [...sorted];
  next[index] = { ...target, position: current.position };
  next[targetIndex] = { ...current, position: target.position };
  return next;
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function isUnlocked(unlockType: string, unlockDate?: string | null) {
  if (unlockType === 'manual') return true;
  if (!unlockDate) return false;
  return new Date(unlockDate).getTime() <= Date.now();
}

export function quoteOfTheDay(quotes: string[]) {
  const daySeed = Number(new Date().toISOString().slice(8, 10));
  return quotes[daySeed % quotes.length];
}

export function sanitizeFilename(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
}

export function getSafeExternalUrl(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    return new URL(normalized).toString();
  } catch (_error) {
    return null;
  }
}

export function isDirectAudioUrl(value?: string | null) {
  const safeUrl = getSafeExternalUrl(value);
  if (!safeUrl) return false;

  const pathname = new URL(safeUrl).pathname.toLowerCase();
  return ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.webm'].some((ext) => pathname.endsWith(ext));
}

export function getExternalAudioLabel(value?: string | null) {
  const safeUrl = getSafeExternalUrl(value);
  if (!safeUrl) return 'Open song';

  const hostname = new URL(safeUrl).hostname.toLowerCase();

  if (hostname.includes('spotify')) return 'Open in Spotify';
  if (hostname.includes('youtube') || hostname.includes('youtu.be')) return 'Open in YouTube';
  if (hostname.includes('music.apple')) return 'Open in Apple Music';
  if (hostname.includes('soundcloud')) return 'Open in SoundCloud';

  return 'Open song';
}
