const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const DOCUMENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  txt: "text/plain",
};

type UploadTicket = {
  uploadUrl: string;
  key: string;
  expiresIn: number;
  requiredHeaders: { "Content-Type": string };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseTicket(value: unknown, contentType: string): UploadTicket {
  if (
    !isRecord(value) ||
    typeof value.uploadUrl !== "string" ||
    typeof value.key !== "string" ||
    !value.key.startsWith("uploads/") ||
    typeof value.expiresIn !== "number" ||
    !Number.isFinite(value.expiresIn) ||
    value.expiresIn <= 0 ||
    !isRecord(value.requiredHeaders) ||
    value.requiredHeaders["Content-Type"] !== contentType
  ) {
    throw new Error("The API returned an unexpected upload response.");
  }

  const url = new URL(value.uploadUrl);
  if (url.protocol !== "https:") {
    throw new Error("The API returned an invalid upload URL.");
  }

  return {
    uploadUrl: value.uploadUrl,
    key: value.key,
    expiresIn: value.expiresIn,
    requiredHeaders: { "Content-Type": contentType },
  };
}

export async function uploadDocument(
  file: File,
  onUploading: () => void,
): Promise<void> {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const contentType = DOCUMENT_TYPES[extension];
  if (typeof contentType !== "string" || file.size < 1 || file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Choose a nonempty PDF or TXT document up to 10 MiB.");
  }

  const response = await fetch("/files/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType,
      sizeBytes: file.size,
    }),
    cache: "no-store",
  });

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      isRecord(data) && typeof data.message === "string"
        ? data.message
        : `Unable to prepare the upload (HTTP ${response.status}).`,
    );
  }

  const ticket = parseTicket(data, contentType);
  onUploading();
  let upload: Response;
  try {
    upload = await fetch(ticket.uploadUrl, {
      method: "PUT",
      headers: ticket.requiredHeaders,
      body: file,
      credentials: "omit",
    });
  } catch {
    throw new Error("Unable to reach upload storage. Check your connection and try again.");
  }
  if (!upload.ok) {
    throw new Error(`Upload failed (HTTP ${upload.status}). Try again to request a fresh upload URL.`);
  }
}
