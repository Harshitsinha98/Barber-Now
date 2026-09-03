import Image from "next/image";
import { redirect } from "next/navigation";
import { getMyShop } from "@/lib/supabase/queries";
import { PhotoUploader } from "./PhotoUploader";
import { removeFromGallery, clearCover } from "./actions";
import { ImageIcon, Trash2, X } from "lucide-react";

export default async function PhotosPage() {
  const shop = await getMyShop();
  if (!shop) redirect("/barber/onboarding");

  return (
    <div className="p-5 sm:p-8">
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
        Photos
      </h1>
      <p className="text-sm text-ink/60">
        A great cover photo and gallery help customers choose your shop.
      </p>

      {/* Cover */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink">Cover photo</h2>
          <PhotoUploader shopId={shop.id} target="cover" />
        </div>

        {shop.cover_image ? (
          <div className="relative h-56 w-full overflow-hidden rounded-2xl sm:h-72">
            <Image
              src={shop.cover_image}
              alt="Shop cover"
              fill
              className="object-cover"
            />
            <form action={clearCover} className="absolute right-3 top-3">
              <button
                className="flex items-center gap-1 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white hover:bg-black/80"
                title="Remove cover"
              >
                <X size={14} /> Remove
              </button>
            </form>
          </div>
        ) : (
          <div className="flex h-40 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-black/15 text-ink/40">
            <ImageIcon size={28} />
            <p className="mt-2 text-sm">No cover photo yet</p>
          </div>
        )}
      </section>

      {/* Gallery */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink">
            Gallery ({shop.gallery?.length ?? 0})
          </h2>
          <PhotoUploader shopId={shop.id} target="gallery" />
        </div>

        {shop.gallery && shop.gallery.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {shop.gallery.map((url) => (
              <div
                key={url}
                className="group relative aspect-square overflow-hidden rounded-xl"
              >
                <Image src={url} alt="Gallery photo" fill className="object-cover" />
                <form
                  action={removeFromGallery}
                  className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100"
                >
                  <input type="hidden" name="url" value={url} />
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-rose-600"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-40 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-black/15 text-ink/40">
            <ImageIcon size={28} />
            <p className="mt-2 text-sm">No gallery photos yet</p>
          </div>
        )}
      </section>
    </div>
  );
}
