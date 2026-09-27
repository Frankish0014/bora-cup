export default function LoadingSession() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-6 sm:py-10" aria-busy="true">
      <p className="sr-only">Loading your cupping session…</p>
      <div className="h-6 w-36 animate-pulse rounded bg-paper-3" />
      <div className="mt-16 h-4 w-24 animate-pulse rounded bg-paper-3" />
      <div className="mt-4 h-11 w-3/4 animate-pulse rounded bg-paper-3" />
      <div className="mt-5 h-4 w-full animate-pulse rounded bg-paper-2" />
      <div className="card mt-10 p-6">
        <div className="h-4 w-24 animate-pulse rounded bg-paper-3" />
        <div className="mt-5 grid grid-cols-2 gap-5">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-10 animate-pulse rounded bg-paper-2" />
          ))}
        </div>
      </div>
      <div className="mt-5 h-14 w-full animate-pulse rounded-xl bg-paper-3" />
    </main>
  );
}
