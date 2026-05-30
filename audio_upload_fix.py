from pathlib import Path

# ---------- Patch types.ts ----------
p = Path("src/types.ts")
text = p.read_text()
if "music_src?: string | null" not in text:
    text = text.replace(
        "export type Memory = Database['public']['Tables']['memories']['Row'] & { photo_src?: string | null };",
        "export type Memory = Database['public']['Tables']['memories']['Row'] & { photo_src?: string | null; music_src?: string | null };",
    )
p.write_text(text)

# ---------- Patch api.ts ----------
p = Path("src/lib/api.ts")
text = p.read_text()

text = text.replace(
"""  const mapped = await Promise.all(
    (data ?? []).map(async (memory) => ({
      ...(memory as Memory),
      photo_src: await signedUrl(memory.photo_url),
    })),
  );

  return mapped;
}
""",
"""  const mapped = await Promise.all(
    (data ?? []).map(async (memory) => ({
      ...(memory as Memory),
      photo_src: await signedUrl(memory.photo_url),
      music_src: await signedUrl(memory.music_url),
    })),
  );

  return mapped;
}
""",
)

text = text.replace(
"""    archived?: boolean;
    photoFile?: File | null;
    existingPhotoPath?: string | null;
  },
) {
  let photoPath = payload.existingPhotoPath ?? null;

  if (payload.photoFile) {
    photoPath = await uploadFile(payload.photoFile, `${coupleId}/memories`);
    if (payload.existingPhotoPath && payload.existingPhotoPath !== photoPath) {
      await removeFiles([payload.existingPhotoPath]);
    }
  }

  const record = {
    couple_id: coupleId,
    title: payload.title,
    body: payload.body,
    mood: payload.mood ?? null,
    music_url: payload.music_url ?? null,
""",
"""    archived?: boolean;
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
""",
)

text = text.replace(
"""    return { ...(data as Memory), photo_src: await signedUrl(data.photo_url), music_src: await signedUrl(data.music_url) };
  }

  const { data, error } = await supabase.from('memories').insert(record).select('*').single();
  if (error) throw error;
  return { ...(data as Memory), photo_src: await signedUrl(data.photo_url), music_src: await signedUrl(data.music_url) };
}

export async function deleteMemory(memory: Memory) {
  const { error } = await supabase.from('memories').delete().eq('id', memory.id);
  if (error) throw error;
  await removeFiles([memory.photo_url, memory.music_url]);
}
""",
"""    return { ...(data as Memory), photo_src: await signedUrl(data.photo_url), music_src: await signedUrl(data.music_url) };
  }

  const { data, error } = await supabase.from('memories').insert(record).select('*').single();
  if (error) throw error;
  return { ...(data as Memory), photo_src: await signedUrl(data.photo_url), music_src: await signedUrl(data.music_url) };
}

export async function deleteMemory(memory: Memory) {
  const { error } = await supabase.from('memories').delete().eq('id', memory.id);
  if (error) throw error;
  await removeFiles([memory.photo_url, memory.music_url]);
}
""",
)

p.write_text(text)

# ---------- Patch components.tsx ----------
p = Path("src/components.tsx")
text = p.read_text()

if "FileAudio2" not in text:
    text = text.replace("  Camera,\n  Check,\n", "  Camera,\n  Check,\n  FileAudio2,\n")

if "export { CalendarDays, Camera, FileAudio2, Heart, Home, Image, LetterText, Lock, Plus, Sparkles, Target };" not in text:
    text = text.replace(
        "export { CalendarDays, Camera, Heart, Home, Image, LetterText, Lock, Plus, Sparkles, Target };",
        "export { CalendarDays, Camera, FileAudio2, Heart, Home, Image, LetterText, Lock, Plus, Sparkles, Target };",
    )

p.write_text(text)

# ---------- Patch app-pages.tsx ----------
p = Path("src/pages/app-pages.tsx")
text = p.read_text()

if "FileAudio2," not in text:
    text = text.replace("  Image,\n  Input,\n", "  FileAudio2,\n  Image,\n  Input,\n")

if "const [selectedMusicFile, setSelectedMusicFile] = useState<File | null>(null);" not in text:
    text = text.replace(
        "  const [selectedFile, setSelectedFile] = useState<File | null>(null);\n  const [previewUrl, setPreviewUrl] = useState<string | null>(null);\n",
        "  const [selectedFile, setSelectedFile] = useState<File | null>(null);\n  const [selectedMusicFile, setSelectedMusicFile] = useState<File | null>(null);\n  const [previewUrl, setPreviewUrl] = useState<string | null>(null);\n",
    )

text = text.replace(
"""        music_url: values.music_url || null,
        memory_date: values.memory_date || null,
        favorite: editing?.favorite ?? false,
        pinned: editing?.pinned ?? false,
        archived: editing?.archived ?? false,
        photoFile: selectedFile,
        existingPhotoPath: editing?.photo_url ?? null,
""",
"""        music_url: selectedMusicFile ? null : values.music_url || null,
        memory_date: values.memory_date || null,
        favorite: editing?.favorite ?? false,
        pinned: editing?.pinned ?? false,
        archived: editing?.archived ?? false,
        photoFile: selectedFile,
        musicFile: selectedMusicFile,
        existingPhotoPath: editing?.photo_url ?? null,
        existingMusicPath: editing?.music_url ?? null,
""",
)

text = text.replace(
"""      setSelectedFile(null);
      form.reset({ title: '', body: '', mood: 'grateful', music_url: '', memory_date: todayIsoDate() });
""",
"""      setSelectedFile(null);
      setSelectedMusicFile(null);
      form.reset({ title: '', body: '', mood: 'grateful', music_url: '', memory_date: todayIsoDate() });
""",
)

text = text.replace(
"""        existingPhotoPath: memory.photo_url,
""",
"""        existingPhotoPath: memory.photo_url,
        existingMusicPath: memory.music_url,
""",
)

text = text.replace(
"""    setSelectedFile(null);
    form.reset({
""",
"""    setSelectedFile(null);
    setSelectedMusicFile(null);
    form.reset({
""",
)

if "Audio file from your device (optional)" not in text:
    needle = """          </div>
          <div>
            <label className="mb-2 block text-sm text-cocoa/75">Photo</label>
"""
    insert = """          </div>
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
"""
    text = text.replace(needle, insert)

p.write_text(text)

print("audio upload patch file created successfully")
