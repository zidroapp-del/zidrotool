import { cn } from "@/lib/utils";

export function SkeletonCard() {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="skeleton h-11 w-11 rounded-xl" />
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>
      <div className="skeleton mt-4 h-5 w-3/4 rounded" />
      <div className="skeleton mt-2 h-4 w-full rounded" />
      <div className="skeleton mt-1 h-4 w-2/3 rounded" />
      <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3 dark:border-ink-800">
        <div className="skeleton h-4 w-4 rounded" />
        <div className="skeleton h-4 w-20 rounded" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn("skeleton h-4 rounded", className)} />;
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine
          key={i}
          className={cn(i === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

export function SkeletonCategoryGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="card p-5">
          <div className="skeleton h-12 w-12 rounded-xl" />
          <div className="skeleton mt-4 h-5 w-2/3 rounded" />
          <div className="skeleton mt-2 h-4 w-full rounded" />
          <div className="skeleton mt-1 h-3 w-1/3 rounded" />
        </div>
      ))}
    </div>
  );
}
