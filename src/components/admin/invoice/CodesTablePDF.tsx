import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// ── Border helpers (thin = 0.5, thick = 1) ───────────────────────────────────
const BT  = { borderTopWidth: 0.5,    borderTopColor: "#000",    borderTopStyle: "solid"    } as const;
const BR  = { borderRightWidth: 0.5,  borderRightColor: "#000",  borderRightStyle: "solid"  } as const;
const BB  = { borderBottomWidth: 0.5, borderBottomColor: "#000", borderBottomStyle: "solid" } as const;
const BL  = { borderLeftWidth: 0.5,   borderLeftColor: "#000",   borderLeftStyle: "solid"   } as const;

const BT1 = { borderTopWidth: 1,    borderTopColor: "#000",    borderTopStyle: "solid"    } as const;
const BR1 = { borderRightWidth: 1,  borderRightColor: "#000",  borderRightStyle: "solid"  } as const;
const BB1 = { borderBottomWidth: 1, borderBottomColor: "#000", borderBottomStyle: "solid" } as const;
const BL1 = { borderLeftWidth: 1,   borderLeftColor: "#000",   borderLeftStyle: "solid"   } as const;

// ── Dimensions ────────────────────────────────────────────────────────────────
// Label column is split into two sub-columns:
//   LW1 – left (empty for short labels; used by wide labels)
//   LW2 – right (contains short labels)
// Wide labels (e.g. "Вид деятельности по ОКДП") span LW1 + LW2.
const LW1 = 110;  // left sub-column (wide enough for "Транспортная накладная")
const LW2 = 34;   // right sub-column (short labels)
const VW  = 52;   // value column

export const CODES_TABLE_WIDTH = LW1 + LW2 + VW; // 196pt
export const CODES_RIGHT_WIDTH = LW2 + VW;        //  86pt (label-right + value columns)

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: { fontFamily: "Roboto", fontSize: 7, padding: 20, color: "#000" },
  table: { width: LW1 + LW2 + VW },
  row: { flexDirection: "row" },

  // Left sub-column
  lbl1: { width: LW1 },
  lbl1Text: { width: LW1, textAlign: "right", padding: "2 2 2 0", fontSize: 7 },

  // Right sub-column – short label text, right-aligned
  lbl2: { width: LW2, textAlign: "right", padding: "2 3 2 0", fontSize: 7 },
  lbl2Bordered: {
    width: LW2, textAlign: "right", padding: "2 3", fontSize: 7,
    ...BB, ...BL,
  },
  lbl2BorderedFirst: {
    width: LW2, textAlign: "right", padding: "2 3", fontSize: 7,
    ...BB, ...BL,
  },
  lbl2WithBB: {
    width: LW2, textAlign: "right", padding: "2 3 2 0", fontSize: 7,
    ...BB,
  },

  // Wide label – spans LW1 + LW2
  lblWide: { width: LW1 + LW2, textAlign: "right", padding: "2 3 2 0", fontSize: 7 },

  // Value cells
  // "Коды" header — thin borders, no BB (first data row's thick BT1 serves as separator)
  valueHeader: {
    width: VW, textAlign: "center", padding: "2 3", fontSize: 7,
    ...BT, ...BR, ...BL,
  },
  // First data row ("Форма по ОКУД") — thick top/left/right, thin bottom separator
  valueFirst: {
    width: VW, textAlign: "center", padding: "2 3", fontSize: 7, fontWeight: "bold",
    ...BT1, ...BR1, ...BB, ...BL1,
  },
  // Normal data rows — thick left/right, thin bottom separator
  value: {
    width: VW, textAlign: "center", padding: "2 3", fontSize: 7, fontWeight: "bold",
    ...BR1, ...BB, ...BL1,
  },
  valueBordered: {
    width: VW, textAlign: "center", padding: "2 3", fontSize: 7, fontWeight: "bold",
    ...BR1, ...BB, ...BL1,
  },
  valueBorderedFirst: {
    width: VW, textAlign: "center", padding: "2 3", fontSize: 7, fontWeight: "bold",
    ...BR1, ...BB, ...BL1,
  },
  // Last data row ("Вид операции") — thick left/right/bottom, no inner BB
  valueLast: {
    width: VW, textAlign: "center", padding: "2 3", fontSize: 7, fontWeight: "bold",
    ...BR1, ...BB1, ...BL1,
  },
});

