import type { User } from '@supabase/supabase-js';
import { MEDIA_BUCKET, supabase } from './supabase';
import type {
  Album,
  CoupleSpace,
  Letter,
  Memory,
  Milestone,
  MoodKind,
  MoodLog,
  PartnerInvite,
  Photo,
  Profile,
  SpecialPage,
  Wish,
} from '../types';
import { reorderBySwap, sanitizeFilename } from './utils';

const hour = 60 * 60;

async function signedUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(path, hour);
  if (error) return null;
  return `${data.signedUrl}${data.signedUrl.includes('?') ? '&' : '?'}v=${Date.now()}`;
}

async function uploadFile(file: File, folder: string) {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${folder}/${crypto.randomUUID()}-${sanitizeFilename(file.name || `file.${ext}`)}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    upsert: false,
    cacheControl: '3600',
    contentType: file.type,
  });
  if (error) throw error;
  return path;
}

async function removeFiles(paths: (string | null | undefined)[]) {
  const filtered = paths.filter(Boolean) as string[];
  if (!filtered.length) return;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove(filtered);
  if (error) throw error;
}

function singleRpcRow<T>(data: T | T[] | null) {
  if (Array.isArray(data)) return (data[0] ?? null) as T | null;
  return data;
}

export async function ensureProfile(user: User) {
  const { data: existing, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (error) throw error;
  if (existing) return existing as Profile;

  const { data, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      name: (user.user_metadata.name as string | undefined) ?? user.email?.split('@')[0] ?? 'My Love',
      email: user.email ?? null,
    })
    .select('*')
    .single();

  if (insertError) throw insertError;
  return data as Profile;
}

export async function getCoupleSpaceForUser(userId: string) {
  const { data, error } = await supabase
    .from('couple_spaces')
    .select('*')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;
  return (data ?? null) as CoupleSpace | null;
}

export async function updateCoupleSpace(coupleId: string, payload: Partial<CoupleSpace>) {
  const { data, error } = await supabase.from('couple_spaces').update(payload).eq('id', coupleId).select('*').single();
  if (error) throw error;
  return data as CoupleSpace;
}

export async function createInvite(inviterId: string, inviteeEmail?: string | null) {
  const existingCouple = await getCoupleSpaceForUser(inviterId);
  if (existingCouple?.user2_id) {
    throw new Error('Your couple space already has two members.');
  }

  const { data, error } = await supabase.rpc('create_partner_invite', {
    input_invitee_email: inviteeEmail?.trim() ? inviteeEmail.trim() : null,
  });

  if (error) throw error;

  const invite = singleRpcRow<PartnerInvite>(data as PartnerInvite | PartnerInvite[] | null);
  if (!invite) throw new Error('Invite could not be created.');
  return invite;
}

export async function listActiveInviteForUser(inviterId: string) {
  const { data, error } = await supabase
    .from('partner_invites')
    .select('*')
    .eq('inviter_id', inviterId)
    .is('accepted_at', null)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;
  return (data ?? null) as PartnerInvite | null;
}

export async function revokeInvite(inviteId: string) {
  const { data, error } = await supabase.rpc('revoke_partner_invite', {
    input_invite_id: inviteId,
  });

  if (error) throw error;

  const invite = singleRpcRow<PartnerInvite>(data as PartnerInvite | PartnerInvite[] | null);
  if (!invite) throw new Error('Invite could not be revoked.');
  return invite;
}

export async function acceptInvite(code: string, currentUserId: string) {
  if (!code.trim()) throw new Error('Enter the invite code first.');

  const myCouple = await getCoupleSpaceForUser(currentUserId);
  if (myCouple) {
    throw new Error('This account already belongs to a couple space.');
  }

  const { data, error } = await supabase.rpc('accept_partner_invite', {
    input_code: code.trim().toUpperCase(),
  });

  if (error) throw error;

  const coupleSpace = singleRpcRow<CoupleSpace>(data as CoupleSpace | CoupleSpace[] | null);
  if (!coupleSpace) throw new Error('Invite could not be accepted.');
  return coupleSpace;
}

