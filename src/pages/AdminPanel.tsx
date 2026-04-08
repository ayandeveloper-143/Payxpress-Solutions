import { useEffect, useState, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/context/AdminAuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
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

// ---- Shared Section Header ----
interface SectionHeaderProps {
    icon: React.ReactNode;
    title: string;
    description: string;
}
const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, title, description }) => (
    <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
            <span className="text-accent">{icon}</span>
        </div>
        <div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">{description}</p>
        </div>
    </div>
);

// ---- Shared Table Wrapper ----
const TableWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">{children}</table>
    </div>
);

const Th: React.FC<{ children: React.ReactNode; right?: boolean }> = ({ children, right }) => (
    <th
        className={`px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide ${right ? "text-right" : "text-left"}`}
    >
        {children}
    </th>
);

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
        <div className="rounded-2xl border bg-card p-6 space-y-6">
            <SectionHeader
                icon={<FileText size={18} />}
                title="All Invoices"
                description="View and download invoices for all users."
            />

            <div className="flex items-center gap-3 flex-wrap">
                <Input
                    placeholder="Search by email, invoice ID or order ID…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
                <span className="text-sm text-muted-foreground">
                    {filtered.length} invoice{filtered.length !== 1 ? "s" : ""}
                </span>
            </div>

            {loading ? (
                <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <p className="text-muted-foreground text-sm">No invoices found.</p>
            ) : (
                <TableWrapper>
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <Th>Invoice</Th>
                            <Th>User</Th>
                            <Th>Amount</Th>
                            <Th>Date</Th>
                            <Th>Status</Th>
                            <Th right>Action</Th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filtered.map((inv) => (
                            <tr key={inv.orderId} className="hover:bg-muted/30 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="font-mono text-xs font-medium">{inv.invoiceId || inv.orderId}</div>
                                    {inv.invoiceId && (
                                        <div className="text-xs text-muted-foreground">{inv.orderId}</div>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="font-medium text-sm">{inv.userName || "—"}</div>
                                    <div className="text-xs text-muted-foreground">{inv.userEmail}</div>
                                </td>
                                <td className="px-4 py-3 font-medium">{fmtCurrency(inv.total)}</td>
                                <td className="px-4 py-3 text-muted-foreground text-xs">{fmtDate(inv.date)}</td>
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
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Download className="h-3.5 w-3.5" />
                                            )}
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </TableWrapper>
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
        <div className="rounded-2xl border bg-card p-6 space-y-6">
            <div className="flex items-start justify-between flex-wrap gap-3">
                <SectionHeader
                    icon={<Activity size={18} />}
                    title="Delivery Logs"
                    description="POD evidence — every payment and download event."
                />
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground">
                        Page {page}/{pages} · {total} entries
                    </span>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={page >= pages}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                </div>
            ) : logs.length === 0 ? (
                <p className="text-muted-foreground text-sm">No delivery logs found.</p>
            ) : (
                <TableWrapper>
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <Th>Event</Th>
                            <Th>User</Th>
                            <Th>Order / Product</Th>
                            <Th>IP Address</Th>
                            <Th>Timestamp</Th>
                            <Th>Status</Th>
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
                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                    {log.user_email || log.user_uuid}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="font-mono text-xs">{log.order_id || log.product_slug || "—"}</div>
                                    {log.invoice_id && (
                                        <div className="text-xs text-muted-foreground">Inv: {log.invoice_id}</div>
                                    )}
                                </td>
                                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                    {log.ip_address || "—"}
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(log.created_at)}</td>
                                <td className="px-4 py-3">
                                    <span className="text-xs font-medium text-green-600 uppercase">{log.status}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </TableWrapper>
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
        <div className="rounded-2xl border bg-card p-6 space-y-6">
            <SectionHeader
                icon={<Users size={18} />}
                title="Users & Purchases"
                description="View user accounts and manage purchased product entries."
            />

            <div className="flex items-center gap-3 flex-wrap">
                <Input
                    placeholder="Search by name or email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
                <span className="text-sm text-muted-foreground">
                    {filtered.length} user{filtered.length !== 1 ? "s" : ""}
                </span>
            </div>

            {loading ? (
                <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full rounded-lg" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <p className="text-muted-foreground text-sm">No users found.</p>
            ) : (
                <div className="space-y-2">
                    {filtered.map((user) => (
                        <div key={user.uuid} className="rounded-xl border overflow-hidden">
                            <button
                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                                onClick={() => setExpanded(expanded === user.uuid ? null : user.uuid)}
                            >
                                <div>
                                    <div className="font-medium text-sm text-foreground">{user.name}</div>
                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={user.isVerified ? "default" : "secondary"}>
                                        {user.isVerified ? "Verified" : "Unverified"}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {user.orderHistory.length} item{user.orderHistory.length !== 1 ? "s" : ""}
                                    </span>
                                </div>
                            </button>

                            {expanded === user.uuid && (
                                <div className="border-t bg-muted/20 px-4 py-3">
                                    {user.orderHistory.length === 0 ? (
                                        <p className="text-xs text-muted-foreground">No purchases yet.</p>
                                    ) : (
                                        <>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                                Purchased Products
                                            </p>
                                            <div className="space-y-1">
                                                {user.orderHistory.map((item) => (
                                                    <div
                                                        key={item.slug}
                                                        className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-muted/30"
                                                    >
                                                        <div>
                                                            <span className="font-mono text-sm">{item.slug}</span>
                                                            {item.purchasedAt && (
                                                                <span className="text-xs text-muted-foreground ml-2">
                                                                    {fmtDate(item.purchasedAt)}
                                                                </span>
                                                            )}
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
                                        </>
                                    )}
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

    const handleDeactivate = async (id: number) => {
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

    const field = (
        label: string,
        key: keyof ProductFormData,
        type: "text" | "textarea" | "number" | "checkbox" = "text"
    ) => (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
            {type === "textarea" ? (
                <textarea
                    className="w-full min-h-[80px] px-3 py-2 text-sm bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                    value={String(form[key])}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
            ) : type === "checkbox" ? (
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={Boolean(form[key])}
                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                        className="h-4 w-4 rounded border-input accent-accent"
                    />
                    <span className="text-sm text-foreground">Active (visible on storefront)</span>
                </label>
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
                    className={key === "slug" && !isCreating ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}
                />
            )}
        </div>
    );

    return (
        <>
            {/* Product Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-8 px-4">
                    <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">
                                {isCreating ? "Create Product" : "Edit Product"}
                            </h3>
                            <button
                                onClick={closeForm}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
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

                        {field("Short Description", "description", "textarea")}
                        {field("Overview", "overview", "textarea")}
                        {field("Short Note", "short_note", "textarea")}
                        {field("Full Description", "full_description", "textarea")}
                        {field("Screenshots (one URL per line)", "screenshots", "textarea")}
                        {field("Features (one per line)", "features", "textarea")}
                        {field("", "is_active", "checkbox")}

                        <div className="flex justify-end gap-2 pt-1">
                            <Button variant="outline" onClick={closeForm} disabled={saving}>
                                Cancel
                            </Button>
                            <Button
                                className="bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.97] transition-all"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                                {isCreating ? "Create Product" : "Save Changes"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="rounded-2xl border bg-card p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <SectionHeader
                        icon={<Package size={18} />}
                        title="Products"
                        description="Manage storefront products — create, edit, or deactivate."
                    />
                    <Button
                        size="sm"
                        className="bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.97] transition-all"
                        onClick={openCreateForm}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Product
                    </Button>
                </div>

                {loading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full rounded-lg" />
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No products found.</p>
                ) : (
                    <TableWrapper>
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <Th>Product</Th>
                                <Th>Price</Th>
                                <Th>Tag</Th>
                                <Th>Active</Th>
                                <Th right>Actions</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {products.map((p) => (
                                <tr
                                    key={p.id}
                                    className={`hover:bg-muted/30 transition-colors ${!p.isActive ? "opacity-50" : ""}`}
                                >
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-sm">{p.title}</div>
                                        <div className="text-xs font-mono text-muted-foreground">{p.slug}</div>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-sm">{p.priceLabel}</td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">{p.tag}</td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => handleToggleActive(p)}
                                            className="text-muted-foreground hover:text-foreground transition-colors"
                                            title={p.isActive ? "Deactivate" : "Activate"}
                                        >
                                            {p.isActive ? (
                                                <ToggleRight className="h-5 w-5 text-green-600" />
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
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => handleDeactivate(p.id)}
                                                disabled={deletingId === p.id}
                                                title="Deactivate"
                                            >
                                                {deletingId === p.id ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                )}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </TableWrapper>
                )}
            </div>
        </>
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
        { id: "invoices", label: "Invoices", icon: <FileText size={15} /> },
        { id: "delivery-logs", label: "Delivery Logs", icon: <Activity size={15} /> },
        { id: "users", label: "Users & Purchases", icon: <Users size={15} /> },
        { id: "products", label: "Products", icon: <Package size={15} /> },
    ];

    const handleLogout = () => {
        logout();
        navigate("/admin/login", { replace: true });
    };

    return (
        <div className="min-h-screen overflow-x-hidden bg-background">
            <Navbar />

            <main className="container-main pt-28 pb-16 space-y-10">
                <ScrollReveal className="flex items-end justify-between flex-wrap gap-4">
                    <div className="space-y-1">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Admin</p>
                        <h1 className="text-3xl sm:text-4xl font-bold leading-tight">Admin Panel</h1>
                        <p className="text-muted-foreground text-sm">
                            Manage invoices, delivery logs, users, and products.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLogout}
                        className="gap-2 active:scale-[0.97] transition-all"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </Button>
                </ScrollReveal>

                {/* Tab Navigation */}
                <ScrollReveal>
                    <nav className="flex gap-1 flex-wrap">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                                    activeTab === tab.id
                                        ? "bg-accent text-accent-foreground"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </ScrollReveal>

                {/* Tab Content */}
                <ScrollReveal>
                    {activeTab === "invoices" && <InvoicesTab />}
                    {activeTab === "delivery-logs" && <DeliveryLogsTab />}
                    {activeTab === "users" && <UsersTab />}
                    {activeTab === "products" && <ProductsTab />}
                </ScrollReveal>
            </main>

            <Footer />
        </div>
    );
};

export default AdminPanel;
