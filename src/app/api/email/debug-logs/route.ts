import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  const logPath = path.join(process.cwd(), "scratch", "email_debug.log");
  if (!fs.existsSync(logPath)) {
    return NextResponse.json({ logs: "No logs found yet." });
  }
  
  const content = fs.readFileSync(logPath, "utf-8");
  return new Response(content, { 
    headers: { "Content-Type": "text/plain; charset=utf-8" } 
  });
}
