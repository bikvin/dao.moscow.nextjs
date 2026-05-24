import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { PriceUnitEnum } from "@prisma/client";
import { type InvoicePDFData } from "./InvoicePDF";

export type { InvoicePDFData as TovNaklData };

// ── Helpers ──────────────────────────────────────────────────────────────────

function num(kopecks: number): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(kopecks / 100);
}

const MONTHS_GEN = [
  "января","февраля","марта","апреля","мая","июня",
  "июля","августа","сентября","октября","ноября","декабря",
];

function fmtLong(date: Date): string {
  const d = new Date(date);
  return `«${d.getDate()}» ${MONTHS_GEN[d.getMonth()]} ${d.getFullYear()} года`;
}

function fmtShort(date: Date): string {
  return new Date(date).toLocaleDateString("ru-RU");
}

const H = ["","сто","двести","триста","четыреста","пятьсот","шестьсот","семьсот","восемьсот","девятьсот"];
const T = ["","десять","двадцать","тридцать","сорок","пятьдесят","шестьдесят","семьдесят","восемьдесят","девяносто"];
const TN = ["десять","одиннадцать","двенадцать","тринадцать","четырнадцать","пятнадцать","шестнадцать","семнадцать","восемнадцать","девятнадцать"];
const OM = ["","один","два","три","четыре","пять","шесть","семь","восемь","девять"];
const OF = ["","одна","две","три","четыре","пять","шесть","семь","восемь","девять"];

function pl(n: number, one: string, few: string, many: string): string {
  const m = Math.abs(n) % 100, d = Math.abs(n) % 10;
  if (m >= 11 && m <= 19) return many;
  if (d === 1) return one;
  if (d >= 2 && d <= 4) return few;
  return many;
}

function tri(n: number, fem: boolean): string {
  const parts: string[] = [];
  const h = Math.floor(n / 100), rem = n % 100;
  if (h) parts.push(H[h]);
  if (rem >= 10 && rem <= 19) parts.push(TN[rem - 10]);
  else { const t = Math.floor(rem / 10), o = rem % 10; if (t) parts.push(T[t]); if (o) parts.push(fem ? OF[o] : OM[o]); }
  return parts.join(" ");
}

function amountInWords(kopecks: number): string {
  const rub = Math.floor(kopecks / 100), kop = kopecks % 100;
  const parts: string[] = [];
  const mil = Math.floor(rub / 1_000_000);
  if (mil) { parts.push(tri(mil, false)); parts.push(pl(mil, "миллион", "миллиона", "миллионов")); }
  const th = Math.floor((rub % 1_000_000) / 1_000);
  if (th) { parts.push(tri(th, true)); parts.push(pl(th, "тысяча", "тысячи", "тысяч")); }
  const rem = rub % 1_000;
  if (rem) parts.push(tri(rem, false));
  if (!parts.length) parts.push("ноль");
  const w = `${parts.join(" ")} ${pl(rub, "рубль", "рубля", "рублей")} ${kop.toString().padStart(2, "0")} ${pl(kop, "копейка", "копейки", "копеек")}`;
  return w.charAt(0).toUpperCase() + w.slice(1);
}

// ── Column widths ─────────────────────────────────────────────────────────────
// Total ≈ 800pt (A4 landscape 841 − 40 padding)
const W = {
  n:    20,
  name: 175,
  code:  48,
  unNm:  32,
  unCd:  24,
  pack:  24,
  inOne: 26,
  pcs:   26,
  wGr:   34,
  wNt:   34,
  price: 64,
  amt:   70,
  vatR:  28,
  vatA:  60,
  total: 70,
};

// ── Styles ────────────────────────────────────────────────────────────────────

const B = { borderWidth: 0.5, borderColor: "#000", borderStyle: "solid" } as const;
const BT = { borderTopWidth: 0.5, borderTopColor: "#000", borderTopStyle: "solid" } as const;
const BR = { borderRightWidth: 0.5, borderRightColor: "#000", borderRightStyle: "solid" } as const;
const BB = { borderBottomWidth: 0.5, borderBottomColor: "#000", borderBottomStyle: "solid" } as const;
const BL = { borderLeftWidth: 0.5, borderLeftColor: "#000", borderLeftStyle: "solid" } as const;

