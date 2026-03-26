import { NextRequest, NextResponse } from "next/server";
import {
  generateUniqueFileName,
  isValidAudioFile,
  MAX_FILE_SIZE,
  getFileSizeInMB,
  getUploadSignedUrl,
} from "@/lib/supabase-storage";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/upload
 * Generate a signed URL for uploading audio/image files to Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check — only authenticated users can upload
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fileName, fileSize, fileType, type = 'audio' } = body;

    if (!fileName || !fileSize) {
      return NextResponse.json(
        { error: "Missing file metadata (fileName or fileSize)" },
        { status: 400 }
      );
    }

    if (type === 'image') {
      const validImageTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/svg+xml',
      ];
      if (fileType && !validImageTypes.includes(fileType)) {
        return NextResponse.json(
          { error: "Invalid image type. Accepted formats: JPG, PNG, WEBP, GIF, SVG" },
          { status: 400 }
        );
      }
    } else {
      // Validate audio file type
      const validAudioTypes = [
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/wave',
        'audio/x-wav',
        'audio/ogg',
        'audio/flac',
      ];

      if (fileType && !validAudioTypes.includes(fileType)) {
        return NextResponse.json(
          { error: "Invalid file type. Accepted formats: MP3, WAV, OGG, FLAC" },
          { status: 400 }
        );
      }
    }

    // Validate file size
    if (fileSize > MAX_FILE_SIZE) {
      const sizeMB = fileSize / (1024 * 1024);
      return NextResponse.json(
        { error: `File too large. Maximum size: 100MB. Your file: ${sizeMB.toFixed(1)}MB` },
        { status: 400 }
      );
    }

    // Generate unique filename and upload URL
    const uniqueFileName = generateUniqueFileName(fileName);
    const folder = type === 'image'
      ? 'blog'
      : type === 'announcement'
      ? 'announcements'
      : 'tracks';
    const { uploadUrl, publicUrl } = await getUploadSignedUrl(uniqueFileName, folder, fileType);

    return NextResponse.json({
      success: true,
      uploadUrl,
      fileName: uniqueFileName,
      publicUrl,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate upload URL";
    console.error("Upload API error:", error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
