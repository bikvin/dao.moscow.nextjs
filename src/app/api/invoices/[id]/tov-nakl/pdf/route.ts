import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer, Font, type DocumentProps } from "@react-pdf/renderer";
import path from "path";
import fs from "fs";
import React from "react";
import { db } from "@/db";
import { InvoiceTypeEnum } from "@prisma/client";
import { TovNaklPDF } from "@/components/admin/invoice/TovNaklPDF";

let fontsRegistered = false;

function registerFonts() {
  if (fontsRegistered) return;
  const toDataUrl = (filePath: string) => {
    const buf = fs.readFileSync(filePath);
    return `data:font/truetype;base64,${buf.toString("base64")}`;
  };
  Font.register({
    family: "Roboto",
    fonts: [
      { src: toDataUrl(path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf")) },
      { src: toDataUrl(path.join(process.cwd(), "public/fonts/Roboto-Bold.ttf")), fontWeight: "bold" },
    ],
  });
  fontsRegistered = true;
}

const SELLER_FIELDS = [
  "sellerLegalName", "sellerInn", "sellerKpp", "sellerAddress", "sellerPhone",
  "sellerBankName", "sellerShortBankName", "sellerBik", "sellerBankAccNo", "sellerAccNo",
] as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  registerFonts();

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

  if (invoice.invoiceType !== InvoiceTypeEnum.CASH) {
    return NextResponse.json({ error: "Товарная накладная только для наличных счетов" }, { status: 400 });
  }

  const settingsRows = await db.settings.findMany({
    where: { field: { in: [...SELLER_FIELDS] } },
  });
  const getSetting = (field: string) => settingsRows.find((r) => r.field === field)?.value ?? "";
  const sel = (v: string, field: string) => v || getSetting(field);

  const data = {
    sequenceNumber: invoice.sequenceNumber,
    invoiceDate: invoice.invoiceDate,
    invoiceType: invoice.invoiceType,
    deliveryPriceRub: invoice.deliveryPriceRub,
    discountPercent: invoice.discountPercent,
    totalRub: invoice.totalRub,
    sellerLegalName:     sel(invoice.sellerLegalName,     "sellerLegalName"),
    sellerInn:           sel(invoice.sellerInn,           "sellerInn"),
    sellerKpp:           sel(invoice.sellerKpp,           "sellerKpp"),
    sellerAddress:       sel(invoice.sellerAddress,       "sellerAddress"),
    sellerPhone:         sel(invoice.sellerPhone,         "sellerPhone"),
    sellerBankName:      sel(invoice.sellerBankName,      "sellerBankName"),
    sellerShortBankName: sel(invoice.sellerShortBankName, "sellerShortBankName"),
    sellerBik:           sel(invoice.sellerBik,           "sellerBik"),
    sellerBankAccNo:     sel(invoice.sellerBankAccNo,     "sellerBankAccNo"),
    sellerAccNo:         sel(invoice.sellerAccNo,         "sellerAccNo"),
    buyerLegalName:  invoice.buyerLegalName,
    buyerInn:        invoice.buyerInn,
    buyerKpp:        invoice.buyerKpp,
    buyerBankName:   invoice.buyerBankName,
    buyerBik:        invoice.buyerBik,
    buyerBankAccNo:  invoice.buyerBankAccNo,
    buyerAccNo:      invoice.buyerAccNo,
    items: invoice.items.map((item) => ({
      sku: item.product.sku,
      variantName: item.productVariant.variantName,
      quantity: item.quantity,
      quantityM2: item.quantityM2,
      priceUnit: item.priceUnit,
      priceRub: item.priceRub,
      totalRub: item.totalRub,
    })),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(TovNaklPDF, { invoice: data }) as any;
  const buffer = await renderToBuffer(element as React.ReactElement<DocumentProps>);

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="tov-nakl-${invoice.sequenceNumber}.pdf"`,
    },
  });
}
