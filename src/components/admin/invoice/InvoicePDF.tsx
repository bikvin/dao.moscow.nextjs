import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { InvoiceTypeEnum, PriceUnitEnum } from "@prisma/client";

export type InvoicePDFData = {
  sequenceNumber: number;
  invoiceDate: Date;
  invoiceType: InvoiceTypeEnum;
  deliveryPriceRub: number;
  discountPercent: number;
  totalRub: number;
  sellerLegalName: string;
  sellerInn: string;
  sellerKpp: string;
  sellerAddress: string;
  sellerPhone: string;
  sellerBankName: string;
  sellerShortBankName: string;
  sellerBik: string;
  sellerBankAccNo: string;
  sellerAccNo: string;
  buyerLegalName: string;
  buyerInn: string;
  buyerKpp: string;
  buyerBankName: string;
  buyerBik: string;
  buyerBankAccNo: string;
  buyerAccNo: string;
  items: {
    sku: string;
    variantName: string;
    quantity: number;
    quantityM2: number | null;
    priceUnit: PriceUnitEnum;
    priceRub: number;
    totalRub: number;
  }[];
};

// ── Formatting helpers ───────────────────────────────────────────────────────

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
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtShort(date: Date): string {
  return new Date(date).toLocaleDateString("ru-RU");
}

// ── Amount in words (прописью) ───────────────────────────────────────────────

const H = ["","сто","двести","триста","четыреста","пятьсот","шестьсот","семьсот","восемьсот","девятьсот"];
const T = ["","десять","двадцать","тридцать","сорок","пятьдесят","шестьдесят","семьдесят","восемьдесят","девяносто"];
const TN = ["десять","одиннадцать","двенадцать","тринадцать","четырнадцать","пятнадцать","шестнадцать","семнадцать","восемнадцать","девятнадцать"];
const OM = ["","один","два","три","четыре","пять","шесть","семь","восемь","девять"];
const OF = ["","одна","две","три","четыре","пять","шесть","семь","восемь","девять"];

function pl(n: number, one: string, few: string, many: string): string {
  const m100 = Math.abs(n) % 100;
  const m10 = Math.abs(n) % 10;
  if (m100 >= 11 && m100 <= 19) return many;
  if (m10 === 1) return one;
  if (m10 >= 2 && m10 <= 4) return few;
  return many;
}

function tri(n: number, fem: boolean): string {
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const rem = n % 100;
  if (h) parts.push(H[h]);
  if (rem >= 10 && rem <= 19) {
    parts.push(TN[rem - 10]);
  } else {
    const t = Math.floor(rem / 10);
    const o = rem % 10;
    if (t) parts.push(T[t]);
    if (o) parts.push(fem ? OF[o] : OM[o]);
  }
  return parts.join(" ");
}

function rubWords(n: number): string {
  if (n === 0) return "ноль";
  const parts: string[] = [];
  const mil = Math.floor(n / 1_000_000);
  if (mil) { parts.push(tri(mil, false)); parts.push(pl(mil, "миллион", "миллиона", "миллионов")); }
  const th = Math.floor((n % 1_000_000) / 1_000);
  if (th) { parts.push(tri(th, true)); parts.push(pl(th, "тысяча", "тысячи", "тысяч")); }
  const rem = n % 1_000;
  if (rem) parts.push(tri(rem, false));
  return parts.join(" ");
}

