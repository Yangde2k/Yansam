import { type PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlbumGrid,
  AnniversaryHero,
  Button,
  CalendarDays,
  ConfirmationDialog,
  EmptyState,
  GhostButton,
  GlassCard,
  HiddenReveal,
  FileAudio2,
  Image,
  Input,
  LoveLetterCard,
  MemoryCard,
  MobileFilePicker,
  MoodPicker,
  PageIntro,
  PageTabs,
  PhotoStrip,
  QuickLinkCard,
  SectionSkeleton,
  SectionTitle,
  Select,
  Sparkles,
  Target,
  Textarea,
  TimelineRail,
  UploadDropzone,
} from '../components';
import { useAuth } from '../context/AuthContext';
import {
  acceptInvite,
  addPhotos,
  createInvite,
  deleteAlbum,
  deleteLetter,
  deleteMemory,
  deleteMilestone,
  deleteMood,
  deletePhoto,
  deleteSpecialPage,
  deleteWish,
  listActiveInviteForUser,
  listAlbums,
  listLetters,
  listMemories,
  listMilestones,
  listMoods,
  listNotifications,
  listSpecialPages,
  listWishes,
  movePhoto,
  openLetter,
  reorderCoupleItems,
  revokeInvite,
  saveAlbum,
  saveLetter,
  saveMemory,
  saveMilestone,
  saveMood,
  saveSpecialPage,
  saveWish,
  setAlbumCover,
  updateCoupleSpace,
} from '../lib/api';
import { formatDate, formatRelativeDate, getMoodMeta, isUnlocked, quoteOfTheDay, todayIsoDate } from '../lib/utils';
import type { Album, Letter, Memory, Milestone, MoodKind, Photo, SpecialPage, Wish } from '../types';
import { MOOD_OPTIONS } from '../types';
import { useUIStore } from '../store/ui';

const homeQuotes = [
  'Love is not far away when it keeps a light on for you.',
  'Distance only changes the map, never the meaning.',
  'Even in silence, two hearts can keep a room warm.',
  'Small memories become a home when they are kept gently.',
  'A shared sanctuary is made from tenderness, not proximity.',
  'The softest love stories are the ones we keep returning to.',
  'Today is another page in the life you are building together.',
];

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function CoupleNotice() {
  return (
    <EmptyState
      icon={Sparkles}
      title="Create or join your couple room"
      body="This space unlocks after you create an invite or accept your partner’s code in Settings."
      action={<Link to="/app/settings"><Button>Open settings</Button></Link>}
    />
  );
}

export function HomePage() {
  const { profile, coupleSpace } = useAuth();
  const coupleId = coupleSpace?.id;

  const memoriesQuery = useQuery({ queryKey: ['memories', coupleId], queryFn: () => listMemories(coupleId!), enabled: Boolean(coupleId) });
  const moodsQuery = useQuery({ queryKey: ['moods', coupleId], queryFn: () => listMoods(coupleId!), enabled: Boolean(coupleId) });
  const milestonesQuery = useQuery({ queryKey: ['milestones', coupleId], queryFn: () => listMilestones(coupleId!), enabled: Boolean(coupleId) });
  const notificationsQuery = useQuery({ queryKey: ['notifications', coupleId], queryFn: () => listNotifications(coupleId!), enabled: Boolean(coupleId) });

  if (!coupleId) {
    return (
      <>
        <AnniversaryHero profile={profile} coupleSpace={coupleSpace} />
        <CoupleNotice />
      </>
    );
  }

  const moods = moodsQuery.data ?? [];
  const recentMemories = (memoriesQuery.data ?? []).slice(0, 3);
  const nextMilestone = (milestonesQuery.data ?? []).find((item) => new Date(item.date).getTime() >= Date.now()) ?? null;
  const latestMood = moods[0];
  const notifications = notificationsQuery.data ?? [];

  if (memoriesQuery.isLoading || moodsQuery.isLoading || milestonesQuery.isLoading || notificationsQuery.isLoading) {
    return (
      <>
        <PageIntro title="Your shared sanctuary" subtitle="A soft dashboard for memories, moods, anniversaries, and the quiet moments in between." />
        <SectionSkeleton title="Pulling in your latest updates…" rows={2} />
        <SectionSkeleton title="Gathering memories and reminders…" rows={3} />
      </>
    );
  }

  return (
    <>
      <PageIntro title="Your shared sanctuary" subtitle="A soft dashboard for memories, moods, anniversaries, and the quiet moments in between." />
      <AnniversaryHero profile={profile} coupleSpace={coupleSpace} nextMilestone={nextMilestone} />

      <GlassCard>
        <p className="text-xs uppercase tracking-[0.24em] text-cocoa/60">Daily quote</p>
        <p className="mt-2 font-serif text-2xl leading-tight text-wine">“{quoteOfTheDay(homeQuotes)}”</p>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.24em] text-cocoa/60">Today’s shared mood</p>
          {latestMood ? (
            <div className="mt-3">
              <p className="text-3xl">{getMoodMeta(latestMood.mood).emoji}</p>
              <p className="mt-2 font-serif text-2xl text-wine">{getMoodMeta(latestMood.mood).label}</p>
              <p className="mt-2 text-sm text-cocoa/75">{latestMood.note || 'A quiet feeling held together.'}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-cocoa/75">No one has checked in today yet.</p>
          )}
        </GlassCard>
        <HiddenReveal title="Hidden romantic message" buttonLabel="Unfold" message="No matter how far the miles stretch, this room still keeps us close — page by page, mood by mood, memory by memory." />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <QuickLinkCard to="/app/memories" icon={Sparkles} title="Add memory" body="Write today before it disappears into tomorrow." />
        <QuickLinkCard to="/app/gallery" icon={Image} title="Photo gallery" body="Open your latest album and relive your favorite frames." />
        <QuickLinkCard to="/app/moods" icon={CalendarDays} title="Daily check-in" body="Track how each day felt, gently and honestly." />
        <QuickLinkCard to="/app/future" icon={Target} title="Future together" body="Keep your plans, wishes, and dreams in one place." />
      </div>

      <div>
        <SectionTitle title="Recent memories" subtitle="Your newest pages together" />
        <div className="space-y-4">
          {recentMemories.length ? recentMemories.map((memory) => <MemoryCard key={memory.id} memory={memory} />) : <EmptyState title="No memories yet" body="Add your first diary entry to begin the story." />}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <GlassCard>
          <p className="font-serif text-2xl text-wine">Upcoming</p>
          <div className="mt-4 space-y-3">
            {(milestonesQuery.data ?? []).slice(0, 3).map((item) => (
              <div key={item.id} className="rounded-2xl bg-white/60 p-3">
                <p className="font-medium text-wine">{item.title}</p>
                <p className="text-sm text-cocoa/70">{formatDate(item.date)} • {formatRelativeDate(item.date)}</p>
              </div>
            ))}
            {!milestonesQuery.data?.length ? <p className="text-sm text-cocoa/70">No milestone added yet.</p> : null}
          </div>
        </GlassCard>
        <GlassCard>
          <p className="font-serif text-2xl text-wine">Soft reminders</p>
          <div className="mt-4 space-y-3">
            {notifications.length ? notifications.map((item) => (
              <div key={item.id} className="rounded-2xl bg-white/60 p-3">
                <p className="text-sm font-medium text-wine">{item.type.replaceAll('_', ' ')}</p>
                <p className="mt-1 text-sm text-cocoa/70">{item.message || 'A gentle reminder is waiting for you.'}</p>
              </div>
            )) : <p className="text-sm text-cocoa/70">Notifications will appear here once you start adding moments.</p>}
          </div>
        </GlassCard>
      </div>
    </>
  );
}

