"use server";

import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";
import { readFileSync, existsSync } from "fs";
import path from "path";

interface LicenseData {
  businessId?: string;
  userId: string;
  businessType: string;
  businessCategory: string;
  legalName: string;
  inn: string;
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

export async function generateLicenseAction(data: LicenseData) {
  try {
    // 1. Update or Create Business
    const business = await prisma.business.upsert({
      where: { inn: data.inn },
      update: {
        legalName: data.legalName,
        address: data.regAddress,
        kpp: data.kpp,
        phone: data.phone,
        contactPerson: data.contactPerson,
        businessType: data.businessType,
        businessCategory: data.businessCategory,
        bankName: data.bankName,
        bik: data.bik,
        settlementAccount: data.settlementAccount,
        corrAccount: data.corrAccount,
      },
      create: {
        userId: data.userId,
        inn: data.inn,
        kpp: data.kpp,
        legalName: data.legalName,
        address: data.regAddress,
        phone: data.phone,
        contactPerson: data.contactPerson,
        businessType: data.businessType,
        businessCategory: data.businessCategory,
        bankName: data.bankName,
        bik: data.bik,
        settlementAccount: data.settlementAccount,
        corrAccount: data.corrAccount,
      },
    });

    // 2. Create Location records for trade points
    await prisma.location.deleteMany({ where: { businessId: business.id } });
    await prisma.location.createMany({
      data: data.tradePoints.map((addr, i) => ({
        businessId: business.id,
        name: `Точка ${i + 1}`,
        address: addr,
      })),
    });

    // 3. Create License Record
    const licenseNumber = `LIC-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const validFrom = new Date();
    const validTo = new Date();
    validTo.setFullYear(validTo.getFullYear() + 1);

    const license = await prisma.license.create({
      data: {
        businessId: business.id,
        licenseNumber,
        signingName: data.signingName,
        validFrom,
        validTo,
        expiresAt: validTo,
        totalCost: 1500,
        pdfUrl: "", 
      },
    });

    // 4. Generate PDF
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));

    // Register Font for Cyrillic
    const fontPath = "/System/Library/Fonts/Supplemental/Arial.ttf";
    if (existsSync(fontPath)) {
      doc.font(fontPath);
    }

    // Read userLicense.md
    const templatePath = path.join(process.cwd(), "userLicense.md");
    const template = existsSync(templatePath) ? readFileSync(templatePath, "utf-8") : "Template not found";

    // Header
    doc.fontSize(16).text("ЛИЦЕНЗИОННЫЙ ДОГОВОР-ОФЕРТА", { align: "center" }).moveDown();
    doc.fontSize(8).text(template.split("─────────────────────────────────────────────────────────────────────────")[0], { align: "justify" });
    
    doc.addPage();
    doc.fontSize(12).text("ПРИЛОЖЕНИЕ №1", { align: "right" });
    doc.text("ПОДТВЕРЖДЕНИЕ ЗАКЛЮЧЕНИЯ ДОГОВОРА", { align: "center" }).moveDown();
    doc.fontSize(10).text(`№ ${licenseNumber} от ${new Date().toLocaleDateString("ru-RU")}`).moveDown();

    doc.fontSize(10).text("1. ДАННЫЕ ЛИЦЕНЗИАТА:", { underline: true }).moveDown(0.5);
    doc.text(`Наименование: ${data.legalName}`);
    doc.text(`ИНН: ${data.inn}`);
    doc.text(`КПП: ${data.kpp || "-"}`);
    doc.text(`Адрес регистрации: ${data.regAddress}`);
    doc.text(`Контактное лицо: ${data.contactPerson}`);
    doc.text(`Email: ${data.userId} | Телефон: ${data.phone}`);
    doc.moveDown();

    doc.text("2. УСЛОВИЯ ЛИЦЕНЗИИ:", { underline: true }).moveDown(0.5);
    doc.text(`Тарифный план: Базовый (B2B)`);
    doc.text(`Количество точек вещания: ${data.tradePoints.length}`);
    doc.text(`Срок действия: с ${validFrom.toLocaleDateString("ru-RU")} по ${validTo.toLocaleDateString("ru-RU")}`);
    doc.text("Территории использования (адреса):");
    data.tradePoints.forEach((addr, i) => doc.text(`${i + 1}. ${addr}`, { indent: 20 }));
    doc.moveDown();

    doc.text(`Стоимость: 1 500 рублей (НДС не облагается)`);
    doc.moveDown(2);

    // Signature Block - Fixed Layout
    const startY = doc.y;
    
    // Licensor side
    doc.fontSize(10).text("ЛИЦЕНЗИАР:", 50, startY);
    doc.text("ИП Бугембе Даниел", 50, startY + 15);
    doc.text("ИНН 165510859142", 50, startY + 30);
    doc.text("________________ / Д. Бугембе /", 50, startY + 60);

    // Add Stamp Image
    const stampPath = path.join(process.cwd(), "public/images/licensor_stamp.png");
    if (existsSync(stampPath)) {
      doc.image(stampPath, 40, startY + 35, { width: 120 });
    }

    // Licensee side
    doc.text("ЛИЦЕНЗИАТ:", 350, startY);
    doc.text(data.legalName, 350, startY + 15);
    doc.text(`ИНН ${data.inn}`, 350, startY + 30);
    doc.fontSize(12).font(fontPath).text(data.signingName, 350, startY + 55, { oblique: true });
    doc.fontSize(10).text("________________ (Электронная подпись)", 350, startY + 60);

    doc.end();

    return new Promise<{ success: boolean; data?: string; error?: string }>((resolve) => {
      doc.on("end", () => {
        const result = Buffer.concat(chunks).toString("base64");
        resolve({ success: true, data: result });
      });
    });
  } catch (err: any) {
    console.error("License generation error:", err);
    return { success: false, error: err.message };
  }
}
