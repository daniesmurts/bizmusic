"use server";

import { db } from "@/db";
import { businesses, licenses, users, locations } from "@/db/schema";
import { eq, desc, inArray, and } from "drizzle-orm";
import { generateLicensePDF } from "@/lib/license-generator";
import { generateAgreementPDF } from "@/lib/agreement-generator";
import { mergePdfBuffers } from "@/lib/document-bundle";
import { syncUserAndLegalAcceptance } from "@/lib/legal-acceptance";
import { supabaseAdmin } from "@/lib/supabase-storage";
import { revalidatePath } from "next/cache";

const BUCKET_NAME = 'bizmusic-assets';

interface BundleInput {
  legalName: string;
  inn: string;
  ogrn?: string;
  kpp?: string;
  regAddress: string;
  contactPerson?: string;
  signingName: string;
  acceptedAt: Date;
  licenseNumber: string;
  validFrom: Date;
  validTo: Date;
  verificationUrl: string;
}

async function buildLicenseBundle(input: BundleInput): Promise<Buffer> {
  const agreementBuffer = await generateAgreementPDF({
    legalName: input.legalName,
    inn: input.inn,
    ogrn: input.ogrn,
    kpp: input.kpp,
    regAddress: input.regAddress,
    contactPerson: input.contactPerson,
    signingName: input.signingName,
    acceptedAt: input.acceptedAt,
  });

  const certificateBuffer = await generateLicensePDF({
    businessName: input.legalName,
    inn: input.inn,
    licenseNumber: input.licenseNumber,
    validFrom: input.validFrom.toLocaleDateString("ru-RU"),
    validTo: input.validTo.toLocaleDateString("ru-RU"),
    verificationUrl: input.verificationUrl,
    signingName: input.signingName,
  });

  return mergePdfBuffers([agreementBuffer, certificateBuffer]);
}

async function markLicenseFailed(licenseId: string, message: string) {
  await db.update(licenses)
    .set({
      documentStatus: "FAILED",
      generationError: message,
    })
    .where(eq(licenses.id, licenseId));
}

/**
 * Generate a new license for a business
 */
export async function generateLicenseAction(businessId: string) {
  let licenseId: string | null = null;
  try {
    // 1. Fetch business details
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.id, businessId),
      with: {
        user: {
          columns: {
            termsAcceptedAt: true,
          },
        },
      },
    });

    if (!business) {
      return { success: false, error: "Бизнес не найден" };
    }

    // 2. Prepare license data
    const licenseNumber = `BM-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const validFrom = new Date();
    const validTo = new Date();
    validTo.setFullYear(validTo.getFullYear() + 1); // 1 year validity

    licenseId = crypto.randomUUID();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${appUrl}/verify/${licenseId}`;

    // 3. Persist generation start for observability and retry flow
    await db.insert(licenses).values({
      id: licenseId,
      businessId: business.id,
      licenseNumber,
      signingName: business.contactPerson || business.legalName,
      issuedAt: validFrom,
      expiresAt: validTo,
      validFrom,
      validTo,
      pdfUrl: "",
      totalCost: 0,
      documentStatus: "GENERATING",
      generationError: null,
      agreementAcceptedAt: business.user?.termsAcceptedAt || new Date(),
    });

    // 4. Generate agreement and certificate, then merge into one legal bundle PDF
    const pdfBuffer = await buildLicenseBundle({
      legalName: business.legalName,
      inn: business.inn,
      ogrn: business.ogrn || undefined,
      kpp: business.kpp || undefined,
      regAddress: business.address,
      contactPerson: business.contactPerson || undefined,
      signingName: business.contactPerson || business.legalName,
      acceptedAt: business.user?.termsAcceptedAt || new Date(),
      licenseNumber,
      validFrom,
      validTo,
      verificationUrl,
    });

    // 5. Upload to Supabase (with 30s timeout)
    const fileName = `licenses/${licenseId}.pdf`;
    const uploadTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Upload timed out after 30 seconds")), 30_000)
    );
    const { error: uploadError } = await Promise.race([
      supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(fileName, pdfBuffer, { contentType: 'application/pdf', upsert: true }),
      uploadTimeout,
    ]);

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // 6. Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    // 7. Mark generation ready
    const [license] = await db.update(licenses)
      .set({
        pdfUrl: publicUrl,
        documentStatus: "READY",
        generationError: null,
      })
      .where(eq(licenses.id, licenseId))
      .returning();

    // 8. Update business status
    await db.update(businesses)
      .set({ subscriptionStatus: "ACTIVE" })
      .where(eq(businesses.id, businessId));

    revalidatePath("/admin/clients");
    revalidatePath("/admin/logs");

    return { success: true, data: license };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate license";
    if (licenseId) {
      await markLicenseFailed(licenseId, message);
    }
    console.error("License generation error:", error);
    return { success: false, error: message };
  }
}

