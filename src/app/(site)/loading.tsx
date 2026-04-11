function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`rounded-xl bg-white/[0.06] animate-pulse ${className ?? ""}`} />;
}

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-12 md:space-y-16">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="h-14 w-full max-w-md" />
          <SkeletonBlock className="h-20 max-w-lg" />
          <div className="flex flex-wrap gap-2 pt-2">
            <SkeletonBlock className="h-10 w-28" />
            <SkeletonBlock className="h-10 w-28" />
            <SkeletonBlock className="h-10 w-28" />
          </div>
        </div>
        <SkeletonBlock className="min-h-[220px]" />
      </div>
      <SkeletonBlock className="aspect-[21/9] w-full" />
      <SkeletonBlock className="h-64 w-full" />
    </div>
  );
}
