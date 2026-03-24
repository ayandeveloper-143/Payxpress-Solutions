import type { Request, Response } from "express";
import { z } from "zod";
import { db } from "../config/db.js";

const contactSchema = z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(255),
    subject: z.string().trim().max(150).optional().or(z.literal("")),
    message: z.string().trim().min(10).max(2000),
});

export const createContactEnquiry = async (request: Request, response: Response) => {
    const parsed = contactSchema.safeParse(request.body);

    if (!parsed.success) {
        response.status(400).json({
            message: "Invalid contact request.",
            errors: parsed.error.flatten().fieldErrors,
        });
        return;
    }

    const { name, email, subject, message } = parsed.data;

    const [result] = await db.execute(
        `INSERT INTO contact_enquiries (name, email, subject, message)
     VALUES (?, ?, ?, ?)`,
        [name, email, subject || null, message]
    );

    response.status(201).json({
        message: "Enquiry saved successfully.",
        enquiryId: (result as { insertId: number }).insertId,
    });
};