const s = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 7,
    paddingTop: 15,
    paddingBottom: 15,
    paddingLeft: 20,
    paddingRight: 20,
    color: "#000",
  },

  // ── Form header ────────────────────────────────
  formHeaderRow: { flexDirection: "row", marginBottom: 2 },
  formHeaderLeft: { flex: 1 },
  formHeaderRight: { width: 140, alignItems: "flex-end" },
  formTitle: { fontSize: 6, color: "#444", textAlign: "right" },
  codesBox: { flexDirection: "row", ...B, marginTop: 1 },
  codesLabel: { fontSize: 6, padding: "1 2", borderRightWidth: 0.5, borderRightColor: "#000", borderRightStyle: "solid" },
  codesVal: { fontSize: 6, padding: "1 4", fontWeight: "bold" },

  // ── Party rows ─────────────────────────────────
  partyRow: { flexDirection: "row", marginBottom: 1 },
  partyLabel: { width: 80, fontSize: 7, fontWeight: "bold" },
  partyValue: { flex: 1, fontSize: 7, ...BB },
  partyOkpoWrap: { width: 90, flexDirection: "row", alignItems: "flex-end", paddingLeft: 4 },
  partyOkpoLabel: { fontSize: 6, color: "#444" },
  partyOkpoVal: { fontSize: 7, ...BB, flex: 1, marginLeft: 2 },
  partySmall: { fontSize: 5.5, color: "#444", marginBottom: 2 },

  subRow: { flexDirection: "row", marginBottom: 4 },
  subLeft: { flex: 1, ...BB },
  subRight: { flex: 1, textAlign: "right", fontSize: 6, color: "#444" },

  // ── Basis row ──────────────────────────────────
  basisRow: { flexDirection: "row", marginBottom: 1 },
  basisLabel: { fontSize: 7, fontWeight: "bold", marginRight: 4 },
  basisValue: { flex: 1, fontSize: 7, ...BB },
  basisNumWrap: { width: 120, flexDirection: "row" },
  basisNumLabel: { fontSize: 6, color: "#444" },
  basisNumVal: { fontSize: 7, ...BB, flex: 1, marginLeft: 2 },

  // ── Title section ──────────────────────────────
  titleSection: { flexDirection: "row", alignItems: "flex-start", marginBottom: 4, marginTop: 2 },
  titleLeft: { width: 200 },
  titleMain: { fontSize: 11, fontWeight: "bold", textAlign: "center" },
  titleSub: { fontSize: 6, color: "#444", textAlign: "center" },
  titleMid: { flex: 1, flexDirection: "row", ...B },
  titleCell: { flex: 1, padding: "2 4", ...BR },
  titleCellLast: { flex: 1, padding: "2 4" },
  titleCellLabel: { fontSize: 5.5, color: "#444" },
  titleCellVal: { fontSize: 7 },
  titleRight: { width: 120, ...B, padding: "2 4" },
  titleRightLabel: { fontSize: 5.5, color: "#444" },
  titleRightRow: { flexDirection: "row", ...BB, paddingBottom: 1, marginBottom: 1 },
  titleRightRowLast: { flexDirection: "row" },

  // ── Items table ────────────────────────────────
  table: { ...B, marginBottom: 2 },
  tRow: { flexDirection: "row", ...BB },
  tRowLast: { flexDirection: "row" },

  // header cells
  hCell: { padding: "1 2", ...BR, textAlign: "center", fontSize: 6 },

  // data cells
  dN:    { width: W.n,    padding: "1 2", ...BR, textAlign: "center" },
  dName: { width: W.name, padding: "1 2", ...BR },
  dCode: { width: W.code, padding: "1 2", ...BR, textAlign: "center" },
  dUnNm: { width: W.unNm, padding: "1 2", ...BR, textAlign: "center" },
  dUnCd: { width: W.unCd, padding: "1 2", ...BR, textAlign: "center" },
  dPack: { width: W.pack, padding: "1 2", ...BR, textAlign: "center" },
  dInOne:{ width: W.inOne,padding: "1 2", ...BR, textAlign: "center" },
  dPcs:  { width: W.pcs,  padding: "1 2", ...BR, textAlign: "center" },
  dWGr:  { width: W.wGr,  padding: "1 2", ...BR, textAlign: "center" },
  dWNt:  { width: W.wNt,  padding: "1 2", ...BR, textAlign: "right" },
  dPrice:{ width: W.price,padding: "1 2", ...BR, textAlign: "right" },
  dAmt:  { width: W.amt,  padding: "1 2", ...BR, textAlign: "right" },
  dVatR: { width: W.vatR, padding: "1 2", ...BR, textAlign: "center" },
  dVatA: { width: W.vatA, padding: "1 2", ...BR, textAlign: "right" },
  dTotal:{ width: W.total,padding: "1 2",         textAlign: "right" },

  // ── Footer ─────────────────────────────────────
  footRow: { flexDirection: "row", marginBottom: 3 },
  footLabel: { fontSize: 7, marginRight: 4 },
  footLine: { flex: 1, ...BB },

  sigSection: { flexDirection: "row", marginBottom: 4 },
  sigBlock: { flex: 1 },
  sigTitle: { fontSize: 7, fontWeight: "bold", marginBottom: 2 },
  sigRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 6 },
  sigLabel: { fontSize: 7, marginRight: 4, width: 100 },
  sigLine: { flex: 1, ...BB },
  sigHint: { fontSize: 5.5, color: "#444", textAlign: "center" },

  dateRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 4 },
  dateLabel: { fontSize: 7 },
  datePart: { fontSize: 7, ...BB, minWidth: 30, textAlign: "center", marginHorizontal: 2 },
});

