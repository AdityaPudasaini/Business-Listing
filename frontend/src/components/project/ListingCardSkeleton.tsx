// ListingCardSkeleton.tsx — a pulsing placeholder matching ListingCard's
export function ListingCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden h-full flex flex-col border border-gray-100 shadow-sm">
      <div className="w-full h-52 bg-gray-200 animate-pulse" />
      <div className="border-t-2 border-gray-100" />
      <div className="p-5 flex flex-col flex-1 gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="h-5 w-2/3 rounded bg-gray-200 animate-pulse" />
          <div className="h-5 w-12 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="h-3 w-1/3 rounded bg-gray-100 animate-pulse" />
        <div className="h-4 w-4/5 rounded bg-gray-200 animate-pulse mt-2" />

        <div className="mt-auto pt-4 border-t border-gray-100 flex items-end justify-between gap-3">
          <div className="flex flex-col gap-2">
            <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
            <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
          </div>
          <div className="h-9 w-20 rounded-xl bg-gray-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
