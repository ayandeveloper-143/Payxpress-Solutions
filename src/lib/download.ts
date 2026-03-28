import { ApiRequestError } from "@/lib/api";
import { apiBaseUrl } from "@/lib/api";

export async function downloadProductFile(productSlug: string): Promise<void> {
    const response = await fetch(`${apiBaseUrl}/download/${productSlug}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
    });

    if (!response.ok) {
        // Try to parse error JSON, fallback to text
        let message = "Download failed.";
        try {
            const data = await response.json();
            message = data.message || message;
        } catch {
            try {
                message = await response.text();
            } catch { }
        }
        throw new ApiRequestError({
            message,
            status: response.status,
        });
    }

    // Get file extension from Content-Disposition or fallback to .zip
    let extension = ".zip";
    const disposition = response.headers.get("Content-Disposition");
    if (disposition) {
        const match = disposition.match(/filename="?([^";]+)"?/);
        if (match) {
            const original = match[1];
            const extMatch = original.match(/(\.[a-zA-Z0-9]+)$/);
            if (extMatch) extension = extMatch[1];
        }
    }
    const filename = productSlug + extension;

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }, 100);
}
