import { FilesResponse } from "@/app/_components/files-response";
import { DocumentUpload } from "@/app/_components/document-upload";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center gap-10 bg-background px-6 py-12 font-sans text-foreground">
      <DocumentUpload />
      <FilesResponse />
    </main>
  );
}
