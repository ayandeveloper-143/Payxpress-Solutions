export interface InvoiceTemplateParams {
  invoiceNo: string;
  billPeriod: string;
  invoiceDate: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  billingAddress: string;
  paymentMethod: string;
  paymentDetails: string;
  paymentId: string;
  bankRef: string;
  paymentTimeStr: string;
  itemsHtml: string;
  total: number | string;
  gstPercent: number | string;
  gstAmount: number | string;
  gatewayFee: number | string;
  amountInWords: string;
}

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS_WORDS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

const DEFAULT_GATEWAY_FEE_PERCENT = "2";

function convertBelow1000(n: number): string {
  if (n < 20) return ONES[n];
  if (n < 100) {
    const t = TENS_WORDS[Math.floor(n / 10)];
    const o = n % 10 !== 0 ? " " + ONES[n % 10] : "";
    return t + o;
  }
  const h = ONES[Math.floor(n / 100)] + " Hundred";
  const remainder = n % 100;
  return remainder !== 0 ? h + " " + convertBelow1000(remainder) : h;
}

export function numberToWords(amount: number): string {
  const intPart = Math.floor(amount);
  const decPart = Math.floor(Math.round(amount * 100) % 100);

  if (intPart === 0 && decPart === 0) return "Zero Rupees Only";

  const parts: string[] = [];

  if (intPart >= 10000000) {
    parts.push(convertBelow1000(Math.floor(intPart / 10000000)) + " Crore");
  }
  if (intPart % 10000000 >= 100000) {
    parts.push(convertBelow1000(Math.floor((intPart % 10000000) / 100000)) + " Lakh");
  }
  if (intPart % 100000 >= 1000) {
    parts.push(convertBelow1000(Math.floor((intPart % 100000) / 1000)) + " Thousand");
  }
  if (intPart % 1000 > 0) {
    parts.push(convertBelow1000(intPart % 1000));
  }

  let result = parts.join(" ") + " Rupees";

  if (decPart > 0) {
    result += " and " + convertBelow1000(decPart) + " Paise";
  }

  return result + " Only";
}