type MemoryForm = {
  title: string;
  body: string;
  mood: MoodKind;
  music_url?: string;
  memory_date?: string;
};

export function MemoriesPage() {
  const { coupleSpace } = useAuth();
  const coupleId = coupleSpace?.id;
  const addToast = useUIStore((state) => state.addToast);
  const queryClient = useQueryClient();
  const view = useUIStore((state) => state.preferences.memoriesView);
  const setMemoriesView = useUIStore((state) => state.setMemoriesView);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Memory | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMusicFile, setSelectedMusicFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Memory | null>(null);
  const form = useForm<MemoryForm>({ defaultValues: { mood: 'grateful', memory_date: todayIsoDate() } });

  const memoriesQuery = useQuery({ queryKey: ['memories', coupleId], queryFn: () => listMemories(coupleId!), enabled: Boolean(coupleId) });

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(editing?.photo_src ?? null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [editing?.photo_src, selectedFile]);

  const saveMutation = useMutation({
    mutationFn: async (values: MemoryForm) => {
      if (!coupleId) throw new Error('Create or join a couple room first.');
      return saveMemory(coupleId, {
        id: editing?.id,
        title: values.title,
        body: values.body,
        mood: values.mood,
        music_url: selectedMusicFile ? null : values.music_url || null,
        memory_date: values.memory_date || null,
        favorite: editing?.favorite ?? false,
        pinned: editing?.pinned ?? false,
        archived: editing?.archived ?? false,
        photoFile: selectedFile,
        musicFile: selectedMusicFile,
        existingPhotoPath: editing?.photo_url ?? null,
        existingMusicPath: editing?.music_url ?? null,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['memories', coupleId] });
      addToast({ title: editing ? 'Memory updated' : 'Memory saved', tone: 'success' });
      setOpen(false);
      setEditing(null);
      setSelectedFile(null);
      setSelectedMusicFile(null);
      form.reset({ title: '', body: '', mood: 'grateful', music_url: '', memory_date: todayIsoDate() });
    },
    onError: (error) => addToast({ title: 'Could not save memory', description: error instanceof Error ? error.message : 'Please retry.', tone: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (memory: Memory) => deleteMemory(memory),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['memories', coupleId] });
      addToast({ title: 'Memory deleted', tone: 'success' });
      setDeleteTarget(null);
    },
    onError: (error) => addToast({ title: 'Delete failed', description: error instanceof Error ? error.message : 'Please retry.', tone: 'error' }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ memory, patch }: { memory: Memory; patch: Partial<Memory> }) => {
      if (!coupleId) throw new Error('Create or join a couple room first.');
      return saveMemory(coupleId, {
        id: memory.id,
        title: patch.title ?? memory.title,
        body: patch.body ?? memory.body,
        mood: (patch.mood ?? memory.mood ?? 'grateful') as MoodKind,
        music_url: patch.music_url ?? memory.music_url ?? null,
        memory_date: patch.memory_date ?? memory.memory_date ?? null,
        favorite: patch.favorite ?? memory.favorite,
        pinned: patch.pinned ?? memory.pinned,
        archived: patch.archived ?? memory.archived,
        existingPhotoPath: memory.photo_url,
        existingMusicPath: memory.music_url,
        existingMusicPath: memory.music_url,
      });
    },
    onMutate: async ({ memory, patch }) => {
      await queryClient.cancelQueries({ queryKey: ['memories', coupleId] });
      const previous = queryClient.getQueryData<Memory[]>(['memories', coupleId]);
      queryClient.setQueryData<Memory[]>(['memories', coupleId], (current = []) => current.map((item) => (item.id === memory.id ? { ...item, ...patch } : item)));
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(['memories', coupleId], context.previous);
      addToast({ title: 'Update failed', description: error instanceof Error ? error.message : 'Please retry.', tone: 'error' });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['memories', coupleId] });
    },
  });

  const startCreate = () => {
    setEditing(null);
    setSelectedFile(null);
    form.reset({ title: '', body: '', mood: 'grateful', music_url: '', memory_date: todayIsoDate() });
    setOpen(true);
  };

  const startEdit = (memory: Memory) => {
    setEditing(memory);
    setSelectedFile(null);
    setSelectedMusicFile(null);
    form.reset({
      title: memory.title,
      body: memory.body,
      mood: (memory.mood ?? 'grateful') as MoodKind,
      music_url: memory.music_url ?? '',
      memory_date: memory.memory_date ?? todayIsoDate(),
    });
    setOpen(true);
  };

  if (!coupleId) return <CoupleNotice />;

  const memories = memoriesQuery.data ?? [];
  const viewItems = [...memories];

  if (memoriesQuery.isLoading) {
    return (
      <>
        <PageIntro title="Memory diary" subtitle="Keep your most tender pages in a shared timeline built just for the two of you." />
        <SectionSkeleton title="Loading your shared diary…" rows={3} />
      </>
    );
  }

  return (
    <>
      <PageIntro title="Memory diary" subtitle="Keep your most tender pages in a shared timeline built just for the two of you." action={<Button onClick={startCreate}>New memory</Button>} />
      <PageTabs value={view} onChange={(nextView) => setMemoriesView(nextView as 'timeline' | 'grid' | 'stack')} items={[{ value: 'timeline', label: 'Timeline' }, { value: 'grid', label: 'Grid' }, { value: 'stack', label: 'Stack' }]} />

      {!memories.length ? <EmptyState title="No memories yet" body="Write your first entry and begin your shared capsule." action={<Button onClick={startCreate}>Add memory</Button>} /> : null}

      {view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2">{viewItems.map((memory) => <MemoryCard key={memory.id} memory={memory} onEdit={startEdit} onDelete={setDeleteTarget} onToggleFavorite={(item) => toggleMutation.mutate({ memory: item, patch: { favorite: !item.favorite } })} onTogglePin={(item) => toggleMutation.mutate({ memory: item, patch: { pinned: !item.pinned } })} />)}</div>
      ) : null}

      {view === 'timeline' ? (
        <div className="space-y-4">{viewItems.map((memory) => <MemoryCard key={memory.id} memory={memory} onEdit={startEdit} onDelete={setDeleteTarget} onToggleFavorite={(item) => toggleMutation.mutate({ memory: item, patch: { favorite: !item.favorite } })} onTogglePin={(item) => toggleMutation.mutate({ memory: item, patch: { pinned: !item.pinned } })} />)}</div>
      ) : null}

      {view === 'stack' ? (
        <div className="space-y-4">{viewItems.map((memory, index) => <div key={memory.id} style={{ transform: `translateY(${index * -6}px)` }}><MemoryCard memory={memory} onEdit={startEdit} onDelete={setDeleteTarget} onToggleFavorite={(item) => toggleMutation.mutate({ memory: item, patch: { favorite: !item.favorite } })} onTogglePin={(item) => toggleMutation.mutate({ memory: item, patch: { pinned: !item.pinned } })} /></div>)}</div>
      ) : null}

      <ConfirmationDialog open={Boolean(deleteTarget)} title="Delete memory?" body="This memory can be removed permanently, including its uploaded photo." confirmLabel="Delete" onClose={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget); }} />

      <ModalMemoryForm open={open} title={editing ? 'Edit memory' : 'New memory'} onClose={() => setOpen(false)}>
        <form className="space-y-4" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
          <div>
            <label className="mb-2 block text-sm text-cocoa/75">Title</label>
            <Input placeholder="A moment worth keeping" {...form.register('title', { required: true })} />
          </div>
          <div>
            <label className="mb-2 block text-sm text-cocoa/75">What happened?</label>
            <Textarea placeholder="Write the feeling, the scene, the detail you never want to forget…" {...form.register('body', { required: true })} />
          </div>
          <div>
            <label className="mb-2 block text-sm text-cocoa/75">Mood</label>
            <MoodPicker value={form.watch('mood')} onChange={(value) => form.setValue('mood', value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-cocoa/75">Memory date</label>
              <Input type="date" {...form.register('memory_date')} />
            </div>
            <div>
              <label className="mb-2 block text-sm text-cocoa/75">Song URL (optional)</label>
              <Input placeholder="Direct .mp3 link, Spotify, YouTube…" {...form.register('music_url')} disabled={Boolean(selectedMusicFile)} />
              <p className="mt-2 text-xs text-cocoa/65">Direct audio files play inside YANSAM. Spotify, YouTube, and similar links will open externally as a fallback.</p>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm text-cocoa/75">Audio file from your device (optional)</label>
            <MobileFilePicker
              label={selectedMusicFile ? `Selected: ${selectedMusicFile.name}` : 'Choose audio from device'}
              helper={selectedMusicFile ? 'This uploaded audio file will be saved inside your private memory and used instead of the URL above.' : editing?.music_url ? 'Choose an audio file to replace the current soundtrack, or leave empty to keep the existing one.' : 'Pick an audio file from device storage. MP3, WAV, OGG, M4A and similar formats work best.'}
              accept="audio/*"
              icon={FileAudio2}
              onFiles={(files) => setSelectedMusicFile(files[0] ?? null)}
              loading={saveMutation.isPending}
            />
            {selectedMusicFile ? (
              <button
                type="button"
                className="mt-3 text-sm font-medium text-wine underline underline-offset-4"
                onClick={() => setSelectedMusicFile(null)}
              >
                Remove selected audio file
              </button>
            ) : null}
          </div>
          <div>
            <label className="mb-2 block text-sm text-cocoa/75">Photo</label>
            <MobileFilePicker label="Choose from gallery" helper="Native mobile file picker only. No forced camera capture." onFiles={(files) => setSelectedFile(files[0] ?? null)} previewUrls={previewUrl ? [previewUrl] : []} loading={saveMutation.isPending} />
          </div>
          <Button className="w-full" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving…' : editing ? 'Update memory' : 'Save memory'}</Button>
        </form>
      </ModalMemoryForm>
    </>
  );
}

