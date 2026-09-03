"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { setCover, addToGallery } from "./actions";
import { Upload, LoaderCircle, ImagePlus } from "lucide-react";

export function PhotoUploader({
  shopId,
  target,
}: {
  shopId: string;
  /** "cover" sets the shop cover; "gallery" appends to the gallery. */
  target: "cover" | "gallery";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${shopId}/${target}-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("shop-photos")
        .upload(path, file, { upsert: false });
      if (upErr) {
        setError(upErr.message);
        return;
      }

      const { data } = supabase.storage.from("shop-photos").getPublicUrl(path);
      const url = data.publicUrl;

      // Persist the URL via the server action.
      const fd = new FormData();
      fd.set("url", url);
      start(async () => {
        if (target === "cover") await setCover(fd);
        else await addToGallery(fd);
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const busy = uploading || pending;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className={target === "cover" ? "btn-outline text-sm" : "btn-gold text-sm"}
      >
        {busy ? (
          <>
            <LoaderCircle size={16} className="animate-spin" /> Uploading…
          </>
        ) : target === "cover" ? (
          <>
            <Upload size={16} /> Upload cover
          </>
        ) : (
          <>
            <ImagePlus size={16} /> Add photo
          </>
        )}
      </button>
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
