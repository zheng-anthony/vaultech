"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { uploadDocument } from "@/lib/api/uploads";

type UploadStatus = "idle" | "preparing" | "uploading" | "success" | "error";

export function DocumentUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const busy = status === "preparing" || status === "uploading";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || busy) return;
    setError(null);
    setStatus("preparing");
    try {
      await uploadDocument(file, () => setStatus("uploading"));
      setStatus("success");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to upload the document.");
      setStatus("error");
    }
  }

  return (
    <section aria-labelledby="upload-heading" className="w-full max-w-xl rounded-xl border border-foreground/20 p-6">
      <h1 id="upload-heading" className="text-2xl font-semibold">Upload a document</h1>
      <p id="upload-help" className="mt-2 text-sm">PDF or TXT, up to 10 MiB.</p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label htmlFor="document" className="text-sm font-medium">Document</label>
        <input
          id="document"
          type="file"
          accept=".pdf,.txt"
          required
          disabled={busy}
          aria-describedby="upload-help"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setStatus("idle");
            setError(null);
          }}
          className="w-full rounded-lg border border-foreground/20 p-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!file || busy || status === "success"}
          className="rounded-lg bg-foreground px-6 py-3 font-medium text-background hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "preparing" ? "Preparing upload…" : status === "uploading" ? "Uploading…" : "Upload document"}
        </button>
      </form>
      <div role="status" aria-live="polite" className="mt-4 text-sm">
        {status === "success" && `${file?.name} uploaded successfully.`}
      </div>
      {error && <p role="alert" className="mt-4 text-sm">{error}</p>}
    </section>
  );
}
