"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { UploadCloud, FileText, Download, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const MAX = 15 * 1024 * 1024;

interface StoredFile {
  key: string;
  name: string;
  size: number;
  lastModified: string;
}

function fmtSize(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export default function BelgelerPage() {
  const token = useAuthStore((s) => s.accessToken);
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const authHeaders = useCallback(
    (): Record<string, string> => (token ? { authorization: `Bearer ${token}` } : {}),
    [token],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/uploads`, { headers: authHeaders() });
      const data = (await res.json()) as { files?: StoredFile[] };
      setFiles(data.files ?? []);
    } catch {
      /* sessizce geç */
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    void load();
  }, [load]);

  async function upload(file: File) {
    if (file.size > MAX) {
      toast.error("Dosya 15 MB'tan büyük olamaz.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: authHeaders(),
        body: fd,
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error ?? "Yükleme başarısız.");
      }
      toast.success("Dosya yüklendi.");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Yükleme başarısız.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function download(f: StoredFile) {
    try {
      const res = await fetch(`${API_URL}/uploads/file?key=${encodeURIComponent(f.key)}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("İndirilemedi.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = f.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "İndirilemedi.");
    }
  }

  return (
    <div className="px-5 pt-6">
      <header className="mb-4">
        <p className="text-xs text-text-3">Danışan paneli</p>
        <h1 className="font-headline text-xl font-semibold text-foreground">Belgelerim</h1>
        <p className="mt-1 text-xs text-text-3">
          Tahlil, reçete ve sağlık belgelerinizi güvenle saklayın (en fazla 15 MB).
        </p>
      </header>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex w-full flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-primary/40 bg-accent/40 px-4 py-7 text-center transition-colors hover:bg-accent disabled:opacity-60"
      >
        {uploading ? (
          <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
        ) : (
          <UploadCloud className="size-6 text-primary" aria-hidden />
        )}
        <span className="text-sm font-medium text-foreground">
          {uploading ? "Yükleniyor…" : "Dosya yükle"}
        </span>
        <span className="text-[11px] text-text-3">PDF, görsel veya belge seçin</span>
      </button>

      <div className="mt-5 space-y-2">
        {loading ? (
          <>
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-[var(--radius)] border border-dashed border-border p-8 text-center">
            <FileText className="size-6 text-text-3" aria-hidden />
            <p className="text-sm text-text-2">Henüz belge yok.</p>
          </div>
        ) : (
          files.map((f) => (
            <div
              key={f.key}
              className="flex items-center gap-3 rounded-[var(--radius)] border border-border bg-card px-3 py-2.5 shadow-[var(--shadow-sm)]"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius)] bg-accent text-primary">
                <FileText className="size-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">{f.name}</span>
                <span className="block text-xs text-text-3">
                  {fmtSize(f.size)} · {new Date(f.lastModified).toLocaleDateString("tr-TR")}
                </span>
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="İndir"
                onClick={() => void download(f)}
                className="shrink-0"
              >
                <Download className="size-4" aria-hidden />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
