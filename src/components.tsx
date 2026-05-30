import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import type { ButtonHTMLAttributes, ComponentType, InputHTMLAttributes, PropsWithChildren, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  Heart,
  Home,
  Image,
  LetterText,
  LoaderCircle,
  Lock,
  Music4,
  Plus,
  Sparkles,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import type { Album, CoupleSpace, Letter, Memory, Milestone, MoodKind, Photo, Profile } from './types';
import { MOOD_OPTIONS } from './types';
import { cn, formatDate, formatRelativeDate, getExternalAudioLabel, getInitials, getMoodMeta, getSafeExternalUrl, isDirectAudioUrl, isUnlocked } from './lib/utils';
import { useUIStore } from './store/ui';

export function Button({ className, children, ...props }: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl bg-wine px-4 py-3 text-sm font-medium text-white shadow-soft transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({ className, children, ...props }: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl border border-white/50 bg-white/40 px-4 py-3 text-sm font-medium text-wine shadow-soft backdrop-blur-md transition hover:bg-white/60 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn('w-full rounded-2xl border border-white/60 bg-white/65 px-4 py-3 text-sm text-wine outline-none ring-0 placeholder:text-cocoa/70 focus:border-rose focus:bg-white/85', className)}
      {...props}
    />
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn('min-h-[120px] w-full rounded-2xl border border-white/60 bg-white/65 px-4 py-3 text-sm text-wine outline-none placeholder:text-cocoa/70 focus:border-rose focus:bg-white/85', className)}
      {...props}
    />
  );
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn('w-full rounded-2xl border border-white/60 bg-white/65 px-4 py-3 text-sm text-wine outline-none focus:border-rose focus:bg-white/85', className)}
      {...props}
    />
  );
});

export function GlassCard({ className, children }: PropsWithChildren<{ className?: string }>) {
  return <div className={cn('rounded-[28px] border border-white/50 bg-white/45 p-5 shadow-glow backdrop-blur-xl', className)}>{children}</div>;
}

export function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <p className="font-serif text-2xl text-wine">{title}</p>
        {subtitle ? <p className="mt-1 text-sm text-cocoa/75">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function PageIntro({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] border border-white/40 bg-white/35 p-5 shadow-soft backdrop-blur-xl">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cocoa/55">Private for two</p>
          <p className="mt-2 font-serif text-3xl text-wine">{title}</p>
          <p className="mt-2 text-sm leading-7 text-cocoa/75">{subtitle}</p>
        </div>
        {action}
      </div>
    </motion.div>
  );
}

