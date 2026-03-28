import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";

/**
 * Generate a PDF from HTML string and save to the given file path.
 * @param html HTML string
 * @param outputPath Absolute path to save the PDF
 */
export async function generatePdfFromHtml(html: string, outputPath: string) {
    const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await page.pdf({ path: outputPath, format: "A4", printBackground: true });
    await browser.close();
}
