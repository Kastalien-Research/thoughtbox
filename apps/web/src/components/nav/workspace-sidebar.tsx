'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem = {
  label: string
  href: string
  icon: React.ReactNode
}

function DashboardIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function RunsIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )
}

function KeyIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  )
}

function UsageIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function BillingIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function ObservabilityIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function KnowledgeIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="6" cy="6" r="2.25" strokeWidth={2} />
      <circle cx="18" cy="7" r="2.25" strokeWidth={2} />
      <circle cx="12" cy="17" r="2.25" strokeWidth={2} />
      <path strokeLinecap="round" strokeWidth={2} d="M7.4 8l3.4 6.9M16.8 9l-3.5 6M8.2 6.3l7.6.5" />
    </svg>
  )
}

function MergesIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="6" cy="5" r="2.25" strokeWidth={2} />
      <circle cx="6" cy="19" r="2.25" strokeWidth={2} />
      <circle cx="18" cy="12" r="2.25" strokeWidth={2} />
      <path strokeLinecap="round" strokeWidth={2} d="M6 7.5v9M7.9 6.2L15.8 11M7.9 17.8L15.8 13" />
    </svg>
  )
}

function RepoIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="7" cy="5" r="2.25" strokeWidth={2} />
      <circle cx="7" cy="12" r="2.25" strokeWidth={2} />
      <circle cx="7" cy="19" r="2.25" strokeWidth={2} />
      <path strokeLinecap="round" strokeWidth={2} d="M7 7.25v2.5M7 14.25v2.5M9 11l7-1.5a3 3 0 003-3V6" />
      <circle cx="19" cy="4.5" r="1.75" strokeWidth={2} />
    </svg>
  )
}

function PeersIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}

function ConnectIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  )
}

function DocsIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  )
}

export function WorkspaceSidebar({ workspaceSlug }: { workspaceSlug: string }) {
  const pathname = usePathname()
  const base = `/w/${workspaceSlug}`

  const mainNavItems: NavItem[] = [
    { label: 'Dashboard', href: `${base}/dashboard`, icon: <DashboardIcon /> },
    { label: 'Sessions', href: `${base}/sessions`, icon: <RunsIcon /> },
    { label: 'Knowledge', href: `${base}/knowledge`, icon: <KnowledgeIcon /> },
    { label: 'Merges', href: `${base}/merges`, icon: <MergesIcon /> },
    { label: 'Repo', href: `${base}/repo`, icon: <RepoIcon /> },
    { label: 'Peers', href: `${base}/peers`, icon: <PeersIcon /> },
    { label: 'Observability', href: `${base}/observability`, icon: <ObservabilityIcon /> },
    { label: 'API Keys', href: `${base}/api-keys`, icon: <KeyIcon /> },
  ]

  const accountNavItems: NavItem[] = [
    { label: 'Usage', href: `${base}/usage`, icon: <UsageIcon /> },
    { label: 'Billing', href: `${base}/billing`, icon: <BillingIcon /> },
    { label: 'Settings', href: `${base}/settings/workspace`, icon: <SettingsIcon /> },
  ]

  const bottomNavItems: NavItem[] = [
    { label: 'Connect', href: `${base}/connect`, icon: <ConnectIcon /> },
    { label: 'Quickstart', href: `${base}/docs/quickstart`, icon: <DocsIcon /> },
  ]

  function NavLink({ item }: { item: NavItem }) {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
    return (
      <Link
        href={item.href}
        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-background text-foreground'
            : 'text-foreground hover:bg-background/5 hover:text-foreground'
        }`}
      >
        {item.icon}
        {item.label}
      </Link>
    )
  }

  return (
    <aside className="flex h-full w-[var(--sidebar-width)] flex-col bg-background text-background">
      {/* Workspace header */}
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-background text-xs font-semibold text-background">
          {workspaceSlug.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-background capitalize">
            {workspaceSlug}
          </p>
          <p className="text-xs text-foreground">Workspace</p>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-0.5">
          {mainNavItems.map((item) => (
            <li key={item.href}>
              <NavLink item={item} />
            </li>
          ))}
        </ul>

        <p className="mt-6 mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-foreground">
          Account
        </p>
        <ul className="flex flex-col gap-0.5">
          {accountNavItems.map((item) => (
            <li key={item.href}>
              <NavLink item={item} />
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom nav */}
      <div className="border-t border-white/10 px-3 py-3">
        <ul className="flex flex-col gap-0.5">
          {bottomNavItems.map((item) => (
            <li key={item.href}>
              <NavLink item={item} />
            </li>
          ))}
        </ul>

        {/* Account link */}
        <Link
          href={`${base}/settings/account`}
          className="mt-2 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-background/5 hover:text-foreground transition-colors"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-background text-xs font-semibold text-background">
            U
          </span>
          <span className="flex-1 truncate">Account</span>
        </Link>
      </div>
    </aside>
  )
}