export function SectionSkeleton({ title = 'Loading softly…', rows = 3 }: { title?: string; rows?: number }) {
  return (
    <GlassCard>
      <div className="animate-pulse space-y-4">
        <div>
          <div className="h-3 w-24 rounded-full bg-white/65" />
          <div className="mt-3 h-8 w-44 rounded-full bg-white/70" />
          <div className="mt-3 h-4 w-full max-w-xs rounded-full bg-white/60" />
        </div>
        <p className="text-sm text-cocoa/70">{title}</p>
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="rounded-3xl bg-white/55 p-4">
              <div className="h-4 w-32 rounded-full bg-white/70" />
              <div className="mt-3 h-3 w-full rounded-full bg-white/55" />
              <div className="mt-2 h-3 w-3/4 rounded-full bg-white/55" />
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

export function EmptyState({ icon: Icon = Heart, title, body, action }: { icon?: ComponentType<{ className?: string }>; title: string; body: string; action?: ReactNode }) {
  return (
    <GlassCard className="text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/70 text-wine">
        <Icon className="h-5 w-5" />
      </div>
      <p className="font-serif text-xl text-wine">{title}</p>
      <p className="mt-2 text-sm text-cocoa/75">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </GlassCard>
  );
}

export function Modal({ open, title, onClose, children }: PropsWithChildren<{ open: boolean; title?: string; onClose: () => void }>) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-wine/20 p-4 backdrop-blur-sm sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="max-h-[92vh] w-full max-w-lg overflow-auto rounded-[32px] border border-white/60 bg-ivory/95 p-5 shadow-glow">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="font-serif text-2xl text-wine">{title}</p>
              <button className="rounded-full bg-white/70 p-2 text-wine" onClick={onClose}>
                <X className="h-4 w-4" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function ConfirmationDialog({ open, title, body, confirmLabel = 'Confirm', onClose, onConfirm }: { open: boolean; title: string; body: string; confirmLabel?: string; onClose: () => void; onConfirm: () => void | Promise<void> }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-cocoa/80">{body}</p>
      <div className="mt-5 flex gap-3">
        <GhostButton className="flex-1" onClick={onClose}>
          Cancel
        </GhostButton>
        <Button className="flex-1" onClick={() => void onConfirm()}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export function ToastSystem() {
  const { toasts, removeToast } = useUIStore();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.button
            key={toast.id}
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            onClick={() => removeToast(toast.id)}
            className={cn(
              'pointer-events-auto w-full max-w-md rounded-2xl border px-4 py-3 text-left shadow-soft backdrop-blur-xl',
              toast.tone === 'success' && 'border-emerald-200 bg-emerald-50/90 text-emerald-900',
              toast.tone === 'error' && 'border-red-200 bg-red-50/90 text-red-900',
              (!toast.tone || toast.tone === 'default') && 'border-white/60 bg-white/80 text-wine',
            )}
          >
            <p className="font-medium">{toast.title}</p>
            {toast.description ? <p className="mt-1 text-sm opacity-80">{toast.description}</p> : null}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function LoadingScreen({ label = 'Preparing your sanctuary…' }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-romance-gradient px-6">
      <GlassCard className="w-full max-w-sm text-center">
        <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-wine" />
        <p className="mt-4 font-serif text-2xl text-wine">YANSAM</p>
        <p className="mt-2 text-sm text-cocoa/80">{label}</p>
      </GlassCard>
    </div>
  );
}

export function ErrorFallback({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <EmptyState
        icon={Sparkles}
        title="Something soft needs a retry"
        body={message ?? 'A gentle refresh should bring everything back.'}
        action={onRetry ? <Button onClick={onRetry}>Try again</Button> : undefined}
      />
    </div>
  );
}

export function HiddenReveal({ title, message, buttonLabel = 'Reveal', className }: { title: string; message: string; buttonLabel?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <GlassCard className={cn('overflow-hidden', className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-serif text-xl text-wine">{title}</p>
          <p className="text-sm text-cocoa/70">A little hidden tenderness.</p>
        </div>
        <GhostButton onClick={() => setOpen((value) => !value)}>
          <Sparkles className="h-4 w-4" /> {open ? 'Hide' : buttonLabel}
        </GhostButton>
      </div>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 overflow-hidden rounded-2xl bg-white/60 p-4 text-sm leading-7 text-cocoa/85">
            {message}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </GlassCard>
  );
}

export function MoodPicker({ value, onChange }: { value?: MoodKind; onChange: (value: MoodKind) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {MOOD_OPTIONS.map((mood) => (
        <button key={mood.value} type="button" onClick={() => onChange(mood.value)} className={cn('rounded-2xl border border-white/60 bg-white/55 p-3 text-left shadow-soft transition hover:-translate-y-0.5', value === mood.value && 'border-rose bg-white/85 ring-2 ring-rose/40')}>
          <p className="text-xl">{mood.emoji}</p>
          <p className="mt-2 text-sm font-medium text-wine">{mood.label}</p>
        </button>
      ))}
    </div>
  );
}

export function MobileFilePicker({ label = 'Choose photos', helper = 'Uses the native gallery / file picker.', multiple = false, onFiles, previewUrls = [], loading = false }: { label?: string; helper?: string; multiple?: boolean; onFiles: (files: File[]) => void; previewUrls?: string[]; loading?: boolean }) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="space-y-3 rounded-3xl border border-dashed border-white/60 bg-white/40 p-4 backdrop-blur-xl">
      <button type="button" onClick={() => inputRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/80 px-4 py-3 text-sm font-medium text-wine shadow-soft">
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length) onFiles(files);
          event.currentTarget.value = '';
        }}
      />
      <p className="text-xs text-cocoa/70">{helper}</p>
      {previewUrls.length ? (
        <div className="grid grid-cols-3 gap-2">
          {previewUrls.map((src) => (
            <img key={src} src={src} alt="preview" className="aspect-square rounded-2xl object-cover" />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function UploadDropzone({ onFiles, previewUrls = [], loading = false }: { onFiles: (files: File[]) => void; previewUrls?: string[]; loading?: boolean }) {
  const [dragging, setDragging] = useState(false);
  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        const files = Array.from(event.dataTransfer.files ?? []).filter((file) => file.type.startsWith('image/'));
        if (files.length) onFiles(files);
      }}
      className={cn('rounded-3xl border border-dashed bg-white/35 p-2 transition', dragging ? 'border-rose bg-white/60' : 'border-white/60')}
    >
      <MobileFilePicker label="Upload from gallery" helper="No forced camera capture. Fast preview, stable upload." multiple onFiles={onFiles} previewUrls={previewUrls} loading={loading} />
    </div>
  );
}

export function AmbientAudioPlayer({ src }: { src?: string | null }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.65);
  const safeUrl = getSafeExternalUrl(src);
  const directAudio = isDirectAudioUrl(src);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !directAudio) return;

    let interval: number | undefined;
    if (playing) {
      void audio.play().catch(() => setPlaying(false));
      let step = 0;
      interval = window.setInterval(() => {
        step += 1;
        audio.volume = Math.min(volume, (volume / 6) * step);
        if (step >= 6 && interval) window.clearInterval(interval);
      }, 120);
    } else {
      const start = audio.volume;
      let step = 0;
      interval = window.setInterval(() => {
        step += 1;
        const next = Math.max(0, start - (start / 6) * step);
        audio.volume = next;
        if (step >= 6) {
          window.clearInterval(interval);
          audio.pause();
          audio.volume = volume;
        }
      }, 120);
    }

    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [directAudio, playing, volume]);

  if (!safeUrl) return null;

  if (!directAudio) {
    return (
      <GlassCard className="mt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 text-wine">
            <Music4 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-wine">Memory soundtrack</p>
            <p className="text-xs text-cocoa/70">This link opens externally because it is not a direct audio file.</p>
          </div>
          <GhostButton onClick={() => window.open(safeUrl, '_blank', 'noopener,noreferrer')}>
            {getExternalAudioLabel(safeUrl)}
          </GhostButton>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="mt-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 text-wine">
          <Music4 className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-wine">Memory soundtrack</p>
          <p className="text-xs text-cocoa/70">Direct audio links will play inside YANSAM with a soft fade.</p>
        </div>
        <GhostButton onClick={() => setPlaying((value) => !value)}>{playing ? 'Pause' : 'Play'}</GhostButton>
      </div>
      <input className="mt-4 w-full accent-wine" type="range" min={0} max={1} step={0.05} value={volume} onChange={(event) => setVolume(Number(event.target.value))} />
      <audio ref={audioRef} src={safeUrl} preload="none" loop />
    </GlassCard>
  );
}

export function MemoryCard({ memory, onEdit, onDelete, onToggleFavorite, onTogglePin }: { memory: Memory; onEdit?: (memory: Memory) => void; onDelete?: (memory: Memory) => void; onToggleFavorite?: (memory: Memory) => void; onTogglePin?: (memory: Memory) => void }) {
  const mood = getMoodMeta(memory.mood);
  return (
    <motion.div layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard className="overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-cocoa/60">
              <span>{mood.emoji}</span>
              <span>{mood.label}</span>
            </div>
            <p className="mt-2 font-serif text-2xl text-wine">{memory.title}</p>
            <p className="mt-1 text-xs text-cocoa/65">{formatDate(memory.memory_date ?? memory.created_at)} • {memory.pinned ? 'Pinned' : 'Memory'}</p>
          </div>
          <div className="flex gap-2">
            <button className={cn('rounded-full p-2', memory.favorite ? 'bg-rose text-white' : 'bg-white/75 text-wine')} onClick={() => onToggleFavorite?.(memory)}>
              <Heart className="h-4 w-4" fill={memory.favorite ? 'currentColor' : 'none'} />
            </button>
            <button className={cn('rounded-full p-2', memory.pinned ? 'bg-wine text-white' : 'bg-white/75 text-wine')} onClick={() => onTogglePin?.(memory)}>
              <Sparkles className="h-4 w-4" />
            </button>
          </div>
        </div>
        {memory.photo_src ? <img src={memory.photo_src} alt={memory.title} className="mt-4 h-60 w-full rounded-[24px] object-cover" /> : null}
        <p className="mt-4 text-sm leading-7 text-cocoa/85">{memory.body}</p>
        {memory.music_url ? <AmbientAudioPlayer src={memory.music_url} /> : null}
        <div className="mt-4 flex gap-2">
          <GhostButton className="flex-1" onClick={() => onEdit?.(memory)}>Edit</GhostButton>
          <GhostButton className="flex-1" onClick={() => onDelete?.(memory)}><Trash2 className="h-4 w-4" /> Delete</GhostButton>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export function AlbumGrid({ albums, search, onSelect, onRename, onDelete }: { albums: Album[]; search?: string; onSelect: (album: Album) => void; onRename?: (album: Album) => void; onDelete?: (album: Album) => void }) {
  const filtered = useMemo(() => albums.filter((album) => album.title.toLowerCase().includes((search ?? '').toLowerCase())), [albums, search]);

  if (!filtered.length) {
    return <EmptyState icon={Image} title="No albums yet" body="Create your first photo sanctuary and fill it with memories." />;
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {filtered.map((album) => (
        <motion.button key={`${album.id}-${album.cover_src ?? 'empty'}`} layout onClick={() => onSelect(album)} className="text-left">
          <GlassCard className="overflow-hidden p-0">
            <div className="relative aspect-square bg-white/50">
              {album.cover_src ? (
                <img src={album.cover_src} alt={album.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-cocoa/55">
                  <Image className="h-10 w-10" />
                </div>
              )}
              <div className="absolute inset-x-3 bottom-3 flex gap-2">
                <GhostButton className="flex-1 bg-white/80 text-xs" onClick={(event) => { event.stopPropagation(); onRename?.(album); }}>Rename</GhostButton>
                <GhostButton className="bg-white/80 px-3" onClick={(event) => { event.stopPropagation(); onDelete?.(album); }}>
                  <Trash2 className="h-4 w-4" />
                </GhostButton>
              </div>
            </div>
            <div className="p-4">
              <p className="font-serif text-xl text-wine">{album.title}</p>
              <p className="text-xs text-cocoa/65">{album.photos?.length ?? 0} photos • {formatRelativeDate(album.created_at)}</p>
            </div>
          </GlassCard>
        </motion.button>
      ))}
    </div>
  );
}

export function TimelineRail({ milestones, onEdit, onDelete, onMove }: { milestones: Milestone[]; onEdit?: (item: Milestone) => void; onDelete?: (item: Milestone) => void; onMove?: (item: Milestone, direction: -1 | 1) => void }) {
  if (!milestones.length) {
    return <EmptyState icon={CalendarDays} title="Your timeline is waiting" body="Add the first conversation, first call, and every milestone after that." />;
  }

  return (
    <div className="relative ml-3 border-l border-rose/35 pl-6">
      {milestones.map((item, index) => (
        <motion.div key={item.id} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} className="relative mb-5">
          <span className="absolute -left-[31px] top-5 h-4 w-4 rounded-full border-4 border-ivory bg-rose" />
          <GlassCard>
            <p className="text-xs uppercase tracking-[0.24em] text-cocoa/60">{item.type}</p>
            <p className="mt-1 font-serif text-xl text-wine">{item.title}</p>
            <p className="mt-2 text-sm text-cocoa/75">{formatDate(item.date)} • {formatRelativeDate(item.date)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <GhostButton onClick={() => onMove?.(item, -1)} disabled={index === 0}>Up</GhostButton>
              <GhostButton onClick={() => onMove?.(item, 1)} disabled={index === milestones.length - 1}>Down</GhostButton>
              <GhostButton onClick={() => onEdit?.(item)}>Edit</GhostButton>
              <GhostButton onClick={() => onDelete?.(item)}><Trash2 className="h-4 w-4" /> Delete</GhostButton>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}

export function LoveLetterCard({ letter, onOpen, onEdit, onDelete }: { letter: Letter; onOpen?: (letter: Letter) => void; onEdit?: (letter: Letter) => void; onDelete?: (letter: Letter) => void }) {
  const unlocked = isUnlocked(letter.unlock_type, letter.unlock_date);
  return (
    <motion.div layout whileHover={{ y: -2 }}>
      <GlassCard>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-serif text-2xl text-wine">{letter.title}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.24em] text-cocoa/60">{letter.unlock_type.replace('_', ' ')}</p>
          </div>
          <div className={cn('rounded-full p-2', unlocked ? 'bg-white/75 text-wine' : 'bg-wine text-white')}>
            {unlocked ? <LetterText className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          </div>
        </div>
        <div className="mt-4 rounded-[26px] bg-white/60 p-4">
          {unlocked ? (
            <AnimatePresence mode="wait">
              <motion.div key={letter.opened ? 'open' : 'closed'} initial={{ rotateX: -14, opacity: 0.7 }} animate={{ rotateX: 0, opacity: 1 }} className="space-y-3">
                <p className="text-sm leading-7 text-cocoa/85">{letter.opened ? letter.body : 'Tap open to unfold this private letter.'}</p>
                <Button className="w-full" onClick={() => onOpen?.(letter)}>{letter.opened ? 'Read again' : 'Open letter'}</Button>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div>
              <p className="text-sm text-cocoa/75">Locked until {letter.unlock_date ? formatDate(letter.unlock_date) : 'the right moment'}.</p>
            </div>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <GhostButton className="flex-1" onClick={() => onEdit?.(letter)}>Edit</GhostButton>
          <GhostButton className="flex-1" onClick={() => onDelete?.(letter)}><Trash2 className="h-4 w-4" /> Delete</GhostButton>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export function AnniversaryHero({ profile, coupleSpace, nextMilestone }: { profile: Profile | null; coupleSpace: CoupleSpace | null; nextMilestone?: Milestone | null }) {
  return (
    <GlassCard className="relative overflow-hidden">
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-rose/20 blur-2xl" />
      <div className="absolute -left-6 bottom-0 h-24 w-24 rounded-full bg-beige/30 blur-2xl" />
      <p className="text-xs uppercase tracking-[0.3em] text-cocoa/55">Welcome to YANSAM</p>
      <p className="mt-3 max-w-xs font-serif text-3xl leading-tight text-wine">Hello, {profile?.name ?? 'love'} — your private emotional home is ready.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl bg-white/55 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-cocoa/60">Anniversary</p>
          <p className="mt-2 text-lg font-medium text-wine">{coupleSpace?.anniversary_date ? formatDate(coupleSpace.anniversary_date) : 'Choose your date in Settings'}</p>
        </div>
        <div className="rounded-3xl bg-white/55 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-cocoa/60">Coming up</p>
          <p className="mt-2 text-lg font-medium text-wine">{nextMilestone ? nextMilestone.title : 'Add a milestone'}</p>
          <p className="text-sm text-cocoa/70">{nextMilestone ? formatRelativeDate(nextMilestone.date) : 'Your shared timeline awaits.'}</p>
        </div>
      </div>
    </GlassCard>
  );
}

const navItems = [
  { to: '/app/home', label: 'Home', icon: Home },
  { to: '/app/memories', label: 'Diary', icon: Heart },
  { to: '/app/gallery', label: 'Gallery', icon: Image },
  { to: '/app/letters', label: 'Letters', icon: LetterText },
  { to: '/app/future', label: 'Future', icon: Target },
];

export function FloatingNav() {
  return (
    <div className="fixed inset-x-0 bottom-4 z-40 px-4">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-2 rounded-[28px] border border-white/50 bg-white/60 p-2 shadow-glow backdrop-blur-xl">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn('flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] transition', isActive ? 'bg-wine text-white shadow-soft' : 'text-cocoa/80')}
          >
            <item.icon className="h-4 w-4" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export function QuickLinkCard({ to, icon: Icon, title, body }: { to: string; icon: ComponentType<{ className?: string }>; title: string; body: string }) {
  return (
    <Link to={to} className="block">
      <GlassCard className="h-full">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 text-wine">
          <Icon className="h-5 w-5" />
        </div>
        <p className="mt-4 font-serif text-xl text-wine">{title}</p>
        <p className="mt-2 text-sm text-cocoa/70">{body}</p>
        <div className="mt-4 inline-flex items-center gap-2 text-sm text-wine">
          Open <ChevronRight className="h-4 w-4" />
        </div>
      </GlassCard>
    </Link>
  );
}

export function AppShell({ profile }: { profile: Profile | null }) {
  const location = useLocation();
  const setLastRoute = useUIStore((state) => state.setLastRoute);

  useEffect(() => {
    if (location.pathname.startsWith('/app')) setLastRoute(location.pathname);
  }, [location.pathname, setLastRoute]);

  return (
    <div className="min-h-screen bg-romance-gradient pb-28 text-wine">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-0 top-20 h-44 w-44 rounded-full bg-rose/20 blur-3xl animate-pulse-glow" />
        <div className="absolute right-0 top-40 h-52 w-52 rounded-full bg-beige/25 blur-3xl animate-float" />
        <div className="absolute bottom-16 left-10 h-36 w-36 rounded-full bg-white/35 blur-3xl animate-pulse-glow" />
      </div>
      <header className="sticky top-0 z-30 border-b border-white/35 bg-ivory/55 backdrop-blur-xl">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cocoa/60">YANSAM</p>
            <p className="font-serif text-2xl">{location.pathname.includes('/app/home') ? 'Welcome home' : 'Private for two'}</p>
          </div>
          <Link to="/app/settings" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-sm font-semibold text-wine shadow-soft">
            {getInitials(profile?.name)}
          </Link>
        </div>
      </header>
      <main className="relative mx-auto flex min-h-[calc(100vh-120px)] max-w-xl flex-col gap-5 px-4 py-5">
        <Outlet />
      </main>
      <FloatingNav />
    </div>
  );
}

export function AuthHero({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8 text-center">
      <p className="text-xs uppercase tracking-[0.35em] text-cocoa/60">YANSAM</p>
      <h1 className="mt-4 font-serif text-4xl text-wine">{title}</h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-cocoa/75">{subtitle}</p>
    </div>
  );
}

export function AuthFrame({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-romance-gradient px-4 py-8">
      <div className="mx-auto max-w-md">
        {children}
      </div>
    </div>
  );
}

export function AppLockScreen({
  open,
  onUnlock,
  onSignOut,
}: {
  open: boolean;
  onUnlock: (passcode: string) => boolean;
  onSignOut: () => void;
}) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setPasscode('');
      setError('');
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-wine/25 px-4 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            className="w-full max-w-sm rounded-[32px] border border-white/60 bg-ivory/95 p-6 text-center shadow-glow"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/80 text-wine shadow-soft">
              <Lock className="h-7 w-7" />
            </div>
            <p className="mt-4 text-xs uppercase tracking-[0.3em] text-cocoa/55">Private for two</p>
            <p className="mt-3 font-serif text-3xl text-wine">Unlock YANSAM</p>
            <p className="mt-2 text-sm leading-7 text-cocoa/75">Your sanctuary is protected with a local passcode before anyone can enter.</p>
            <div className="mt-5 space-y-3">
              <Input
                type="password"
                inputMode="numeric"
                autoFocus
                placeholder="Enter passcode"
                value={passcode}
                onChange={(event) => {
                  setPasscode(event.target.value);
                  if (error) setError('');
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    const unlocked = onUnlock(passcode);
                    if (!unlocked) setError('That passcode does not match.');
                  }
                }}
              />
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <Button
                className="w-full"
                onClick={() => {
                  const unlocked = onUnlock(passcode);
                  if (!unlocked) setError('That passcode does not match.');
                }}
              >
                Unlock
              </Button>
              <GhostButton className="w-full" onClick={onSignOut}>
                Sign out instead
              </GhostButton>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function PhotoStrip({ photos, onOpen, onDelete, onSetCover, onMove, albums }: { photos: Photo[]; onOpen: (photo: Photo) => void; onDelete?: (photo: Photo) => void; onSetCover?: (photo: Photo) => void; onMove?: (photo: Photo, targetAlbumId: string) => void; albums?: Album[] }) {
  if (!photos.length) {
    return <EmptyState icon={Camera} title="Empty album" body="Upload your first photo and it will appear instantly here." />;
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {photos.map((photo) => (
        <div key={`${photo.id}-${photo.src ?? photo.url}`} className="space-y-2 rounded-[28px] border border-white/45 bg-white/35 p-2 shadow-soft backdrop-blur-xl">
          <button type="button" className="block w-full" onClick={() => onOpen(photo)}>
            <img src={photo.src ?? ''} alt="Album memory" className="aspect-square w-full rounded-[22px] object-cover" />
          </button>
          <div className="flex gap-2">
            <GhostButton className="flex-1 px-2 py-2 text-xs" onClick={() => onSetCover?.(photo)}><Check className="h-3.5 w-3.5" /> Cover</GhostButton>
            <GhostButton className="px-3 py-2" onClick={() => onDelete?.(photo)}><Trash2 className="h-4 w-4" /></GhostButton>
          </div>
          {albums && albums.length > 1 && onMove ? (
            <select className="w-full rounded-2xl border border-white/60 bg-white/75 px-3 py-2 text-xs text-wine" defaultValue="" onChange={(event) => { if (event.target.value) onMove(photo, event.target.value); event.currentTarget.value = ''; }}>
              <option value="">Move photo…</option>
              {albums.filter((album) => album.id !== photo.album_id).map((album) => (
                <option key={album.id} value={album.id}>{album.title}</option>
              ))}
            </select>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function PageTabs({ value, onChange, items }: { value: string; onChange: (value: string) => void; items: { value: string; label: string }[] }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => (
        <button key={item.value} className={cn('rounded-full px-4 py-2 text-sm whitespace-nowrap', value === item.value ? 'bg-wine text-white' : 'bg-white/60 text-wine')} onClick={() => onChange(item.value)}>
          {item.label}
        </button>
      ))}
    </div>
  );
}

export { CalendarDays, Camera, Heart, Home, Image, LetterText, Lock, Plus, Sparkles, Target };