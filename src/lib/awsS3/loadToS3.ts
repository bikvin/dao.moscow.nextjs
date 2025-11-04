export const loadToS3 = async (file: File, directory: string) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("directory", directory);

  console.log("loadToS3");

  const response = await fetch("/api/s3/upload", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  console.log("data", data);

  return data;
};
