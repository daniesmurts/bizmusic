import { NextResponse } from "next/server";
import { generateWaveBatchAction } from "@/lib/actions/wave";

export async function POST(req: Request) {
  try {
    const { businessId, excludeTrackIds } = await req.json();
    
    if (!businessId) {
      return NextResponse.json({ success: false, error: "Missing businessId" }, { status: 400 });
    }

    const result = await generateWaveBatchAction(businessId, excludeTrackIds || []);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
