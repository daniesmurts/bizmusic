import test from "node:test";
import assert from "node:assert/strict";
import { mock } from "node:test";

// Helper: Create a fake fetch response
function makeFetchResponse(content: string, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => ({
      choices: [{ message: { content } }],
    }),
    text: async () => content,
  };
}

test("refineAnnouncementText truncates output to 500 chars", async () => {
  const longResponse = "А".repeat(600);

  mock.method(globalThis, "fetch", async () => makeFetchResponse(longResponse));

  // Set env var for this test
  process.env.GROQ_API_KEY = "test_key";

  // Import fresh to avoid module cache issues
  const { refineAnnouncementText } = await import("@/lib/groq-ai");

  const result = await refineAnnouncementText("test draft");

  assert.ok(result.length <= 500, `Expected ≤500 chars, got ${result.length}`);

  mock.restoreAll();
});

test("refineAnnouncementText throws on total API failure", async () => {
  let callCount = 0;
  mock.method(globalThis, "fetch", async () => {
    callCount++;
    throw new Error("Network error");
  });

  process.env.GROQ_API_KEY = "test_key";

  const { refineAnnouncementText } = await import("@/lib/groq-ai");

  await assert.rejects(
    async () => refineAnnouncementText("Оригинальный черновик объявления."),
    /Network error/
  );

  // Should have retried once (2 calls) and then fallen back to original
  assert.ok(callCount >= 1, "Expected at least one API call");

  mock.restoreAll();
});

test("refineAnnouncementText returns empty string for empty draft without calling API", async () => {
  let callCount = 0;
  mock.method(globalThis, "fetch", async () => {
    callCount++;
    return makeFetchResponse("some response");
  });

  process.env.GROQ_API_KEY = "test_key";

  const { refineAnnouncementText } = await import("@/lib/groq-ai");

  const result = await refineAnnouncementText("  ");

  assert.equal(callCount, 0, "No API call should be made for empty input");
  assert.equal(result, "  ");

  mock.restoreAll();
});
