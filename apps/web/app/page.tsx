import { FilesResponse } from "@/app/_components/files-response";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-background px-6 py-12 font-sans text-foreground">
      <FilesResponse />
    </main>
  );
}
