import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

const region = process.env.NEXT_AWS_S3_REGION;
const accessKeyId = process.env.NEXT_AWS_S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.NEXT_AWS_S3_SECRET_ACCESS_KEY;

if (!region || !accessKeyId || !secretAccessKey) {
  throw new Error("Credential not found");
}

const s3Client = new S3Client({
  region: region,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
});

async function uploadFileToS3(
  file: Buffer,
  fileName: string,
  directory: string
) {
  const fileBuffer = file;

  const dotLastIndex = fileName.lastIndexOf(".");
  // const fileNameNoExt = fileName.substring(0, dotLastIndex);
  const fileExt = fileName.substring(dotLastIndex + 1, fileName.length);

  const randomFileName = `${uuidv4()}`;
  const randomFileNameExt = `${randomFileName}.${fileExt}`;

  const params = {
    Bucket: process.env.NEXT_AWS_S3_BUCKET_NAME,
    Key: `${directory}/${randomFileNameExt}`,
    Body: fileBuffer,
    ContentType: "image/*",
  };

  const command = new PutObjectCommand(params);
  try {
    await s3Client.send(command);

    return randomFileNameExt;
  } catch (error) {
    console.log("Error", error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const directory = formData.get("directory");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    if (!directory || directory instanceof File) {
      return NextResponse.json(
        { error: "Directory is required." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = await uploadFileToS3(buffer, file.name, directory);
    const url = `${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_PROTOCOL}://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_LINK}/${directory}/${fileName}`;

    return NextResponse.json({ success: true, fileName, url });
  } catch (error) {
    return NextResponse.json({ error });
  }
}
