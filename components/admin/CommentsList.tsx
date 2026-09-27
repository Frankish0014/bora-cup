export function CommentsList({ coffeeName, comments }: { coffeeName: string; comments: string[] }) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-[17px] font-semibold tracking-tight text-ink">Comments</h2>
        <p className="text-xs text-ink-mute tabular">
          {comments.length} for {coffeeName}
        </p>
      </div>
      {comments.length === 0 ? (
        <p className="card px-5 py-10 text-center text-sm text-ink-soft">No comments yet.</p>
      ) : (
        <ul className="card divide-y divide-line">
          {comments.map((comment, index) => (
            <li key={`${index}-${comment.slice(0, 24)}`} className="px-5 py-4 text-[15px] leading-7 text-ink whitespace-pre-wrap">
              {comment}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
