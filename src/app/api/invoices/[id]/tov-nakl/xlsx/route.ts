import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { db } from "@/db";
import { InvoiceTypeEnum, PriceUnitEnum } from "@prisma/client";

const MONTHS_GEN = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];

function fmtShort(date: Date): string { return new Date(date).toLocaleDateString("ru-RU"); }

function num(kopecks: number): string {
  return new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(kopecks / 100);
}

const H = ["","сто","двести","триста","четыреста","пятьсот","шестьсот","семьсот","восемьсот","девятьсот"];
const T = ["","десять","двадцать","тридцать","сорок","пятьдесят","шестьдесят","семьдесят","восемьдесят","девяносто"];
const TN = ["десять","одиннадцать","двенадцать","тринадцать","четырнадцать","пятнадцать","шестнадцать","семнадцать","восемнадцать","девятнадцать"];
const OM = ["","один","два","три","четыре","пять","шесть","семь","восемь","девять"];
const OF = ["","одна","две","три","четыре","пять","шесть","семь","восемь","девять"];
function pl(n: number, a: string, b: string, c: string) { const m=Math.abs(n)%100,d=Math.abs(n)%10; if(m>=11&&m<=19)return c; if(d===1)return a; if(d>=2&&d<=4)return b; return c; }
function tri(n: number, fem: boolean): string { const p: string[]=[],h=Math.floor(n/100),rem=n%100; if(h)p.push(H[h]); if(rem>=10&&rem<=19)p.push(TN[rem-10]); else{const t=Math.floor(rem/10),o=rem%10;if(t)p.push(T[t]);if(o)p.push(fem?OF[o]:OM[o]);} return p.join(" "); }
function amountInWords(kopecks: number): string {
  const rub=Math.floor(kopecks/100),kop=kopecks%100,parts: string[]=[];
  const mil=Math.floor(rub/1_000_000); if(mil){parts.push(tri(mil,false));parts.push(pl(mil,"миллион","миллиона","миллионов"));}
  const th=Math.floor((rub%1_000_000)/1_000); if(th){parts.push(tri(th,true));parts.push(pl(th,"тысяча","тысячи","тысяч"));}
  const rem=rub%1_000; if(rem)parts.push(tri(rem,false)); if(!parts.length)parts.push("ноль");
  const w=`${parts.join(" ")} ${pl(rub,"рубль","рубля","рублей")} ${kop.toString().padStart(2,"0")} ${pl(kop,"копейка","копейки","копеек")}`;
  return w.charAt(0).toUpperCase()+w.slice(1);
}

type BS = ExcelJS.BorderStyle;
const THIN: ExcelJS.Border = { style: "thin" as BS, color: { argb: "FF000000" } };
const MED:  ExcelJS.Border = { style: "medium" as BS, color: { argb: "FF000000" } };
function b(...sides: ("T"|"B"|"L"|"R")[]): ExcelJS.Borders {
  return { top: sides.includes("T")?THIN:undefined, bottom: sides.includes("B")?THIN:undefined, left: sides.includes("L")?THIN:undefined, right: sides.includes("R")?THIN:undefined } as ExcelJS.Borders;
}
function all(): ExcelJS.Borders { return { top: THIN, bottom: THIN, left: THIN, right: THIN }; }

