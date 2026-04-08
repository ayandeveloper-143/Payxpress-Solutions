import { useEffect, useState, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
    fetchAdminInvoices,
    fetchAdminDeliveryLogs,
    fetchAdminUsers,
    fetchAdminProducts,
    downloadAdminInvoicePdf,
    deleteAdminPurchase,
    deleteAdminProduct,
    updateAdminProduct,
    createAdminProduct,
    ApiRequestError,
    type AdminInvoice,
    type AdminDeliveryLog,
    type AdminUser,
    type AdminProduct,
    type CreateAdminProductPayload,
    type UpdateAdminProductPayload,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
    Download,
    FileText,
    LayoutDashboard,
    LogOut,
    Package,
    ShieldCheck,
    Users,
    Activity,
    Loader2,
    Pencil,
    Trash2,
    Plus,
    X,
    ChevronLeft,
    ChevronRight,
    ToggleLeft,
    ToggleRight,
} from "lucide-react";
import { format } from "date-fns";

type TabId = "invoices" | "delivery-logs" | "users" | "products";

// ---- Helpers ----
const fmtDate = (d: string | Date) => {
    try {
        return format(new Date(d), "dd MMM yyyy, HH:mm");
    } catch {
        return String(d);
    }
};

const fmtCurrency = (n: number) =>
    `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ---- Invoices Tab ----
const InvoicesTab = () => {
    const { toast } = useToast();
    const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [downloading, setDownloading] = useState<string | null>(null);

    useEffect(() => {
        fetchAdminInvoices()
            .then((r) => setInvoices(r.invoices))
            .catch(() => toast({ title: "Failed to load invoices", variant: "destructive" }))
            .finally(() => setLoading(false));
    }, []);

    const filtered = invoices.filter(
        (inv) =>
            inv.userEmail.toLowerCase().includes(search.toLowerCase()) ||
            inv.invoiceId.toLowerCase().includes(search.toLowerCase()) ||
            inv.orderId.toLowerCase().includes(search.toLowerCase())
    );

    const handleDownload = async (invoiceId: string) => {
        setDownloading(invoiceId);
        try {
            await downloadAdminInvoicePdf(invoiceId);
            toast({ title: "Invoice downloaded" });
        } catch {
            toast({ title: "Download failed", variant: "destructive" });
        } finally {
            setDownloading(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
                <Input
                    placeholder="Search by email, invoice ID or order ID…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
                <span className="text-sm text-muted-foreground">{filtered.length} invoice{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            {loading ? (
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full rounded-lg" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <p className="text-muted-foreground text-sm">No invoices found.</p>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Invoice</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filtered.map((inv) => (
                                <tr key={inv.orderId} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-mono text-xs text-foreground">{inv.invoiceId || inv.orderId}</div>
                                        <div className="text-xs text-muted-foreground">{inv.orderId}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-foreground">{inv.userName || "—"}</div>
                                        <div className="text-xs text-muted-foreground">{inv.userEmail}</div>
                                    </td>
                                    <td className="px-4 py-3 font-medium">{fmtCurrency(inv.total)}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(inv.date)}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={inv.status === "success" ? "default" : "secondary"}>
                                            {inv.status}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {inv.invoiceId && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDownload(inv.invoiceId)}
                                                disabled={downloading === inv.invoiceId}
                                            >
                                                {downloading === inv.invoiceId ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Download className="h-4 w-4" />
                                                )}
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// ---- Delivery Logs Tab ----
const DeliveryLogsTab = () => {
    const { toast } = useToast();
    const [logs, setLogs] = useState<AdminDeliveryLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 100;

    const loadLogs = useCallback((p: number) => {
        setLoading(true);
        fetchAdminDeliveryLogs(p)
            .then((r) => {
                setLogs(r.logs as AdminDeliveryLog[]);
                setTotal(r.total);
            })
            .catch(() => toast({ title: "Failed to load delivery logs", variant: "destructive" }))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        loadLogs(page);
    }, [page, loadLogs]);

    const pages = Math.max(1, Math.ceil(total / limit));

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm text-muted-foreground">{total} total log entries</p>
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">Page {page}/{pages}</span>
                    <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full rounded-lg" />
                    ))}
                </div>
            ) : logs.length === 0 ? (
                <p className="text-muted-foreground text-sm">No delivery logs found.</p>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Event</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order / Product</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">IP Address</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Timestamp</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <Badge variant={log.event_type === "payment_success" ? "default" : "secondary"}>
                                            {log.event_type === "payment_success" ? "Payment" : "Download"}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground text-xs">{log.user_email || log.user_uuid}</td>
                                    <td className="px-4 py-3">
                                        <div className="text-xs font-mono">{log.order_id || log.product_slug || "—"}</div>
                                        {log.invoice_id && (
                                            <div className="text-xs text-muted-foreground">Invoice: {log.invoice_id}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.ip_address || "—"}</td>
                                    <td className="px-4 py-3 text-muted-foreground text-xs">{fmtDate(log.created_at)}</td>
                                    <td className="px-4 py-3">
                                        <span className="text-green-500 font-medium text-xs uppercase">{log.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// ---- Users Tab ----
const UsersTab = () => {
    const { toast } = useToast();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [deletingKey, setDeletingKey] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);

    useEffect(() => {
        fetchAdminUsers()
            .then((r) => setUsers(r.users))
            .catch(() => toast({ title: "Failed to load users", variant: "destructive" }))
            .finally(() => setLoading(false));
    }, []);

    const handleDeletePurchase = async (userUuid: string, slug: string) => {
        const key = `${userUuid}:${slug}`;
        setDeletingKey(key);
        try {
            await deleteAdminPurchase(userUuid, slug);
            setUsers((prev) =>
                prev.map((u) =>
                    u.uuid === userUuid
                        ? { ...u, orderHistory: u.orderHistory.filter((h) => h.slug !== slug) }
                        : u
                )
            );
            toast({ title: "Purchase entry removed" });
        } catch {
            toast({ title: "Failed to remove purchase", variant: "destructive" });
        } finally {
            setDeletingKey(null);
        }
    };

    const filtered = users.filter(
        (u) =>
            u.email.toLowerCase().includes(search.toLowerCase()) ||
            u.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
                <Input
                    placeholder="Search by name or email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
                <span className="text-sm text-muted-foreground">{filtered.length} user{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            {loading ? (
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full rounded-lg" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <p className="text-muted-foreground text-sm">No users found.</p>
            ) : (
                <div className="space-y-2">
                    {filtered.map((user) => (
                        <div key={user.uuid} className="border border-border rounded-lg overflow-hidden">
                            <button
                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                                onClick={() => setExpanded(expanded === user.uuid ? null : user.uuid)}
                            >
                                <div>
                                    <div className="font-medium text-foreground">{user.name}</div>
                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={user.isVerified ? "default" : "secondary"}>
                                        {user.isVerified ? "Verified" : "Unverified"}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {user.orderHistory.length} purchase{user.orderHistory.length !== 1 ? "s" : ""}
                                    </span>
                                </div>
                            </button>

                            {expanded === user.uuid && user.orderHistory.length > 0 && (
                                <div className="border-t border-border bg-muted/20 p-4">
                                    <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Purchased Products</p>
                                    <div className="space-y-1">
                                        {user.orderHistory.map((item) => (
                                            <div
                                                key={item.slug}
                                                className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/30"
                                            >
                                                <div>
                                                    <span className="font-mono text-sm">{item.slug}</span>
                                                    <span className="text-xs text-muted-foreground ml-2">
                                                        {item.purchasedAt ? fmtDate(item.purchasedAt) : ""}
                                                    </span>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-destructive hover:text-destructive h-7 px-2"
                                                    disabled={deletingKey === `${user.uuid}:${item.slug}`}
                                                    onClick={() => handleDeletePurchase(user.uuid, item.slug)}
                                                >
                                                    {deletingKey === `${user.uuid}:${item.slug}` ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-3 w-3" />
                                                    )}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {expanded === user.uuid && user.orderHistory.length === 0 && (
                                <div className="border-t border-border bg-muted/20 px-4 py-3">
                                    <p className="text-xs text-muted-foreground">No purchases yet.</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ---- Products Tab ----
interface ProductFormData {
    slug: string;
    title: string;
    description: string;
    tag: string;
    price_label: string;
    image: string;
    overview: string;
    short_note: string;
    full_description: string;
    screenshots: string;
    features: string;
    cart_limit: number;
    sort_order: number;
    is_active: boolean;
    product_file: string;
}

const defaultProductForm: ProductFormData = {
    slug: "",
    title: "",
    description: "",
    tag: "",
    price_label: "",
    image: "",
    overview: "",
    short_note: "",
    full_description: "",
    screenshots: "",
    features: "",
    cart_limit: 1,
    sort_order: 0,
    is_active: true,
    product_file: "",
};

const ProductsTab = () => {
    const { toast } = useToast();
    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [editProduct, setEditProduct] = useState<AdminProduct | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [form, setForm] = useState<ProductFormData>(defaultProductForm);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const loadProducts = useCallback(() => {
        setLoading(true);
        fetchAdminProducts()
            .then((r) => setProducts(r.products))
            .catch(() => toast({ title: "Failed to load products", variant: "destructive" }))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    const openCreateForm = () => {
        setIsCreating(true);
        setEditProduct(null);
        setForm(defaultProductForm);
        setShowForm(true);
    };

    const openEditForm = (p: AdminProduct) => {
        setIsCreating(false);
        setEditProduct(p);
        setForm({
            slug: p.slug,
            title: p.title,
            description: p.description,
            tag: p.tag,
            price_label: p.priceLabel,
            image: p.image,
            overview: p.overview,
            short_note: p.shortNote,
            full_description: p.fullDescription,
            screenshots: p.screenshots.join("\n"),
            features: p.features.join("\n"),
            cart_limit: p.cartLimit,
            sort_order: p.sortOrder,
            is_active: p.isActive,
            product_file: p.productFile ?? "",
        });
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditProduct(null);
        setIsCreating(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const screenshots = form.screenshots.split("\n").map((s) => s.trim()).filter(Boolean);
            const features = form.features.split("\n").map((s) => s.trim()).filter(Boolean);

            if (isCreating) {
                const payload: CreateAdminProductPayload = {
                    slug: form.slug,
                    title: form.title,
                    description: form.description,
                    tag: form.tag,
                    price_label: form.price_label,
                    image: form.image,
                    overview: form.overview,
                    short_note: form.short_note,
                    full_description: form.full_description,
                    screenshots,
                    features,
                    cart_limit: form.cart_limit,
                    sort_order: form.sort_order,
                    is_active: form.is_active,
                    product_file: form.product_file || null,
                };
                await createAdminProduct(payload);
                toast({ title: "Product created" });
            } else if (editProduct) {
                const payload: UpdateAdminProductPayload = {
                    title: form.title,
                    description: form.description,
                    tag: form.tag,
                    price_label: form.price_label,
                    image: form.image,
                    overview: form.overview,
                    short_note: form.short_note,
                    full_description: form.full_description,
                    screenshots,
                    features,
                    cart_limit: form.cart_limit,
                    sort_order: form.sort_order,
                    is_active: form.is_active,
                    product_file: form.product_file || null,
                };
                await updateAdminProduct(editProduct.id, payload);
                toast({ title: "Product updated" });
            }
            closeForm();
            loadProducts();
        } catch (err) {
            const msg = err instanceof ApiRequestError ? err.message : "Save failed.";
            toast({ title: msg, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Deactivate this product? It will be hidden from the storefront.")) return;
        setDeletingId(id);
        try {
            await deleteAdminProduct(id);
            toast({ title: "Product deactivated" });
            loadProducts();
        } catch {
            toast({ title: "Failed to deactivate product", variant: "destructive" });
        } finally {
            setDeletingId(null);
        }
    };

    const handleToggleActive = async (p: AdminProduct) => {
        try {
            await updateAdminProduct(p.id, { is_active: !p.isActive });
            setProducts((prev) =>
                prev.map((prod) => (prod.id === p.id ? { ...prod, isActive: !p.isActive } : prod))
            );
        } catch {
            toast({ title: "Failed to update product", variant: "destructive" });
        }
    };

    const field = (label: string, key: keyof ProductFormData, type: "text" | "textarea" | "number" | "checkbox" = "text") => (
        <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase">{label}</label>
            {type === "textarea" ? (
                <textarea
                    className="w-full min-h-[80px] px-3 py-2 text-sm bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    value={String(form[key])}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
            ) : type === "checkbox" ? (
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={Boolean(form[key])}
                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                        className="h-4 w-4"
                    />
                    <span className="text-sm text-foreground">Active (visible on storefront)</span>
                </div>
            ) : (
                <Input
                    type={type}
                    value={String(form[key])}
                    onChange={(e) =>
                        setForm((f) => ({
                            ...f,
                            [key]: type === "number" ? Number(e.target.value) : e.target.value,
                        }))
                    }
                    disabled={key === "slug" && !isCreating}
                />
            )}
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{products.length} product{products.length !== 1 ? "s" : ""}</p>
                <Button onClick={openCreateForm} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Product
                </Button>
            </div>

            {/* Product Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8">
                    <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl mx-4 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">{isCreating ? "Create Product" : "Edit Product"}</h3>
                            <button onClick={closeForm} className="text-muted-foreground hover:text-foreground">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {field("Slug (URL key)", "slug")}
                            {field("Title", "title")}
                            {field("Tag / Category", "tag")}
                            {field("Price Label (e.g. ₹999)", "price_label")}
                            {field("Image URL", "image")}
                            {field("Cart Limit", "cart_limit", "number")}
                            {field("Sort Order", "sort_order", "number")}
                            {field("Product File Path", "product_file")}
                        </div>

                        {field("Description (short)", "description", "textarea")}
                        {field("Overview", "overview", "textarea")}
                        {field("Short Note", "short_note", "textarea")}
                        {field("Full Description", "full_description", "textarea")}
                        {field("Screenshots (one URL per line)", "screenshots", "textarea")}
                        {field("Features (one per line)", "features", "textarea")}
                        {field("", "is_active", "checkbox")}

                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={closeForm} disabled={saving}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                                {isCreating ? "Create" : "Save Changes"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full rounded-lg" />
                    ))}
                </div>
            ) : products.length === 0 ? (
                <p className="text-muted-foreground text-sm">No products found.</p>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Price</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tag</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Active</th>
                                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {products.map((p) => (
                                <tr key={p.id} className={`hover:bg-muted/30 transition-colors ${!p.isActive ? "opacity-50" : ""}`}>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-foreground">{p.title}</div>
                                        <div className="text-xs font-mono text-muted-foreground">{p.slug}</div>
                                    </td>
                                    <td className="px-4 py-3 font-medium">{p.priceLabel}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{p.tag}</td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => handleToggleActive(p)}
                                            className="text-muted-foreground hover:text-foreground transition-colors"
                                            title={p.isActive ? "Deactivate" : "Activate"}
                                        >
                                            {p.isActive ? (
                                                <ToggleRight className="h-5 w-5 text-green-500" />
                                            ) : (
                                                <ToggleLeft className="h-5 w-5" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => openEditForm(p)}
                                                title="Edit"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => handleDelete(p.id)}
                                                disabled={deletingId === p.id}
                                                title="Deactivate"
                                            >
                                                {deletingId === p.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// ---- Main Admin Panel ----
const AdminPanel = () => {
    const { isAdminLoggedIn, logout } = useAdminAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabId>("invoices");

    if (!isAdminLoggedIn) {
        return <Navigate to="/admin/login" replace />;
    }

    const tabs: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
        { id: "invoices", label: "Invoices", icon: <FileText className="h-4 w-4" /> },
        { id: "delivery-logs", label: "Delivery Logs", icon: <Activity className="h-4 w-4" /> },
        { id: "users", label: "Users & Purchases", icon: <Users className="h-4 w-4" /> },
        { id: "products", label: "Products", icon: <Package className="h-4 w-4" /> },
    ];

    const handleLogout = () => {
        logout();
        navigate("/admin/login", { replace: true });
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-primary/10">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="font-semibold text-foreground">Admin Panel</h1>
                            <p className="text-xs text-muted-foreground">PayXpress Solutions</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                    </Button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Tab Navigation */}
                <nav className="flex items-center gap-1 border-b border-border mb-6 overflow-x-auto pb-px">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                                activeTab === tab.id
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </nav>

                {/* Tab Content */}
                {activeTab === "invoices" && <InvoicesTab />}
                {activeTab === "delivery-logs" && <DeliveryLogsTab />}
                {activeTab === "users" && <UsersTab />}
                {activeTab === "products" && <ProductsTab />}
            </div>
        </div>
    );
};

export default AdminPanel;