export async function retryLicenseGenerationAction(licenseId: string) {
  try {
    const license = await db.query.licenses.findFirst({
      where: eq(licenses.id, licenseId),
      with: {
        business: {
          with: {
            user: {
              columns: { termsAcceptedAt: true },
            },
          },
        },
      },
    });

    if (!license) {
      return { success: false, error: "Лицензия не найдена" };
    }

    await db.update(licenses)
      .set({ documentStatus: "GENERATING", generationError: null })
      .where(eq(licenses.id, licenseId));

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${appUrl}/verify/${license.id}`;

    const pdfBuffer = await buildLicenseBundle({
      legalName: license.business.legalName,
      inn: license.business.inn,
      ogrn: license.business.ogrn || undefined,
      kpp: license.business.kpp || undefined,
      regAddress: license.business.address,
      contactPerson: license.business.contactPerson || undefined,
      signingName: license.signingName,
      acceptedAt: license.agreementAcceptedAt || license.business.user?.termsAcceptedAt || new Date(),
      licenseNumber: license.licenseNumber,
      validFrom: license.validFrom,
      validTo: license.validTo,
      verificationUrl,
    });

    const fileName = `licenses/${license.id}.pdf`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    const [updated] = await db.update(licenses)
      .set({
        pdfUrl: publicUrl,
        documentStatus: "READY",
        generationError: null,
      })
      .where(eq(licenses.id, license.id))
      .returning();

    // Mark business as active
    await db.update(businesses)
      .set({ subscriptionStatus: "ACTIVE" })
      .where(eq(businesses.id, license.businessId));

    revalidatePath("/admin/clients");
    revalidatePath("/admin/logs");
    revalidatePath("/dashboard/contract");

    return { success: true, data: updated };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Не удалось повторно сформировать документ";
    await markLicenseFailed(licenseId, message);
    console.error("Retry license generation error:", error);
    return { success: false, error: message };
  }
}

export async function retryFailedLicensesBatchAction(limit: number = 25) {
  try {
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { role: true },
    });

    if (!dbUser || dbUser.role !== "ADMIN") {
      return { success: false, error: "Forbidden" };
    }

    const safeLimit = Math.max(1, Math.min(Math.floor(limit), 100));

    const failedLicenses = await db.query.licenses.findMany({
      where: eq(licenses.documentStatus, "FAILED"),
      orderBy: [desc(licenses.issuedAt)],
      limit: safeLimit,
      columns: { id: true },
    });

    let recovered = 0;
    const failed: string[] = [];

    for (const license of failedLicenses) {
      const result = await retryLicenseGenerationAction(license.id);
      if (result.success) {
        recovered += 1;
      } else {
        failed.push(license.id);
      }
    }

    return {
      success: true,
      data: {
        scanned: failedLicenses.length,
        recovered,
        failed,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ошибка при пакетной повторной генерации";
    console.error("Batch retry failed licenses error:", error);
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
  let provisionalLicenseId: string | null = null;
  try {
    if (!formData.legalName?.trim() || !formData.inn?.trim() || !formData.regAddress?.trim() || !formData.signingName?.trim()) {
      return {
        success: false,
        error: "Заполните обязательные поля: название компании, ИНН, адрес регистрации и подписант.",
      };
    }

    // Get authenticated user from Supabase session
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return { success: false, error: "Пользователь не авторизован" };
    }

    await syncUserAndLegalAcceptance({
      userId: authUser.id,
      email: authUser.email!,
      metadata: authUser.user_metadata as Record<string, unknown>,
      source: "contract_submit",
    });

    const dbUser = await db.query.users.findFirst({ where: eq(users.id, authUser.id) });
    if (!dbUser) {
      return { success: false, error: "Профиль пользователя не найден" };
    }

    // Security Check: prevent hijacking an existing business by INN
    const existingInnBusiness = await db.query.businesses.findFirst({
      where: eq(businesses.inn, formData.inn)
    });

    if (existingInnBusiness && existingInnBusiness.userId !== dbUser.id) {
      return { success: false, error: "Бизнес с таким ИНН уже зарегистрирован другим пользователем." };
    }

    // Upsert business record for the verified user
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
    provisionalLicenseId = licenseId;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verificationUrl = `${appUrl}/verify/${licenseId}`;

    await db.insert(licenses).values({
      id: licenseId,
      businessId: business.id,
      licenseNumber,
      signingName: formData.signingName,
      issuedAt: validFrom,
      expiresAt: validTo,
      validFrom,
      validTo,
      pdfUrl: "",
      totalCost: 0,
      documentStatus: "GENERATING",
      generationError: null,
      agreementAcceptedAt: dbUser.termsAcceptedAt || new Date(),
    });

    const pdfBuffer = await buildLicenseBundle({
      legalName: formData.legalName,
      inn: formData.inn,
      ogrn: formData.ogrn,
      kpp: formData.kpp,
      regAddress: formData.regAddress,
      contactPerson: formData.contactPerson,
      signingName: formData.signingName,
      acceptedAt: dbUser.termsAcceptedAt || new Date(),
      licenseNumber,
      validFrom,
      validTo,
      verificationUrl,
    });

    // Upload PDF to Supabase storage (with 30s timeout)
    const fileName = `licenses/${licenseId}.pdf`;
    const uploadTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Upload timed out after 30 seconds")), 30_000)
    );
    const { error: uploadError } = await Promise.race([
      supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(fileName, pdfBuffer, { contentType: "application/pdf", upsert: true }),
      uploadTimeout,
    ]);

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(fileName);

    await db.update(licenses)
      .set({
        pdfUrl: publicUrl,
        documentStatus: "READY",
        generationError: null,
      })
      .where(eq(licenses.id, licenseId));

    // Mark business as active
    await db.update(businesses)
      .set({ subscriptionStatus: "ACTIVE" })
      .where(eq(businesses.id, business.id));

    revalidatePath("/dashboard/contract");
    revalidatePath("/dashboard");

    return { success: true, pdfUrl: publicUrl };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Не удалось сформировать лицензию";
    if (provisionalLicenseId) {
      await markLicenseFailed(provisionalLicenseId, message);
    }
    console.error("Contract submission error:", error);
    return { success: false, error: message };
  }
}
