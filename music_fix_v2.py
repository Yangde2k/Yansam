from pathlib import Path
import re

# ---------- utils.ts ----------
utils_path = Path("src/lib/utils.ts")
utils = utils_path.read_text()

if "export function getSafeExternalUrl" not in utils:
    utils += """

export function getSafeExternalUrl(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const normalized = /^https?:\\/\\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
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
"""
    utils_path.write_text(utils)

# ---------- components.tsx ----------
components_path = Path("src/components.tsx")
components = components_path.read_text()

components = components.replace(
    "import { cn, formatDate, formatRelativeDate, getInitials, getMoodMeta, isUnlocked } from './lib/utils';",
    "import { cn, formatDate, formatRelativeDate, getExternalAudioLabel, getInitials, getMoodMeta, getSafeExternalUrl, isDirectAudioUrl, isUnlocked } from './lib/utils';"
)

new_audio_block = """export function AmbientAudioPlayer({ src }: { src?: string | null }) {
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

export function MemoryCard"""

components, count = re.subn(
    r"export function AmbientAudioPlayer\(\{ src \}: \{ src\?: string \| null \}\) \{.*?\n\}\n\nexport function MemoryCard",
    new_audio_block,
    components,
    flags=re.S,
)

if count != 1:
    raise SystemExit("Could not replace AmbientAudioPlayer block.")

components_path.write_text(components)

# ---------- app-pages.tsx ----------
pages_path = Path("src/pages/app-pages.tsx")
pages = pages_path.read_text()

old_line = '<Input placeholder="https://…" {...form.register(\'music_url\')} />'
new_line = '<Input placeholder="Direct .mp3 link, Spotify, YouTube…" {...form.register(\'music_url\')} />\\n              <p className="mt-2 text-xs text-cocoa/65">Direct audio files play inside YANSAM. Spotify, YouTube, and similar links will open externally as a fallback.</p>'

if old_line in pages:
    pages = pages.replace(old_line, new_line)
    pages_path.write_text(pages)

print("music fallback patch applied successfully")
