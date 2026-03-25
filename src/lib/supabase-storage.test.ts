import test from "node:test";
import assert from "node:assert/strict";

import { parseStorageObjectRef } from "@/lib/storage-object-ref";

test("parseStorageObjectRef parses Supabase public URL with folder", () => {
  const ref = parseStorageObjectRef(
    "https://xyz.supabase.co/storage/v1/object/public/bizmusic-assets/announcements/track_123.mp3"
  );

  assert.equal(ref.folder, "announcements");
  assert.equal(ref.fileName, "track_123.mp3");
  assert.equal(ref.objectPath, "announcements/track_123.mp3");
});

test("parseStorageObjectRef strips query string from signed URL", () => {
  const ref = parseStorageObjectRef(
    "https://xyz.supabase.co/storage/v1/object/sign/bizmusic-assets/tracks/song.mp3?token=abc"
  );

  assert.equal(ref.folder, "tracks");
  assert.equal(ref.fileName, "song.mp3");
  assert.equal(ref.objectPath, "tracks/song.mp3");
});

test("parseStorageObjectRef supports relative object paths", () => {
  const ref = parseStorageObjectRef("announcements/daily/promo.mp3");

  assert.equal(ref.folder, "announcements/daily");
  assert.equal(ref.fileName, "promo.mp3");
  assert.equal(ref.objectPath, "announcements/daily/promo.mp3");
});

test("parseStorageObjectRef falls back to default folder for bare filename", () => {
  const ref = parseStorageObjectRef("voice.mp3", "announcements");

  assert.equal(ref.folder, "announcements");
  assert.equal(ref.fileName, "voice.mp3");
  assert.equal(ref.objectPath, "announcements/voice.mp3");
});
