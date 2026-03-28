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

    // Get filename from Content-Disposition header
    const disposition = response.headers.get("Content-Disposition");
    let filename = "download.zip";
    if (disposition) {
        const match = disposition.match(/filename="?([^";]+)"?/);
        if (match) filename = match[1];
    }

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
