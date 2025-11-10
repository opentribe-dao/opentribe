import { auth } from "@packages/auth/server";
import {
  del,
  generateUniqueFileName,
  put,
  type UploadType,
  uploadMetadataSchema,
  validateFile,
} from "@packages/storage";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export async function OPTIONS() {
  return NextResponse.json({});
}

// POST /api/v1/upload - Upload a file
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const metadata = formData.get("metadata") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate metadata
    let parsedMetadata;
    try {
      parsedMetadata = JSON.parse(metadata || "{}");
      parsedMetadata = uploadMetadataSchema.parse(parsedMetadata);
    } catch (error) {
      return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
    }

    // Validate file type and size based on upload type
    const validation = validateFile(file, parsedMetadata.type as UploadType);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Generate a unique path for the file
    const userId = session.user.id;
    const fileName = `${userId}/${generateUniqueFileName(file.name, parsedMetadata.type as UploadType)}`;

    // Upload to Vercel Blob
    const blob = await put(fileName, file, {
      access: "public",
      addRandomSuffix: true,
    });

    // Return the URL
    return NextResponse.json({
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      pathname: blob.pathname,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/upload - Delete a file
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the URL to delete
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    // Delete from Vercel Blob
    await del(url);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
