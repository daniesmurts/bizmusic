import test from "node:test";
import assert from "node:assert/strict";
import { getSsl, stripSslParams } from "@/db/ssl";

test("stripSslParams removes ssl params but keeps the rest", () => {
  const out = stripSslParams(
    "postgresql://u:p@c-abc.rw.mdb.yandexcloud.net:6432/bizmuzik?sslmode=verify-full&application_name=app",
  );
  assert.equal(out, "postgresql://u:p@c-abc.rw.mdb.yandexcloud.net:6432/bizmuzik?application_name=app");
});

test("getSsl pins the Yandex CA for YC hosts only", () => {
  const yc = getSsl("postgresql://u:p@c-abc.rw.mdb.yandexcloud.net:6432/db");
  assert.ok(yc && yc.rejectUnauthorized === true && yc.ca.includes("BEGIN CERTIFICATE"));
  assert.equal(getSsl("postgresql://u:p@localhost:5432/db"), false);
});