// ── Row variants ──────────────────────────────────────────────────────────────

// Normal short-label row (lbl1 empty + lbl2 text + value)
function Row({ label, value, header, first, last, bordered, firstBordered, labelBB, leftLabel, wide, minH }: {
  label: string; value: string;
  header?: boolean; first?: boolean; last?: boolean; bordered?: boolean; firstBordered?: boolean; labelBB?: boolean; leftLabel?: string; wide?: boolean; minH?: number;
}) {
  const valStyle = header ? s.valueHeader
    : first ? s.valueFirst
    : firstBordered ? s.valueBorderedFirst
    : bordered ? s.valueBordered
    : last ? s.valueLast
    : s.value;
  const lbl2Style = firstBordered ? s.lbl2BorderedFirst : bordered ? s.lbl2Bordered : labelBB ? s.lbl2WithBB : s.lbl2;
  return (
    <View style={[s.row, minH ? { minHeight: minH } : {}]}>
      {wide
        ? <Text style={s.lblWide}>{label}</Text>
        : leftLabel
          ? <><Text style={s.lbl1Text}>{leftLabel}</Text><Text style={lbl2Style}>{label}</Text></>
          : <><View style={s.lbl1} /><Text style={lbl2Style}>{label}</Text></>
      }
      <Text style={valStyle}>{value}</Text>
    </View>
  );
}

// Wide-label row: label spans both sub-columns
function WideRow({ label, value, minH, last }: { label: string; value: string; minH?: number; last?: boolean }) {
  return (
    <View style={[s.row, minH ? { minHeight: minH } : {}]}>
      <Text style={s.lblWide}>{label}</Text>
      <Text style={last ? s.valueLast : s.value}>{value}</Text>
    </View>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
export type CodesTableData = {
  senderOkpo?: string;
  buyerOkpo?: string;
  sellerOkpo?: string;
  basisNumber: string;
  basisDate: string;
};

// ── Reusable view (no Document/Page wrapper) ─────────────────────────────────
export function CodesTableView({ data }: { data: CodesTableData }) {
  return (
    <View style={s.table}>
      {/* "Коды" header — thin borders, sits above the thick-bordered value column */}
      <Row label=""               value="Коды"                  header />

      {/* Data rows — value column has thick outer border (left/right/top on first, bottom on last) */}
      <Row label="Форма по ОКУД"  value="0330212"               first wide />
      <Row label="по ОКПО"        value={data.senderOkpo ?? ""} />
      <Row label=""               value=""                       minH={16} />
      <WideRow label="Вид деятельности по ОКДП" value="" minH={14} />
      <Row label="по ОКПО"        value={data.buyerOkpo  ?? ""} />
      <Row label="по ОКПО"        value={data.sellerOkpo ?? ""} />
      <Row label="по ОКПО"        value={data.buyerOkpo  ?? ""}  labelBB />
      <Row label="номер"          value={data.basisNumber}       firstBordered />
      <Row label="дата"           value={data.basisDate}         bordered />
      <Row label="номер"          value=""                       bordered leftLabel="Транспортная накладная" />
      <Row label="дата"           value=""                       bordered />
      <WideRow label="Вид операции" value="" last />
    </View>
  );
}

// ── Standalone PDF (for testing) ─────────────────────────────────────────────
export function CodesTablePDF({ data }: { data: CodesTableData }) {
  return (
    <Document>
      <Page size={[LW1 + LW2 + VW + 40, 400]} style={s.page}>
        <CodesTableView data={data} />
      </Page>
    </Document>
  );
}
