import { db } from "../src/db";
import { leadActivities } from "../src/db/schema";

async function test() {
  try {
    const res = await db.insert(leadActivities).values({
      leadId: "674e2355-5ea4-49e7-bb8c-9d5e24c056c8",
      agentId: "8c935ea2-0656-4541-8673-dd94835a0f2a",
      type: "email_sent",
      note: "Отправлен первый email",
      emailSubject: "Проверка РАО — вы готовы? ⚠️",
      emailBodyText: "Test body",
      emailTo: "daniel.smurts@yandex.ru",
      emailMessageId: "test-id",
      isRead: true,
      createdAt: new Date(),
    }).returning();
    console.log("Success:", res);
  } catch (e) {
    console.error("FAILURE:", e);
  }
  process.exit(0);
}

test();