function ModalMemoryForm({ open, onClose, title, children }: PropsWithChildren<{ open: boolean; onClose: () => void; title: string }>) {
  return (
    <div>
      {/* Keeps app-pages.tsx self-contained while reusing the shared modal style through native container */}
      <div className={open ? 'fixed inset-0 z-50 flex items-end justify-center bg-wine/25 p-4 backdrop-blur-sm sm:items-center' : 'hidden'}>
        <div className="max-h-[92vh] w-full max-w-lg overflow-auto rounded-[32px] border border-white/60 bg-ivory/95 p-5 shadow-glow">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="font-serif text-2xl text-wine">{title}</p>
            <GhostButton onClick={onClose}>Close</GhostButton>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

type AlbumForm = { title: string };

export function GalleryPage() {
  const { coupleSpace } = useAuth();
  const coupleId = coupleSpace?.id;
  const addToast = useUIStore((state) => state.addToast);
  const queryClient = useQueryClient();
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const search = useUIStore((state) => state.preferences.gallerySearch);
  const sort = useUIStore((state) => state.preferences.gallerySort);
  const setGallerySearch = useUIStore((state) => state.setGallerySearch);
  const setGallerySort = useUIStore((state) => state.setGallerySort);
  const [albumOpen, setAlbumOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [deleteAlbumTarget, setDeleteAlbumTarget] = useState<Album | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null);
  const [draftFiles, setDraftFiles] = useState<File[]>([]);
  const albumForm = useForm<AlbumForm>({ defaultValues: { title: '' } });

  const previewUrls = useMemo(() => draftFiles.map((file) => URL.createObjectURL(file)), [draftFiles]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const albumsQuery = useQuery({ queryKey: ['albums', coupleId], queryFn: () => listAlbums(coupleId!), enabled: Boolean(coupleId) });

  const albums = useMemo(() => {
    const current = albumsQuery.data ?? [];
    const next = [...current];
    if (sort === 'title') next.sort((a, b) => a.title.localeCompare(b.title));
    return next;
  }, [albumsQuery.data, sort]);

  useEffect(() => {
    if (!selectedAlbumId && albums[0]) setSelectedAlbumId(albums[0].id);
    if (selectedAlbumId && !albums.find((album) => album.id === selectedAlbumId)) setSelectedAlbumId(albums[0]?.id ?? null);
  }, [albums, selectedAlbumId]);

  const selectedAlbum = albums.find((album) => album.id === selectedAlbumId) ?? null;

  const saveAlbumMutation = useMutation({
    mutationFn: async (values: AlbumForm) => {
      if (!coupleId) throw new Error('Create or join a couple room first.');
      return saveAlbum(coupleId, { id: editingAlbum?.id, title: values.title, cover_url: editingAlbum?.cover_url ?? null });
    },
    onSuccess: async (album) => {
      await queryClient.invalidateQueries({ queryKey: ['albums', coupleId] });
      setSelectedAlbumId(album.id);
      setAlbumOpen(false);
      setEditingAlbum(null);
      albumForm.reset({ title: '' });
      addToast({ title: editingAlbum ? 'Album renamed' : 'Album created', tone: 'success' });
    },
    onError: (error) => addToast({ title: 'Could not save album', description: error instanceof Error ? error.message : 'Please retry.', tone: 'error' }),
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      if (!coupleId || !selectedAlbum) throw new Error('Select an album first.');
      return addPhotos(selectedAlbum.id, coupleId, files);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['albums', coupleId] });
      addToast({ title: 'Photos uploaded', description: 'Your album updated instantly.', tone: 'success' });
      setDraftFiles([]);
    },
    onError: (error) => addToast({ title: 'Upload failed', description: error instanceof Error ? error.message : 'Please retry.', tone: 'error' }),
  });

  const deleteAlbumMutation = useMutation({
    mutationFn: async (album: Album) => deleteAlbum(album),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['albums', coupleId] });
      setDeleteAlbumTarget(null);
      addToast({ title: 'Album deleted', tone: 'success' });
    },
    onError: (error) => addToast({ title: 'Could not delete album', description: error instanceof Error ? error.message : 'Please retry.', tone: 'error' }),
  });

  const photoMutation = useMutation({
    mutationFn: async ({ photo, action, targetAlbumId }: { photo: Photo; action: 'delete' | 'cover' | 'move'; targetAlbumId?: string }) => {
      if (action === 'delete') return deletePhoto(photo);
      if (action === 'cover') return setAlbumCover(photo.album_id, photo.url);
      return movePhoto(photo.id, targetAlbumId!);
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['albums', coupleId] });
      addToast({ title: variables.action === 'delete' ? 'Photo removed' : variables.action === 'cover' ? 'Album cover updated' : 'Photo moved', tone: 'success' });
    },
    onError: (error) => addToast({ title: 'Photo action failed', description: error instanceof Error ? error.message : 'Please retry.', tone: 'error' }),
  });

  if (!coupleId) return <CoupleNotice />;

  if (albumsQuery.isLoading) {
    return (
      <>
        <PageIntro title="Shared gallery" subtitle="Albums, covers, and photos that update instantly and stay beautifully organized." />
        <SectionSkeleton title="Loading albums and photo previews…" rows={3} />
      </>
    );
  }

  return (
    <>
      <PageIntro title="Shared gallery" subtitle="Albums, covers, and photos that update instantly and stay beautifully organized." action={<Button onClick={() => { setEditingAlbum(null); albumForm.reset({ title: '' }); setAlbumOpen(true); }}>Create album</Button>} />

      <GlassCard>
        <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
          <Input placeholder="Search albums" value={search} onChange={(event) => setGallerySearch(event.target.value)} />
          <Select value={sort} onChange={(event) => setGallerySort(event.target.value as 'latest' | 'title')}>
            <option value="latest">Latest</option>
            <option value="title">Title</option>
          </Select>
        </div>
      </GlassCard>

      <AlbumGrid albums={albums} search={search} onSelect={(album) => setSelectedAlbumId(album.id)} onRename={(album) => { setEditingAlbum(album); albumForm.reset({ title: album.title }); setAlbumOpen(true); }} onDelete={setDeleteAlbumTarget} />

      {selectedAlbum ? (
        <GlassCard>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-serif text-2xl text-wine">{selectedAlbum.title}</p>
              <p className="text-sm text-cocoa/70">{selectedAlbum.photos?.length ?? 0} photos • cover updates instantly</p>
            </div>
            <GhostButton onClick={() => photoMutation.mutateAsync({ photo: { id: '', album_id: selectedAlbum.id, couple_id: coupleId, url: '', favorite: false, created_at: '', updated_at: '', position: 0 }, action: 'cover' }).catch(() => undefined)} disabled={!selectedAlbum.photos?.length}>Auto cover</GhostButton>
          </div>
          <div className="mt-4">
            <UploadDropzone
              loading={uploadMutation.isPending}
              previewUrls={previewUrls}
              onFiles={(files) => {
                setDraftFiles(files);
                uploadMutation.mutate(files);
              }}
            />
          </div>
          <div className="mt-4">
            <PhotoStrip
              photos={selectedAlbum.photos ?? []}
              albums={albums}
              onOpen={setPreviewPhoto}
              onDelete={(photo) => photoMutation.mutate({ photo, action: 'delete' })}
              onSetCover={(photo) => photoMutation.mutate({ photo, action: 'cover' })}
              onMove={(photo, targetAlbumId) => photoMutation.mutate({ photo, action: 'move', targetAlbumId })}
            />
          </div>
        </GlassCard>
      ) : null}

      <ConfirmationDialog open={Boolean(deleteAlbumTarget)} title="Delete album?" body="This removes the album and all photos inside it from storage." confirmLabel="Delete album" onClose={() => setDeleteAlbumTarget(null)} onConfirm={() => { if (deleteAlbumTarget) deleteAlbumMutation.mutate(deleteAlbumTarget); }} />

      <ModalMemoryForm open={albumOpen} title={editingAlbum ? 'Rename album' : 'Create album'} onClose={() => setAlbumOpen(false)}>
        <form className="space-y-4" onSubmit={albumForm.handleSubmit((values) => saveAlbumMutation.mutate(values))}>
          <div>
            <label className="mb-2 block text-sm text-cocoa/75">Album title</label>
            <Input placeholder="Summer calls, screenshots, airport smiles…" {...albumForm.register('title', { required: true })} />
          </div>
          <Button className="w-full" disabled={saveAlbumMutation.isPending}>{saveAlbumMutation.isPending ? 'Saving…' : editingAlbum ? 'Save changes' : 'Create album'}</Button>
        </form>
      </ModalMemoryForm>

      <ModalMemoryForm open={Boolean(previewPhoto)} title="Photo preview" onClose={() => setPreviewPhoto(null)}>
        {previewPhoto ? <img src={previewPhoto.src ?? ''} alt="Preview" className="max-h-[70vh] w-full rounded-[28px] object-cover" /> : null}
      </ModalMemoryForm>
    </>
  );
}