const SELLER_FIELDS = ["sellerLegalName","sellerInn","sellerKpp","sellerAddress","sellerPhone","sellerBankName","sellerShortBankName","sellerBik","sellerBankAccNo","sellerAccNo"] as const;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const invoice = await db.invoice.findUnique({
    where: { id: params.id },
    include: { items: { include: { product: { select: { sku: true } }, productVariant: { select: { variantName: true } } }, orderBy: { createdAt: "asc" } } },
  });

  if (!invoice) return NextResponse.json({ error: "Счёт не найден" }, { status: 404 });
  if (invoice.invoiceType !== InvoiceTypeEnum.CASH) return NextResponse.json({ error: "Только для наличных" }, { status: 400 });

  const settingsRows = await db.settings.findMany({ where: { field: { in: [...SELLER_FIELDS] } } });
  const gs = (f: string) => settingsRows.find(r => r.field === f)?.value ?? "";
  const sel = (v: string, f: string) => v || gs(f);

  const seller = {
    legalName:     sel(invoice.sellerLegalName,     "sellerLegalName"),
    inn:           sel(invoice.sellerInn,           "sellerInn"),
    kpp:           sel(invoice.sellerKpp,           "sellerKpp"),
    address:       sel(invoice.sellerAddress,       "sellerAddress"),
    phone:         sel(invoice.sellerPhone,         "sellerPhone"),
    bankName:      sel(invoice.sellerBankName,      "sellerBankName"),
    bik:           sel(invoice.sellerBik,           "sellerBik"),
    bankAccNo:     sel(invoice.sellerBankAccNo,     "sellerBankAccNo"),
    accNo:         sel(invoice.sellerAccNo,         "sellerAccNo"),
  };

  const sellerStr = [seller.legalName, seller.inn?`ИНН ${seller.inn}`:"", seller.kpp?`КПП ${seller.kpp}`:"", seller.address||"", seller.phone?`тел.: ${seller.phone}`:"", seller.accNo?`р/с ${seller.accNo}`:"", seller.bankName?`в банке ${seller.bankName}`:"", seller.bik?`БИК ${seller.bik}`:"", seller.bankAccNo?`к/с ${seller.bankAccNo}`:""].filter(Boolean).join(", ");
  const buyerStr  = [invoice.buyerLegalName, invoice.buyerInn?`ИНН ${invoice.buyerInn}`:"", invoice.buyerKpp?`КПП ${invoice.buyerKpp}`:"", invoice.buyerAccNo?`р/с ${invoice.buyerAccNo}`:"", invoice.buyerBankName?`в банке ${invoice.buyerBankName}`:"", invoice.buyerBik?`БИК ${invoice.buyerBik}`:"", invoice.buyerBankAccNo?`к/с ${invoice.buyerBankAccNo}`:""].filter(Boolean).join(", ");

  const totalKop = invoice.totalRub;
  const totalQty = invoice.items.reduce((s, i) => s + (i.priceUnit === PriceUnitEnum.M2 && i.quantityM2 !== null ? i.quantityM2 : i.quantity), 0);
  const sellerTitle = seller.legalName.startsWith("ИП") ? "Индивидуальный предприниматель" : "Руководитель";

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Накладная", { pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.3, header: 0, footer: 0 } } });

  // Columns: A(pad) B(№) C(name) D(code) E(unNm) F(unCd) G(pack) H(inOne) I(pcs) J(wGr) K(wNt) L(price) M(amt) N(vatR) O(vatA) P(total)
  ws.columns = [
    { width: 2 },   // A padding
    { width: 4 },   // B №
    { width: 12 },  // C name
    { width: 8 },   // D code
    { width: 6 },   // E unit name
    { width: 6 },   // F ОКЕИ
    { width: 6 },   // G pack
    { width: 6 },   // H in one
    { width: 7 },   // I pcs
    { width: 7 },   // J wGr
    { width: 7 },   // K wNt
    { width: 11 },  // L price
    { width: 12 },  // M amt
    { width: 7 },   // N vatR
    { width: 20 },  // O codes-label
    { width: 8 },   // P codes-label2
    { width: 12 },  // Q total
  ];

  const C = 1; // column offset
  const font = { name: "Arial", size: 8 };
  const fontBold = { name: "Arial", size: 8, bold: true };
  const fontSm = { name: "Arial", size: 6 };

  function gc(row: number, col: number) { return ws.getCell(row, col + C); }
  function mg(r1: number, c1: number, r2: number, c2: number) { ws.mergeCells(r1, c1 + C, r2, c2 + C); }

  function setCell(row: number, col: number, value: ExcelJS.CellValue, opts: { bold?: boolean; small?: boolean; wrap?: boolean; align?: ExcelJS.Alignment["horizontal"]; vAlign?: ExcelJS.Alignment["vertical"] } = {}) {
    const c = gc(row, col);
    c.value = value;
    c.font = opts.bold ? fontBold : opts.small ? fontSm : font;
    c.alignment = { horizontal: opts.align ?? "left", vertical: opts.vAlign ?? "middle", wrapText: opts.wrap ?? false };
  }

  const basisNumber = `Счет №${invoice.sequenceNumber}`;
  const basisDate = fmtShort(invoice.invoiceDate);

  // Codes table border helpers — thick box on col 16 (Q) only
  const cLbl  = (_row: number) => { /* col 14 (O): no border */ };
  const cVal  = (row: number) => { gc(row, 16).border = { left: MED, bottom: THIN, right: MED } as ExcelJS.Borders; };
  const cFirst = (row: number) => {
    gc(row, 16).border = { top: MED, left: MED, bottom: THIN, right: MED } as ExcelJS.Borders;
  };

  let r = 1;

  // ── Row 1: form identifier label ─────────────────────────────────────────
  ws.getRow(r).height = 10;
  mg(r, 1, r, 16);
  setCell(r, 1, "Унифицированная форма № ТОРГ-12. Утверждена постановлением Госкомстата России от 25.12.98 № 132", { small: true, align: "right" });
  r++;

  // ── Row 2: "Коды" header ──────────────────────────────────────────────────
  ws.getRow(r).height = 10;
  mg(r, 1, r, 13);
  setCell(r, 1, "");
  setCell(r, 14, "");
  setCell(r, 15, "");
  setCell(r, 16, "Коды", { small: true, align: "center" });
  gc(r, 16).border = b("T", "L", "R");
  r++;

  // ── Rows 2–3: Грузоотправитель + ОКУД / ОКПО sender ──────────────────────
  ws.getRow(r).height = 11;
  mg(r, 1, r+1, 13);
  setCell(r, 1, "");
  mg(r, 14, r, 15);
  setCell(r, 14, "Форма по ОКУД", { small: true, align: "right" });
  setCell(r, 16, "0330212", { bold: true, align: "center" });
  cFirst(r);
  r++;
  ws.getRow(r).height = 11;
  setCell(r, 15, "по ОКПО", { small: true, align: "right" });
  setCell(r, 16, "0202757706", { bold: true, align: "center" });
  cLbl(r); cVal(r);
  r++;

  // ── Row 4: border line + empty codes row ─────────────────────────────────
  ws.getRow(r).height = 9;
  mg(r, 1, r, 13);
  setCell(r, 1, "");
  gc(r, 1).border = b("B");
  setCell(r, 14, "");
  gc(r, 14).border = b("B");
  setCell(r, 15, "");
  setCell(r, 16, "");
  cLbl(r); cVal(r);
  r++;

  // ── Row 5: Грузоотправитель hint + Вид деятельности по ОКДП ─────────────
  ws.getRow(r).height = 8;
  mg(r, 1, r, 13);
  setCell(r, 1, "организация-грузоотправитель, адрес, телефон, факс, банковские реквизиты", { small: true, align: "center" });
  mg(r, 14, r, 15);
  setCell(r, 14, "Вид деятельности по ОКДП", { small: true, align: "right", wrap: true });
  setCell(r, 16, "");
  cVal(r);
  r++;

  // ── Row 6: структурное подразделение border + ОКПО buyer ─────────────────
  ws.getRow(r).height = 9;
  mg(r, 1, r, 13);
  setCell(r, 1, "");
  gc(r, 1).border = b("B");
  gc(r, 14).border = b("B");
  setCell(r, 15, "по ОКПО", { small: true, align: "right" });
  setCell(r, 16, "");
  cLbl(r); cVal(r);
  r++;

  // ── Row 7: структурное подразделение hint + ОКПО seller ──────────────────
  ws.getRow(r).height = 8;
  mg(r, 1, r, 13);
  setCell(r, 1, "структурное подразделение", { small: true, align: "center" });
  setCell(r, 15, "по ОКПО", { small: true, align: "right" });
  setCell(r, 16, "0202757706", { bold: true, align: "center" });
  cLbl(r); cVal(r);
  r++;

  // ── Row 8: Грузополучатель + ОКПО payer ───────────────────────────────────
  ws.getRow(r).height = 22;
  mg(r, 1, r, 2);
  setCell(r, 1, "Грузополучатель", { bold: true });
  mg(r, 3, r, 13);
  setCell(r, 3, buyerStr, { wrap: true });
  gc(r, 3).border = b("B");
  gc(r, 14).border = b("B");
  setCell(r, 15, "по ОКПО", { small: true, align: "right" });
  setCell(r, 16, "");
  cLbl(r); cVal(r);
  r++;

  // ── Row 9: Грузополучатель hint + Основание номер ─────────────────────────
  ws.getRow(r).height = 8;
  mg(r, 3, r, 13);
  setCell(r, 3, "организация, адрес, телефон, факс, банковские реквизиты", { small: true, align: "center" });
  setCell(r, 15, "номер", { small: true, align: "right" });
  gc(r, 15).border = all();
  setCell(r, 16, basisNumber, { bold: true, align: "center" });
  cLbl(r); cVal(r);
  r++;

  // ── Row 10: Поставщик + Основание дата ───────────────────────────────────
  ws.getRow(r).height = 22;
  mg(r, 1, r, 2);
  setCell(r, 1, "Поставщик", { bold: true });
  mg(r, 3, r, 13);
  setCell(r, 3, "", { wrap: true });
  gc(r, 3).border = b("B");
  gc(r, 14).border = b("B");
  setCell(r, 15, "дата", { small: true, align: "right" });
  gc(r, 15).border = all();
  setCell(r, 16, basisDate, { bold: true, align: "center" });
  cLbl(r); cVal(r);
  r++;

  // ── Row 11: Поставщик hint + Транспортная накладная номер ────────────────
  ws.getRow(r).height = 10;
  mg(r, 3, r, 13);
  setCell(r, 3, "организация, адрес, телефон, факс, банковские реквизиты", { small: true, align: "center" });
  setCell(r, 14, "Транспортная накладная", { small: true, align: "right" });
  setCell(r, 15, "номер", { small: true, align: "right" });
  gc(r, 15).border = all();
  setCell(r, 16, "");
  cVal(r);
  r++;

  // ── Row 12: Плательщик + Транспортная накладная дата ─────────────────────
  ws.getRow(r).height = 22;
  mg(r, 1, r, 2);
  setCell(r, 1, "Плательщик", { bold: true });
  mg(r, 3, r, 13);
  setCell(r, 3, buyerStr, { wrap: true });
  gc(r, 3).border = b("B");
  gc(r, 14).border = b("B");
  setCell(r, 15, "дата", { small: true, align: "right" });
  gc(r, 15).border = all();
  setCell(r, 16, "");
  cLbl(r); cVal(r);
  r++;

  // ── Row 13: Плательщик hint + Вид операции (last row, thick bottom) ───────
  ws.getRow(r).height = 8;
  mg(r, 3, r, 13);
  setCell(r, 3, "организация, адрес, телефон, факс, банковские реквизиты", { small: true, align: "center" });
  setCell(r, 15, "Вид операции", { small: true, align: "right" });
  setCell(r, 16, "");
  gc(r, 16).border = { left: MED, bottom: MED, right: MED } as ExcelJS.Borders;
  r++;

  // ── Basis ─────────────────────────────────────────────────────────────────
  ws.getRow(r).height = 13;
  mg(r, 1, r, 2);
  setCell(r, 1, "Основание", { bold: true });
  mg(r, 3, r, 11);
  setCell(r, 3, `${basisNumber} от ${basisDate}`);
  gc(r, 3).border = b("B");
  r++;
  ws.getRow(r).height = 9;
  mg(r, 3, r, 11);
  setCell(r, 3, "договор, заказ-наряд", { small: true, align: "center" });
  r++;

  // ── Margin row ────────────────────────────────────────────────────────────
  ws.getRow(r).height = 10;
  r++;

  // ── Title row ──────────────────────────────────────────────────────────────
  ws.getRow(r).height = 16;
  mg(r, 5, r, 6);
  setCell(r, 5, "Номер документа", { small: true, align: "center" });
  gc(r, 5).border = all();
  mg(r, 7, r, 8);
  setCell(r, 7, "Дата составления", { small: true, align: "center" });
  gc(r, 7).border = all();

  r++;

  ws.getRow(r).height = 14;
  mg(r, 1, r, 4);
  setCell(r, 1, "ТОВАРНАЯ НАКЛАДНАЯ", { bold: true, align: "center" });
  gc(r, 1).font = { name: "Arial", size: 11, bold: true };
  mg(r, 5, r, 6);
  setCell(r, 5, String(invoice.sequenceNumber), { align: "center" });
  gc(r, 5).border = all();
  mg(r, 7, r, 8);
  setCell(r, 7, fmtShort(invoice.invoiceDate), { align: "center" });
  gc(r, 7).border = all();
  r++;

  r++;

  // ── Table header ───────────────────────────────────────────────────────────
  // Row 1 of header
  ws.getRow(r).height = 22;
  setCell(r, 1, "Но-\nмер\nпо по-\nрядку", { small: true, align: "center", wrap: true });
  gc(r, 1).border = all();

  mg(r, 2, r+1, 2);
  setCell(r, 2, "наименование, характеристика,\nсорт, артикул товара", { small: true, align: "center", wrap: true });
  gc(r, 2).border = all();

  mg(r, 3, r+1, 3);
  setCell(r, 3, "код", { small: true, align: "center" });
  gc(r, 3).border = all();

  setCell(r, 4, "Единица измерения", { small: true, align: "center" });
  mg(r, 4, r, 5);
  gc(r, 4).border = all();

  setCell(r, 6, "Вид упа-\nковки", { small: true, align: "center", wrap: true });
  mg(r, 6, r+1, 6);
  gc(r, 6).border = all();

  setCell(r, 7, "Количество", { small: true, align: "center" });
  mg(r, 7, r, 8);
  gc(r, 7).border = all();

  mg(r, 9, r+1, 9);
  setCell(r, 9, "Масса брутто", { small: true, align: "center", wrap: true });
  gc(r, 9).border = all();

  mg(r, 10, r+1, 10);
  setCell(r, 10, "Количество (масса нетто)", { small: true, align: "center", wrap: true });
  gc(r, 10).border = all();

  mg(r, 11, r+1, 11);
  setCell(r, 11, "Цена,\nруб. коп.", { small: true, align: "center", wrap: true });
  gc(r, 11).border = all();

  mg(r, 12, r+1, 12);
  setCell(r, 12, "Сумма без учета НДС, руб. коп.", { small: true, align: "center", wrap: true });
  gc(r, 12).border = all();

  setCell(r, 13, "НДС", { small: true, align: "center" });
  mg(r, 13, r, 14);
  gc(r, 13).border = all();

  mg(r, 15, r+1, 16);
  setCell(r, 15, "Сумма с учетом НДС, руб. коп.", { small: true, align: "center", wrap: true });
  gc(r, 15).border = all();
  r++;

  // Row 2 of header
  ws.getRow(r).height = 18;
  setCell(r, 1, "1", { small: true, align: "center" });
  gc(r, 1).border = all();
  // B already merged
  // C already merged
  setCell(r, 4, "наимен.", { small: true, align: "center" });
  gc(r, 4).border = all();
  setCell(r, 5, "код по ОКЕИ", { small: true, align: "center", wrap: true });
  gc(r, 5).border = all();
  // F already merged
  setCell(r, 7, "в одном месте", { small: true, align: "center", wrap: true });
  gc(r, 7).border = all();
  setCell(r, 8, "мест, штук", { small: true, align: "center", wrap: true });
  gc(r, 8).border = all();

  const colNums = ["2","3","4","5","6","7","8","9","10","11","12","13","14","15"];
  const colIdxs = [2,3,4,5,6,7,8,9,10,11,12,13,14,15];
  // Number row - place numbers in the already-sized cells
  // Rows for numbers: some cells are already merged, we add the column number text in second header row
  // (already handled above for col 1; now add for the sub-header cells)
  setCell(r, 2, "2", { small: true, align: "center" });
  setCell(r, 3, "3", { small: true, align: "center" });
  setCell(r, 9, "9", { small: true, align: "center" });
  setCell(r, 10, "10", { small: true, align: "center" });
  setCell(r, 11, "11", { small: true, align: "center" });
  setCell(r, 12, "12", { small: true, align: "center" });
  setCell(r, 15, "15", { small: true, align: "center" });

  // Row 3: remaining column numbers
  r++;
  ws.getRow(r).height = 10;
  for (let ci = 0; ci < colIdxs.length; ci++) {
    setCell(r, colIdxs[ci], colNums[ci], { small: true, align: "center" });
    gc(r, colIdxs[ci]).border = all();
  }
  setCell(r, 1, "", {});
  gc(r, 1).border = all();
  mg(r, 15, r, 16);
  r++;

  // ── Data rows ──────────────────────────────────────────────────────────────
  invoice.items.forEach((item, idx) => {
    ws.getRow(r).height = 14;
    const isM2 = item.priceUnit === PriceUnitEnum.M2;
    const qty = (isM2 && item.quantityM2 !== null ? item.quantityM2 : item.quantity);
    const unitName = isM2 ? "м2" : "шт";
    const unitCode = isM2 ? "055" : "796";

    const vals = [idx+1, item.product.sku, "", unitName, unitCode, "", "", qty, "", qty, item.priceRub/100, item.totalRub/100, "Без НДС", "", item.totalRub/100];
    const aligns: ExcelJS.Alignment["horizontal"][] = ["center","left","center","center","center","center","center","right","center","right","right","right","center","right","right"];
    vals.forEach((v, i) => {
      setCell(r, i + 1, v, { align: aligns[i] });
      gc(r, i + 1).border = all();
      if ([11,12,15].includes(i + 1) && typeof v === "number") gc(r, i + 1).numFmt = "#,##0.00";
    });
    mg(r, 15, r, 16);
    r++;
  });

  if (invoice.deliveryPriceRub > 0) {
    ws.getRow(r).height = 14;
    const n = invoice.items.length + 1;
    const vals = [n, "Доставка", "", "усл", "799", "", "", 1, "", "", invoice.deliveryPriceRub/100, invoice.deliveryPriceRub/100, "Без НДС", "", invoice.deliveryPriceRub/100];
    const aligns: ExcelJS.Alignment["horizontal"][] = ["center","left","center","center","center","center","center","right","center","right","right","right","center","right","right"];
    vals.forEach((v, i) => {
      setCell(r, i + 1, v, { align: aligns[i] });
      gc(r, i + 1).border = all();
      if ([11,12,15].includes(i + 1) && typeof v === "number") gc(r, i + 1).numFmt = "#,##0.00";
    });
    mg(r, 15, r, 16);
    r++;
  }

  // ── Итого / Всего ──────────────────────────────────────────────────────────
  for (const label of ["Итого", "Всего по накладной"]) {
    ws.getRow(r).height = 13;
    mg(r, 1, r, 9);
    setCell(r, 1, label, { bold: true, align: "right" });
    gc(r, 1).border = {};

    setCell(r, 10, totalQty);
    gc(r, 10).border = b("T","L","R");
    setCell(r, 11, "Х", { align: "center" });
    gc(r, 11).border = all();
    setCell(r, 12, num(totalKop), { align: "right", bold: true });
    gc(r, 12).border = all();
    setCell(r, 13, "Х", { align: "center" });
    gc(r, 13).border = all();
    setCell(r, 14, "Х", { align: "center" });
    gc(r, 14).border = all();
    mg(r, 15, r, 16);
    setCell(r, 15, num(totalKop), { align: "right", bold: true });
    gc(r, 15).border = all();
    gc(r, 15).numFmt = "#,##0.00";
    r++;
  }

  // ── Attachment / count line ────────────────────────────────────────────────
  ws.getRow(r).height = 12;
  mg(r, 1, r, 16);
  setCell(r, 1, `Товарная накладная имеет приложение на _____________ и содержит ${invoice.items.length + (invoice.deliveryPriceRub > 0 ? 1 : 0)} порядковых номеров записей`, { wrap: false });
  r++;

  // ── Amount in words ────────────────────────────────────────────────────────
  ws.getRow(r).height = 11;
  mg(r, 1, r, 4);
  setCell(r, 1, "Всего отпущено на сумму", { bold: true });
  r++;
  ws.getRow(r).height = 13;
  mg(r, 1, r, 16);
  setCell(r, 1, amountInWords(totalKop), { bold: true });
  gc(r, 1).border = b("B");
  r++;
  ws.getRow(r).height = 9;
  mg(r, 1, r, 16);
  setCell(r, 1, "прописью", { small: true });
  r++;

  // ── Signatures ────────────────────────────────────────────────────────────
  ws.getRow(r).height = 14;
  setCell(r, 1, "Отпуск груза разрешил", { bold: false });
  mg(r, 1, r, 2);
  setCell(r, 3, sellerTitle);
  mg(r, 3, r, 5);
  mg(r, 6, r, 8);
  setCell(r, 6, "");
  gc(r, 6).border = b("B");
  setCell(r, 9, "");
  mg(r, 9, r, 11);
  setCell(r, 12, "Груз принял");
  mg(r, 12, r, 13);
  mg(r, 14, r, 16);
  gc(r, 14).border = b("B");
  r++;

  ws.getRow(r).height = 9;
  setCell(r, 3, "должность", { small: true });
  mg(r, 3, r, 5);
  setCell(r, 6, "подпись", { small: true, align: "center" });
  mg(r, 6, r, 8);
  setCell(r, 9, "расшифровка подписи", { small: true });
  mg(r, 9, r, 11);
  setCell(r, 12, "должность", { small: true });
  mg(r, 12, r, 13);
  setCell(r, 14, "подпись", { small: true, align: "center" });
  mg(r, 14, r, 16);
  r++;

  ws.getRow(r).height = 14;
  setCell(r, 1, "Главный (старший) бухгалтер", { bold: true });
  mg(r, 1, r, 5);
  mg(r, 6, r, 8);
  gc(r, 6).border = b("B");
  setCell(r, 9, "");
  mg(r, 9, r, 11);
  gc(r, 9).border = b("B");
  setCell(r, 12, "Груз получил");
  mg(r, 12, r, 12);
  setCell(r, 13, "грузополучатель");
  mg(r, 13, r, 16);
  r++;

  ws.getRow(r).height = 9;
  setCell(r, 6, "подпись", { small: true, align: "center" });
  mg(r, 6, r, 8);
  setCell(r, 9, "расшифровка подписи", { small: true });
  mg(r, 9, r, 11);
  setCell(r, 12, "должность", { small: true });
  setCell(r, 13, "подпись", { small: true, align: "center" });
  setCell(r, 16, "расшифровка подписи", { small: true });
  r++;

  ws.getRow(r).height = 14;
  setCell(r, 1, "Отпуск груза произвел");
  mg(r, 1, r, 2);
  mg(r, 3, r, 5);
  gc(r, 3).border = b("B");
  mg(r, 6, r, 8);
  gc(r, 6).border = b("B");
  mg(r, 9, r, 11);
  gc(r, 9).border = b("B");
  r++;

  ws.getRow(r).height = 9;
  setCell(r, 3, "должность", { small: true });
  mg(r, 3, r, 5);
  setCell(r, 6, "подпись", { small: true, align: "center" });
  mg(r, 6, r, 8);
  setCell(r, 9, "расшифровка подписи", { small: true });
  mg(r, 9, r, 11);
  r++;

  // ── Date rows ──────────────────────────────────────────────────────────────
  ws.getRow(r).height = 14;
  setCell(r, 1, "М.П.");
  const d = new Date(invoice.invoiceDate);
  setCell(r, 3, `"${d.getDate()}" ${MONTHS_GEN[d.getMonth()]} ${d.getFullYear()} года`);
  mg(r, 3, r, 7);
  setCell(r, 9, "М.П.");
  setCell(r, 11, '"   "');
  mg(r, 12, r, 13);
  gc(r, 12).border = b("B");
  setCell(r, 14, "20");
  gc(r, 16).border = b("B");
  setCell(r, 16, "");
  setCell(r, 17, "года");
  r++;

  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="tov-nakl-${invoice.sequenceNumber}.xlsx"`,
    },
  });
}
