import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { PriceUnitEnum } from "@prisma/client";
import { type InvoicePDFData } from "./InvoicePDF";
import { CodesTableView, CODES_RIGHT_WIDTH } from "./CodesTablePDF";

export type { InvoicePDFData as TovNaklData };

import { fmtShort, num, amountInWords, MONTHS_GEN } from "@/lib/invoice/formatters";

// ── Helpers ──────────────────────────────────────────────────────────────────

// ── Column widths ─────────────────────────────────────────────────────────────
// Total ≈ 800pt (A4 landscape 841 − 40 padding)
const W = {
  n:    20,
  name: 175,
  code:  48,
  unNm:  48,
  unCd:  28,
  pack:  34,
  inOne: 40,
  pcs:   30,
  wGr:   34,
  wNt:   34,
  price: 64,
  amt:   70,
  vatR:  36,
  vatA:  60,
  total: 70,
};

// ── Styles ────────────────────────────────────────────────────────────────────

const B = { borderWidth: 0.5, borderColor: "#000", borderStyle: "solid" } as const;
const BT = { borderTopWidth: 0.5, borderTopColor: "#000", borderTopStyle: "solid" } as const;
const BR = { borderRightWidth: 0.5, borderRightColor: "#000", borderRightStyle: "solid" } as const;
const BB = { borderBottomWidth: 0.5, borderBottomColor: "#000", borderBottomStyle: "solid" } as const;

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
  formTitle: { fontSize: 6, color: "#444", textAlign: "right" },

  // ── Party rows ─────────────────────────────────
  partyRow: { flexDirection: "row", marginBottom: 1 },
  partyLabel: { width: 80, fontSize: 7, fontWeight: "bold" },
  partyValue: { flex: 1, fontSize: 7, ...BB },
  partySmall: { fontSize: 5.5, color: "#444", marginBottom: 2, textAlign: "center" },

  subRow: { flexDirection: "row", marginBottom: 0 },
  subLeft: { flex: 1, ...BB },

  // ── Basis row ──────────────────────────────────
  basisRow: { flexDirection: "row", marginBottom: 1 },
  basisLabel: { fontSize: 7, fontWeight: "bold", marginRight: 4 },
  basisValue: { flex: 1, fontSize: 7, ...BB },

  // ── Title section ──────────────────────────────
  titleSection: { flexDirection: "row", justifyContent: "center", alignItems: "flex-end", marginBottom: 4, marginTop: 20 },
  titleLeft: { marginRight: 6 },
  titleMain: { fontSize: 9, fontWeight: "bold", textAlign: "center" },
  titleSub: { fontSize: 6, color: "#444", textAlign: "center" },
  titleMid: { flexDirection: "column" },
  titleLabelRow: { flexDirection: "row", ...B },
  // label row — thin right-border separator between the two columns
  titleCell: { width: 80, padding: "2 4", textAlign: "center", fontSize: 7, color: "#444", ...BR },
  titleCellLast: { width: 75, padding: "2 4", textAlign: "center", fontSize: 7, color: "#444" },
  // value row — thick outer border around the whole row
  titleValRow: { flexDirection: "row", borderWidth: 1, borderColor: "#000", borderStyle: "solid" },
  titleValCell: { width: 80, padding: "2 4", textAlign: "center", fontSize: 9, fontWeight: "bold", ...BR },
  titleValCellLast: { width: 75, padding: "2 4", textAlign: "center", fontSize: 9, fontWeight: "bold" },

  // ── Items table ────────────────────────────────
  table: { ...B },
  tRow: { flexDirection: "row", ...BB },
  tRowLast: { flexDirection: "row" },

  // header cells
  hCell: { padding: "1 2", textAlign: "center", fontSize: 6 },
  // View wrapper for single-column header cells — stretches to full row height so BR covers full height
  hCellV: { ...BR, justifyContent: "center" },

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

  const sellerTitle = invoice.sellerLegalName.startsWith("ИП") ? "Индивидуальный предприниматель" : "Руководитель";

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>

        {/* ── Header: left content + absolutely positioned codes table ── */}
        <View>

          {/* ── Left content (right padding reserves space for codes table) ── */}
          <View>
            {/* Form title lines */}
            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 1 }}>
              <View>
                <Text style={s.formTitle}>{"Унифицированная форма № ТОРГ-12"}</Text>
                <Text style={s.formTitle}>{"Утверждена постановлением Госкомстата России от 25.12.98 № 132"}</Text>
              </View>
            </View>

            {/* Party + basis rows — width stops before codes table label+value columns */}
            <View style={{ marginRight: CODES_RIGHT_WIDTH + 10, marginTop: 25 }}>

              {/* Грузоотправитель */}
              <View style={s.partyRow}>
                <Text style={s.partyValue}>{""}</Text>
              </View>
              <Text style={s.partySmall}>{"организация-грузоотправитель, адрес, телефон, факс, банковские реквизиты"}</Text>

              {/* Структурное подразделение */}
              <View style={s.partyRow}>
                <Text style={s.partyValue}>{""}</Text>
              </View>
              <Text style={s.partySmall}>{"структурное подразделение"}</Text>

              {/* Грузополучатель */}
              <View style={s.partyRow}>
                <Text style={s.partyLabel}>{"Грузополучатель"}</Text>
                <Text style={s.partyValue}>{buyerStr}</Text>
              </View>
              <Text style={s.partySmall}>{"организация, адрес, телефон, факс, банковские реквизиты"}</Text>

              {/* Поставщик */}
              <View style={s.partyRow}>
                <Text style={s.partyLabel}>{"Поставщик"}</Text>
                <Text style={s.partyValue}>{""}</Text>
              </View>
              <Text style={s.partySmall}>{"организация, адрес, телефон, факс, банковские реквизиты"}</Text>

              {/* Плательщик */}
              <View style={s.partyRow}>
                <Text style={s.partyLabel}>{"Плательщик"}</Text>
                <Text style={s.partyValue}>{buyerStr}</Text>
              </View>
              <Text style={s.partySmall}>{"организация, адрес, телефон, факс, банковские реквизиты"}</Text>

              {/* Основание */}
              <View style={s.basisRow}>
                <Text style={s.basisLabel}>{"Основание"}</Text>
                <Text style={s.basisValue}>{basis}</Text>
              </View>
              <View style={[s.basisRow, { marginBottom: 3 }]}>
                <Text style={[s.partySmall, { flex: 1 }]}>{"договор, заказ-наряд"}</Text>
              </View>

            </View>

            {/* Title section */}
            <View style={s.titleSection}>
              <View style={s.titleLeft}>
                <Text style={s.titleMain}>{"ТОВАРНАЯ НАКЛАДНАЯ"}</Text>
              </View>
              <View style={s.titleMid}>
                {/* Label row */}
                <View style={s.titleLabelRow}>
                  <Text style={s.titleCell}>{"Номер документа"}</Text>
                  <Text style={s.titleCellLast}>{"Дата составления"}</Text>
                </View>
                {/* Value row — thick outer border */}
                <View style={s.titleValRow}>
                  <Text style={s.titleValCell}>{String(invoice.sequenceNumber)}</Text>
                  <Text style={s.titleValCellLast}>{fmtShort(invoice.invoiceDate)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Codes table — absolutely positioned top-right ── */}
          <View style={{ position: "absolute", top: 16, right: 0 }}>
            <CodesTableView data={{
              senderOkpo:  "0202757706",
              sellerOkpo:  "0202757706",
              basisNumber: `Счет №${invoice.sequenceNumber}`,
              basisDate:   fmtShort(invoice.invoiceDate),
            }} />
          </View>

        </View>
        <Text style={{ fontSize: 7, textAlign: "right", marginBottom: 4 }}>{"Страница 1"}</Text>

        {/* ── Items table ── */}
        <View style={s.table}>

          {/* Header row 1 */}
          <View style={s.tRow}>
            <View style={[s.hCellV, { width: W.n }]}>
              <Text style={[s.hCell, { fontWeight: "bold" }]}>{"Но-\nмер\nпо\nпо-\nрядку"}</Text>
            </View>
            <View style={{ width: W.name + W.code, flexDirection: "row", ...BR }}>
              <View style={{ flex: 1, ...BR }}>
                <Text style={[s.hCell, { ...BB }]}>{"Товар"}</Text>
                <Text style={s.hCell}>{"наименование, характеристика, сорт, артикул товара"}</Text>
              </View>
              <Text style={[s.hCell, { width: W.code, alignSelf: "flex-end" }]}>{"код"}</Text>
            </View>
            <View style={{ width: W.unNm + W.unCd, flexDirection: "row", ...BR }}>
              <View style={{ width: W.unNm, ...BR }}>
                <Text style={[s.hCell, { ...BB }]}>{"Единица измерения"}</Text>
                <Text style={s.hCell}>{"наименование"}</Text>
              </View>
              <Text style={[s.hCell, { width: W.unCd, alignSelf: "flex-end" }]}>{"код по ОКЕИ"}</Text>
            </View>
            <View style={[s.hCellV, { width: W.pack }]}>
              <Text style={s.hCell}>{"Вид упаковки"}</Text>
            </View>
            <View style={{ width: W.inOne + W.pcs, flexDirection: "row", ...BR }}>
              <View style={{ width: W.inOne, ...BR }}>
                <Text style={[s.hCell, { ...BB }]}>{"Количество"}</Text>
                <Text style={s.hCell}>{"в одном месте"}</Text>
              </View>
              <Text style={[s.hCell, { width: W.pcs, alignSelf: "flex-end" }]}>{"мест, штук"}</Text>
            </View>
            <View style={[s.hCellV, { width: W.wGr }]}>
              <Text style={s.hCell}>{"Масса брутто"}</Text>
            </View>
            <View style={[s.hCellV, { width: W.wNt }]}>
              <Text style={s.hCell}>{"Количество (масса нетто)"}</Text>
            </View>
            <View style={[s.hCellV, { width: W.price }]}>
              <Text style={s.hCell}>{"Цена, руб. коп."}</Text>
            </View>
            <View style={[s.hCellV, { width: W.amt }]}>
              <Text style={s.hCell}>{"Сумма без учета НДС, руб. коп."}</Text>
            </View>
            <View style={{ width: W.vatR + W.vatA, flexDirection: "row", ...BR }}>
              <View style={{ width: W.vatR, ...BR }}>
                <Text style={[s.hCell, { ...BB }]}>{"НДС"}</Text>
                <Text style={s.hCell}>{"ставка, %"}</Text>
              </View>
              <Text style={[s.hCell, { width: W.vatA, alignSelf: "flex-end" }]}>{"сумма, руб. коп."}</Text>
            </View>
            <View style={[s.hCellV, { width: W.total, borderRightWidth: 0 }]}>
              <Text style={s.hCell}>{"Сумма с учетом НДС, руб. коп."}</Text>
            </View>
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
            const isLast = idx === invoice.items.length - 1 && invoice.deliveryPriceRub === 0;
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
          {invoice.deliveryPriceRub > 0 && (
            <View style={s.tRowLast}>
              <Text style={s.dN}>{String(invoice.items.length + 1)}</Text>
              <Text style={s.dName}>{"Доставка"}</Text>
              <Text style={s.dCode}>{""}</Text>
              <Text style={s.dUnNm}>{"усл"}</Text>
              <Text style={s.dUnCd}>{"799"}</Text>
              <Text style={s.dPack}>{""}</Text>
              <Text style={s.dInOne}>{""}</Text>
              <Text style={s.dPcs}>{"1"}</Text>
              <Text style={s.dWGr}>{""}</Text>
              <Text style={s.dWNt}>{""}</Text>
              <Text style={s.dPrice}>{num(invoice.deliveryPriceRub)}</Text>
              <Text style={s.dAmt}>{num(invoice.deliveryPriceRub)}</Text>
              <Text style={s.dVatR}>{"Без НДС"}</Text>
              <Text style={s.dVatA}>{""}</Text>
              <Text style={s.dTotal}>{num(invoice.deliveryPriceRub)}</Text>
            </View>
          )}

          {/* ── Итого row (inside table so right border = table's outer BR) ── */}
          <View style={{ flexDirection: "row", ...BT }}>
            <View style={{ width: W.n+W.name+W.code+W.unNm+W.unCd+W.pack+W.inOne, ...BR }}>
              <Text style={{ textAlign: "right", padding: "1 4", fontSize: 7, fontWeight: "bold" }}>{"Итого"}</Text>
            </View>
            <View style={{ flex: 1, flexDirection: "row", ...BB }}>
              <Text style={{ width: W.pcs, padding: "1 2", ...BR, fontSize: 7 }}>{""}</Text>
              <Text style={{ width: W.wGr, padding: "1 2", ...BR, fontSize: 7 }}>{""}</Text>
              <Text style={{ width: W.wNt, padding: "1 2", ...BR, textAlign: "right", fontSize: 7 }}>{qty.toFixed(3).replace(".", ",")}</Text>
              <Text style={{ width: W.price, padding: "1 2", ...BR, textAlign: "center", fontSize: 7 }}>{"Х"}</Text>
              <Text style={{ width: W.amt, padding: "1 2", ...BR, textAlign: "right", fontSize: 7 }}>{num(total)}</Text>
              <Text style={{ width: W.vatR, padding: "1 2", ...BR, textAlign: "center", fontSize: 7 }}>{"Х"}</Text>
              <Text style={{ width: W.vatA, padding: "1 2", ...BR, fontSize: 7 }}>{""}</Text>
              <Text style={{ width: W.total, padding: "1 2", textAlign: "right", fontSize: 7, fontWeight: "bold" }}>{num(total)}</Text>
            </View>
          </View>
          {/* ── Всего по накладной row ── */}
          <View style={{ flexDirection: "row" }}>
            <View style={{ width: W.n+W.name+W.code+W.unNm+W.unCd+W.pack+W.inOne, ...BR }}>
              <Text style={{ textAlign: "right", padding: "1 4", fontSize: 7, fontWeight: "bold" }}>{"Всего по накладной"}</Text>
            </View>
            <View style={{ flex: 1, flexDirection: "row" }}>
              <Text style={{ width: W.pcs, padding: "1 2", ...BR, fontSize: 7 }}>{""}</Text>
              <Text style={{ width: W.wGr, padding: "1 2", ...BR, fontSize: 7 }}>{""}</Text>
              <Text style={{ width: W.wNt, padding: "1 2", ...BR, textAlign: "right", fontSize: 7 }}>{qty.toFixed(3).replace(".", ",")}</Text>
              <Text style={{ width: W.price, padding: "1 2", ...BR, textAlign: "center", fontSize: 7 }}>{"Х"}</Text>
              <Text style={{ width: W.amt, padding: "1 2", ...BR, textAlign: "right", fontSize: 7 }}>{num(total)}</Text>
              <Text style={{ width: W.vatR, padding: "1 2", ...BR, textAlign: "center", fontSize: 7 }}>{"Х"}</Text>
              <Text style={{ width: W.vatA, padding: "1 2", ...BR, fontSize: 7 }}>{""}</Text>
              <Text style={{ width: W.total, padding: "1 2", textAlign: "right", fontSize: 7, fontWeight: "bold" }}>{num(total)}</Text>
            </View>
          </View>

        </View>

        {/* ── Footer ── */}
        {/* Row: "Товарная накладная имеет приложение" + right "порядковых номеров записей" */}
        <View style={{ flexDirection: "row", marginTop: 4, marginBottom: 1 }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
              <Text style={{ fontSize: 7 }}>{"Товарная накладная имеет приложение на"}</Text>
              <Text style={{ flex: 1, ...BB, marginHorizontal: 4 }}>{""}</Text>
            </View>
            <Text style={{ fontSize: 5.5, color: "#444", marginTop: 1 }}>{"прописью"}</Text>
          </View>
          <View style={{ width: 140, paddingLeft: 8 }}>
            <Text style={{ fontSize: 6, color: "#444" }}>{"порядковых номеров записей"}</Text>
            <Text style={{ flex: 1, ...BB, marginTop: 2 }}>{""}</Text>
          </View>
        </View>

        {/* Масса груза (нетто) + Масса груза (брутто) */}
        <View style={{ flexDirection: "row", marginBottom: 1, marginTop: 2 }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-end", marginBottom: 1 }}>
              <Text style={{ fontSize: 7, marginRight: 4 }}>{"Масса груза (нетто)"}</Text>
              <Text style={{ flex: 1, ...BB }}>{""}</Text>
            </View>
            <Text style={{ fontSize: 5.5, color: "#444" }}>{"прописью"}</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", marginBottom: 1 }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-end", marginBottom: 1 }}>
              <Text style={{ fontSize: 7, marginRight: 4 }}>{"Всего мест"}</Text>
              <Text style={{ width: 60, ...BB, marginRight: 8 }}>{""}</Text>
              <Text style={{ fontSize: 7, marginRight: 4 }}>{"Масса груза (брутто)"}</Text>
              <Text style={{ flex: 1, ...BB }}>{""}</Text>
            </View>
            <View style={{ flexDirection: "row" }}>
              <Text style={{ fontSize: 5.5, color: "#444", width: 100 }}>{"прописью"}</Text>
              <Text style={{ fontSize: 5.5, color: "#444" }}>{"прописью"}</Text>
            </View>
          </View>
        </View>

        {/* Приложение + По доверенности */}
        <View style={{ flexDirection: "row", marginBottom: 1, marginTop: 2 }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
              <Text style={{ fontSize: 7 }}>{"Приложение (паспорта, сертификаты и т.п.) на"}</Text>
              <Text style={{ width: 40, ...BB, marginHorizontal: 4 }}>{""}</Text>
              <Text style={{ fontSize: 7 }}>{"листах"}</Text>
            </View>
            <Text style={{ fontSize: 5.5, color: "#444", marginTop: 1 }}>{"прописью"}</Text>
          </View>
          <View style={{ width: 200, paddingLeft: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
              <Text style={{ fontSize: 7 }}>{"По доверенности №"}</Text>
              <Text style={{ width: 50, ...BB, marginHorizontal: 4 }}>{""}</Text>
              <Text style={{ fontSize: 7 }}>{"от"}</Text>
              <Text style={{ flex: 1, ...BB, marginLeft: 4 }}>{""}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 1 }}>
              <Text style={{ fontSize: 7, marginRight: 4 }}>{"выданной"}</Text>
              <Text style={{ flex: 1, ...BB }}>{""}</Text>
            </View>
            <Text style={{ fontSize: 5.5, color: "#444", marginTop: 1 }}>{"кем, кому (организация, должность, фамилия, и. о.)"}</Text>
          </View>
        </View>

        {/* Всего отпущено на сумму */}
        <View style={{ flexDirection: "row", marginBottom: 1, marginTop: 3 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 7, fontWeight: "bold" }}>{"Всего отпущено на сумму"}</Text>
            <Text style={{ fontSize: 7, fontWeight: "bold", ...BB, marginTop: 1 }}>{amountInWords(total)}</Text>
            <Text style={{ fontSize: 5.5, color: "#444", marginTop: 1 }}>{"прописью"}</Text>
          </View>
          <View style={{ width: 200, paddingLeft: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
              <Text style={{ fontSize: 7, marginRight: 4 }}>{"выданной"}</Text>
              <Text style={{ flex: 1, ...BB }}>{""}</Text>
            </View>
            <Text style={{ fontSize: 5.5, color: "#444", marginTop: 1 }}>{"кем, кому (организация, должность, фамилия, и. о.)"}</Text>
          </View>
        </View>

        {/* ── Signatures ── */}
        <View style={s.sigSection}>
          <View style={s.sigBlock}>
            <View style={s.sigRow}>
              <Text style={[s.sigLabel, { width: 70 }]}>{"Отпуск груза разрешил"}</Text>
              <Text style={[s.sigLabel, { width: 80 }]}>{sellerTitle}</Text>
              <View style={{ ...BB, flex: 1, marginRight: 4 }} />
              <Text style={{ fontSize: 7, width: 60 }}>{""}</Text>
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