type MilestoneForm = { title: string; date: string; type: string };

export function TimelinePage() {
  const { coupleSpace } = useAuth();
  const coupleId = coupleSpace?.id;
  const addToast = useUIStore((state) => state.addToast);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Milestone | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Milestone | null>(null);
  const form = useForm<MilestoneForm>({ defaultValues: { type: 'custom', date: todayIsoDate() } });

  const milestonesQuery = useQuery({ queryKey: ['milestones', coupleId], queryFn: () => listMilestones(coupleId!), enabled: Boolean(coupleId) });

  const saveMutation = useMutation({
    mutationFn: async (values: MilestoneForm) => {
      if (!coupleId) throw new Error('Create or join a couple room first.');
      return saveMilestone(coupleId, { id: editing?.id, ...values, position: editing?.position });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['milestones', coupleId] });
      addToast({ title: editing ? 'Milestone updated' : 'Milestone added', tone: 'success' });
      setOpen(false);
      setEditing(null);
      form.reset({ title: '', type: 'custom', date: todayIsoDate() });
    },
    onError: (error) => addToast({ title: 'Could not save milestone', description: error instanceof Error ? error.message : 'Please retry.', tone: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteMilestone(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['milestones', coupleId] });
      setDeleteTarget(null);
      addToast({ title: 'Milestone deleted', tone: 'success' });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: -1 | 1 }) => reorderCoupleItems('milestones', milestonesQuery.data ?? [], id, direction),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['milestones', coupleId] });
    },
  });

  if (!coupleId) return <CoupleNotice />;

  if (milestonesQuery.isLoading) {
    return (
      <>
        <PageIntro title="Relationship timeline" subtitle="Mark every first, every celebration, and every chapter you never want to lose." />
        <SectionSkeleton title="Loading your timeline…" rows={3} />
      </>
    );
  }

  return (
    <>
      <PageIntro title="Relationship timeline" subtitle="Mark every first, every celebration, and every chapter you never want to lose." action={<Button onClick={() => { setEditing(null); form.reset({ title: '', type: 'custom', date: todayIsoDate() }); setOpen(true); }}>Add milestone</Button>} />
      <TimelineRail milestones={milestonesQuery.data ?? []} onEdit={(item) => { setEditing(item); form.reset({ title: item.title, date: item.date, type: item.type }); setOpen(true); }} onDelete={setDeleteTarget} onMove={(item, direction) => reorderMutation.mutate({ id: item.id, direction })} />
      <ConfirmationDialog open={Boolean(deleteTarget)} title="Delete milestone?" body="You can always add it again later." onClose={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id); }} />
      <ModalMemoryForm open={open} title={editing ? 'Edit milestone' : 'Add milestone'} onClose={() => setOpen(false)}>
        <form className="space-y-4" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
          <div>
            <label className="mb-2 block text-sm text-cocoa/75">Title</label>
            <Input placeholder="First voice call" {...form.register('title', { required: true })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-cocoa/75">Date</label>
              <Input type="date" {...form.register('date', { required: true })} />
            </div>
            <div>
              <label className="mb-2 block text-sm text-cocoa/75">Type</label>
              <Select {...form.register('type')}>
                <option value="first_conversation">First conversation</option>
                <option value="first_call">First call</option>
                <option value="first_date">First date</option>
                <option value="birthday">Birthday</option>
                <option value="anniversary">Anniversary</option>
                <option value="future">Future milestone</option>
                <option value="custom">Custom</option>
              </Select>
            </div>
          </div>
          <Button className="w-full" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving…' : 'Save milestone'}</Button>
        </form>
      </ModalMemoryForm>
    </>
  );
}

