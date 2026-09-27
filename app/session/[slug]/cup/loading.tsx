export default function LoadingCup() {
  return (
    <main className="min-h-dvh" aria-busy="true">
      <p className="sr-only">Loading your cupping session…</p>
      <div className="px-3 pt-3 sm:px-5">
        <div className="mx-auto w-full max-w-6xl rounded-[1.35rem] border border-line bg-foam px-4 py-3 shadow-card">
          <div className="h-5 w-40 animate-pulse rounded bg-paper-3" />
          <div className="mt-4 flex gap-1">
            {Array.from({ length: 8 }, (_, index) => (
              <span key={index} className="h-1 flex-1 rounded-full bg-paper-3" />
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-3 pt-4 sm:px-5 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="h-28 animate-pulse bg-leaf/30" />
          <div className="grid grid-cols-2 gap-4 p-6">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="h-10 animate-pulse rounded bg-paper-2" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="card p-6">
              <div className="h-5 w-24 animate-pulse rounded bg-paper-3" />
              <div className="mt-4 h-24 animate-pulse rounded-xl bg-paper-2" />
            </div>
          ))}
          <div className="card p-6">
            <div className="h-5 w-20 animate-pulse rounded bg-paper-3" />
            <div className="mt-5 grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-xl bg-paper-2" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
