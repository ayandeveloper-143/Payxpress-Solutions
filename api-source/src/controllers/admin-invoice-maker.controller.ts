import type { Request, Response } from "express";
import path from "node:path";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import { z } from "zod";
import { generatePdfFromHtml } from "../utils/pdf.js";

const generateAdminPreviewPdfSchema = z.object({
    html: z.string().min(100).max(2_000_000),
    fileName: z.string().trim().min(1).max(120).optional(),
});

const sanitizeFileName = (name: string) =>
    path.basename(name).replace(/[^a-zA-Z0-9_-]/g, "_");

const toDataUri = async (filePath: string, mimeType: string) => {
    const file = await fsPromises.readFile(filePath);
    return `data:${mimeType};base64,${file.toString("base64")}`;
};

const inlineBrandImages = async (html: string) => {
    const logoPath = path.resolve("public/logo.png");
    const signaturePath = path.resolve("public/signature.webp");

    let result = html;

    if (fs.existsSync(logoPath)) {
        const logoDataUri = await toDataUri(logoPath, "image/png");
        result = result.replaceAll("https://payxpress-solutions.com/logo.png", logoDataUri);
    }

    if (fs.existsSync(signaturePath)) {
        const signatureDataUri = await toDataUri(signaturePath, "image/webp");
        result = result.replaceAll("https://payxpress-solutions.com/signature.webp", signatureDataUri);
    }

    return result;
};

export const generateAdminPreviewPdf = async (request: Request, response: Response): Promise<void> => {
    const parsed = generateAdminPreviewPdfSchema.safeParse(request.body);

    if (!parsed.success) {
        response.status(400).json({ message: "Invalid invoice payload." });
        return;
    }

    const fileNameBase = sanitizeFileName(parsed.data.fileName || "invoice");
    const tmpDir = path.resolve("public/bills/_admin_invoice_maker");
    const outputPath = path.join(tmpDir, `${fileNameBase}.pdf`);

    try {
        const htmlWithInlinedImages = await inlineBrandImages(parsed.data.html);
        await generatePdfFromHtml(htmlWithInlinedImages, outputPath);

        response.setHeader("Content-Type", "application/pdf");
        response.setHeader("Content-Disposition", `attachment; filename=\"${fileNameBase}.pdf\"`);

        const stream = fs.createReadStream(outputPath);
        stream.on("error", () => {
            if (!response.headersSent) {
                response.status(500).json({ message: "Failed to read generated PDF." });
            }
        });
        stream.on("close", () => {
            fs.unlink(outputPath, () => undefined);
        });

        stream.pipe(response);
    } catch (error) {
        console.error("[admin-invoice-maker] generateAdminPreviewPdf error:", error);
        response.status(500).json({ message: "Unable to generate PDF right now." });
    }
};