type LetterForm = { title: string; body: string; unlock_type: string; unlock_date?: string };

export function LettersPage() {
  const { coupleSpace } = useAuth();
  const coupleId = coupleSpace?.id;
  const addToast = useUIStore((state) => state.addToast);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Letter | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Letter | null>(null);
  const [reading, setReading] = useState<Letter | null>(null);
  const form = useForm<LetterForm>({ defaultValues: { unlock_type: 'manual' } });

  const lettersQuery = useQuery({ queryKey: ['letters', coupleId], queryFn: () => listLetters(coupleId!), enabled: Boolean(coupleId) });

  const saveMutation = useMutation({
    mutationFn: async (values: LetterForm) => {
      if (!coupleId) throw new Error('Create or join a couple room first.');
      return saveLetter(coupleId, { id: editing?.id, title: values.title, body: values.body, unlock_type: values.unlock_type, unlock_date: values.unlock_date || null });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['letters', coupleId] });
      setOpen(false);
      setEditing(null);
      form.reset({ title: '', body: '', unlock_type: 'manual', unlock_date: '' });
      addToast({ title: editing ? 'Letter updated' : 'Letter saved', tone: 'success' });
    },
  });

  const openMutation = useMutation({
    mutationFn: async (letter: Letter) => {
      if (!letter.opened) await openLetter(letter.id);
      return letter;
    },
    onSuccess: async (letter) => {
      await queryClient.invalidateQueries({ queryKey: ['letters', coupleId] });
      setReading({ ...letter, opened: true });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (letter: Letter) => deleteLetter(letter.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['letters', coupleId] });
      setDeleteTarget(null);
      addToast({ title: 'Letter deleted', tone: 'success' });
    },
  });

  if (!coupleId) return <CoupleNotice />;

  if (lettersQuery.isLoading) {
    return (
      <>
        <PageIntro title="Private love letters" subtitle="Write hidden notes for anniversaries, lonely nights, and every moment love wants to wait for." />
        <SectionSkeleton title="Loading your letters…" rows={2} />
      </>
    );
  }

  return (
    <>
      <PageIntro title="Private love letters" subtitle="Write hidden notes for anniversaries, lonely nights, and every moment love wants to wait for." action={<Button onClick={() => { setEditing(null); form.reset({ title: '', body: '', unlock_type: 'manual', unlock_date: '' }); setOpen(true); }}>Write letter</Button>} />
      <div className="space-y-4">
        {(lettersQuery.data ?? []).length ? (
          lettersQuery.data?.map((letter) => (
            <LoveLetterCard key={letter.id} letter={letter} onOpen={(item) => isUnlocked(item.unlock_type, item.unlock_date) && openMutation.mutate(item)} onEdit={(item) => { setEditing(item); form.reset({ title: item.title, body: item.body, unlock_type: item.unlock_type, unlock_date: item.unlock_date?.slice(0, 10) ?? '' }); setOpen(true); }} onDelete={setDeleteTarget} />
          ))
        ) : (
          <EmptyState title="No letters yet" body="Write your first hidden note for a future version of your partner." action={<Button onClick={() => setOpen(true)}>Write now</Button>} />
        )}
      </div>
      <ConfirmationDialog open={Boolean(deleteTarget)} title="Delete letter?" body="This hidden note will be removed from your sanctuary." onClose={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget); }} />
      <ModalMemoryForm open={open} title={editing ? 'Edit letter' : 'Write a letter'} onClose={() => setOpen(false)}>
        <form className="space-y-4" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
          <div>
            <label className="mb-2 block text-sm text-cocoa/75">Title</label>
            <Input placeholder="Open when missing me" {...form.register('title', { required: true })} />
          </div>
          <div>
            <label className="mb-2 block text-sm text-cocoa/75">Letter</label>
            <Textarea placeholder="Write the words you want them to find later…" {...form.register('body', { required: true })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-cocoa/75">Unlock type</label>
              <Select {...form.register('unlock_type')}>
                <option value="manual">Manual</option>
                <option value="anniversary">Anniversary</option>
                <option value="date">Specific date</option>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm text-cocoa/75">Unlock date</label>
              <Input type="date" {...form.register('unlock_date')} />
            </div>
          </div>
          <Button className="w-full" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving…' : 'Save letter'}</Button>
        </form>
      </ModalMemoryForm>
      <ModalMemoryForm open={Boolean(reading)} title={reading?.title ?? 'Letter'} onClose={() => setReading(null)}>
        <p className="whitespace-pre-wrap text-sm leading-8 text-cocoa/85">{reading?.body}</p>
      </ModalMemoryForm>
    </>
  );
}

type MoodForm = { note?: string };

export function MoodsPage() {
  const { coupleSpace } = useAuth();
  const coupleId = coupleSpace?.id;
  const addToast = useUIStore((state) => state.addToast);
  const queryClient = useQueryClient();
  const [mood, setMood] = useState<MoodKind>('grateful');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const form = useForm<MoodForm>();

  const moodsQuery = useQuery({ queryKey: ['moods', coupleId], queryFn: () => listMoods(coupleId!), enabled: Boolean(coupleId) });

  const saveMutation = useMutation({
    mutationFn: async (values: MoodForm) => {
      if (!coupleId) throw new Error('Create or join a couple room first.');
      return saveMood(coupleId, { mood, note: values.note || null });
    },
    onMutate: async (values) => {
      await queryClient.cancelQueries({ queryKey: ['moods', coupleId] });
      const previous = queryClient.getQueryData(['moods', coupleId]);
      queryClient.setQueryData(['moods', coupleId], (current: unknown) => [{ id: `temp-${Date.now()}`, couple_id: coupleId, mood, note: values.note || null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, ...(Array.isArray(current) ? current : [])]);
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(['moods', coupleId], context.previous);
      addToast({ title: 'Could not save check-in', description: error instanceof Error ? error.message : 'Please retry.', tone: 'error' });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['moods', coupleId] });
      form.reset({ note: '' });
      addToast({ title: 'Mood saved', tone: 'success' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteMood(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['moods', coupleId] });
      setDeleteTarget(null);
      addToast({ title: 'Mood entry deleted', tone: 'success' });
    },
  });

  if (!coupleId) return <CoupleNotice />;

  if (moodsQuery.isLoading) {
    return (
      <>
        <PageIntro title="Daily check-in" subtitle="Track how today feels, gently and honestly, with notes you can both come back to." />
        <SectionSkeleton title="Loading your check-ins…" rows={3} />
      </>
    );
  }

  const moods = moodsQuery.data ?? [];
  const counts = MOOD_OPTIONS.map((item) => ({ ...item, count: moods.filter((entry) => entry.mood === item.value).length }));

  return (
    <>
      <PageIntro title="Daily check-in" subtitle="Track how today feels, gently and honestly, with notes you can both come back to." action={<Button onClick={() => form.handleSubmit((values) => saveMutation.mutate(values))()}>Save today</Button>} />
      <SectionTitle title="Daily check-in" subtitle="How are you feeling today?" />
      <GlassCard>
        <form className="space-y-4" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
          <MoodPicker value={mood} onChange={setMood} />
          <Textarea placeholder="Leave a note for the day…" {...form.register('note')} />
          <Button className="w-full" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving…' : 'Save today’s mood'}</Button>
        </form>
      </GlassCard>
      <GlassCard>
        <SectionTitle title="Mood trend" subtitle="A simple emotional snapshot" />
        <div className="space-y-3">
          {counts.map((item) => (
            <div key={item.value}>
              <div className="mb-1 flex items-center justify-between text-sm text-cocoa/80">
                <span>{item.emoji} {item.label}</span>
                <span>{item.count}</span>
              </div>
              <div className="h-2 rounded-full bg-white/60"><div className="h-2 rounded-full bg-wine" style={{ width: `${Math.min(100, item.count * 22)}%` }} /></div>
            </div>
          ))}
        </div>
      </GlassCard>
      <div className="space-y-3">
        {moods.map((entry) => (
          <GlassCard key={entry.id}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-wine">{getMoodMeta(entry.mood).emoji} {getMoodMeta(entry.mood).label}</p>
                <p className="mt-1 text-sm text-cocoa/70">{entry.note || 'No note added.'}</p>
                <p className="mt-2 text-xs text-cocoa/60">{formatDate(entry.created_at)}</p>
              </div>
              {!entry.id.startsWith('temp-') ? <GhostButton onClick={() => setDeleteTarget(entry.id)}>Delete</GhostButton> : null}
            </div>
          </GlassCard>
        ))}
      </div>
      <ConfirmationDialog open={Boolean(deleteTarget)} title="Delete mood entry?" body="This check-in will be removed." onClose={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget); }} />
    </>
  );
}