function amountInWords(kopecks: number): string {
  const rub = Math.floor(kopecks / 100);
  const kop = kopecks % 100;
  const w = `${rubWords(rub)} ${pl(rub, "рубль", "рубля", "рублей")} ${kop.toString().padStart(2, "0")} ${pl(kop, "копейка", "копейки", "копеек")}`;
  return w.charAt(0).toUpperCase() + w.slice(1);
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 10,
    paddingTop: 60,
    paddingBottom: 30,
    paddingLeft: 40,
    paddingRight: 40,
    color: "#000",
  },

  // ── Bank header ────────────────────────────────
  bankBox: {
    flexDirection: "row",
    borderWidth: 0.75, borderColor: "#000000", borderStyle: "solid",
    marginBottom: 12,
  },
  bankLeft: {
    flex: 1,
    borderRightWidth: 0.75, borderRightColor: "#000000", borderRightStyle: "solid",
  },
  bankLeftTop: {
    minHeight: 56,
    padding: "2 2",
    justifyContent: "space-between",
    borderBottomWidth: 0.75, borderBottomColor: "#000000", borderBottomStyle: "solid",
  },
  bankInnKppRow: {
    flexDirection: "row",
    borderBottomWidth: 0.75, borderBottomColor: "#000000", borderBottomStyle: "solid",
  },
  bankInnCell: {
    flex: 1,
    padding: "2 2",
    borderRightWidth: 0.75, borderRightColor: "#000000", borderRightStyle: "solid",
  },
  bankKppCell: {
    width: 100,
    padding: "2 2",
  },
  bankLeftBot: { minHeight: 42, padding: "2 2", justifyContent: "space-between" },
  bankMiddle: {
    width: 36,
    borderLeftWidth: 0.75, borderLeftColor: "#000000", borderLeftStyle: "solid",
  },
  bankMiddleCell: {
    minHeight: 28,
    padding: "2 2",
    borderBottomWidth: 0.75, borderBottomColor: "#000000", borderBottomStyle: "solid",
  },
  bankMiddleCellLast: { minHeight: 28, padding: "2 2" },
  bankRight: {
    width: 130,
    borderLeftWidth: 0.75, borderLeftColor: "#000000", borderLeftStyle: "solid",
  },
  bankRightCell: {
    minHeight: 28,
    padding: "2 2",
    borderBottomWidth: 0.75, borderBottomColor: "#000000", borderBottomStyle: "solid",
  },
  bankRightCellLast: { minHeight: 28, padding: "2 2" },
  bankSmall: { fontSize: 7, color: "#000000" },
  bankBold: { fontSize: 9 },

  // ── Title ──────────────────────────────────────
  titleWrap: {
    borderBottomWidth: 2, borderBottomColor: "#000000", borderBottomStyle: "solid",
    paddingTop: 6, paddingBottom: 8, marginBottom: 10, marginTop: 6,
  },
  title: { fontSize: 15, fontWeight: "bold" },

  // ── Parties ────────────────────────────────────
  partiesTable: { marginBottom: 6 },
  partyRow: { flexDirection: "row", marginBottom: 7 },
  partyLabel: { width: 120, fontSize: 10, color: "#333" },
  partyValue: { flex: 1, fontSize: 10, fontWeight: "bold" },

  // ── Items table ────────────────────────────────
  table: {
    borderWidth: 1.5, borderColor: "#000000", borderStyle: "solid",
    marginBottom: 3,
  },
  tHead: {
    flexDirection: "row",
    borderBottomWidth: 0.75, borderBottomColor: "#000000", borderBottomStyle: "solid",
  },
  tRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5, borderBottomColor: "#000000", borderBottomStyle: "solid",
  },
  tRowLast: { flexDirection: "row" },
  cN:  { width: 20,  padding: "1 2", borderRightWidth: 0.5, borderRightColor: "#000000", borderRightStyle: "solid", textAlign: "center", fontSize: 9 },
  cNm: { flex: 1,    padding: "1 2", borderRightWidth: 0.5, borderRightColor: "#000000", borderRightStyle: "solid", fontSize: 9 },
  cQ:  { width: 44,  padding: "1 2", borderRightWidth: 0.5, borderRightColor: "#000000", borderRightStyle: "solid", textAlign: "right", fontSize: 9 },
  cU:  { width: 26,  padding: "1 2", borderRightWidth: 0.5, borderRightColor: "#000000", borderRightStyle: "solid", textAlign: "center", fontSize: 9 },
  cP:  { width: 72,  padding: "1 2", borderRightWidth: 0.5, borderRightColor: "#000000", borderRightStyle: "solid", textAlign: "right", fontSize: 9 },
  cS:  { width: 72,  padding: "1 2", textAlign: "right", fontSize: 9 },
  thTxt: { fontWeight: "bold", fontSize: 9, textAlign: "center" },

  // ── Totals ─────────────────────────────────────
  totalsWrap: { alignItems: "flex-end", marginBottom: 6 },
  tRow2: { flexDirection: "row", marginBottom: 1 },
  tLbl: { width: 130, textAlign: "right", paddingRight: 6, color: "#333" },
  tVal: { width: 72, textAlign: "right" },
  tLblBold: { width: 130, textAlign: "right", paddingRight: 6, fontWeight: "bold" },
  tValBold: { width: 72, textAlign: "right", fontWeight: "bold" },

  // ── Count + words ──────────────────────────────
  countLine: { fontSize: 10, marginBottom: 2 },
  wordsLine: { fontSize: 10, fontWeight: "bold", marginBottom: 8 },

  // ── Notes ──────────────────────────────────────
  notesBorder: {
    borderBottomWidth: 0.75, borderBottomColor: "#000000", borderBottomStyle: "solid",
    paddingTop: 3, paddingBottom: 3, marginBottom: 10,
  },
  notesTitle: { fontSize: 9, marginBottom: 1 },
  notesText: { fontSize: 8.5, color: "#333", marginBottom: 1 },

  // ── Signature ──────────────────────────────────
  sigRow: { flexDirection: "row", alignItems: "flex-end" },
  sigLabel: { fontSize: 10, fontWeight: "bold", marginRight: 8 },
  sigLine: {
    flex: 1,
    borderBottomWidth: 0.75, borderBottomColor: "#000000", borderBottomStyle: "solid",
  },
  sigName: { fontSize: 10, marginLeft: 8 },
});

