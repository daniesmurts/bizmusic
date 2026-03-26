import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

export interface AgreementData {
  legalName: string;
  inn: string;
  ogrn?: string;
  kpp?: string;
  regAddress: string;
  contactPerson?: string;
  signingName: string;
  acceptedAt: Date;
  acceptedIp?: string;
}

function readOfferText(): string {
  const offerPath = path.join(process.cwd(), "publicoffer.md");
  if (!fs.existsSync(offerPath)) {
    throw new Error("publicoffer.md not found");
  }

  const raw = fs.readFileSync(offerPath, "utf-8");
  return raw
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .trim();
}

export async function generateAgreementPDF(data: AgreementData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const boldFontPath = path.join(process.cwd(), "public", "fonts", "Roboto-Bold.ttf");
      const regularFontPath = path.join(process.cwd(), "public", "fonts", "Roboto-Regular.ttf");

      if (!fs.existsSync(boldFontPath) || !fs.existsSync(regularFontPath)) {
        throw new Error("Fonts not found. Please ensure Roboto-Bold.ttf and Roboto-Regular.ttf are in public/fonts/");
      }

      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, left: 50, right: 50, bottom: 50 },
        font: regularFontPath,
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      const offerText = readOfferText();

      doc.font(boldFontPath).fontSize(18).text("ПУБЛИЧНАЯ ОФЕРТА", { align: "center" });
      doc.moveDown(0.5);
      doc.font(boldFontPath).fontSize(12).text("Лицензионный договор о предоставлении права использования музыкальных произведений", {
        align: "center",
      });
      doc.moveDown(1.2);

      doc.font(regularFontPath).fontSize(10).fillColor("#333333").text(offerText, {
        align: "justify",
        lineGap: 3,
      });

      doc.addPage();
      doc.font(boldFontPath).fontSize(16).fillColor("#000000").text("Приложение: Данные Лицензиата", { align: "left" });
      doc.moveDown(1);

      doc.font(regularFontPath).fontSize(11);
      doc.text(`Юридическое наименование: ${data.legalName}`);
      doc.text(`ИНН: ${data.inn}`);
      if (data.ogrn) doc.text(`ОГРН/ОГРНИП: ${data.ogrn}`);
      if (data.kpp) doc.text(`КПП: ${data.kpp}`);
      doc.text(`Адрес регистрации: ${data.regAddress}`);
      if (data.contactPerson) doc.text(`Контактное лицо: ${data.contactPerson}`);
      doc.moveDown(1.5);

      doc.font(boldFontPath).fontSize(12).text("Акцепт оферты и подписание", { align: "left" });
      doc.moveDown(0.6);

      doc.font(regularFontPath).fontSize(11).text(
        `Настоящим подтверждаю акцепт условий публичной оферты и согласие на заключение договора в электронной форме. ` +
        `Подписант лицензиата: ${data.signingName}. Дата и время акцепта: ${data.acceptedAt.toLocaleString("ru-RU")}.`
      );

      if (data.acceptedIp) {
        doc.moveDown(0.4);
        doc.font(regularFontPath).fontSize(10).fillColor("#555555").text(`IP-адрес акцепта: ${data.acceptedIp}`);
      }

      doc.moveDown(2);
      doc.font(regularFontPath).fontSize(10).fillColor("#666666").text(
        "Документ сформирован автоматически в системе BizMusic и является юридически значимым электронным документом.",
        { align: "left" }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}