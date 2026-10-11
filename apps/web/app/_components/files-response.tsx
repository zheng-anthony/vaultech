"use client";

import { useState } from "react";
import { getFiles } from "@/lib/api/files";
import type { FilesResponse as FilesData } from "@/lib/api/files";

function formatSize(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KiB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));
}

export function FilesResponse() {
  const [response, setResponse] = useState<FilesData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleGetFiles(continuationToken?: string) {
    setIsLoading(true);
    setError(null);
    if (!continuationToken) setResponse(null);

    try {
      const data = await getFiles(continuationToken);
      setResponse((previous) => ({
        files: continuationToken ? [...(previous?.files ?? []), ...data.files] : data.files,
        nextToken: data.nextToken,
      }));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to load files.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section aria-labelledby="files-heading" className="rounded-[2rem] bg-storage p-6 text-storage-ink sm:p-9 lg:p-12">
      <div className="flex flex-col gap-6 border-b border-storage-ink/30 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em]">Your storage</p>
          <h2 id="files-heading" className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">Stored files</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed">View object keys, sizes, and upload dates.</p>
        </div>
        <button
          type="button"
          onClick={() => handleGetFiles()}
          disabled={isLoading}
          className="shrink-0 rounded-full bg-storage-ink px-6 py-3 font-semibold text-storage transition-[background-color,transform] duration-300 ease-out hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-storage-ink disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          {isLoading ? "Loading…" : response ? "Refresh files" : "Get files"}
        </button>
      </div>

      <div aria-live="polite" aria-busy={isLoading} className="min-h-32">
        {response === null && !isLoading && !error && (
          <p className="py-10 text-sm">Select Get files to see your stored documents.</p>
        )}
        {response?.files.length === 0 && (
          <p className="py-10 text-sm">No documents uploaded yet.</p>
        )}
        {response && response.files.length > 0 && (
          <ul className="divide-y divide-storage-ink/25">
            {response.files.map((file) => (
              <li key={file.key} className="grid gap-2 py-5 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-8">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider">Object key</p>
                  <p className="mt-1 break-all text-sm">{file.key}</p>
                </div>
                <p className="text-sm">{formatSize(file.sizeBytes)}</p>
                <p className="text-sm">{formatDate(file.lastModified)}</p>
              </li>
            ))}
          </ul>
        )}
        {isLoading && response === null && <p className="py-10 text-sm">Loading files…</p>}
      </div>
      {response?.nextToken && (
        <button
          type="button"
          onClick={() => handleGetFiles(response.nextToken ?? undefined)}
          disabled={isLoading}
          className="mt-5 rounded-full border border-storage-ink/60 px-6 py-3 font-semibold transition-colors duration-300 ease-out hover:bg-storage-ink/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-storage-ink disabled:opacity-50 motion-reduce:transition-none"
        >
          Load more
        </button>
      )}
      {error && (
        <p role="alert" className="mt-5 text-sm">
          {error}
        </p>
      )}
    </section>
  );
}
