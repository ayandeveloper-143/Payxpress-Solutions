import { ApiRequestError } from "@/lib/api";
import { apiBaseUrl } from "@/lib/api";

export async function downloadProductFile(productSlug: string): Promise<string> {
    const response = await fetch(`${apiBaseUrl}/download/${productSlug}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new ApiRequestError({
            message: data.message || "Download failed.",
            status: response.status,
            code: data.code,
            field: data.field,
            errors: data.errors,
        });
    }

    const { url } = await response.json();
    if (!url) throw new ApiRequestError({ message: "No file URL returned.", status: 500 });
    return url;
}
