# FFmpeg Setup for Jingle Mixing

The announcement jingle feature requires `ffmpeg` in runtime environment.

## Local Development (macOS)

```bash
brew install ffmpeg
ffmpeg -version | head -1
```

## Docker (Production)

The project Dockerfile already installs ffmpeg in runner image:

```dockerfile
RUN apk add --no-cache ffmpeg
```

Rebuild image after pulling latest changes.

## Ubuntu/Debian Server

```bash
sudo apt-get update
sudo apt-get install -y ffmpeg
ffmpeg -version | head -1
```

## Verification Checklist

1. `ffmpeg -version` returns a version string.
2. Admin can upload a jingle in Admin Content -> Announcements.
3. User can select jingle in announcement form.
4. Generated announcement contains intro/outro jingle with smooth transition.

## Safety Limits

- Max jingle duration: 12 seconds.
- Recommended loudness: -12 dB to -3 dB.
- Position supported: `intro` or `outro`.
