import Link from 'next/link'

export function PublicFooter() {
  return (
    <footer className="border-t border-foreground/10 bg-background">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold text-foreground">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-background text-xs font-bold">
                T
              </span>
              Thoughtbox
            </Link>
            <p className="mt-2 max-w-xs text-sm text-foreground">
              Observable agency for AI systems. An intention ledger for auditable agent reasoning.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</p>
              <ul className="mt-3 flex flex-col gap-2">
                <li><Link href="/pricing" className="text-sm text-foreground hover:text-foreground hover:underline-thick transition-colors">Pricing</Link></li>
                <li><Link href="/docs" className="text-sm text-foreground hover:text-foreground hover:underline-thick transition-colors">Docs</Link></li>
                <li><Link href="/docs/quickstart" className="text-sm text-foreground hover:text-foreground hover:underline-thick transition-colors">Quickstart</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company</p>
              <ul className="mt-3 flex flex-col gap-2">
                <li><Link href="/support" className="text-sm text-foreground hover:text-foreground hover:underline-thick transition-colors">Support</Link></li>
                <li><a href="https://github.com/Kastalien-Research/thoughtbox" target="_blank" rel="noopener noreferrer" className="text-sm text-foreground hover:text-foreground hover:underline-thick transition-colors">GitHub</a></li>
                <li><a href="https://discord.gg/8g4Ku3EXrv" target="_blank" rel="noopener noreferrer" className="text-sm text-foreground hover:text-foreground hover:underline-thick transition-colors">Discord</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Legal</p>
              <ul className="mt-3 flex flex-col gap-2">
                <li><Link href="/terms" className="text-sm text-foreground hover:text-foreground hover:underline-thick transition-colors">Terms</Link></li>
                <li><Link href="/privacy" className="text-sm text-foreground hover:text-foreground hover:underline-thick transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-foreground/10 pt-8 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Thoughtbox. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
