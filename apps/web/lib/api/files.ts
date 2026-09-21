export type FilesResponse = { files: unknown[] };

export async function getFiles(): Promise<FilesResponse> {
  const response = await fetch("/files", { cache: "no-store" });

  if (!response.ok) {
    throw new Error(
      `Unable to load files (HTTP ${response.status}). Please try again.`,
    );
  }

  const data: unknown = await response.json();

  if (
    typeof data !== "object" ||
    data === null ||
    !("files" in data) ||
    !Array.isArray(data.files)
  ) {
    throw new Error("The API returned an unexpected response.");
  }

  return data as FilesResponse;
}
