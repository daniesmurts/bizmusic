import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";

export interface LicenseData {
  businessName: string;
  inn: string;
  licenseNumber: string;
  validFrom: string;
  validTo: string;
  verificationUrl: string;
  signingName?: string;
  ownerName?: string;
}

export async function generateLicensePDF(data: LicenseData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      // Use a more standard font path for cross-environment compatibility
      const boldFontPath = path.join(process.cwd(), "public", "fonts", "Roboto-Bold.ttf");
      const regularFontPath = path.join(process.cwd(), "public", "fonts", "Roboto-Regular.ttf");

      // Verify fonts exist
      if (!fs.existsSync(boldFontPath) || !fs.existsSync(regularFontPath)) {
        throw new Error("Fonts not found. Please ensure Roboto-Bold.ttf and Roboto-Regular.ttf are in public/fonts/");
      }

      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        font: regularFontPath, // Set default font to avoid Helvetica loading
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      // Draw border (Neon Green)
      doc.rect(20, 20, 555, 802).lineWidth(15).stroke("#5cf387");
      doc.rect(27, 27, 541, 788).lineWidth(1).stroke("#000000");

      // Background watermark (Optional, but let's keep it clean)
      
      // Header Section
      doc.moveDown(4);
      doc.font(boldFontPath).fontSize(32).fillColor("#000000").text("ЛИЦЕНЗИОННЫЙ", { align: "center" });
      doc.text("СЕРТИФИКАТ", { align: "center" });
      
      doc.moveDown(1);
      doc.fontSize(12).fillColor("#666666").text("МУЗЫКАЛЬНОЕ ОФОРМЛЕНИЕ ДЛЯ БИЗНЕСА", { align: "center", characterSpacing: 2 });
      
      doc.moveDown(4);

      // Main Text
      doc.font(regularFontPath).fontSize(14).fillColor("#333333").text(
        "Настоящий сертификат подтверждает, что указанная ниже организация является официальным пользователем сервиса «Бизнес Музыка» и имеет законное право на публичное исполнение музыкальных произведений из каталога сервиса.",
        { align: "justify", lineGap: 5 }
      );

      doc.moveDown(3);

      // Details Table-like structure
      const leftCol = 70;
      const rightCol = 220;

      doc.font(boldFontPath).fontSize(12).fillColor("#888888").text("ЛИЦЕНЗИАТ:", leftCol, doc.y);
      doc.font(boldFontPath).fontSize(16).fillColor("#000000").text(data.businessName, rightCol, doc.y - 12);
      
      doc.moveDown(1.5);
      doc.font(boldFontPath).fontSize(12).fillColor("#888888").text("ИНН:", leftCol, doc.y);
      doc.font(boldFontPath).fontSize(16).fillColor("#000000").text(data.inn, rightCol, doc.y - 12);

      doc.moveDown(1.5);
      doc.font(boldFontPath).fontSize(12).fillColor("#888888").text("НОМЕР ЛИЦЕНЗИИ:", leftCol, doc.y);
      doc.font(boldFontPath).fontSize(16).fillColor("#000000").text(data.licenseNumber, rightCol, doc.y - 12);

      doc.moveDown(1.5);
      doc.font(boldFontPath).fontSize(12).fillColor("#888888").text("ПЕРИОД ДЕЙСТВИЯ:", leftCol, doc.y);
      doc.font(boldFontPath).fontSize(16).fillColor("#000000").text(`с ${data.validFrom} по ${data.validTo}`, rightCol, doc.y - 12);

      // Compliance Notice
      doc.moveDown(4);
      doc.font(regularFontPath).fontSize(10).fillColor("#666666").text(
        "Данный документ освобождает владельца от необходимости заключения договоров и выплаты вознаграждения в пользу РАО и ВОИС, так как права на все используемые произведения очищены напрямую через правообладателей.",
        leftCol, doc.y, { width: 450, align: "center", lineGap: 3 }
      );

      // QR Code for verification
      const qrDataUrl = await QRCode.toDataURL(data.verificationUrl, {
        margin: 1,
        width: 150,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
      
      const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");
      doc.image(qrBuffer, 380, 620, { width: 120 });
      
      doc.font(regularFontPath).fontSize(8).fillColor("#999999").text("ОТСКАНИРУЙТЕ ДЛЯ ПРОВЕРКИ", 380, 745, { width: 120, align: "center" });

      // Signature Section
      const ownerName = data.ownerName?.trim() || process.env.LICENSOR_LEGAL_NAME || "ИП Бугембе Даниел";
      const signerName = data.signingName?.trim();
      const signatureImagePath = process.env.LICENSOR_SIGNATURE_IMAGE_PATH
        ? path.join(process.cwd(), process.env.LICENSOR_SIGNATURE_IMAGE_PATH)
        : path.join(process.cwd(), "public", "images", "signature.png");

      doc.font(regularFontPath).fontSize(12).fillColor("#000000").text("Уполномоченный представитель", 70, 650);
      doc.font(boldFontPath).text(ownerName, 70, 670);

      if (fs.existsSync(signatureImagePath)) {
        doc.image(signatureImagePath, 70, 700, { width: 150, height: 40 });
      } else {
        doc.font(boldFontPath).fontSize(24).fillColor("#1e40af").text(ownerName, 75, 715, { oblique: true });
      }
      doc.lineWidth(1).strokeColor("#1e40af").moveTo(70, 745).lineTo(220, 745).stroke();

      if (signerName) {
        doc.font(regularFontPath)
          .fontSize(10)
          .fillColor("#333333")
          .text(`Подписант лицензиата: ${signerName}`, 70, 755, { width: 300 });
      }
      
      // Stamp Placeholder
      doc.circle(280, 710, 45).lineWidth(2).strokeColor("#1e40af").dash(5, { space: 2 }).stroke();
      doc.font(regularFontPath).fontSize(8).fillColor("#1e40af").text("ДЛЯ ДОКУМЕНТОВ", 250, 705, { width: 60, align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
