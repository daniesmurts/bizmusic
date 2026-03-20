"use server";

import { prisma } from "@/lib/prisma";
import { generateLicensePDF } from "@/lib/license-generator";
import { supabaseAdmin } from "@/lib/supabase-storage";
import { revalidatePath } from "next/cache";

const BUCKET_NAME = 'bizmusic-assets';

/**
 * Generate a new license for a business
 */
export async function generateLicenseAction(businessId: string) {
  try {
    // 1. Fetch business details
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return { success: false, error: "Бизнес не найден" };
    }

    // 2. Prepare license data
    const licenseNumber = `BM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const validFrom = new Date();
    const validTo = new Date();
    validTo.setFullYear(validTo.getFullYear() + 1); // 1 year validity

    const licenseId = crypto.randomUUID(); 
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${appUrl}/verify/${licenseId}`;

    // 3. Generate PDF
    const pdfBuffer = await generateLicensePDF({
      businessName: business.legalName,
      inn: business.inn,
      licenseNumber: licenseNumber,
      validFrom: validFrom.toLocaleDateString("ru-RU"),
      validTo: validTo.toLocaleDateString("ru-RU"),
      verificationUrl: verificationUrl,
    });

    // 4. Upload to Supabase
    const fileName = `licenses/${licenseId}.pdf`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // 5. Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    // 6. Create database record
    const license = await prisma.license.create({
      data: {
        id: licenseId,
        businessId: business.id,
        licenseNumber: licenseNumber,
        signingName: "D. Smurts",
        issuedAt: validFrom,
        expiresAt: validTo,
        validFrom: validFrom,
        validTo: validTo,
        pdfUrl: publicUrl,
        totalCost: 0,
      },
    });

    // 7. Update business status
    await prisma.business.update({
      where: { id: businessId },
      data: { subscriptionStatus: "ACTIVE" }
    });

    revalidatePath("/admin/clients");
    revalidatePath("/admin/logs");

    return { success: true, data: license };
  } catch (error: any) {
    console.error("License generation error:", error);
    return { success: false, error: error.message || "Failed to generate license" };
  }
}

/**
 * Fetch all licenses
 */
export async function getLicensesAction() {
  try {
    const licenses = await prisma.license.findMany({
      include: {
        business: true
      },
      orderBy: {
        issuedAt: "desc"
      }
    });

    return { success: true, data: licenses };
  } catch (error: any) {
    console.error("Error fetching licenses:", error);
    return { success: false, error: "Не удалось загрузить список лицензий" };
  }
}

export async function getLicenseByIdAction(id: string) {
  try {
    const license = await prisma.license.findUnique({
      where: { id },
      include: {
        business: {
          include: {
            user: true
          }
        }
      }
    });

    if (!license) {
      return { success: false, error: "Лицензия не найдена" };
    }

    return { success: true, data: license };
  } catch (error: any) {
    console.error("Error fetching license:", error);
    return { success: false, error: "Ошибка при получении лицензии" };
  }
}
