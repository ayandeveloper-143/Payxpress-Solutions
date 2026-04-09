import React, { useMemo, useState } from "react";
import { Trash2, Plus, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { apiBaseUrl } from "@/lib/api";

interface InvoiceItem {
    id: string;
    name: string;
    description: string;
    hsn: string;
    quantity: number;
    unitPrice: number;
    gstPercent: number;
}

interface GatewayFee {
    id: string;
    label: string;
    type: "fixed" | "percent";
    value: number;
}

interface InvoiceFormState {
    invoiceNo: string;
    billPeriod: string;
    invoiceDate: string;
    orderId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    billingAddress: string;
    items: InvoiceItem[];
    gstMode: "included" | "extra";
    gatewayFees: GatewayFee[];
    paymentMethod: string;
    paymentDetails: string;
    paymentId: string;
    bankRef: string;
    paymentTime: string;
    paymentStatus: "PAID" | "UNPAID";
    hsnFooterText: string;
    footerNoteText: string;
    showSignatory: boolean;
    signatoryName: string;
}

const money = (value: number) =>
    value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ONES = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
];

const TENS_WORDS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

const convertBelow1000 = (n: number): string => {
    if (n < 20) return ONES[n];
    if (n < 100) {
        const t = TENS_WORDS[Math.floor(n / 10)];
        const o = n % 10 !== 0 ? ` ${ONES[n % 10]}` : "";
        return `${t}${o}`;
    }
    const h = `${ONES[Math.floor(n / 100)]} Hundred`;
    const rem = n % 100;
    return rem !== 0 ? `${h} ${convertBelow1000(rem)}` : h;
};

const numberToWords = (amount: number): string => {
    const intPart = Math.floor(amount);
    const decPart = Math.floor(Math.round(amount * 100) % 100);
    if (intPart === 0 && decPart === 0) return "Zero Rupees Only";

    const parts: string[] = [];
    if (intPart >= 10000000) parts.push(`${convertBelow1000(Math.floor(intPart / 10000000))} Crore`);
    if (intPart % 10000000 >= 100000) parts.push(`${convertBelow1000(Math.floor((intPart % 10000000) / 100000))} Lakh`);
    if (intPart % 100000 >= 1000) parts.push(`${convertBelow1000(Math.floor((intPart % 100000) / 1000))} Thousand`);
    if (intPart % 1000 > 0) parts.push(convertBelow1000(intPart % 1000));

    let result = `${parts.join(" ")} Rupees`;
    if (decPart > 0) result += ` and ${convertBelow1000(decPart)} Paise`;
    return `${result} Only`;
};

const htmlEscape = (value: string) =>
    value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

const makeId = () => Math.random().toString(36).slice(2, 10);

const defaultItem = (): InvoiceItem => ({
    id: makeId(),
    name: "",
    description: "",
    hsn: "998314",
    quantity: 1,
    unitPrice: 0,
    gstPercent: 18,
});

const defaultFee = (): GatewayFee => ({
    id: makeId(),
    label: "Gateway Fee",
    type: "percent",
    value: 2,
});

