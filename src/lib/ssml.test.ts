import test from "node:test";
import assert from "node:assert/strict";

import { validateSsmlBasic } from "@/lib/ssml";

test("validateSsmlBasic accepts valid SSML structure", () => {
  const result = validateSsmlBasic("<speak>Привет <break time='300ms'/> мир</speak>");
  assert.equal(result.errors.length, 0);
});

test("validateSsmlBasic rejects unknown tags", () => {
  const result = validateSsmlBasic("<speak><audio src='x.mp3'/></speak>");
  assert.ok(result.errors.some((e) => e.includes("Недопустимый тег")));
});

test("validateSsmlBasic detects incorrect nesting", () => {
  const result = validateSsmlBasic("<speak><prosody>Тест</speak></prosody>");
  assert.ok(result.errors.some((e) => e.includes("Нарушена вложенность")));
});

test("validateSsmlBasic warns when speak root is missing", () => {
  const result = validateSsmlBasic("<prosody rate='90%'>Текст</prosody>");
  assert.ok(result.warnings.some((w) => w.includes("<speak>")));
});
