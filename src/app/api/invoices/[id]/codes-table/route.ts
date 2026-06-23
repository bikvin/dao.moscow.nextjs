export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer, Font, type DocumentProps } from "@react-pdf/renderer";
import path from "path";
import fs from "fs";
import React from "react";
import { db } from "@/db";
import { CodesTablePDF } from "@/components/admin/invoice/CodesTablePDF";

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

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  registerFonts();

  const invoice = await db.invoice.findUnique({ where: { id: params.id } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = {
    senderOkpo: "0202757706",
    sellerOkpo: "0202757706",
    basisNumber: `Счет №${invoice.sequenceNumber}`,
    basisDate: new Date(invoice.invoiceDate).toLocaleDateString("ru-RU"),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(CodesTablePDF, { data }) as any;
  const buffer = await renderToBuffer(element as React.ReactElement<DocumentProps>);

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="codes-table-${invoice.sequenceNumber}.pdf"`,
    },
  });
}
