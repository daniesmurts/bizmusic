"use server";
 
import { db } from "@/db";
import { demoRequests } from "@/db/schema";
import { z } from "zod";
 
const demoRequestSchema = z.object({
  name: z.string().min(2, "Имя должно содержать минимум 2 символа"),
  email: z.string().email("Некорректный email адрес"),
  phone: z.string().optional(),
  company: z.string().optional(),
  interest: z.string().min(1, "Пожалуйста, выберите сферу интереса"),
  message: z.string().optional(),
  consentAccepted: z.boolean().refine((val) => val === true, {
    message: "Необходимо принять условия использования",
  }),
});
 
export async function createDemoRequestAction(formData: z.infer<typeof demoRequestSchema>) {
  try {
    const validatedData = demoRequestSchema.parse(formData);
 
    await db.insert(demoRequests).values({
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phone,
      company: validatedData.company,
      interest: validatedData.interest,
      message: validatedData.message,
      consentAccepted: true,
      consentAcceptedAt: new Date(),
    });

    // Send to Web3Forms for email notification
    try {
      await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY,
          from_name: "Бизнес Музыка - Заявка на демо",
          subject: `Новая заявка на демо: ${validatedData.interest}`,
          ...validatedData,
        }),
      });
    } catch (wpError) {
      console.error("Web3Forms Notification Error:", wpError);
      // We don't fail the entire action if only the email notification fails
    }
 
    return { success: true, message: "Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время." };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("Error creating demo request:", error);
    return { success: false, error: "Произошла ошибка при отправке заявки. Попробуйте позже." };
  }
}