type WishForm = { title: string; kind: string };

export function FuturePage() {
  const { coupleSpace } = useAuth();
  const coupleId = coupleSpace?.id;
  const addToast = useUIStore((state) => state.addToast);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Wish | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Wish | null>(null);
  const form = useForm<WishForm>({ defaultValues: { kind: 'bucket_list' } });

  const wishesQuery = useQuery({ queryKey: ['wishes', coupleId], queryFn: () => listWishes(coupleId!), enabled: Boolean(coupleId) });

  const saveMutation = useMutation({
    mutationFn: async (values: WishForm) => {
      if (!coupleId) throw new Error('Create or join a couple room first.');
      return saveWish(coupleId, { id: editing?.id, title: values.title, kind: values.kind, done: editing?.done ?? false, position: editing?.position });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wishes', coupleId] });
      setEditing(null);
      form.reset({ title: '', kind: 'bucket_list' });
      addToast({ title: 'Future plan saved', tone: 'success' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (wish: Wish) => {
      if (!coupleId) throw new Error('Create or join a couple room first.');
      return saveWish(coupleId, { id: wish.id, title: wish.title, kind: wish.kind, done: !wish.done, position: wish.position });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wishes', coupleId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (wish: Wish) => deleteWish(wish.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wishes', coupleId] });
      setDeleteTarget(null);
      addToast({ title: 'Future plan deleted', tone: 'success' });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: -1 | 1 }) => reorderCoupleItems('wishes', wishesQuery.data ?? [], id, direction),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wishes', coupleId] });
    },
  });

  if (!coupleId) return <CoupleNotice />;

  if (wishesQuery.isLoading) {
    return (
      <>
        <PageIntro title="Future together" subtitle="Dream homes, travel wishes, future dates, and every plan that gives your love somewhere to go next." />
        <SectionSkeleton title="Loading shared plans…" rows={3} />
      </>
    );
  }

  return (
    <>
      <PageIntro title="Future together" subtitle="Dream homes, travel wishes, future dates, and every plan that gives your love somewhere to go next." />
      <SectionTitle title="Future together" subtitle="Dreams, travel wishes, shared goals, and dates" />
      <GlassCard>
        <form className="space-y-4" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
          <Input placeholder="Visit Kyoto together" {...form.register('title', { required: true })} />
          <Select {...form.register('kind')}>
            <option value="bucket_list">Bucket list</option>
            <option value="travel">Travel wishlist</option>
            <option value="home">Dream home</option>
            <option value="goal">Goal</option>
            <option value="date">Future date</option>
          </Select>
          <Button className="w-full" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving…' : editing ? 'Update plan' : 'Add plan'}</Button>
        </form>
      </GlassCard>
      <div className="space-y-3">
        {(wishesQuery.data ?? []).length ? (
          wishesQuery.data?.map((wish, index, list) => (
            <GlassCard key={wish.id} className={wish.done ? 'opacity-70' : ''}>
              <div className="flex items-start gap-3">
                <button className={`mt-1 h-6 w-6 rounded-full border ${wish.done ? 'bg-wine text-white' : 'border-wine text-transparent'}`} onClick={() => toggleMutation.mutate(wish)}>✓</button>
                <div className="flex-1">
                  <p className="font-serif text-xl text-wine">{wish.title}</p>
                  <p className="mt-1 text-sm text-cocoa/70">{wish.kind.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <GhostButton onClick={() => { setEditing(wish); form.reset({ title: wish.title, kind: wish.kind }); }}>Edit</GhostButton>
                <GhostButton onClick={() => reorderMutation.mutate({ id: wish.id, direction: -1 })} disabled={index === 0}>Up</GhostButton>
                <GhostButton onClick={() => reorderMutation.mutate({ id: wish.id, direction: 1 })} disabled={index === list.length - 1}>Down</GhostButton>
                <GhostButton onClick={() => setDeleteTarget(wish)}>Delete</GhostButton>
              </div>
            </GlassCard>
          ))
        ) : (
          <EmptyState title="No future plans yet" body="Start with one dream. The rest can follow softly." />
        )}
      </div>
      <ConfirmationDialog open={Boolean(deleteTarget)} title="Delete plan?" body="This wish or goal will be removed." onClose={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget); }} />
    </>
  );
}

type SpecialForm = { title: string; body: string; type: string; reveal_label?: string };