export async function listMemories(coupleId: string) {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('couple_id', coupleId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;

  const mapped = await Promise.all(
    (data ?? []).map(async (memory) => ({
      ...(memory as Memory),
      photo_src: await signedUrl(memory.photo_url),
      music_src: await signedUrl(memory.music_url),
    })),
  );

  return mapped;
}

export async function saveMemory(
  coupleId: string,
  payload: {
    id?: string;
    title: string;
    body: string;
    mood?: MoodKind | null;
    music_url?: string | null;
    memory_date?: string | null;
    favorite?: boolean;
    pinned?: boolean;
    archived?: boolean;
    photoFile?: File | null;
    musicFile?: File | null;
    existingPhotoPath?: string | null;
    existingMusicPath?: string | null;
  },
) {
  let photoPath = payload.existingPhotoPath ?? null;
  let musicPath = payload.existingMusicPath ?? payload.music_url ?? null;

  if (payload.photoFile) {
    photoPath = await uploadFile(payload.photoFile, `${coupleId}/memories`);
    if (payload.existingPhotoPath && payload.existingPhotoPath !== photoPath) {
      await removeFiles([payload.existingPhotoPath]);
    }
  }

  if (payload.musicFile) {
    musicPath = await uploadFile(payload.musicFile, `${coupleId}/memories/audio`);
    if (payload.existingMusicPath && payload.existingMusicPath != musicPath) {
      await removeFiles([payload.existingMusicPath]);
    }
  }

  const record = {
    couple_id: coupleId,
    title: payload.title,
    body: payload.body,
    mood: payload.mood ?? null,
    music_url: musicPath ?? null,
    memory_date: payload.memory_date ?? null,
    favorite: payload.favorite ?? false,
    pinned: payload.pinned ?? false,
    archived: payload.archived ?? false,
    photo_url: photoPath,
  };

  if (payload.id) {
    const { data, error } = await supabase.from('memories').update(record).eq('id', payload.id).select('*').single();
    if (error) throw error;
    return { ...(data as Memory), photo_src: await signedUrl(data.photo_url) };
  }

  const { data, error } = await supabase.from('memories').insert(record).select('*').single();
  if (error) throw error;
  return { ...(data as Memory), photo_src: await signedUrl(data.photo_url) };
}

export async function deleteMemory(memory: Memory) {
  const { error } = await supabase.from('memories').delete().eq('id', memory.id);
  if (error) throw error;
  await removeFiles([memory.photo_url]);
}

export async function listAlbums(coupleId: string) {
  const { data, error } = await supabase
    .from('albums')
    .select('*, photos(*)')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const mapped = await Promise.all(
    ((data as unknown as Album[]) ?? []).map(async (album) => {
      const photos = await Promise.all(
        ((album.photos ?? []) as Photo[])
          .sort((a, b) => b.position - a.position || new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .map(async (photo) => ({ ...photo, src: await signedUrl(photo.url) })),
      );
      const coverPath = album.cover_url ?? photos[0]?.url ?? null;
      return {
        ...album,
        photos,
        cover_src: await signedUrl(coverPath),
      } as Album;
    }),
  );

  return mapped;
}

export async function saveAlbum(coupleId: string, payload: { id?: string; title: string; cover_url?: string | null }) {
  if (payload.id) {
    const { data, error } = await supabase
      .from('albums')
      .update({ title: payload.title, cover_url: payload.cover_url ?? null })
      .eq('id', payload.id)
      .select('*')
      .single();
    if (error) throw error;
    return data as Album;
  }

  const { data, error } = await supabase
    .from('albums')
    .insert({ couple_id: coupleId, title: payload.title, cover_url: payload.cover_url ?? null })
    .select('*')
    .single();
  if (error) throw error;
  return data as Album;
}

export async function deleteAlbum(album: Album) {
  const photos = album.photos ?? [];
  await removeFiles([album.cover_url, ...photos.map((photo) => photo.url)]);
  const { error } = await supabase.from('albums').delete().eq('id', album.id);
  if (error) throw error;
}

export async function addPhotos(albumId: string, coupleId: string, files: File[]) {
  const uploaded = await Promise.all(
    files.map(async (file, index) => ({
      album_id: albumId,
      couple_id: coupleId,
      url: await uploadFile(file, `${coupleId}/albums/${albumId}`),
      position: index,
    })),
  );

  const { error } = await supabase.from('photos').insert(uploaded);
  if (error) throw error;
}

export async function deletePhoto(photo: Photo) {
  const { error } = await supabase.from('photos').delete().eq('id', photo.id);
  if (error) throw error;
  await removeFiles([photo.url]);
}

export async function movePhoto(photoId: string, targetAlbumId: string) {
  const { error } = await supabase.from('photos').update({ album_id: targetAlbumId }).eq('id', photoId);
  if (error) throw error;
}

export async function setAlbumCover(albumId: string, photoPath: string | null) {
  const { error } = await supabase.from('albums').update({ cover_url: photoPath }).eq('id', albumId);
  if (error) throw error;
}

export async function listMilestones(coupleId: string) {
  const { data, error } = await supabase
    .from('milestones')
    .select('*')
    .eq('couple_id', coupleId)
    .order('position', { ascending: true })
    .order('date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Milestone[];
}

export async function saveMilestone(coupleId: string, payload: { id?: string; title: string; date: string; type: string; position?: number }) {
  if (payload.id) {
    const { data, error } = await supabase.from('milestones').update(payload).eq('id', payload.id).select('*').single();
    if (error) throw error;
    return data as Milestone;
  }
  const { data: existing } = await supabase.from('milestones').select('id').eq('couple_id', coupleId);
  const { data, error } = await supabase
    .from('milestones')
    .insert({ couple_id: coupleId, title: payload.title, date: payload.date, type: payload.type, position: existing?.length ?? 0 })
    .select('*')
    .single();
  if (error) throw error;
  return data as Milestone;
}

export async function deleteMilestone(id: string) {
  const { error } = await supabase.from('milestones').delete().eq('id', id);
  if (error) throw error;
}

export async function reorderCoupleItems<T extends Milestone | Wish | SpecialPage>(
  table: 'milestones' | 'wishes' | 'special_pages',
  items: T[],
  id: string,
  direction: -1 | 1,
) {
  const next = reorderBySwap(items, id, direction);
  const updates = next.map((item) => supabase.from(table).update({ position: item.position }).eq('id', item.id));
  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
  return next;
}

export async function listLetters(coupleId: string) {
  const { data, error } = await supabase.from('letters').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Letter[];
}

export async function saveLetter(coupleId: string, payload: { id?: string; title: string; body: string; unlock_type: string; unlock_date?: string | null }) {
  if (payload.id) {
    const { data, error } = await supabase.from('letters').update(payload).eq('id', payload.id).select('*').single();
    if (error) throw error;
    return data as Letter;
  }
  const { data, error } = await supabase.from('letters').insert({ couple_id: coupleId, ...payload }).select('*').single();
  if (error) throw error;
  return data as Letter;
}

export async function openLetter(id: string) {
  const { error } = await supabase.from('letters').update({ opened: true }).eq('id', id);
  if (error) throw error;
}

export async function deleteLetter(id: string) {
  const { error } = await supabase.from('letters').delete().eq('id', id);
  if (error) throw error;
}

export async function listMoods(coupleId: string) {
  const { data, error } = await supabase.from('moods').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as MoodLog[];
}

export async function saveMood(coupleId: string, payload: { id?: string; mood: MoodKind; note?: string | null }) {
  if (payload.id) {
    const { data, error } = await supabase.from('moods').update(payload).eq('id', payload.id).select('*').single();
    if (error) throw error;
    return data as MoodLog;
  }
  const { data, error } = await supabase.from('moods').insert({ couple_id: coupleId, ...payload }).select('*').single();
  if (error) throw error;
  return data as MoodLog;
}

export async function deleteMood(id: string) {
  const { error } = await supabase.from('moods').delete().eq('id', id);
  if (error) throw error;
}

export async function listWishes(coupleId: string) {
  const { data, error } = await supabase
    .from('wishes')
    .select('*')
    .eq('couple_id', coupleId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Wish[];
}

export async function saveWish(coupleId: string, payload: { id?: string; title: string; kind: string; done?: boolean; position?: number }) {
  if (payload.id) {
    const { data, error } = await supabase.from('wishes').update(payload).eq('id', payload.id).select('*').single();
    if (error) throw error;
    return data as Wish;
  }
  const { data: existing } = await supabase.from('wishes').select('id').eq('couple_id', coupleId);
  const { data, error } = await supabase
    .from('wishes')
    .insert({ couple_id: coupleId, title: payload.title, kind: payload.kind, done: payload.done ?? false, position: existing?.length ?? 0 })
    .select('*')
    .single();
  if (error) throw error;
  return data as Wish;
}

export async function deleteWish(id: string) {
  const { error } = await supabase.from('wishes').delete().eq('id', id);
  if (error) throw error;
}

export async function listSpecialPages(coupleId: string) {
  const { data, error } = await supabase
    .from('special_pages')
    .select('*')
    .eq('couple_id', coupleId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as SpecialPage[];
}

export async function saveSpecialPage(
  coupleId: string,
  payload: { id?: string; title: string; body: string; type: string; reveal_label?: string | null; position?: number },
) {
  if (payload.id) {
    const { data, error } = await supabase.from('special_pages').update(payload).eq('id', payload.id).select('*').single();
    if (error) throw error;
    return data as SpecialPage;
  }
  const { data: existing } = await supabase.from('special_pages').select('id').eq('couple_id', coupleId);
  const { data, error } = await supabase
    .from('special_pages')
    .insert({
      couple_id: coupleId,
      title: payload.title,
      body: payload.body,
      type: payload.type,
      reveal_label: payload.reveal_label ?? null,
      position: existing?.length ?? 0,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as SpecialPage;
}

export async function deleteSpecialPage(id: string) {
  const { error } = await supabase.from('special_pages').delete().eq('id', id);
  if (error) throw error;
}

export async function listNotifications(coupleId: string) {
  const { data, error } = await supabase.from('notifications').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false }).limit(6);
  if (error) throw error;
  return data ?? [];
}