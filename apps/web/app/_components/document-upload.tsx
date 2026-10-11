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
    <section aria-labelledby="upload-heading" className="relative rounded-[2rem] bg-panel p-6 shadow-[0_20px_50px_-35px_rgba(53,67,41,0.45)] sm:p-9">
      <p className="text-sm font-semibold uppercase tracking-[0.14em]">Add to your files</p>
      <h2 id="upload-heading" className="mt-3 font-serif text-4xl leading-tight tracking-tight sm:text-5xl">Upload a document</h2>
      <p id="upload-help" className="mt-3 text-sm leading-relaxed">PDF or TXT, up to 10 MiB.</p>
      <form onSubmit={handleSubmit} className="mt-7">
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
          className="peer sr-only"
        />
        <label
          htmlFor="document"
          className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-ink/45 bg-canvas/45 px-5 py-8 text-center transition-colors duration-300 ease-out hover:bg-canvas/70 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-ink peer-disabled:cursor-not-allowed peer-disabled:opacity-55"
        >
          <svg aria-hidden="true" viewBox="0 0 40 40" fill="none" className="h-10 w-10 stroke-current" strokeWidth="1.5">
            <path d="M20 27V8m0 0-7 7m7-7 7 7M8 27v4a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="mt-4 max-w-full break-all text-lg font-semibold">{file ? file.name : "Choose a file"}</span>
          <span className="mt-1 text-sm">{file ? "Choose a different file" : "Select a PDF or TXT document"}</span>
        </label>
        <button
          type="submit"
          disabled={!file || busy || status === "success"}
          className="mt-5 w-full rounded-full bg-ink px-6 py-4 text-base font-semibold text-canvas transition-[background-color,transform] duration-300 ease-out hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          {status === "preparing" ? "Preparing upload…" : status === "uploading" ? "Uploading…" : status === "success" ? "Uploaded" : "Upload document"}
        </button>
      </form>
      <div role="status" aria-live="polite" className="mt-4 text-sm empty:hidden">
        {status === "success" && `${file?.name} uploaded successfully.`}
      </div>
      {error && <p role="alert" className="mt-4 text-sm">{error}</p>}
    </section>
  );
}
