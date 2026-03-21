import { NextRequest, NextResponse } from "next/server";
import {
  generateUniqueFileName,
  isValidAudioFile,
  MAX_FILE_SIZE,
  getFileSizeInMB,
  getUploadSignedUrl,
} from "@/lib/supabase-storage";

/**
 * POST /api/upload
 * Generate a signed URL for uploading audio files to Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!isValidAudioFile(file)) {
      return NextResponse.json(
        { error: "Invalid file type. Accepted formats: MP3, WAV, OGG, FLAC" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = getFileSizeInMB(file.size);
      return NextResponse.json(
        { error: `File too large. Maximum size: 100MB. Your file: ${sizeMB.toFixed(1)}MB` },
        { status: 400 }
      );
    }

    // Generate unique filename and upload URL
    const uniqueFileName = generateUniqueFileName(file.name);
    const { uploadUrl, publicUrl } = await getUploadSignedUrl(
      uniqueFileName,
      file.type
    );

    return NextResponse.json({
      success: true,
      uploadUrl,
      fileName: uniqueFileName,
      publicUrl,
    });
  } catch (error: any) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
