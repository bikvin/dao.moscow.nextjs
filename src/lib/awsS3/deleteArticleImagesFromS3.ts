import * as cheerio from "cheerio";
import { deleteFromS3 } from "./deleteFromS3";
import { S3Client } from "@aws-sdk/client-s3";

const region = process.env.NEXT_AWS_S3_REGION;
const accessKeyId = process.env.NEXT_AWS_S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.NEXT_AWS_S3_SECRET_ACCESS_KEY;
const bucketName = process.env.NEXT_AWS_S3_BUCKET_NAME;

if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
  throw new Error("Credential not found");
}

const s3Client = new S3Client({
  region: region,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
});

export const deleteArticleImagesFromS3 = async (article: string) => {
  const $ = cheerio.load(article);
  const urls: string[] = [];

  $("img").each((_, el) => {
    const src = $(el).attr("src");
    if (src) urls.push(src);
  });

  const keys = urls
    .map((url) => {
      try {
        const u = new URL(url);
        // assuming bucket.com/article-images/filename.png
        return u.pathname.startsWith("/") ? u.pathname.slice(1) : u.pathname;
      } catch {
        return "";
      }
    })
    .filter(Boolean);

  const deleteList = keys.map((key) => ({ Key: key }));

  await deleteFromS3(s3Client, deleteList);
};
