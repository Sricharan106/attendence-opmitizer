export default function Logo() {
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-background px-3 py-2 transition-colors">
      <div className="flex h-8 w-8 items-center justify-end rounded-full bg-primary/10 text-lg font-semibold text-primary sm:h-10 sm:w-10 sm:text-lg">
        OP
      </div>

      <div className="mr-2 text-lg font-semibold tracking-tight text-foreground">
        timizer
      </div>

      <div className="mr-2 hidden h-6 w-px bg-border md:block" />

      <div className="hidden text-sm text-muted-foreground md:block">
        Plan smarter, attend better, bye stress.
      </div>
    </div>
  );
}