export function SpecialMomentsPage() {
  const { coupleSpace } = useAuth();
  const coupleId = coupleSpace?.id;
  const addToast = useUIStore((state) => state.addToast);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<SpecialPage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SpecialPage | null>(null);
  const form = useForm<SpecialForm>({ defaultValues: { type: 'anniversary', reveal_label: 'Reveal surprise' } });

  const pagesQuery = useQuery({ queryKey: ['special-pages', coupleId], queryFn: () => listSpecialPages(coupleId!), enabled: Boolean(coupleId) });

  const saveMutation = useMutation({
    mutationFn: async (values: SpecialForm) => {
      if (!coupleId) throw new Error('Create or join a couple room first.');
      return saveSpecialPage(coupleId, { id: editing?.id, title: values.title, body: values.body, type: values.type, reveal_label: values.reveal_label || 'Reveal surprise', position: editing?.position });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['special-pages', coupleId] });
      form.reset({ title: '', body: '', type: 'anniversary', reveal_label: 'Reveal surprise' });
      setEditing(null);
      addToast({ title: 'Special page saved', tone: 'success' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (page: SpecialPage) => deleteSpecialPage(page.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['special-pages', coupleId] });
      setDeleteTarget(null);
      addToast({ title: 'Special page deleted', tone: 'success' });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: -1 | 1 }) => reorderCoupleItems('special_pages', pagesQuery.data ?? [], id, direction),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['special-pages', coupleId] });
    },
  });

  if (!coupleId) return <CoupleNotice />;

  if (pagesQuery.isLoading) {
    return (
      <>
        <PageIntro title="Special moments" subtitle="Create cinematic surprise pages for anniversaries, birthdays, apologies, and hidden reveals." />
        <SectionSkeleton title="Loading your special pages…" rows={2} />
      </>
    );
  }

  return (
    <>
      <PageIntro title="Special moments" subtitle="Create cinematic surprise pages for anniversaries, birthdays, apologies, and hidden reveals." />
      <SectionTitle title="Special moments" subtitle="Anniversaries, birthdays, surprises, and apology pages" />
      <GlassCard>
        <form className="space-y-4" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
          <Input placeholder="A page for our anniversary" {...form.register('title', { required: true })} />
          <Select {...form.register('type')}>
            <option value="anniversary">Anniversary</option>
            <option value="birthday">Birthday</option>
            <option value="apology">Apology</option>
            <option value="surprise">Surprise reveal</option>
          </Select>
          <Input placeholder="Reveal button label" {...form.register('reveal_label')} />
          <Textarea placeholder="Write the cinematic scroll-worthy message here…" {...form.register('body', { required: true })} />
          <Button className="w-full" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving…' : editing ? 'Update page' : 'Create page'}</Button>
        </form>
      </GlassCard>
      <div className="space-y-4">
        {(pagesQuery.data ?? []).map((page, index, list) => (
          <div key={page.id} className="space-y-3">
            <HiddenReveal title={`${page.title} • ${page.type}`} buttonLabel={page.reveal_label ?? 'Reveal'} message={page.body} />
            <div className="flex flex-wrap gap-2">
              <GhostButton onClick={() => { setEditing(page); form.reset({ title: page.title, body: page.body, type: page.type, reveal_label: page.reveal_label ?? 'Reveal surprise' }); }}>Edit</GhostButton>
              <GhostButton onClick={() => reorderMutation.mutate({ id: page.id, direction: -1 })} disabled={index === 0}>Up</GhostButton>
              <GhostButton onClick={() => reorderMutation.mutate({ id: page.id, direction: 1 })} disabled={index === list.length - 1}>Down</GhostButton>
              <GhostButton onClick={() => setDeleteTarget(page)}>Delete</GhostButton>
            </div>
          </div>
        ))}
      </div>
      <ConfirmationDialog open={Boolean(deleteTarget)} title="Delete special page?" body="This surprise page will be removed." onClose={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget); }} />
    </>
  );
}