// ── Component ────────────────────────────────────────────────────────────────

export function InvoicePDF({ invoice }: { invoice: InvoicePDFData }) {
  const isBank = invoice.invoiceType === InvoiceTypeEnum.BANK;

  const itemsSubtotal = invoice.items.reduce((s, i) => s + i.totalRub, 0);
  const discountAmt = invoice.discountPercent > 0
    ? Math.round((itemsSubtotal * invoice.discountPercent) / 100)
    : 0;
  const tableTotal = itemsSubtotal - discountAmt + invoice.deliveryPriceRub;

  const sellerTitle = invoice.sellerLegalName.startsWith("ИП")
    ? "Предприниматель"
    : "Руководитель";

  const buyerDetails = [
    invoice.buyerLegalName,
    invoice.buyerInn ? `ИНН ${invoice.buyerInn}` : "",
    invoice.buyerKpp ? `КПП ${invoice.buyerKpp}` : "",
  ].filter(Boolean).join(", ");

  const sellerDetails = [
    invoice.sellerLegalName,
    invoice.sellerInn ? `ИНН ${invoice.sellerInn}` : "",
    invoice.sellerKpp ? `КПП ${invoice.sellerKpp}` : "",
    invoice.sellerAddress || "",
    invoice.sellerPhone ? `тел. ${invoice.sellerPhone}` : "",
  ].filter(Boolean).join(", ");

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── Bank header ── */}
        <View style={s.bankBox}>
          <View style={s.bankLeft}>
            <View style={s.bankLeftTop}>
              <Text style={s.bankBold}>
                {invoice.sellerShortBankName || invoice.sellerBankName}
              </Text>
              <Text style={s.bankSmall}>{"Банк получателя"}</Text>
            </View>
            <View style={s.bankInnKppRow}>
              <View style={s.bankInnCell}>
                <Text>{invoice.sellerInn ? `ИНН ${invoice.sellerInn}` : "ИНН"}</Text>
              </View>
              <View style={s.bankKppCell}>
                <Text>{invoice.sellerKpp ? `КПП ${invoice.sellerKpp}` : "КПП"}</Text>
              </View>
            </View>
            <View style={s.bankLeftBot}>
              {invoice.sellerLegalName ? (
                <Text style={s.bankBold}>{invoice.sellerLegalName}</Text>
              ) : null}
              <Text style={s.bankSmall}>{"Получатель"}</Text>
            </View>
          </View>
          <View style={s.bankMiddle}>
            <View style={s.bankMiddleCell}>
              <Text style={s.bankBold}>{"БИК"}</Text>
            </View>
            <View style={s.bankMiddleCell}>
              <Text style={s.bankBold}>{"Сч. №"}</Text>
            </View>
            <View style={s.bankMiddleCellLast}>
              <Text style={s.bankBold}>{"Сч. №"}</Text>
            </View>
          </View>
          <View style={s.bankRight}>
            <View style={s.bankRightCell}>
              <Text style={s.bankBold}>{invoice.sellerBik}</Text>
            </View>
            <View style={s.bankRightCell}>
              <Text style={s.bankBold}>{invoice.sellerBankAccNo}</Text>
            </View>
            <View style={s.bankRightCellLast}>
              <Text style={s.bankBold}>{invoice.sellerAccNo}</Text>
            </View>
          </View>
        </View>

        {/* ── Title ── */}
        <View style={s.titleWrap}>
          <Text style={s.title}>
            {`Счет на оплату № ${invoice.sequenceNumber} от ${fmtLong(invoice.invoiceDate)} г.`}
          </Text>
        </View>

        {/* ── Parties ── */}
        <View style={s.partiesTable}>
          <View style={s.partyRow}>
            <Text style={s.partyLabel}>{"Поставщик (Исполнитель):"}</Text>
            <Text style={s.partyValue}>{sellerDetails}</Text>
          </View>
          {isBank && buyerDetails ? (
            <View style={s.partyRow}>
              <Text style={s.partyLabel}>{"Покупатель (Заказчик):"}</Text>
              <Text style={s.partyValue}>{buyerDetails}</Text>
            </View>
          ) : null}
          <View style={s.partyRow}>
            <Text style={s.partyLabel}>{"Основание:"}</Text>
            <Text style={s.partyValue}>
              {`Счет №${invoice.sequenceNumber} от ${fmtShort(invoice.invoiceDate)}`}
            </Text>
          </View>
        </View>

        {/* ── Items table ── */}
        <View style={s.table}>
          <View style={s.tHead}>
            <Text style={[s.cN,  s.thTxt]}>{"№"}</Text>
            <Text style={[s.cNm, s.thTxt]}>{"Товары (работы, услуги)"}</Text>
            <Text style={[s.cQ,  s.thTxt]}>{"Кол-во"}</Text>
            <Text style={[s.cU,  s.thTxt]}>{"Ед."}</Text>
            <Text style={[s.cP,  s.thTxt]}>{"Цена"}</Text>
            <Text style={[s.cS,  s.thTxt]}>{"Сумма"}</Text>
          </View>

          {invoice.items.map((item, idx) => {
            const name = item.sku;
            const isM2 = item.priceUnit === PriceUnitEnum.M2;
            const unit = isM2 ? "м²" : "шт";
            const qty = isM2 && item.quantityM2 !== null
              ? item.quantityM2.toFixed(2)
              : String(item.quantity);

            const isLast = idx === invoice.items.length - 1
              && invoice.deliveryPriceRub === 0
              && invoice.discountPercent === 0;

            return (
              <View key={idx} style={isLast ? s.tRowLast : s.tRow}>
                <Text style={s.cN}>{String(idx + 1)}</Text>
                <Text style={s.cNm}>{name}</Text>
                <Text style={s.cQ}>{qty}</Text>
                <Text style={s.cU}>{unit}</Text>
                <Text style={s.cP}>{num(item.priceRub)}</Text>
                <Text style={s.cS}>{num(item.totalRub)}</Text>
              </View>
            );
          })}

          {invoice.discountPercent > 0 ? (
            <View style={invoice.deliveryPriceRub === 0 ? s.tRowLast : s.tRow}>
              <Text style={s.cN}>{""}</Text>
              <Text style={s.cNm}>{`Скидка ${invoice.discountPercent}%`}</Text>
              <Text style={s.cQ}>{"-"}</Text>
              <Text style={s.cU}>{"-"}</Text>
              <Text style={s.cP}>{"-"}</Text>
              <Text style={s.cS}>{`− ${num(discountAmt)}`}</Text>
            </View>
          ) : null}

          {invoice.deliveryPriceRub > 0 ? (
            <View style={s.tRowLast}>
              <Text style={s.cN}>{""}</Text>
              <Text style={s.cNm}>{"Доставка"}</Text>
              <Text style={s.cQ}>{"-"}</Text>
              <Text style={s.cU}>{"-"}</Text>
              <Text style={s.cP}>{num(invoice.deliveryPriceRub)}</Text>
              <Text style={s.cS}>{num(invoice.deliveryPriceRub)}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Totals ── */}
        <View style={s.totalsWrap}>
          <View style={s.tRow2}>
            <Text style={s.tLblBold}>{"Итого:"}</Text>
            <Text style={s.tValBold}>{num(tableTotal)}</Text>
          </View>
          <View style={s.tRow2}>
            <Text style={s.tLblBold}>{"Без налога (НДС)"}</Text>
            <Text style={s.tValBold}>{"-"}</Text>
          </View>
          <View style={s.tRow2}>
            <Text style={s.tLblBold}>{"Всего к оплате:"}</Text>
            <Text style={s.tValBold}>{num(invoice.totalRub)}</Text>
          </View>
        </View>

        {/* ── Count + amount in words ── */}
        <Text style={s.countLine}>
          {`Всего наименований ${invoice.items.length}, на сумму ${num(invoice.totalRub)} руб.`}
        </Text>
        <Text style={s.wordsLine}>{amountInWords(invoice.totalRub)}</Text>

        {/* ── Notes ── */}
        <View style={s.notesBorder}>
          <Text style={s.notesTitle}>{"Внимание!"}</Text>
          <Text style={s.notesText}>{"Счет действителен в течение 5-ти календарных дней!"}</Text>
          <Text style={s.notesText}>{"Оплата данного счета означает согласие с условиями поставки товара."}</Text>
          <Text style={s.notesText}>{"Уведомление об оплате обязательно, в противном случае не гарантируется наличие товара на складе."}</Text>
          <Text style={s.notesText}>{"Товар отпускается по факту прихода денег на р/с Поставщика, самовывозом, при наличии доверенности и паспорта."}</Text>
        </View>

        {/* ── Signature ── */}
        <View style={s.sigRow}>
          <Text style={s.sigLabel}>{sellerTitle}</Text>
          <View style={s.sigLine} />
          <Text style={s.sigName}>{invoice.sellerLegalName.replace(/^ИП\s+/, "").split(" ").map((w, i) => i === 0 ? w : w[0] + ".").join(" ")}</Text>
        </View>

      </Page>
    </Document>
  );
}
