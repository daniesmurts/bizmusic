import { NextResponse } from "next/server";
import { generateWaveBatchAction } from "@/lib/actions/wave";
import { createClient } from "@/utils/supabase/server";
import { resolveAccessScope } from "@/lib/auth/scope";

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

    const scope = await resolveAccessScope(user.id);
    if (!scope || (scope.role !== "ADMIN" && scope.businessId !== businessId)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const result = await generateWaveBatchAction(businessId, excludeTrackIds || []);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
