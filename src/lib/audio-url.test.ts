import test from "node:test";
import assert from "node:assert/strict";
import { stableAudioUrl } from "@/lib/audio-url";

test("stableAudioUrl maps stored track references to /api/media", () => {
  assert.equal(stableAudioUrl("track_1.mp3"), "/api/media/tracks/track_1.mp3");
  assert.equal(stableAudioUrl("tracks/track_1.mp3"), "/api/media/tracks/track_1.mp3");
  assert.equal(stableAudioUrl("announcements/a.mp3"), "/api/media/announcements/a.mp3");
  assert.equal(stableAudioUrl("/api/media/tracks/t.mp3"), "/api/media/tracks/t.mp3");
  assert.equal(stableAudioUrl("https://cdn.example/x.mp3"), "https://cdn.example/x.mp3");
  assert.equal(stableAudioUrl(undefined), undefined);
  assert.equal(stableAudioUrl(""), undefined);
});
