"use server";

import { db } from "@/db";
import { businesses, licenses, users, locations } from "@/db/schema";
import { eq, desc, inArray, sql, and } from "drizzle-orm";
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
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.id, businessId),
    });

    if (!business) {
      return { success: false, error: "Бизнес не найден" };
    }

    // 2. Prepare license data
    const licenseNumber = `BM-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
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
    const [license] = await db.insert(licenses).values({
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
    }).returning();

    // 7. Update business status
    await db.update(businesses)
      .set({ subscriptionStatus: "ACTIVE" })
      .where(eq(businesses.id, businessId));

    revalidatePath("/admin/clients");
    revalidatePath("/admin/logs");

    return { success: true, data: license };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate license";
    console.error("License generation error:", error);
    return { success: false, error: message };
  }
}

/**
 * Fetch all licenses
 */
export async function getLicensesAction() {
  try {
    const licensesList = await db.query.licenses.findMany({
      with: {
        business: true
      },
      orderBy: [desc(licenses.issuedAt)],
    });

    return { success: true, data: licensesList };
  } catch (error: unknown) {
    console.error("Error fetching licenses:", error);
    return { success: false, error: "Не удалось загрузить список лицензий" };
  }
}

export async function getLicenseByIdAction(id: string) {
  try {
    const license = await db.query.licenses.findFirst({
      where: eq(licenses.id, id),
      with: {
        business: {
          with: {
            user: true
          }
        }
      }
    });

    if (!license) {
      return { success: false, error: "Лицензия не найдена" };
    }

    return { success: true, data: license };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ошибка при получении лицензии";
    console.error("Error fetching license:", error);
    return { success: false, error: message };
  }
}

/**
 * Form-based contract submission: creates/updates business record and generates license PDF
 */
export interface ContractFormData {
  businessType: string;
  businessCategory: string;
  legalName: string;
  inn: string;
  ogrn: string;
  kpp: string;
  regAddress: string;
  phone: string;
  contactPerson: string;
  bankName: string;
  bik: string;
  settlementAccount: string;
  corrAccount: string;
  tradePoints: string[];
  signingName: string;
}

export async function submitContractAction(formData: ContractFormData) {
  try {
    // Get authenticated user from Supabase session
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return { success: false, error: "Пользователь не авторизован" };
    }

    // Find or create Drizzle user record and SYNC ID with Supabase
    let dbUser = await db.query.users.findFirst({ where: eq(users.id, authUser.id) });

    if (!dbUser) {
      console.log(`[SubmitContract] Drizzle user not found for ID: ${authUser.id}, creating...`);
      const [newUser] = await db.insert(users).values({
        id: authUser.id,
        email: authUser.email!,
        passwordHash: "SUPABASE_AUTH",
        role: "BUSINESS_OWNER",
      }).returning();
      dbUser = newUser;
    } else if (dbUser.email !== authUser.email) {
      // Sync email if it changed in Supabase
      const [updatedUser] = await db.update(users)
        .set({ email: authUser.email! })
        .where(eq(users.id, authUser.id))
        .returning();
      dbUser = updatedUser;
    }

    // Upsert business record using the real user ID
    // Using onConflictDoUpdate to ensure atomicity and prevent race conditions
    const [business] = await db.insert(businesses).values({
      userId: dbUser.id,
      inn: formData.inn,
      ogrn: formData.ogrn,
      kpp: formData.kpp,
      legalName: formData.legalName,
      address: formData.regAddress,
      subscriptionStatus: "INACTIVE",
    })
    .onConflictDoUpdate({
      target: businesses.inn,
      set: {
        userId: dbUser.id,
        ogrn: formData.ogrn,
        kpp: formData.kpp,
        legalName: formData.legalName,
        address: formData.regAddress,
        updatedAt: new Date(),
      },
    })
    .returning();

    // Save trade points as Location records
    if (formData.tradePoints && formData.tradePoints.length > 0) {
      const normalizedPoints = formData.tradePoints
        .map(p => p.trim())
        .filter(p => p !== "");
      
      if (normalizedPoints.length > 0) {
        // Fetch existing locations for this business in one go to avoid N+1
        const existingLocations = await db.query.locations.findMany({
          where: and(
            eq(locations.businessId, business.id),
            inArray(locations.address, normalizedPoints)
          ),
          columns: { address: true }
        });

        const existingAddresses = new Set(existingLocations.map(l => l.address));
        const newPoints = normalizedPoints.filter(p => !existingAddresses.has(p));

        if (newPoints.length > 0) {
          // Use batch insert
          await db.insert(locations).values(
            newPoints.map(p => ({
              businessId: business.id,
              name: p.split(',')[0].trim() || "Точка продаж",
              address: p,
            }))
          ).onConflictDoNothing();
        }
      }
    }

    // Generate license
    const licenseNumber = `BM-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const validFrom = new Date();
    const validTo = new Date();
    validTo.setFullYear(validTo.getFullYear() + 1);

    const licenseId = crypto.randomUUID();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verificationUrl = `${appUrl}/verify/${licenseId}`;

    const pdfBuffer = await generateLicensePDF({
      businessName: formData.legalName,
      inn: formData.inn,
      licenseNumber,
      validFrom: validFrom.toLocaleDateString("ru-RU"),
      validTo: validTo.toLocaleDateString("ru-RU"),
      verificationUrl,
    });

    // Upload PDF to Supabase storage
    const fileName = `licenses/${licenseId}.pdf`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(fileName, pdfBuffer, { contentType: "application/pdf", upsert: true });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(fileName);

    // Persist license record
    await db.insert(licenses).values({
      id: licenseId,
      businessId: business.id,
      licenseNumber,
      signingName: formData.signingName,
      issuedAt: validFrom,
      expiresAt: validTo,
      validFrom,
      validTo,
      pdfUrl: publicUrl,
      totalCost: 0,
    });

    await db.update(businesses)
      .set({ subscriptionStatus: "ACTIVE" })
      .where(eq(businesses.id, business.id));

    revalidatePath("/dashboard/contract");
    revalidatePath("/dashboard");

    // Return PDF as base64 for immediate client-side download
    return { success: true, data: pdfBuffer.toString("base64"), pdfUrl: publicUrl };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Не удалось сформировать лицензию";
    console.error("Contract submission error:", error);
    return { success: false, error: message };
  }
}