export function generateInvoiceHtml(params: InvoiceTemplateParams): string {
  const {
    invoiceNo,
    billPeriod,
    invoiceDate,
    orderId,
    customerName,
    customerEmail,
    customerPhone,
    billingAddress,
    paymentMethod,
    paymentDetails,
    paymentId,
    bankRef,
    paymentTimeStr,
    itemsHtml,
    total,
    gstPercent,
    gstAmount,
    gatewayFee,
    amountInWords,
  } = params;

  const gatewayFeePercent = gatewayFee
    ? ((Number(gatewayFee) / Number(total)) * 100).toFixed(0)
    : DEFAULT_GATEWAY_FEE_PERCENT;

  return `<!DOCTYPE html>
<html>

<head>
  <meta charset="UTF-8">
  <title>Tax Invoice - ${invoiceNo}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
    }

    .invoice {
      max-width: 900px;
      margin: auto;
      background: #fff;
      padding: 20px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #eee;
      padding-bottom: 20px;
    }

    .status {
      display: inline-block;
      margin-top: 8px;
      padding: 6px 12px;
      border-radius: 8px;
      background: #e6f4ea;
      color: #188038;
      font-weight: 600;
      font-size: 12px;
    }

    .brand img {
      height: 50px;
    }

    .company-info {
      font-size: 13px;
      color: #555;
      line-height: 1.6;
    }

    .meta {
      text-align: right;
      font-size: 13px;
    }

    .title-main {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 10px;
    }

    .section {
      margin-top: 30px;
    }

    .grid {
      display: flex;
      gap: 40px;
    }

    .box {
      flex: 1;
      font-size: 14px;
    }

    .title {
      font-size: 12px;
      font-weight: bold;
      color: #888;
      margin-bottom: 6px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }

    th,
    td {
      padding: 10px;
      border-bottom: 1px solid #eee;
      font-size: 13px;
    }

    th {
      background: #fafafa;
    }

    .total-box {
      margin-top: 25px;
      margin-bottom: 5px;
      display: flex;
      justify-content: flex-end;
    }

    .total {
      width: 260px;
    }

    .row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
    }

    .grand {
      font-weight: bold;
      font-size: 16px;
      border-top: 1px solid #eee;
      padding-top: 10px;
    }

    .footer {
      margin-top: 40px;
      font-size: 12px;
      color: #666;
    }

    .signature {
      margin-top: 30px;
      text-align: right;
      font-size: 13px;
    }

    .note {
      font-size: 12px;
      color: #444;
    }

    .order-table-section {
      margin-top: 24px;
    }

    .order-table-section .info-title {
      margin-bottom: 16px;
    }

    .invoice-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13.5px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
    }

    .invoice-table th {
      text-align: left;
      padding: 14px 12px;
      background-color: #f8fafc;
      color: #000000;
      font-weight: 600;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12.5px;
    }

    .invoice-table td {
      padding: 16px 12px;
      border-bottom: 1px solid #edf2f7;
      vertical-align: top;
      color: #1e293b;
    }

    .product-title {
      font-weight: 700;
      font-size: 14px;
      margin-bottom: 6px;
      color: #0f172a;
    }

    .product-desc {
      font-size: 12px;
      color: #444;
      line-height: 1.45;
      max-width: 280px;
    }
  </style>
</head>

<body>
  <div class="invoice">

    <div class="header">
      <div>
        <div class="brand">
          <img src="https://payxpress-solutions.com/logo.png" alt="PayXpress Logo">
        </div>
        <div class="company-info">
          <b>PayXpress Solutions</b><br>
          Bareya, West Bengal 713512<br>
          GSTIN: 19CFDPM7789E1ZV<br>
          State: West Bengal (Code: 19)
        </div>
      </div>

      <div class="meta">
        <div class="title-main">TAX INVOICE</div>
        <div><b>Invoice No:</b> ${invoiceNo}</div>
        <div><b>Period:</b> ${billPeriod}</div>
        <div><b>Date:</b> ${invoiceDate}</div>
        <div><b>Order ID:</b> ${orderId}</div>
        <div><b>Place of Supply:</b> West Bengal</div>
        <div class="status">PAID</div>
      </div>
    </div>

    <div class="section grid">
      <div class="box">
        <div class="title">Bill To</div>
        ${customerName}<br>
        ${customerEmail}<br>
        ${customerPhone}<br>
        ${billingAddress}<br>
        India
      </div>

      <div class="box">
        <div class="title">Payment Details</div>
        Method: ${paymentMethod}<br>
        ${paymentDetails ? paymentDetails + "<br>" : ""}
        Payment ID: ${paymentId}<br>
        ${bankRef ? `Bank Ref: ${bankRef}<br>` : ""}
        Time: ${paymentTimeStr}
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
            <th>Total (&#8377;)</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
    </div>

    <div class="total-box">
      <div class="total">
        <div class="row">
          <span>Price (incl. GST &amp; fees)</span>
          <span>&#8377;${total}</span>
        </div>
        <div class="row">
          <span>GST included (${gstPercent}%)</span>
          <span>&#8377;${gstAmount}</span>
        </div>
        <div class="row">
          <span>Gateway Fee (${gatewayFeePercent}%)</span>
          <span>&#8377;${gatewayFee}</span>
        </div>
        <div class="row grand">
          <span>Total</span>
          <span>&#8377;${total}</span>
        </div>
      </div>
    </div><br>

    <div class="note">
      <b>Amount in Words:</b> ${amountInWords}
    </div>

    <div class="footer">
      <b>HSN/SAC:</b> 998314 (Software / Digital Services)<br><br>
      <b>Note:</b><br>
      This is a digital product. It will be available for download in the user dashboard upon successful payment.<br>
      No physical delivery is involved. No physical goods will be shipped for this transaction.<br><br>
      For any queries, please contact our support team.
    </div>

    <div class="signature">
      For PayXpress Solutions<br>
      <img src="https://payxpress-solutions.com/signature.webp" alt="Signature" style="height: 80px;"><br>
      ________________________<br>
      Authorized Signatory
    </div>

  </div>
</body>

</html>`;
}
