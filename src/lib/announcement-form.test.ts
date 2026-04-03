import test from "node:test";
import assert from "node:assert/strict";

import { buildAnnouncementPayload } from "@/lib/announcement-form";

test("buildAnnouncementPayload includes jingleId when selected", () => {
  const payload = buildAnnouncementPayload({
    title: "Тест",
    text: "Текст",
    provider: "sberbank",
    voiceName: "Nec_24000",
    speakingRate: 1,
    pitch: 0,
    selectedJingleId: "jingle-123",
    useSsml: false,
    ssmlText: "",
  });

  assert.equal(payload.jingleId, "jingle-123");
  assert.equal(payload.ssmlText, undefined);
});

test("buildAnnouncementPayload omits jingleId when empty", () => {
  const payload = buildAnnouncementPayload({
    title: "Тест",
    text: "Текст",
    provider: "sberbank",
    voiceName: "Nec_24000",
    speakingRate: 1,
    pitch: 0,
    selectedJingleId: "",
    useSsml: false,
    ssmlText: "",
  });

  assert.equal(payload.jingleId, undefined);
});

test("buildAnnouncementPayload includes ssmlText only when SSML mode is enabled", () => {
  const withSsml = buildAnnouncementPayload({
    title: "Тест",
    text: "fallback",
    provider: "google",
    voiceName: "ru-RU-Wavenet-A",
    speakingRate: 1,
    pitch: 0,
    selectedJingleId: "",
    useSsml: true,
    ssmlText: "  <speak>Привет</speak>  ",
  });

  const withoutSsml = buildAnnouncementPayload({
    title: "Тест",
    text: "fallback",
    provider: "google",
    voiceName: "ru-RU-Wavenet-A",
    speakingRate: 1,
    pitch: 0,
    selectedJingleId: "",
    useSsml: false,
    ssmlText: "<speak>Привет</speak>",
  });

  assert.equal(withSsml.ssmlText, "<speak>Привет</speak>");
  assert.equal(withoutSsml.ssmlText, undefined);
});