// ── Component ─────────────────────────────────────────────────────────────────

export function TovNaklPDF({ invoice }: { invoice: InvoicePDFData }) {
  const sellerStr = [
    invoice.sellerLegalName,
    invoice.sellerInn ? `ИНН ${invoice.sellerInn}` : "",
    invoice.sellerKpp ? `КПП ${invoice.sellerKpp}` : "",
    invoice.sellerAddress || "",
    invoice.sellerPhone ? `тел.: ${invoice.sellerPhone}` : "",
    invoice.sellerAccNo ? `р/с ${invoice.sellerAccNo}` : "",
    invoice.sellerBankName ? `в банке ${invoice.sellerBankName}` : "",
    invoice.sellerBik ? `БИК ${invoice.sellerBik}` : "",
    invoice.sellerBankAccNo ? `к/с ${invoice.sellerBankAccNo}` : "",
  ].filter(Boolean).join(", ");

  const buyerStr = [
    invoice.buyerLegalName,
    invoice.buyerInn ? `ИНН ${invoice.buyerInn}` : "",
    invoice.buyerKpp ? `КПП ${invoice.buyerKpp}` : "",
    invoice.buyerAccNo ? `р/с ${invoice.buyerAccNo}` : "",
    invoice.buyerBankName ? `в банке ${invoice.buyerBankName}` : "",
    invoice.buyerBik ? `БИК ${invoice.buyerBik}` : "",
    invoice.buyerBankAccNo ? `к/с ${invoice.buyerBankAccNo}` : "",
  ].filter(Boolean).join(", ");

  const basis = `Счет №${invoice.sequenceNumber} от ${fmtShort(invoice.invoiceDate)}`;

  const total = invoice.totalRub;
  const qty = invoice.items.reduce((s, i) =>
    s + (i.priceUnit === PriceUnitEnum.M2 && i.quantityM2 !== null ? i.quantityM2 : i.quantity), 0);

  const sellerShort = invoice.sellerLegalName.startsWith("ИП")
    ? invoice.sellerLegalName.replace(/^ИП\s+/, "").split(" ").map((w, i) => i === 0 ? w : w[0] + ".").join(" ")
    : "";
  const sellerTitle = invoice.sellerLegalName.startsWith("ИП") ? "Индивидуальный предприниматель" : "Руководитель";

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>

        {/* ── Form header ── */}
        <View style={s.formHeaderRow}>
          <View style={s.formHeaderLeft}>
            <View style={s.partyRow}>
              <Text style={s.partyLabel}>{"Грузоотправитель"}</Text>
              <Text style={s.partyValue}>{sellerStr}</Text>
              <View style={s.partyOkpoWrap}>
                <Text style={s.partyOkpoLabel}>{"по ОКПО"}</Text>
                <Text style={s.partyOkpoVal}>{""}</Text>
              </View>
            </View>
            <Text style={s.partySmall}>{"организация-грузоотправитель, адрес, телефон, факс, банковские реквизиты"}</Text>
          </View>
          <View style={s.formHeaderRight}>
            <Text style={s.formTitle}>{"Унифицированная форма № ТОРГ-12"}</Text>
            <Text style={s.formTitle}>{"Утверждена постановлением Госкомстата России от 25.12.98 № 132"}</Text>
            <View style={s.codesBox}>
              <Text style={s.codesLabel}>{"Форма по ОКУД"}</Text>
              <Text style={s.codesVal}>{"0330212"}</Text>
            </View>
            <View style={s.codesBox}>
              <Text style={s.codesLabel}>{"по ОКПО"}</Text>
              <Text style={s.codesVal}>{""}</Text>
            </View>
          </View>
        </View>

        {/* Структурное подразделение row */}
        <View style={s.subRow}>
          <Text style={[s.subLeft, { flex: 1, marginRight: 8 }]}>{""}</Text>
          <Text style={s.partySmall}>{"структурное подразделение"}</Text>
          <Text style={[s.subLeft, { flex: 1, marginLeft: 8 }]}>{""}</Text>
          <Text style={[s.subRight, { width: 120 }]}>{"Вид деятельности по ОКДП"}</Text>
        </View>

        {/* Грузополучатель */}
        <View style={s.partyRow}>
          <Text style={s.partyLabel}>{"Грузополучатель"}</Text>
          <Text style={s.partyValue}>{buyerStr}</Text>
          <View style={s.partyOkpoWrap}>
            <Text style={s.partyOkpoLabel}>{"по ОКПО"}</Text>
            <Text style={s.partyOkpoVal}>{""}</Text>
          </View>
        </View>
        <Text style={s.partySmall}>{"организация, адрес, телефон, факс, банковские реквизиты"}</Text>

        {/* Поставщик */}
        <View style={s.partyRow}>
          <Text style={s.partyLabel}>{"Поставщик"}</Text>
          <Text style={s.partyValue}>{sellerStr}</Text>
          <View style={s.partyOkpoWrap}>
            <Text style={s.partyOkpoLabel}>{"по ОКПО"}</Text>
            <Text style={s.partyOkpoVal}>{""}</Text>
          </View>
        </View>
        <Text style={s.partySmall}>{"организация, адрес, телефон, факс, банковские реквизиты"}</Text>

        {/* Плательщик */}
        <View style={s.partyRow}>
          <Text style={s.partyLabel}>{"Плательщик"}</Text>
          <Text style={s.partyValue}>{buyerStr}</Text>
          <View style={s.partyOkpoWrap}>
            <Text style={s.partyOkpoLabel}>{"по ОКПО"}</Text>
            <Text style={s.partyOkpoVal}>{""}</Text>
          </View>
        </View>
        <Text style={s.partySmall}>{"организация, адрес, телефон, факс, банковские реквизиты"}</Text>

        {/* Основание */}
        <View style={s.basisRow}>
          <Text style={s.basisLabel}>{"Основание"}</Text>
          <Text style={s.basisValue}>{basis}</Text>
          <View style={s.basisNumWrap}>
            <Text style={s.basisNumLabel}>{"номер"}</Text>
            <Text style={s.basisNumVal}>{`Счет №${invoice.sequenceNumber}`}</Text>
          </View>
        </View>
        <View style={[s.basisRow, { marginBottom: 3 }]}>
          <Text style={[s.partySmall, { flex: 1 }]}>{"договор, заказ-наряд"}</Text>
          <View style={s.basisNumWrap}>
            <Text style={s.basisNumLabel}>{"дата"}</Text>
            <Text style={s.basisNumVal}>{fmtShort(invoice.invoiceDate)}</Text>
          </View>
        </View>

        {/* ── Title section ── */}
        <View style={s.titleSection}>
          <View style={s.titleLeft}>
            <Text style={s.titleMain}>{"ТОВАРНАЯ НАКЛАДНАЯ"}</Text>
            <Text style={s.titleSub}>{"наименование документа"}</Text>
          </View>
          <View style={s.titleMid}>
            <View style={s.titleCell}>
              <Text style={s.titleCellLabel}>{"Номер документа"}</Text>
              <Text style={s.titleCellVal}>{String(invoice.sequenceNumber)}</Text>
            </View>
            <View style={s.titleCellLast}>
              <Text style={s.titleCellLabel}>{"Дата составления"}</Text>
              <Text style={s.titleCellVal}>{fmtShort(invoice.invoiceDate)}</Text>
            </View>
          </View>
          <View style={s.titleRight}>
            <Text style={s.titleRightLabel}>{"Транспортная накладная"}</Text>
            <View style={s.titleRightRow}>
              <Text style={[s.titleRightLabel, { marginRight: 4 }]}>{"номер"}</Text>
              <Text style={s.partyOkpoVal}>{""}</Text>
            </View>
            <View style={s.titleRightRow}>
              <Text style={[s.titleRightLabel, { marginRight: 4 }]}>{"дата"}</Text>
              <Text style={s.partyOkpoVal}>{""}</Text>
            </View>
            <View style={s.titleRightRowLast}>
              <Text style={s.titleRightLabel}>{"Вид операции"}</Text>
            </View>
          </View>
        </View>

        {/* ── Items table ── */}
        <View style={s.table}>

          {/* Header row 1 */}
          <View style={s.tRow}>
            <Text style={[s.hCell, { width: W.n,    fontWeight: "bold" }]}>{"Но-\nмер\nпо\nпо-\nрядку"}</Text>
            <View style={{ width: W.name + W.code, ...BR }}>
              <Text style={[s.hCell, { ...BB, borderRightWidth: 0 }]}>{"Товар"}</Text>
              <View style={{ flexDirection: "row" }}>
                <Text style={[s.hCell, { flex: 1 }]}>{"наименование, характеристика, сорт, артикул товара"}</Text>
                <Text style={[s.hCell, { width: W.code }]}>{"код"}</Text>
              </View>
            </View>
            <View style={{ width: W.unNm + W.unCd, ...BR }}>
              <Text style={[s.hCell, { ...BB, borderRightWidth: 0 }]}>{"Единица измерения"}</Text>
              <View style={{ flexDirection: "row" }}>
                <Text style={[s.hCell, { width: W.unNm }]}>{"наименование"}</Text>
                <Text style={[s.hCell, { width: W.unCd }]}>{"код по ОКЕИ"}</Text>
              </View>
            </View>
            <Text style={[s.hCell, { width: W.pack }]}>{"Вид упаковки"}</Text>
            <View style={{ width: W.inOne + W.pcs, ...BR }}>
              <Text style={[s.hCell, { ...BB, borderRightWidth: 0 }]}>{"Количество"}</Text>
              <View style={{ flexDirection: "row" }}>
                <Text style={[s.hCell, { width: W.inOne }]}>{"в одном месте"}</Text>
                <Text style={[s.hCell, { width: W.pcs }]}>{"мест, штук"}</Text>
              </View>
            </View>
            <Text style={[s.hCell, { width: W.wGr }]}>{"Масса брутто"}</Text>
            <Text style={[s.hCell, { width: W.wNt }]}>{"Количество (масса нетто)"}</Text>
            <Text style={[s.hCell, { width: W.price }]}>{"Цена, руб. коп."}</Text>
            <Text style={[s.hCell, { width: W.amt }]}>{"Сумма без учета НДС, руб. коп."}</Text>
            <View style={{ width: W.vatR + W.vatA, ...BR }}>
              <Text style={[s.hCell, { ...BB, borderRightWidth: 0 }]}>{"НДС"}</Text>
              <View style={{ flexDirection: "row" }}>
                <Text style={[s.hCell, { width: W.vatR }]}>{"ставка, %"}</Text>
                <Text style={[s.hCell, { width: W.vatA }]}>{"сумма, руб. коп."}</Text>
              </View>
            </View>
            <Text style={[s.hCell, { width: W.total, borderRightWidth: 0 }]}>{"Сумма с учетом НДС, руб. коп."}</Text>
          </View>

          {/* Column numbers row */}
          <View style={s.tRow}>
            {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map((n, i) => {
              const widths = [W.n,W.name,W.code,W.unNm,W.unCd,W.pack,W.inOne,W.pcs,W.wGr,W.wNt,W.price,W.amt,W.vatR,W.vatA,W.total];
              return (
                <Text key={n} style={[s.hCell, { width: widths[i], borderRightWidth: i === 14 ? 0 : 0.5, fontWeight: "bold" }]}>
                  {String(n)}
                </Text>
              );
            })}
          </View>

          {/* Data rows */}
          {invoice.items.map((item, idx) => {
            const isM2 = item.priceUnit === PriceUnitEnum.M2;
            const qtyVal = isM2 && item.quantityM2 !== null
              ? item.quantityM2.toFixed(3).replace(".", ",")
              : String(item.quantity);
            const unitName = isM2 ? "м2" : "шт";
            const unitCode = isM2 ? "055" : "796";
            const isLast = idx === invoice.items.length - 1;

            return (
              <View key={idx} style={isLast ? s.tRowLast : s.tRow}>
                <Text style={s.dN}>{String(idx + 1)}</Text>
                <Text style={s.dName}>{item.sku}</Text>
                <Text style={s.dCode}>{""}</Text>
                <Text style={s.dUnNm}>{unitName}</Text>
                <Text style={s.dUnCd}>{unitCode}</Text>
                <Text style={s.dPack}>{""}</Text>
                <Text style={s.dInOne}>{""}</Text>
                <Text style={s.dPcs}>{qtyVal}</Text>
                <Text style={s.dWGr}>{""}</Text>
                <Text style={s.dWNt}>{qtyVal}</Text>
                <Text style={s.dPrice}>{num(item.priceRub)}</Text>
                <Text style={s.dAmt}>{num(item.totalRub)}</Text>
                <Text style={s.dVatR}>{"Без НДС"}</Text>
                <Text style={s.dVatA}>{""}</Text>
                <Text style={s.dTotal}>{num(item.totalRub)}</Text>
              </View>
            );
          })}
        </View>

        {/* Итого / Всего */}
        {[
          { label: "Итого", qty: qty.toFixed(3).replace(".", ","), amt: num(total) },
          { label: "Всего по накладной", qty: qty.toFixed(3).replace(".", ","), amt: num(total) },
        ].map((row, i) => (
          <View key={i} style={{ flexDirection: "row", ...BB, marginBottom: 1 }}>
            <Text style={{ flex: 1, textAlign: "right", paddingRight: 4, fontSize: 7, fontWeight: "bold", padding: "1 4" }}>{row.label}</Text>
            <Text style={{ width: W.wNt, textAlign: "right", padding: "1 2", ...BL, ...BR, fontSize: 7 }}>{row.qty}</Text>
            <Text style={{ width: W.price + W.amt, textAlign: "right", padding: "1 2", ...BR, fontSize: 7 }}>{"Х"}</Text>
            <Text style={{ width: W.vatR + W.vatA, textAlign: "right", padding: "1 2", ...BL, ...BR, fontSize: 7 }}>{"Х"}</Text>
            <Text style={{ width: W.total, textAlign: "right", padding: "1 2", fontSize: 7, fontWeight: "bold" }}>{row.amt}</Text>
          </View>
        ))}

        {/* ── Footer ── */}
        <View style={{ flexDirection: "row", marginTop: 4, marginBottom: 2 }}>
          <Text style={{ fontSize: 7, flex: 1 }}>
            {"Товарная накладная имеет приложение на "}
            <Text style={{ ...BB }}>{"               "}</Text>
            {" и содержит "}
            <Text style={{ fontWeight: "bold" }}>{invoice.items.length === 1 ? "Один" : String(invoice.items.length)}</Text>
            {" порядковых номеров записей"}
          </Text>
        </View>

        <View style={{ flexDirection: "row", marginBottom: 2 }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", marginBottom: 1 }}>
              <Text style={{ fontSize: 7, width: 80 }}>{"Масса груза (нетто)"}</Text>
              <Text style={{ flex: 1, ...BB }}>{""}</Text>
            </View>
            <Text style={{ fontSize: 5.5, color: "#444", marginLeft: 80 }}>{"прописью"}</Text>
          </View>
          <View style={{ flex: 1, paddingLeft: 8 }}>
            <View style={{ flexDirection: "row", marginBottom: 1 }}>
              <Text style={{ fontSize: 7, width: 80 }}>{"Масса груза (брутто)"}</Text>
              <Text style={{ flex: 1, ...BB }}>{""}</Text>
            </View>
            <Text style={{ fontSize: 5.5, color: "#444", marginLeft: 80 }}>{"прописью"}</Text>
          </View>
        </View>

        <View style={{ marginBottom: 4 }}>
          <View style={{ flexDirection: "row", marginBottom: 1 }}>
            <Text style={{ fontSize: 7, fontWeight: "bold", marginRight: 4 }}>{"Всего отпущено на сумму"}</Text>
          </View>
          <View style={{ flexDirection: "row", marginBottom: 1 }}>
            <Text style={{ fontSize: 7, fontWeight: "bold", ...BB, flex: 1 }}>{amountInWords(total)}</Text>
          </View>
          <Text style={{ fontSize: 5.5, color: "#444" }}>{"прописью"}</Text>
        </View>

        {/* ── Signatures ── */}
        <View style={s.sigSection}>
          <View style={s.sigBlock}>
            <View style={s.sigRow}>
              <Text style={[s.sigLabel, { width: 70 }]}>{"Отпуск груза разрешил"}</Text>
              <Text style={[s.sigLabel, { width: 80 }]}>{sellerTitle}</Text>
              <View style={{ ...BB, flex: 1, marginRight: 4 }} />
              <Text style={{ fontSize: 7, width: 60 }}>{sellerShort}</Text>
            </View>
            <View style={{ flexDirection: "row", marginBottom: 4 }}>
              <Text style={[s.sigHint, { width: 70 }]}>{""}</Text>
              <Text style={[s.sigHint, { width: 80 }]}>{"должность"}</Text>
              <Text style={[s.sigHint, { flex: 1 }]}>{"подпись"}</Text>
              <Text style={[s.sigHint, { width: 60 }]}>{"расшифровка подписи"}</Text>
            </View>

            <View style={s.sigRow}>
              <Text style={[s.sigLabel, { width: 150 }]}>{"Главный (старший) бухгалтер"}</Text>
              <View style={{ ...BB, flex: 1, marginRight: 4 }} />
              <Text style={{ fontSize: 7, width: 60 }}>{""}</Text>
            </View>
            <View style={{ flexDirection: "row", marginBottom: 4 }}>
              <Text style={[s.sigHint, { width: 150 }]}>{""}</Text>
              <Text style={[s.sigHint, { flex: 1 }]}>{"подпись"}</Text>
              <Text style={[s.sigHint, { width: 60 }]}>{"расшифровка подписи"}</Text>
            </View>

            <View style={s.sigRow}>
              <Text style={[s.sigLabel, { width: 150 }]}>{"Отпуск груза произвел"}</Text>
              <View style={{ ...BB, width: 60, marginRight: 4 }} />
              <View style={{ ...BB, flex: 1, marginRight: 4 }} />
              <Text style={{ fontSize: 7, width: 60 }}>{""}</Text>
            </View>
            <View style={{ flexDirection: "row" }}>
              <Text style={[s.sigHint, { width: 150 }]}>{""}</Text>
              <Text style={[s.sigHint, { width: 60 }]}>{"должность"}</Text>
              <Text style={[s.sigHint, { flex: 1 }]}>{"подпись"}</Text>
              <Text style={[s.sigHint, { width: 60 }]}>{"расшифровка подписи"}</Text>
            </View>
          </View>

          <View style={[s.sigBlock, { paddingLeft: 16, borderLeftWidth: 0.5, borderLeftColor: "#000", borderLeftStyle: "solid" }]}>
            <View style={s.sigRow}>
              <Text style={[s.sigLabel, { width: 60 }]}>{"Груз принял"}</Text>
              <View style={{ ...BB, width: 60, marginRight: 4 }} />
              <View style={{ ...BB, flex: 1, marginRight: 4 }} />
              <Text style={{ fontSize: 7, width: 60 }}>{""}</Text>
            </View>
            <View style={{ flexDirection: "row", marginBottom: 4 }}>
              <Text style={[s.sigHint, { width: 60 }]}>{""}</Text>
              <Text style={[s.sigHint, { width: 60 }]}>{"должность"}</Text>
              <Text style={[s.sigHint, { flex: 1 }]}>{"подпись"}</Text>
              <Text style={[s.sigHint, { width: 60 }]}>{"расшифровка подписи"}</Text>
            </View>

            <View style={s.sigRow}>
              <Text style={[s.sigLabel, { width: 60 }]}>{"Груз получил"}</Text>
              <Text style={[s.sigLabel, { width: 70 }]}>{"грузополучатель"}</Text>
              <View style={{ ...BB, width: 60, marginRight: 4 }} />
              <View style={{ ...BB, flex: 1, marginRight: 4 }} />
              <Text style={{ fontSize: 7, width: 60 }}>{""}</Text>
            </View>
            <View style={{ flexDirection: "row", marginBottom: 4 }}>
              <Text style={[s.sigHint, { width: 130 }]}>{""}</Text>
              <Text style={[s.sigHint, { width: 60 }]}>{"должность"}</Text>
              <Text style={[s.sigHint, { flex: 1 }]}>{"подпись"}</Text>
              <Text style={[s.sigHint, { width: 60 }]}>{"расшифровка подписи"}</Text>
            </View>
          </View>
        </View>

        {/* ── Date row ── */}
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View style={s.dateRow}>
            <Text style={s.dateLabel}>{"М.П."}</Text>
            <Text style={{ fontSize: 5.5, color: "#444", marginHorizontal: 4 }}>{" "}</Text>
            <Text style={[s.datePart, { width: 20 }]}>{new Date(invoice.invoiceDate).getDate().toString().padStart(2, "0")}</Text>
            <Text style={s.dateLabel}>{` ${MONTHS_GEN[new Date(invoice.invoiceDate).getMonth()]} `}</Text>
            <Text style={[s.datePart, { width: 36 }]}>{new Date(invoice.invoiceDate).getFullYear().toString()}</Text>
            <Text style={s.dateLabel}>{" года"}</Text>
          </View>
          <View style={s.dateRow}>
            <Text style={s.dateLabel}>{"М.П."}</Text>
            <Text style={{ fontSize: 7, marginHorizontal: 4 }}>{" «"}</Text>
            <Text style={[s.datePart, { width: 20 }]}>{""}</Text>
            <Text style={{ fontSize: 7, marginHorizontal: 4 }}>{"»"}</Text>
            <Text style={[s.datePart, { width: 60 }]}>{""}</Text>
            <Text style={s.dateLabel}>{" 20 "}</Text>
            <Text style={[s.datePart, { width: 20 }]}>{""}</Text>
            <Text style={s.dateLabel}>{" года"}</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
}