const now = new Date();
const defaultInvoiceNo = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}001`;

const AdminInvoiceMaker = () => {
    const { toast } = useToast();
    const [isExporting, setIsExporting] = useState(false);

    const [form, setForm] = useState<InvoiceFormState>({
        invoiceNo: defaultInvoiceNo,
        billPeriod: now.toLocaleDateString("en-IN", { month: "short", year: "numeric" }).replace(" ", "-"),
        invoiceDate: now.toISOString().split("T")[0],
        orderId: `ORDER_${Date.now()}`,
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        billingAddress: "",
        items: [defaultItem()],
        gstMode: "included",
        gatewayFees: [defaultFee()],
        paymentMethod: "UPI",
        paymentDetails: "",
        paymentId: "",
        bankRef: "",
        paymentTime: new Date().toISOString().slice(0, 16),
        paymentStatus: "PAID",
        hsnFooterText: "998314 (Software / Digital Services)",
        footerNoteText:
            "This is a digital product. It will be available for download in the user dashboard upon successful payment.\nNo physical delivery is involved. No physical goods will be shipped for this transaction.\n\nFor any queries, please contact our support team.",
        showSignatory: true,
        signatoryName: "Authorized Signatory",
    });

    const computed = useMemo(() => {
        const lines = form.items.map((item) => {
            const base = item.quantity * item.unitPrice;
            const gst = form.gstMode === "included"
                ? base - base / (1 + item.gstPercent / 100)
                : (base * item.gstPercent) / 100;
            const total = form.gstMode === "included" ? base : base + gst;
            return { ...item, base, gst, total };
        });

        const subtotal = Number(lines.reduce((sum, line) => sum + line.base, 0).toFixed(2));
        const gstAmount = Number(lines.reduce((sum, line) => sum + line.gst, 0).toFixed(2));
        const feeBase = form.gstMode === "included" ? subtotal : subtotal + gstAmount;

        const feeRows = form.gatewayFees.map((fee) => {
            const amount = fee.type === "fixed" ? fee.value : (feeBase * fee.value) / 100;
            return { ...fee, amount: Number(amount.toFixed(2)) };
        });

        const feeTotal = Number(feeRows.reduce((sum, fee) => sum + fee.amount, 0).toFixed(2));
        const total = Number((form.gstMode === "included"
            ? subtotal + feeTotal
            : subtotal + gstAmount + feeTotal).toFixed(2));

        return { lines, subtotal, gstAmount, feeRows, feeTotal, total };
    }, [form]);

    const setField = <K extends keyof InvoiceFormState>(key: K, value: InvoiceFormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const updateItem = (id: string, patch: Partial<InvoiceItem>) => {
        setForm((prev) => ({
            ...prev,
            items: prev.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        }));
    };

    const removeItem = (id: string) => {
        setForm((prev) => ({
            ...prev,
            items: prev.items.length > 1 ? prev.items.filter((item) => item.id !== id) : prev.items,
        }));
    };

    const updateFee = (id: string, patch: Partial<GatewayFee>) => {
        setForm((prev) => ({
            ...prev,
            gatewayFees: prev.gatewayFees.map((fee) => (fee.id === id ? { ...fee, ...patch } : fee)),
        }));
    };

    const removeFee = (id: string) => {
        setForm((prev) => ({
            ...prev,
            gatewayFees: prev.gatewayFees.filter((fee) => fee.id !== id),
        }));
    };

    const previewHtml = useMemo(() => {
        const itemsHtml = computed.lines
            .map((line) => `
              <tr>
                <td>
                  <div class="product-title">${htmlEscape(line.name || "Untitled Item")}</div>
                  ${line.description ? `<div class="product-desc">${htmlEscape(line.description)}</div>` : ""}
                </td>
                <td>${htmlEscape(line.hsn)}</td>
                <td>${line.gstPercent}%</td>
                <td>${line.quantity}</td>
                <td>₹${money(line.total)}</td>
              </tr>
            `)
            .join("");

        const feeRows = computed.feeRows
            .map((fee) => `
              <div class="row">
                <span>${htmlEscape(fee.label)}${fee.type === "percent" ? ` (${fee.value}%)` : ""}</span>
                <span>₹${money(fee.amount)}</span>
              </div>
            `)
            .join("");

        const billToName = form.customerName;
        const billToAddress = form.billingAddress;
        const feeTitle = form.gstMode === "included" ? "Price (incl. GST & fees)" : "Subtotal";
        const gstTitle = form.gstMode === "included" ? "GST included" : "GST extra";
        const hasAnyFee = computed.feeRows.length > 0;
        const paymentTime = form.paymentTime ? new Date(form.paymentTime).toLocaleString("en-IN") : "";
        const amountInWords = numberToWords(computed.total);
        const noteHtml = htmlEscape(form.footerNoteText).replace(/\n/g, "<br />");

        return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Tax Invoice - ${htmlEscape(form.invoiceNo)}</title>
<style>
    body { font-family: Arial, sans-serif; }
    .invoice { max-width: 900px; margin: auto; background: #fff; padding: 20px; }
    .header { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 20px; }
    .status { display: inline-block; margin-top: 8px; padding: 6px 12px; border-radius: 8px; font-weight: 600; font-size: 12px; }
    .status-paid { background: #e6f4ea; color: #188038; }
    .status-unpaid { background: #fff7ed; color: #9a3412; }
    .brand img { height: 50px; }
    .company-info { font-size: 13px; color: #555; line-height: 1.6; }
    .meta { text-align: right; font-size: 13px; }
    .title-main { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
    .section { margin-top: 30px; }
    .grid { display: flex; gap: 40px; }
    .box { flex: 1; font-size: 14px; }
    .title { font-size: 12px; font-weight: bold; color: #888; margin-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { padding: 10px; border-bottom: 1px solid #eee; font-size: 13px; }
    th { background: #fafafa; }
    .total-box { margin-top: 25px; margin-bottom: 5px; display: flex; justify-content: flex-end; }
    .total { width: 260px; }
    .row { display: flex; justify-content: space-between; padding: 4px 0; }
    .grand { font-weight: bold; font-size: 16px; border-top: 1px solid #eee; padding-top: 10px; }
    .footer { margin-top: 40px; font-size: 12px; color: #666; }
    .signature { margin-top: 30px; text-align: right; font-size: 13px; }
    .note { font-size: 12px; color: #444; }
    .order-table-section { margin-top: 24px; }
    .order-table-section .info-title { margin-bottom: 16px; }
    .invoice-table { width: 100%; border-collapse: collapse; font-size: 13.5px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02); }
    .invoice-table th { text-align: left; padding: 14px 12px; background-color: #f8fafc; color: #000000; font-weight: 600; border-bottom: 1px solid #e2e8f0; font-size: 12.5px; }
    .invoice-table td { padding: 16px 12px; border-bottom: 1px solid #edf2f7; vertical-align: top; color: #1e293b; }
    .product-title { font-weight: 700; font-size: 14px; margin-bottom: 6px; color: #0f172a; }
    .product-desc { font-size: 12px; color: #444; line-height: 1.45; max-width: 280px; }
</style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div>
                <div class="brand">
                    <img src="https://payxpress-solutions.com/logo.png" alt="PayXpress Logo" />
                </div>
                <div class="company-info">
                    <b>PayXpress Solutions</b><br />
          Bareya, West Bengal 713512<br />
          GSTIN: 19CFDPM7789E1ZV<br />
          State: West Bengal (Code: 19)
        </div>
      </div>
      <div class="meta">
        <div class="title-main">TAX INVOICE</div>
        <div><b>Invoice No:</b> ${htmlEscape(form.invoiceNo)}</div>
        <div><b>Period:</b> ${htmlEscape(form.billPeriod)}</div>
        <div><b>Date:</b> ${htmlEscape(form.invoiceDate)}</div>
        <div><b>Order ID:</b> ${htmlEscape(form.orderId)}</div>
        <div><b>Place of Supply:</b> West Bengal</div>
        <div class="status ${form.paymentStatus === "PAID" ? "status-paid" : "status-unpaid"}">${form.paymentStatus}</div>
      </div>
    </div>

    <div class="section grid">
      <div class="box">
                <div class="title">Bill To</div>
        ${htmlEscape(billToName)}<br />
        ${htmlEscape(form.customerEmail)}<br />
        ${htmlEscape(form.customerPhone)}<br />
        ${htmlEscape(billToAddress)}<br />
        India
      </div>
      <div class="box">
                <div class="title">Payment Details</div>
        Method: ${htmlEscape(form.paymentMethod)}<br />
        ${form.paymentDetails ? `${htmlEscape(form.paymentDetails)}<br />` : ""}
        Payment ID: ${htmlEscape(form.paymentId || "-")}<br />
        Bank Ref: ${htmlEscape(form.bankRef || "-")}<br />
                Time: ${htmlEscape(paymentTime)}
      </div>
    </div>

    <div class="section">
            <div class="title">Order Summary</div>
            <table class="invoice-table">
        <thead>
          <tr>
            <th>Product &amp; Description</th>
            <th>HSN/SAC</th>
            <th>GST %</th>
            <th>Qty</th>
            <th>Total (₹)</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
    </div>

        <div class="total-box">
      <div class="total">
                <div class="row"><span>${feeTitle}</span><span>₹${money(computed.subtotal)}</span></div>
                <div class="row"><span>${gstTitle}</span><span>₹${money(computed.gstAmount)}</span></div>
        ${feeRows}
                ${!hasAnyFee ? `<div class="row"><span>Gateway Fee (0%)</span><span>₹0.00</span></div>` : ""}
        <div class="row grand"><span>Total</span><span>₹${money(computed.total)}</span></div>
      </div>
        </div><br>

        <div class="note">
            <b>Amount in Words:</b> ${htmlEscape(amountInWords)}
        </div>

        <div class="footer">
            <b>HSN/SAC:</b> ${htmlEscape(form.hsnFooterText)}<br><br>
            <b>Note:</b><br>
            ${noteHtml}
        </div>

    ${form.showSignatory
                ? `<div class="signature">
                    For PayXpress Solutions<br>
                    <img src="https://payxpress-solutions.com/signature.webp" alt="Signature" style="height: 80px;" crossorigin="anonymous"><br>
                    ________________________<br>
                    ${htmlEscape(form.signatoryName || "Authorized Signatory")}
                </div>`
                : `<div class="signature">
                    For PayXpress Solutions<br>
                    <img src="https://payxpress-solutions.com/signature.webp" alt="Signature" style="height: 80px; visibility: hidden;"><br>
                    ________________________<br>
                    ${htmlEscape(form.signatoryName || "Authorized Signatory")}
                </div>`}
  </div>
</body>
</html>`;
    }, [form, computed]);

    const handleExport = async () => {
        if (isExporting) {
            return;
        }

        if (form.items.length === 0 || form.items.some((item) => !item.name.trim())) {
            toast({ title: "Please add at least one valid item before export.", variant: "destructive" });
            return;
        }

        const token = localStorage.getItem("admin_token") ?? "";
        if (!token) {
            toast({ title: "Admin session expired. Please login again.", variant: "destructive" });
            return;
        }

        try {
            setIsExporting(true);
            const response = await fetch(`${apiBaseUrl}/admin/invoice-maker/pdf`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    html: previewHtml,
                    fileName: form.invoiceNo,
                }),
            });

            if (!response.ok) {
                throw new Error("PDF generation failed");
            }

            const blob = await response.blob();
            const fileName = `${form.invoiceNo.trim() || "invoice"}.pdf`;
            const objectUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = objectUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(objectUrl);

            toast({ title: "Invoice PDF downloaded." });
        } catch (error) {
            console.error(error);
            toast({ title: "Unable to create PDF. Please try again.", variant: "destructive" });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="rounded-2xl border bg-card p-6 space-y-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h2 className="text-2xl font-bold">Make Invoice</h2>
                    <p className="text-sm text-muted-foreground">Fill all details, preview on left, and export PDF.</p>
                </div>
                <Button onClick={handleExport} className="gap-2" disabled={isExporting}>
                    {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    {isExporting ? "Generating PDF..." : "Export PDF"}
                </Button>
            </div>

            <Separator />

            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
                <Card className="p-4 border-2 bg-white text-black">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Live Invoice Preview</div>
                    <iframe title="Invoice Preview" className="w-full h-[900px] rounded-md border" srcDoc={previewHtml} />
                </Card>

                <div className="space-y-4 max-h-[900px] overflow-y-auto pr-1">
                    <Card className="p-4 space-y-3">
                        <h3 className="font-semibold">Invoice Details</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs">Invoice No</Label>
                                <Input className="mt-1" value={form.invoiceNo} onChange={(e) => setField("invoiceNo", e.target.value)} />
                            </div>
                            <div>
                                <Label className="text-xs">Invoice Date</Label>
                                <Input className="mt-1" type="date" value={form.invoiceDate} onChange={(e) => setField("invoiceDate", e.target.value)} />
                            </div>
                            <div>
                                <Label className="text-xs">Bill Period</Label>
                                <Input className="mt-1" value={form.billPeriod} onChange={(e) => setField("billPeriod", e.target.value)} />
                            </div>
                            <div>
                                <Label className="text-xs">Order ID</Label>
                                <Input className="mt-1" value={form.orderId} onChange={(e) => setField("orderId", e.target.value)} />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 space-y-3">
                        <h3 className="font-semibold">Customer Details</h3>
                        <div className="space-y-3">
                            <div>
                                <Label className="text-xs">Customer Name</Label>
                                <Input className="mt-1" placeholder="Enter customer full name" value={form.customerName} onChange={(e) => setField("customerName", e.target.value)} />
                            </div>
                            <div>
                                <Label className="text-xs">Customer Email</Label>
                                <Input className="mt-1" placeholder="Enter customer email" value={form.customerEmail} onChange={(e) => setField("customerEmail", e.target.value)} />
                            </div>
                            <div>
                                <Label className="text-xs">Customer Phone</Label>
                                <Input className="mt-1" placeholder="Enter customer phone number" value={form.customerPhone} onChange={(e) => setField("customerPhone", e.target.value)} />
                            </div>
                            <div>
                                <Label className="text-xs">Billing Address</Label>
                                <Textarea className="mt-1 h-20" placeholder="Enter complete billing address" value={form.billingAddress} onChange={(e) => setField("billingAddress", e.target.value)} />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Items</h3>
                            <Button size="sm" className="gap-1" onClick={() => setField("items", [...form.items, defaultItem()])}>
                                <Plus size={14} /> Add Item
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {form.items.map((item) => (
                                <div key={item.id} className="rounded-lg border p-3 space-y-2">
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <Label className="text-xs">Item Name</Label>
                                            <Input className="mt-1" placeholder="Enter item name" value={item.name} onChange={(e) => updateItem(item.id, { name: e.target.value })} />
                                        </div>
                                        <Button size="icon" variant="ghost" onClick={() => removeItem(item.id)} disabled={form.items.length === 1}>
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                    <div>
                                        <Label className="text-xs">Description</Label>
                                        <Textarea className="mt-1 h-16" placeholder="Enter item description" value={item.description} onChange={(e) => updateItem(item.id, { description: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-xs">HSN/SAC</Label>
                                            <Input className="mt-1" placeholder="e.g. 998314" value={item.hsn} onChange={(e) => updateItem(item.id, { hsn: e.target.value })} />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Quantity</Label>
                                            <Input className="mt-1" type="number" min="1" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(item.id, { quantity: Math.max(1, Number(e.target.value) || 1) })} />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Unit Price</Label>
                                            <Input className="mt-1" type="number" min="0" step="0.01" placeholder="0.00" value={item.unitPrice} onChange={(e) => updateItem(item.id, { unitPrice: Math.max(0, Number(e.target.value) || 0) })} />
                                        </div>
                                        <div>
                                            <Label className="text-xs">GST %</Label>
                                            <Input className="mt-1" type="number" min="0" step="0.01" placeholder="18" value={item.gstPercent} onChange={(e) => updateItem(item.id, { gstPercent: Math.max(0, Number(e.target.value) || 0) })} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="p-4 space-y-3">
                        <h3 className="font-semibold">GST & Gateway Fees</h3>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                                <p className="text-sm font-medium">GST Mode</p>
                                <p className="text-xs text-muted-foreground">Switch between GST included or GST extra</p>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant={form.gstMode === "included" ? "default" : "outline"} onClick={() => setField("gstMode", "included")}>Included</Button>
                                <Button size="sm" variant={form.gstMode === "extra" ? "default" : "outline"} onClick={() => setField("gstMode", "extra")}>Extra</Button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Gateway Fee Rows</p>
                            <Button size="sm" variant="outline" className="gap-1" onClick={() => setField("gatewayFees", [...form.gatewayFees, defaultFee()])}>
                                <Plus size={14} /> Add Fee
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {form.gatewayFees.length === 0 && (
                                <p className="text-xs text-muted-foreground">No gateway fee row added.</p>
                            )}
                            {form.gatewayFees.map((fee) => (
                                <div key={fee.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center rounded-lg border p-2">
                                    <div>
                                        <Label className="text-xs">Fee Label</Label>
                                        <Input className="mt-1" value={fee.label} onChange={(e) => updateFee(fee.id, { label: e.target.value })} placeholder="Fee Label" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Type</Label>
                                        <select className="mt-1 h-9 rounded-md border bg-background px-2 text-sm" value={fee.type} onChange={(e) => updateFee(fee.id, { type: e.target.value as "fixed" | "percent" })}>
                                            <option value="percent">%</option>
                                            <option value="fixed">₹</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label className="text-xs">Value</Label>
                                        <Input className="mt-1 w-24" type="number" min="0" step="0.01" value={fee.value} onChange={(e) => updateFee(fee.id, { value: Math.max(0, Number(e.target.value) || 0) })} />
                                    </div>
                                    <Button size="icon" variant="ghost" onClick={() => removeFee(fee.id)}>
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="p-4 space-y-3">
                        <h3 className="font-semibold">Payment Details</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs">Payment Method</Label>
                                <Input className="mt-1" placeholder="UPI / Card / Netbanking" value={form.paymentMethod} onChange={(e) => setField("paymentMethod", e.target.value)} />
                            </div>
                            <div>
                                <Label className="text-xs">Payment Status</Label>
                                <select className="mt-1 h-10 rounded-md border bg-background px-3 text-sm w-full" value={form.paymentStatus} onChange={(e) => setField("paymentStatus", e.target.value as "PAID" | "UNPAID")}>
                                    <option value="PAID">Paid</option>
                                    <option value="UNPAID">Unpaid</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs">Payment Details</Label>
                            <Input className="mt-1" placeholder="UPI/Bank/App etc." value={form.paymentDetails} onChange={(e) => setField("paymentDetails", e.target.value)} />
                        </div>
                        <div>
                            <Label className="text-xs">Transaction / Payment ID</Label>
                            <Input className="mt-1" placeholder="Enter payment id" value={form.paymentId} onChange={(e) => setField("paymentId", e.target.value)} />
                        </div>
                        <div>
                            <Label className="text-xs">Bank Reference</Label>
                            <Input className="mt-1" placeholder="Enter bank reference" value={form.bankRef} onChange={(e) => setField("bankRef", e.target.value)} />
                        </div>
                        <div>
                            <Label className="text-xs">Payment Date & Time</Label>
                            <Input className="mt-1" type="datetime-local" value={form.paymentTime} onChange={(e) => setField("paymentTime", e.target.value)} />
                        </div>
                    </Card>

                    <Card className="p-4 space-y-3">
                        <h3 className="font-semibold">Footer & Signatory</h3>
                        <div>
                            <Label className="text-xs">HSN/SAC Footer Text</Label>
                            <Input className="mt-1" value={form.hsnFooterText} onChange={(e) => setField("hsnFooterText", e.target.value)} />
                        </div>
                        <div>
                            <Label className="text-xs">Footer Note (editable)</Label>
                            <Textarea value={form.footerNoteText} onChange={(e) => setField("footerNoteText", e.target.value)} className="mt-1 h-28" />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                                <p className="text-sm font-medium">Authorized Signatory</p>
                                <p className="text-xs text-muted-foreground">Turn off to hide only signatory image.</p>
                            </div>
                            <Switch checked={form.showSignatory} onCheckedChange={(checked) => setField("showSignatory", checked)} />
                        </div>
                        <div>
                            <Label className="text-xs">Signatory Name</Label>
                            <Input className="mt-1" placeholder="Authorized Signatory" value={form.signatoryName} onChange={(e) => setField("signatoryName", e.target.value)} />
                        </div>
                    </Card>

                    <Card className="p-4 space-y-2">
                        <h3 className="font-semibold">Totals</h3>
                        <div className="text-sm flex justify-between"><span>Subtotal</span><span>₹{money(computed.subtotal)}</span></div>
                        <div className="text-sm flex justify-between"><span>{form.gstMode === "included" ? "GST included" : "GST extra"}</span><span>₹{money(computed.gstAmount)}</span></div>
                        <div className="text-sm flex justify-between"><span>Gateway Fees</span><span>₹{money(computed.feeTotal)}</span></div>
                        <Separator />
                        <div className="text-base font-semibold flex justify-between"><span>Total</span><span>₹{money(computed.total)}</span></div>
                        <Badge variant={form.paymentStatus === "PAID" ? "default" : "secondary"} className="w-fit mt-1">{form.paymentStatus}</Badge>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AdminInvoiceMaker;