export function SettingsPage() {
  const { coupleSpace, profile, userId, refreshAppState, signOut } = useAuth();
  const addToast = useUIStore((state) => state.addToast);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const security = useUIStore((state) => state.security);
  const setSecurity = useUIStore((state) => state.setSecurity);
  const lockApp = useUIStore((state) => state.lockApp);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [anniversaryDate, setAnniversaryDate] = useState(coupleSpace?.anniversary_date ?? '');
  const [passcode, setPasscode] = useState(security.passcode);
  const [passcodeEnabled, setPasscodeEnabled] = useState(security.enabled);
  const [lockOnBackground, setLockOnBackground] = useState(security.lockOnBackground);
  const [autoLockMinutes, setAutoLockMinutes] = useState(String(security.autoLockMinutes));
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    setAnniversaryDate(coupleSpace?.anniversary_date ?? '');
  }, [coupleSpace?.anniversary_date]);

  useEffect(() => {
    setPasscode(security.passcode);
    setPasscodeEnabled(security.enabled);
    setLockOnBackground(security.lockOnBackground);
    setAutoLockMinutes(String(security.autoLockMinutes));
  }, [security]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setInstalling(false);
      addToast({ title: 'YANSAM installed', description: 'You can now launch it like an app from your home screen.', tone: 'success' });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [addToast]);

  const activeInviteQuery = useQuery({
    queryKey: ['active-invite', userId],
    queryFn: () => listActiveInviteForUser(userId!),
    enabled: Boolean(userId),
  });

  const activeInvite = activeInviteQuery.data ?? null;
  const coupleIsFull = Boolean(coupleSpace?.user1_id && coupleSpace?.user2_id);
  const accountLinked = Boolean(profile?.partner_id);

  const createInviteMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('You need to be logged in.');
      return createInvite(userId, inviteEmail || null);
    },
    onSuccess: async (invite) => {
      setInviteCode(invite.code);
      await Promise.all([
        refreshAppState(),
        queryClient.invalidateQueries({ queryKey: ['active-invite', userId] }),
      ]);
      addToast({ title: 'Invite created', description: 'Share the code with your partner.', tone: 'success' });
    },
    onError: (error) => addToast({ title: 'Could not create invite', description: error instanceof Error ? error.message : 'Please retry.', tone: 'error' }),
  });

  const revokeInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => revokeInvite(inviteId),
    onSuccess: async () => {
      setInviteCode('');
      await queryClient.invalidateQueries({ queryKey: ['active-invite', userId] });
      addToast({ title: 'Invite revoked', description: 'That code can no longer be used to join your sanctuary.', tone: 'success' });
    },
    onError: (error) => addToast({ title: 'Could not revoke invite', description: error instanceof Error ? error.message : 'Please retry.', tone: 'error' }),
  });

  const acceptInviteMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('You need to be logged in.');
      return acceptInvite(joinCode, userId);
    },
    onSuccess: async () => {
      await refreshAppState();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['memories'] }),
        queryClient.invalidateQueries({ queryKey: ['albums'] }),
        queryClient.invalidateQueries({ queryKey: ['milestones'] }),
        queryClient.invalidateQueries({ queryKey: ['active-invite', userId] }),
      ]);
      setJoinCode('');
      addToast({ title: 'Invite accepted', description: 'Your couple room is now connected.', tone: 'success' });
    },
    onError: (error) => addToast({ title: 'Could not accept invite', description: error instanceof Error ? error.message : 'Please retry.', tone: 'error' }),
  });

  const anniversaryMutation = useMutation({
    mutationFn: async () => {
      if (!coupleSpace?.id) throw new Error('Create or join a couple room first.');
      return updateCoupleSpace(coupleSpace.id, { anniversary_date: anniversaryDate || null });
    },
    onSuccess: async () => {
      await refreshAppState();
      addToast({ title: 'Anniversary updated', tone: 'success' });
    },
    onError: (error) => addToast({ title: 'Could not update anniversary', description: error instanceof Error ? error.message : 'Please retry.', tone: 'error' }),
  });

  return (
    <div className="space-y-4">
      <GlassCard>
        <p className="font-serif text-2xl text-wine">Profile</p>
        <div className="mt-4 space-y-2 text-sm text-cocoa/80">
          <p><span className="font-medium text-wine">Name:</span> {profile?.name ?? '—'}</p>
          <p><span className="font-medium text-wine">Email:</span> {profile?.email ?? '—'}</p>
          <p><span className="font-medium text-wine">Partner linked:</span> {profile?.partner_id ? 'Yes' : 'Not yet'}</p>
        </div>
      </GlassCard>

      <GlassCard>
        <p className="font-serif text-2xl text-wine">Couple room</p>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-2 block text-sm text-cocoa/75">Anniversary date</label>
            <Input type="date" value={anniversaryDate} onChange={(event) => setAnniversaryDate(event.target.value)} disabled={!coupleSpace?.id} />
            <Button className="mt-3 w-full" onClick={() => anniversaryMutation.mutate()} disabled={!coupleSpace?.id || anniversaryMutation.isPending}>{anniversaryMutation.isPending ? 'Saving…' : 'Save anniversary'}</Button>
          </div>
          {!coupleSpace?.id ? <p className="text-sm text-cocoa/70">Create an invite or accept your partner’s invite to open the shared room.</p> : null}
        </div>
      </GlassCard>

      <GlassCard>
        <p className="font-serif text-2xl text-wine">Invite your partner</p>
        <div className="mt-4 space-y-3">
          <Input placeholder="Optional partner email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} disabled={coupleIsFull || accountLinked} />
          <Button className="w-full" onClick={() => createInviteMutation.mutate()} disabled={createInviteMutation.isPending || coupleIsFull || accountLinked}>
            {createInviteMutation.isPending ? 'Creating…' : activeInvite ? 'Refresh invite code' : 'Create invite code'}
          </Button>
          {coupleIsFull ? <p className="text-sm text-cocoa/70">Your private couple room already has both members. No more invites can be created.</p> : null}
          {!coupleIsFull && activeInviteQuery.isLoading ? <p className="text-sm text-cocoa/70">Checking your current invite…</p> : null}
          {(activeInvite ?? (inviteCode ? { code: inviteCode } : null)) ? (
            <div className="rounded-[28px] bg-white/65 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-cocoa/60">Active invite code</p>
              <p className="mt-2 font-serif text-3xl tracking-[0.2em] text-wine">{activeInvite?.code ?? inviteCode}</p>
              <div className="mt-3 space-y-1 text-sm text-cocoa/75">
                {activeInvite?.invitee_email ? <p>Reserved for: {activeInvite.invitee_email}</p> : <p>Anyone with this code can join until it is used or revoked.</p>}
                {activeInvite?.expires_at ? <p>Expires: {formatDate(activeInvite.expires_at)} • {formatRelativeDate(activeInvite.expires_at)}</p> : null}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button
                  className="w-full"
                  onClick={async () => {
                    const code = activeInvite?.code ?? inviteCode;
                    if (!code) return;
                    try {
                      await navigator.clipboard.writeText(code);
                      addToast({ title: 'Invite code copied', description: 'Send it to your partner privately.', tone: 'success' });
                    } catch (_error) {
                      addToast({ title: 'Copy failed', description: 'Select and copy the code manually.', tone: 'error' });
                    }
                  }}
                >
                  Copy code
                </Button>
                <GhostButton className="w-full" onClick={() => { if (activeInvite?.id) revokeInviteMutation.mutate(activeInvite.id); }} disabled={!activeInvite?.id || revokeInviteMutation.isPending}>
                  {revokeInviteMutation.isPending ? 'Revoking…' : 'Revoke code'}
                </GhostButton>
              </div>
            </div>
          ) : null}
        </div>
      </GlassCard>

      <GlassCard>
        <p className="font-serif text-2xl text-wine">Join with code</p>
        <div className="mt-4 space-y-3">
          <Input placeholder="Enter invite code" value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} disabled={accountLinked || Boolean(coupleSpace)} />
          <Button className="w-full" onClick={() => acceptInviteMutation.mutate()} disabled={acceptInviteMutation.isPending || accountLinked || Boolean(coupleSpace)}>
            {acceptInviteMutation.isPending ? 'Joining…' : 'Join couple room'}
          </Button>
          {accountLinked || coupleSpace ? <p className="text-sm text-cocoa/70">This account is already attached to a couple space, so it cannot join another invite.</p> : <p className="text-sm text-cocoa/70">Invite codes are single-use and protected so only one partner can claim the room.</p>}
        </div>
      </GlassCard>

      <GlassCard>
        <p className="font-serif text-2xl text-wine">Install on Android</p>
        <div className="mt-4 space-y-3">
          <p className="text-sm leading-7 text-cocoa/75">As soon as YANSAM is deployed, you and your partner will be able to add it to your home screens like a private app. This card already catches the install prompt when the browser allows it.</p>
          <Button
            className="w-full"
            disabled={!installPrompt || installing}
            onClick={async () => {
              if (!installPrompt) {
                addToast({ title: 'Install prompt not available yet', description: 'Once the live app meets Android install rules, this button will work here.', tone: 'default' });
                return;
              }

              setInstalling(true);
              await installPrompt.prompt();
              const result = await installPrompt.userChoice;
              setInstalling(false);
              setInstallPrompt(null);
              addToast({
                title: result.outcome === 'accepted' ? 'Install accepted' : 'Install dismissed',
                description: result.outcome === 'accepted' ? 'YANSAM is being added to your device.' : 'You can install it later from this same screen.',
                tone: result.outcome === 'accepted' ? 'success' : 'default',
              });
            }}
          >
            {installing ? 'Opening install prompt…' : installPrompt ? 'Install YANSAM on this device' : 'Install prompt will appear here later'}
          </Button>
        </div>
      </GlassCard>

      <GlassCard>
        <p className="font-serif text-2xl text-wine">Private app lock</p>
        <div className="mt-4 space-y-3">
          <label className="flex items-center justify-between rounded-2xl bg-white/60 px-4 py-3 text-sm text-cocoa/80">
            <span>Enable local passcode lock</span>
            <input type="checkbox" checked={passcodeEnabled} onChange={(event) => setPasscodeEnabled(event.target.checked)} />
          </label>
          <Input type="password" inputMode="numeric" placeholder="4-6 digit passcode" value={passcode} onChange={(event) => setPasscode(event.target.value)} />
          <label className="flex items-center justify-between rounded-2xl bg-white/60 px-4 py-3 text-sm text-cocoa/80">
            <span>Lock when app goes to background</span>
            <input type="checkbox" checked={lockOnBackground} onChange={(event) => setLockOnBackground(event.target.checked)} disabled={!passcodeEnabled} />
          </label>
          <div>
            <label className="mb-2 block text-sm text-cocoa/75">Auto-lock after inactivity</label>
            <Select value={autoLockMinutes} onChange={(event) => setAutoLockMinutes(event.target.value)} disabled={!passcodeEnabled}>
              <option value="1">1 minute</option>
              <option value="5">5 minutes</option>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button className="w-full" onClick={() => {
              if (passcodeEnabled && passcode.trim().length < 4) {
                addToast({ title: 'Use at least 4 digits for the passcode', tone: 'error' });
                return;
              }

              setSecurity({
                enabled: passcodeEnabled,
                passcode: passcodeEnabled ? passcode.trim() : '',
                lockOnBackground,
                autoLockMinutes: Number(autoLockMinutes),
              });

              addToast({
                title: passcodeEnabled ? 'Private app lock saved' : 'App lock disabled',
                description: passcodeEnabled ? 'Your sanctuary will now lock on resume or after inactivity.' : 'You can turn it back on any time.',
                tone: 'success',
              });
            }}>Save lock settings</Button>
            <GhostButton className="w-full" onClick={() => {
              lockApp();
              addToast({ title: 'YANSAM locked', tone: 'success' });
            }} disabled={!security.enabled || !security.passcode}>Lock now</GhostButton>
          </div>
          <p className="text-xs leading-6 text-cocoa/70">This passcode is stored locally on the current device only. It adds privacy on top of your secure account session while keeping the app Android-friendly.</p>
        </div>
      </GlassCard>

      <Button className="w-full" onClick={() => { void signOut().then(() => navigate('/login')); }}>Sign out</Button>
    </div>
  );
}