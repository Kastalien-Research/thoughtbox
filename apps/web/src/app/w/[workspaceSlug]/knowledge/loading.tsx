export default function KnowledgeLoading() {
  return (
    <div className="mx-auto max-w-[1600px] animate-pulse">
      <div className="mb-6">
        <div className="h-7 w-56 rounded bg-foreground/10" />
        <div className="mt-2 h-4 w-96 max-w-full rounded bg-foreground/5" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[320px_1fr_320px] min-h-[600px]">
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03]" />
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] h-[600px] xl:h-auto" />
        <div className="rounded-2xl border border-dashed border-foreground/10" />
      </div>
    </div>
  )
}
