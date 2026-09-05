import Link from "next/link";
import { formatPriceLabel } from "@/lib/catalog";

export function ProductCard({
  href,
  name,
  summary,
  startingPrice,
  thumbnailUrl,
}: {
  href: string;
  name: string;
  summary: string;
  startingPrice: number | null;
  thumbnailUrl?: string;
}) {
  return (
    <Link
      href={href}
      className="group overflow-hidden rounded-[1.25rem] border border-line bg-white transition hover:border-accent/35"
    >
      <div className="aspect-[16/10] bg-paper-deep">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt={name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            MZ MEDIA
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-ink">{name}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-muted">{summary}</p>
        <p className="mt-4 text-sm font-semibold text-accent">
          {formatPriceLabel(startingPrice)}
        </p>
      </div>
    </Link>
  );
}
