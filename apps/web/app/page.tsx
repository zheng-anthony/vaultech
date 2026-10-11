import { FilesResponse } from "@/app/_components/files-response";
import { DocumentUpload } from "@/app/_components/document-upload";

export default function Home() {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto max-w-7xl px-5 pb-16 pt-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between border-b border-ink/20 pb-5">
          <span className="font-serif text-2xl font-semibold tracking-tight">Vaultech.</span>
          <span className="text-sm font-medium">Documents</span>
        </header>

        <div className="relative grid gap-10 pb-12 pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(390px,0.88fr)] lg:items-center lg:gap-16 lg:pb-20 lg:pt-24">
          <div className="relative z-10 max-w-xl">
            <p className="mb-6 border-l-4 border-accent pl-3 text-sm font-semibold uppercase tracking-[0.16em]">Document storage</p>
            <h1 className="font-serif text-[clamp(2.8rem,7vw,7rem)] leading-[0.96] tracking-[-0.055em]">
              Keep your files<br />within reach.
            </h1>
            <p className="mt-8 max-w-md text-lg leading-relaxed text-ink/80">
              Upload a PDF or text document, then review the files you have stored.
            </p>
          </div>
          <div className="relative lg:py-7">
            <div aria-hidden="true" className="absolute -bottom-5 -left-5 right-7 top-10 rounded-[2.5rem] bg-sage/45 sm:-left-8 lg:-bottom-7 lg:-left-10" />
            <DocumentUpload />
          </div>
        </div>

        <FilesResponse />
      </div>
    </main>
  );
}
