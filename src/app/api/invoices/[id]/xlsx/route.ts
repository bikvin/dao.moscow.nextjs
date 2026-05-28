import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { db } from "@/db";
import { InvoiceTypeEnum, PriceUnitEnum } from "@prisma/client";
import { fmtLong, fmtShort, num, amountInWords } from "@/lib/invoice/formatters";

// ── Border helpers ────────────────────────────────────────────────────────────

type BorderStyle = ExcelJS.BorderStyle;

const THIN: { style: BorderStyle; color: { argb: string } } = { style: "thin", color: { argb: "FF000000" } };
const MEDIUM: { style: BorderStyle; color: { argb: string } } = { style: "medium", color: { argb: "FF000000" } };

function allThin(): ExcelJS.Borders {
  return { top: THIN, bottom: THIN, left: THIN, right: THIN, diagonal: {} };
}

function applyBorder(cell: ExcelJS.Cell, borders: Partial<ExcelJS.Borders>) {
  cell.border = borders as ExcelJS.Borders;
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const invoice = await db.invoice.findUnique({
    where: { id: params.id },
    include: {
      items: {
        include: {
          product: { select: { sku: true } },
          productVariant: { select: { variantName: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Счёт не найден" }, { status: 404 });
  }

  const SELLER_FIELDS = [
    "sellerLegalName", "sellerInn", "sellerKpp", "sellerAddress", "sellerPhone",
    "sellerBankName", "sellerShortBankName", "sellerBik", "sellerBankAccNo", "sellerAccNo",
  ] as const;

  const settingsRows = await db.settings.findMany({
    where: { field: { in: [...SELLER_FIELDS] } },
  });
  const getSetting = (field: string) =>
    settingsRows.find((r) => r.field === field)?.value ?? "";
  const sel = (invoiceVal: string, field: string) =>
    invoiceVal || getSetting(field);

  const isBank = invoice.invoiceType === InvoiceTypeEnum.BANK;

  const seller = {
    legalName:     isBank ? sel(invoice.sellerLegalName,     "sellerLegalName")     : "",
    inn:           isBank ? sel(invoice.sellerInn,           "sellerInn")           : "",
    kpp:           isBank ? sel(invoice.sellerKpp,           "sellerKpp")           : "",
    address:       isBank ? sel(invoice.sellerAddress,       "sellerAddress")       : "",
    phone:         isBank ? sel(invoice.sellerPhone,         "sellerPhone")         : "",
    bankName:      isBank ? sel(invoice.sellerBankName,      "sellerBankName")      : "",
    shortBankName: isBank ? sel(invoice.sellerShortBankName, "sellerShortBankName") : "",
    bik:           isBank ? sel(invoice.sellerBik,           "sellerBik")           : "",
    bankAccNo:     isBank ? sel(invoice.sellerBankAccNo,     "sellerBankAccNo")     : "",
    accNo:         isBank ? sel(invoice.sellerAccNo,         "sellerAccNo")         : "",
  };

  const itemsSubtotal = invoice.items.reduce((s, i) => s + i.totalRub, 0);
  const discountAmt = invoice.discountPercent > 0
    ? Math.round((itemsSubtotal * invoice.discountPercent) / 100)
    : 0;
  const tableTotal = itemsSubtotal - discountAmt + invoice.deliveryPriceRub;

  // ── Build workbook ────────────────────────────────────────────────────────

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Счёт");

  ws.columns = [
    { width: 2 },   // A - left padding
    { width: 4 },   // B - № (items) / part of party label
    { width: 28 },  // C - description (items) / part of party label
    { width: 9 },   // D - qty
    { width: 5 },   // E - unit
    { width: 14 },  // F - price / bank label
    { width: 22 },  // G - total / bank value
  ];

  const font = { name: "Arial", size: 9 };
  const fontBold = { name: "Arial", size: 9, bold: true };

  const C = 1; // column offset for left padding column

  function cell(row: number, col: number): ExcelJS.Cell {
    return ws.getCell(row, col + C);
  }

  function setVal(row: number, col: number, value: ExcelJS.CellValue, bold = false, align: ExcelJS.Alignment["horizontal"] = "left", wrap = false) {
    const c = cell(row, col);
    c.value = value;
    c.font = bold ? fontBold : font;
    c.alignment = { horizontal: align, vertical: "middle", wrapText: wrap };
  }

  function merge(r1: number, c1: number, r2: number, c2: number) {
    ws.mergeCells(r1, c1 + C, r2, c2 + C);
  }

  // ── Row 1: top margin ─────────────────────────────────────────────────────
  ws.getRow(1).height = 6;

  // ── Rows 2–7: Bank header ─────────────────────────────────────────────────
  // Left (A:D):  rows 2-3 = bank name, row 4 = "Банк получателя" label
  //              row 5 = INN | KPP
  //              row 6 = seller name, row 7 = "Получатель" label
  // Right (E,F): rows 2-4 = БИК, row 5 = Сч.№ corr, rows 6-7 = Сч.№ own

  ws.getRow(2).height = 14;
  ws.getRow(3).height = 10;
  ws.getRow(4).height = 10;
  ws.getRow(5).height = 12;
  ws.getRow(6).height = 14;
  ws.getRow(7).height = 10;

  // Bank name: A2:D3
  merge(2, 1, 3, 4);
  const bankNameCell = cell(2, 1);
  bankNameCell.value = seller.shortBankName || seller.bankName;
  bankNameCell.font = font;
  bankNameCell.alignment = { horizontal: "left", vertical: "middle" };
  applyBorder(bankNameCell, { top: MEDIUM, left: MEDIUM, right: THIN });

  // "Банк получателя" label: A4:D4
  merge(4, 1, 4, 4);
  const bankLabelCell = cell(4, 1);
  bankLabelCell.value = "Банк получателя";
  bankLabelCell.font = { name: "Arial", size: 7 };
  bankLabelCell.alignment = { horizontal: "left", vertical: "middle" };
  applyBorder(bankLabelCell, { left: MEDIUM, bottom: THIN, right: THIN });

  // INN | KPP: A5:B5 + C5:D5
  ws.getRow(5).height = 12;
  merge(5, 1, 5, 2);
  const innCell = cell(5, 1);
  innCell.value = seller.inn ? `ИНН ${seller.inn}` : "ИНН";
  innCell.font = font;
  innCell.alignment = { horizontal: "left", vertical: "middle" };
  applyBorder(innCell, { top: THIN, left: MEDIUM, bottom: THIN, right: THIN });

  merge(5, 3, 5, 4);
  const kppCell = cell(5, 3);
  kppCell.value = seller.kpp ? `КПП ${seller.kpp}` : "КПП";
  kppCell.font = font;
  kppCell.alignment = { horizontal: "left", vertical: "middle" };
  applyBorder(kppCell, { top: THIN, left: THIN, bottom: THIN, right: THIN });

  // Seller name: A6:D6
  merge(6, 1, 6, 4);
  const sellerNameCell = cell(6, 1);
  sellerNameCell.value = seller.legalName || "";
  sellerNameCell.font = fontBold;
  sellerNameCell.alignment = { horizontal: "left", vertical: "middle" };
  applyBorder(sellerNameCell, { top: THIN, left: MEDIUM, right: THIN });

  // "Получатель" label: A7:D7
  merge(7, 1, 7, 4);
  const receiverLabelCell = cell(7, 1);
  receiverLabelCell.value = "Получатель";
  receiverLabelCell.font = { name: "Arial", size: 7 };
  receiverLabelCell.alignment = { horizontal: "left", vertical: "middle" };
  applyBorder(receiverLabelCell, { left: MEDIUM, bottom: MEDIUM, right: THIN });

  // БИК label + value: E2:E4, F2:F4
  merge(2, 5, 4, 5);
  const bikLabelCell = cell(2, 5);
  bikLabelCell.value = "БИК";
  bikLabelCell.font = font;
  bikLabelCell.alignment = { horizontal: "left", vertical: "middle" };
  applyBorder(bikLabelCell, { top: MEDIUM, left: THIN, bottom: THIN, right: THIN });

  merge(2, 6, 4, 6);
  const bikValCell = cell(2, 6);
  bikValCell.value = seller.bik;
  bikValCell.font = font;
  bikValCell.alignment = { horizontal: "left", vertical: "middle" };
  applyBorder(bikValCell, { top: MEDIUM, left: THIN, bottom: THIN, right: MEDIUM });

  // Сч.№ (corr): E5, F5
  const corrLabelCell = cell(5, 5);
  corrLabelCell.value = "Сч. №";
  corrLabelCell.font = font;
  corrLabelCell.alignment = { horizontal: "left", vertical: "middle" };
  applyBorder(corrLabelCell, { top: THIN, left: THIN, bottom: THIN, right: THIN });

  const corrValCell = cell(5, 6);
  corrValCell.value = seller.bankAccNo;
  corrValCell.font = font;
  corrValCell.alignment = { horizontal: "left", vertical: "middle" };
  applyBorder(corrValCell, { top: THIN, left: THIN, bottom: THIN, right: MEDIUM });

  // Сч.№ (own): E6:E7, F6:F7
  merge(6, 5, 7, 5);
  const ownLabelCell = cell(6, 5);
  ownLabelCell.value = "Сч. №";
  ownLabelCell.font = font;
  ownLabelCell.alignment = { horizontal: "left", vertical: "middle" };
  applyBorder(ownLabelCell, { top: THIN, left: THIN, bottom: MEDIUM, right: THIN });

  merge(6, 6, 7, 6);
  const ownValCell = cell(6, 6);
  ownValCell.value = seller.accNo;
  ownValCell.font = font;
  ownValCell.alignment = { horizontal: "left", vertical: "middle" };
  applyBorder(ownValCell, { top: THIN, left: THIN, bottom: MEDIUM, right: MEDIUM });

  // ── Row 8: spacer ─────────────────────────────────────────────────────────
  ws.getRow(8).height = 16;

  // ── Row 9: Title ──────────────────────────────────────────────────────────
  ws.getRow(9).height = 18;
  merge(9, 1, 9, 6);
  const titleCell = cell(9, 1);
  titleCell.value = `Счет на оплату № ${invoice.sequenceNumber} от ${fmtLong(invoice.invoiceDate)} г.`;
  titleCell.font = { name: "Arial", size: 13, bold: true };
  titleCell.alignment = { horizontal: "left", vertical: "middle" };
  titleCell.border = { bottom: { style: "medium", color: { argb: "FF000000" } } } as ExcelJS.Borders;

  // ── Row 10: spacer ────────────────────────────────────────────────────────
  ws.getRow(10).height = 6;

  // ── Rows 11+: Parties ─────────────────────────────────────────────────────
  let r = 11;

  const sellerDetails = [
    seller.legalName,
    seller.inn ? `ИНН ${seller.inn}` : "",
    seller.kpp ? `КПП ${seller.kpp}` : "",
    seller.address || "",
    seller.phone ? `тел. ${seller.phone}` : "",
  ].filter(Boolean).join(", ");

  const buyerDetails = [
    invoice.buyerLegalName,
    invoice.buyerInn ? `ИНН ${invoice.buyerInn}` : "",
    invoice.buyerKpp ? `КПП ${invoice.buyerKpp}` : "",
  ].filter(Boolean).join(", ");

  function addPartyRow(label: string, value: string) {
    ws.getRow(r).height = 22;
    merge(r, 1, r, 2);
    setVal(r, 1, label, false, "left", true);
    merge(r, 3, r, 6);
    setVal(r, 3, value, true, "left", true);
    r++;
  }

  addPartyRow("Поставщик (Исполнитель):", sellerDetails);
  if (isBank && buyerDetails) addPartyRow("Покупатель (Заказчик):", buyerDetails);
  addPartyRow("Основание:", `Счет №${invoice.sequenceNumber} от ${fmtShort(invoice.invoiceDate)}`);

  // ── Spacer ────────────────────────────────────────────────────────────────
  ws.getRow(r).height = 6;
  r++;

  // ── Items table header ────────────────────────────────────────────────────
  ws.getRow(r).height = 14;
  const thRow = r;
  setVal(r, 1, "№",                          true, "center");
  setVal(r, 2, "Товары (работы, услуги)",     true, "center");
  setVal(r, 3, "Кол-во",                      true, "center");
  setVal(r, 4, "Ед.",                          true, "center");
  setVal(r, 5, "Цена",                         true, "center");
  setVal(r, 6, "Сумма",                        true, "center");
  for (let c = 1; c <= 6; c++) {
    applyBorder(cell(r, c), allThin());
    cell(r, c).fill = { type: "pattern", pattern: "none" };
  }
  r++;

  // ── Items ─────────────────────────────────────────────────────────────────
  invoice.items.forEach((item, idx) => {
    ws.getRow(r).height = 13;
    const isM2 = item.priceUnit === PriceUnitEnum.M2;
    const qty = isM2 && item.quantityM2 !== null ? item.quantityM2 : item.quantity;
    const unit = isM2 ? "м²" : "шт";
    setVal(r, 1, idx + 1,             false, "center");
    setVal(r, 2, item.product.sku,    false, "left");
    setVal(r, 3, qty,                 false, "right");
    setVal(r, 4, unit,                false, "center");
    setVal(r, 5, item.priceRub / 100, false, "right");
    setVal(r, 6, item.totalRub / 100, false, "right");
    cell(r, 5).numFmt = '#,##0.00';
    cell(r, 6).numFmt = '#,##0.00';
    for (let c = 1; c <= 6; c++) applyBorder(cell(r, c), allThin());
    r++;
  });

  if (invoice.discountPercent > 0) {
    ws.getRow(r).height = 13;
    setVal(r, 1, "",                                    false, "center");
    setVal(r, 2, `Скидка ${invoice.discountPercent}%`,  false, "left");
    setVal(r, 3, "-",                                   false, "center");
    setVal(r, 4, "-",                                   false, "center");
    setVal(r, 5, "-",                                   false, "right");
    setVal(r, 6, -discountAmt / 100,                    false, "right");
    cell(r, 6).numFmt = '#,##0.00';
    for (let c = 1; c <= 6; c++) applyBorder(cell(r, c), allThin());
    r++;
  }

  if (invoice.deliveryPriceRub > 0) {
    ws.getRow(r).height = 13;
    setVal(r, 1, "",                          false, "center");
    setVal(r, 2, "Доставка",                  false, "left");
    setVal(r, 3, "-",                         false, "center");
    setVal(r, 4, "-",                         false, "center");
    setVal(r, 5, invoice.deliveryPriceRub / 100, false, "right");
    setVal(r, 6, invoice.deliveryPriceRub / 100, false, "right");
    cell(r, 5).numFmt = '#,##0.00';
    cell(r, 6).numFmt = '#,##0.00';
    for (let c = 1; c <= 6; c++) applyBorder(cell(r, c), allThin());
    r++;
  }

  // Fix top border of header row (make it medium)
  for (let c = 1; c <= 6; c++) {
    const hc = cell(thRow, c);
    hc.border = { ...hc.border, top: MEDIUM, left: c === 1 ? MEDIUM : THIN, right: c === 6 ? MEDIUM : THIN } as ExcelJS.Borders;
  }
  // Fix bottom border of last data row and side borders
  for (let c = 1; c <= 6; c++) {
    const lc = cell(r - 1, c);
    lc.border = { ...lc.border, bottom: MEDIUM, left: c === 1 ? MEDIUM : THIN, right: c === 6 ? MEDIUM : THIN } as ExcelJS.Borders;
  }
  // Fix left/right borders for header and all item rows
  for (let row = thRow; row < r; row++) {
    const lc = cell(row, 1);
    const rc = cell(row, 6);
    lc.border = { ...lc.border, left: MEDIUM } as ExcelJS.Borders;
    rc.border = { ...rc.border, right: MEDIUM } as ExcelJS.Borders;
  }

  // ── Spacer ────────────────────────────────────────────────────────────────
  ws.getRow(r).height = 4;
  r++;

  // ── Totals ────────────────────────────────────────────────────────────────
  function addTotal(label: string, value: string, bold = false) {
    ws.getRow(r).height = 13;
    merge(r, 1, r, 5);
    setVal(r, 1, label, bold, "right");
    setVal(r, 6, value, bold, "right");
    r++;
  }

  addTotal("Итого:", num(tableTotal), true);
  addTotal("Без налога (НДС)", "-", true);
  addTotal("Всего к оплате:", num(invoice.totalRub), true);

  // ── Spacer ────────────────────────────────────────────────────────────────
  ws.getRow(r).height = 4;
  r++;

  // ── Count line ────────────────────────────────────────────────────────────
  ws.getRow(r).height = 13;
  merge(r, 1, r, 6);
  setVal(r, 1, `Всего наименований ${invoice.items.length}, на сумму ${num(invoice.totalRub)} руб.`);
  r++;

  // ── Amount in words ───────────────────────────────────────────────────────
  ws.getRow(r).height = 13;
  merge(r, 1, r, 6);
  setVal(r, 1, amountInWords(invoice.totalRub), true);
  r++;

  // ── Spacer ────────────────────────────────────────────────────────────────
  ws.getRow(r).height = 6;
  r++;

  // ── Notes ─────────────────────────────────────────────────────────────────
  ws.getRow(r).height = 11;
  merge(r, 1, r, 6);
  setVal(r, 1, "Внимание!");
  r++;

  const notes = [
    "Счет действителен в течение 5-ти календарных дней!",
    "Оплата данного счета означает согласие с условиями поставки товара.",
    "Уведомление об оплате обязательно, в противном случае не гарантируется наличие товара на складе.",
    "Товар отпускается по факту прихода денег на р/с Поставщика, самовывозом, при наличии доверенности и паспорта.",
  ];
  notes.forEach((note) => {
    ws.getRow(r).height = 11;
    merge(r, 1, r, 6);
    setVal(r, 1, note, false, "left", true);
    cell(r, 1).font = { name: "Arial", size: 8 };
    r++;
  });

  // Bottom border under notes
  merge(r, 1, r, 6);
  cell(r, 1).border = { bottom: THIN } as ExcelJS.Borders;
  ws.getRow(r).height = 2;
  r++;

  // ── Spacer ────────────────────────────────────────────────────────────────
  ws.getRow(r).height = 8;
  r++;

  // ── Signature ─────────────────────────────────────────────────────────────
  ws.getRow(r).height = 14;
  const sellerTitle = invoice.sellerLegalName.startsWith("ИП") ? "Предприниматель" : "Руководитель";
  merge(r, 1, r, 2);
  setVal(r, 1, sellerTitle, true);

  if (isBank && invoice.sellerLegalName) {
    const shortName = invoice.sellerLegalName
      .replace(/^ИП\s+/, "")
      .split(" ")
      .map((w, i) => (i === 0 ? w : w[0] + "."))
      .join(" ");
    merge(r, 5, r, 6);
    setVal(r, 5, shortName, false, "left");
  }

  // Signature line under cells 3-4
  merge(r, 3, r, 4);
  cell(r, 3).border = { bottom: THIN } as ExcelJS.Borders;

  // ── Page setup ────────────────────────────────────────────────────────────
  ws.pageSetup = {
    paperSize: 9, // A4
    orientation: "portrait",
    margins: { left: 0.4, right: 0.4, top: 0.6, bottom: 0.4, header: 0, footer: 0 },
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };

  // ── Output ────────────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const d = new Date(invoice.invoiceDate);
  const dateStr = d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }).replace(" г.", "");
  const filename = `Счет № ${invoice.sequenceNumber} от ${dateStr} г.xlsx`;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
