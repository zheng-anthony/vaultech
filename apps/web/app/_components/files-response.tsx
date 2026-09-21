"use client";

import { useState } from "react";
import { getFiles } from "@/lib/api/files";

export function FilesResponse() {
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleGetFiles() {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const data = await getFiles();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to load files.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section
      aria-label="Files API"
      className="flex w-full max-w-xl flex-col items-center gap-6"
    >
      <button
        type="button"
        onClick={handleGetFiles}
        disabled={isLoading}
        className="rounded-lg bg-foreground px-6 py-3 font-medium text-background hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground disabled:cursor-wait disabled:opacity-50"
      >
        {isLoading ? "Loading…" : "Get files"}
      </button>

      <div aria-live="polite" aria-busy={isLoading} className="w-full">
        {response !== null && (
          <pre className="max-h-96 overflow-auto rounded-lg border border-foreground/20 p-4 text-sm">
            {response}
          </pre>
        )}
      </div>
      {error && (
        <p role="alert" className="text-center text-sm">
          {error}
        </p>
      )}
    </section>
  );
}
