export type FileSummary = {
  key: string;
  sizeBytes: number;
  lastModified: string;
};

export type FilesResponse = { files: FileSummary[]; nextToken: string | null };

function isFileSummary(value: unknown): value is FileSummary {
  return (
    typeof value === "object" && value !== null &&
    "key" in value && typeof value.key === "string" &&
    "sizeBytes" in value && typeof value.sizeBytes === "number" &&
    Number.isSafeInteger(value.sizeBytes) && value.sizeBytes >= 0 &&
    "lastModified" in value && typeof value.lastModified === "string" &&
    Number.isFinite(Date.parse(value.lastModified))
  );
}

export async function getFiles(continuationToken?: string): Promise<FilesResponse> {
  const query = continuationToken
    ? `?${new URLSearchParams({ continuationToken })}`
    : "";
  const response = await fetch(`/files${query}`, { cache: "no-store" });
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      typeof data === "object" && data !== null && "message" in data && typeof data.message === "string"
        ? data.message
        : `Unable to load files (HTTP ${response.status}). Please try again.`,
    );
  }

  if (
    typeof data !== "object" ||
    data === null ||
    !("files" in data) ||
    !Array.isArray(data.files) ||
    !data.files.every(isFileSummary) ||
    !("nextToken" in data) ||
    !(data.nextToken === null || (typeof data.nextToken === "string" && data.nextToken.length > 0))
  ) {
    throw new Error("The API returned an unexpected response.");
  }

  return { files: data.files, nextToken: data.nextToken };
}
