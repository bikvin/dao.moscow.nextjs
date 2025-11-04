import { DeleteObjectsCommand, S3Client } from "@aws-sdk/client-s3";

const bucketName = process.env.NEXT_AWS_S3_BUCKET_NAME;

export const deleteFromS3 = async (
  s3Client: S3Client,
  deleteList: {
    Key: string | undefined;
  }[]
) => {
  if (deleteList.length > 0) {
    const result = await s3Client.send(
      new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: {
          Objects: deleteList,
        },
      })
    );

    if (result.Deleted) {
      console.log(
        "Successfully deleted:",
        result.Deleted.map((obj) => obj.Key)
      );
    }
    if (result.Errors) {
      console.error("Failed to delete:", result.Errors);
    }
  }
};
