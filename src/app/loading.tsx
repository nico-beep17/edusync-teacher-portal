export default function Loading() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row items-start justify-between sm:items-center gap-4">
        <div className="space-y-2">
          <div className="h-8 w-40 rounded-lg skeu-inset animate-pulse" />
          <div className="h-4 w-64 rounded-md skeu-inset animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-32 rounded-xl skeu-inset animate-pulse" />
          <div className="h-10 w-32 rounded-xl skeu-inset animate-pulse" />
        </div>
      </div>

      {/* School Info skeleton */}
      <div className="skeu-card p-6 space-y-4">
        <div className="h-6 w-48 rounded-lg skeu-inset animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 rounded-md skeu-inset animate-pulse" />
              <div className="h-10 w-full rounded-lg skeu-inset animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Subjects skeleton */}
      <div className="skeu-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 rounded-lg skeu-inset animate-pulse" />
          <div className="h-8 w-28 rounded-lg skeu-inset animate-pulse" />
        </div>
        <div className="h-56 w-full rounded-lg skeu-inset animate-pulse" />
      </div>

      {/* Import/Export skeleton */}
      <div className="skeu-card p-6 space-y-4">
        <div className="h-6 w-56 rounded-lg skeu-inset animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 rounded-xl skeu-inset animate-pulse" />
          ))}
        </div>
      </div>

      {/* PIN skeleton */}
      <div className="skeu-card p-6 space-y-4">
        <div className="h-6 w-56 rounded-lg skeu-inset animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 rounded-md skeu-inset animate-pulse" />
              <div className="h-11 w-full rounded-lg skeu-inset animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
