import { NextResponse } from "next/server";
import { generateWaveBatchAction } from "@/lib/actions/wave";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { businessId, excludeTrackIds } = await req.json();

    if (!businessId) {
      return NextResponse.json({ success: false, error: "Missing businessId" }, { status: 400 });
    }

    const result = await generateWaveBatchAction(businessId, excludeTrackIds || []);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
