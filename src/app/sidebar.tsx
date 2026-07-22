"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LogoMark from "./logo-mark";
import { useHydrated } from "./use-hydrated";

const primaryNav = [
  { href: "/dashboard", label: "Dashboard", icon: "apps" },
  { href: "/actions", label: "Actions", icon: "event_upcoming" },
  { href: "/agents", label: "AI Agents", icon: "model_training" },
  { href: "/messages", label: "Messages", icon: "inbox" },
  { href: "/leads", label: "Leads", icon: "identity_platform" },
];
const sidebarPrefetchHrefs = [
  ...primaryNav.map((item) => item.href),
  "/api-keys",
  "/my-product",
  "/settings",
  "/contact",
];

const STORAGE_KEY = "omentir-sidebar-collapsed";

/* 48px touch target; 24px icons. Active = primary-container (T90) + on-primary-container (T10). */
const navBase =
  "flex min-h-12 items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-[background-color,color] duration-200 ease-[cubic-bezier(0.2,0,0,1)]";
const navActive =
  "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]";
const navIdle =
  "text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-state-hover)] hover:text-[var(--md-sys-color-on-surface)]";

const desktopNavBase =
  "flex min-h-12 items-center rounded-full py-2 text-sm font-medium transition-[background-color,color,padding,gap] duration-200 ease-[cubic-bezier(0.2,0,0,1)]";

function navClassName(active: boolean) {
  return `${navBase} ${active ? navActive : navIdle}`;
}

function desktopNavClassName(active: boolean, collapsed: boolean, compactPx = false) {
  const layout = collapsed
    ? compactPx
      ? "justify-center gap-0 px-2"
      : "justify-center gap-0 px-2"
    : "gap-3 px-3";
  return `${desktopNavBase} ${layout} ${active ? navActive : navIdle}`;
}

function NavIcon({ name, active }: { name: string; active: boolean }) {
  return (
    <span
      className={`material-symbols-outlined leading-none ${active ? "ms-filled" : ""}`}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

function isHrefActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

function SidebarLabel({
  collapsed,
  children,
}: {
  collapsed: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`min-w-0 translate-y-[1px] whitespace-nowrap transition-[max-width,opacity,transform] duration-300 ease-out ${collapsed
          ? "max-w-0 -translate-x-2 overflow-hidden opacity-0"
          : "max-w-40 opacity-100"
        }`}
    >
      {children}
    </span>
  );
}

function getPageTitle(pathname: string) {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname.startsWith("/actions")) return "Actions";
  if (pathname.startsWith("/agents/new")) return "New Agent";
  if (pathname.startsWith("/agents")) return "AI Agents";
  if (pathname.startsWith("/messages")) return "Messages";
  if (pathname.startsWith("/leads")) return "Leads";
  if (pathname.startsWith("/my-product")) return "My Product";
  if (pathname.startsWith("/api-keys")) return "API";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/contact")) return "Contact";
  if (pathname.startsWith("/connect")) return "Connect";
  if (pathname.startsWith("/onboarding")) return "Get Started";
  if (pathname.startsWith("/upgrade")) return "Upgrade";
  return "Omentir";
}

export default function Sidebar({ localMode = false }: { localMode?: boolean }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const hydrated = useHydrated();
  // Gate pathname-derived title behind `hydrated` like the active styles below:
  // the shell prerenders without the real pathname, so deriving the title before
  // mount makes SSR ("Omentir") and the hydrated title (e.g. "Actions") disagree.
  const pageTitle = getPageTitle(hydrated ? pathname : "");
  const isCollapsed = hydrated && collapsed;

  // After hydration: restore collapse from localStorage. useEffect (not
  // useLayoutEffect) so we never re-render during the streaming resume pass.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      sidebarPrefetchHrefs
        .filter((href) => !localMode || (href !== "/api-keys" && href !== "/contact"))
        .forEach((href) => router.prefetch(href));
    });
    return () => cancelAnimationFrame(frame);
  }, [localMode, router]);

  // Close mobile sidebar on route change.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMobileOpen(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  };

  const openMobileMenu = () => setMobileOpen(true);

  // Active highlight only after hydration so server HTML and client props match.
  const linkActive = (href: string) => hydrated && isHrefActive(pathname, href);

  const renderNavLink = (item: (typeof primaryNav)[number], onClick?: () => void) => {
    const active = linkActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClick}
        title={isCollapsed ? item.label : undefined}
        aria-current={active ? "page" : undefined}
        className={navClassName(active)}
      >
        <NavIcon name={item.icon} active={active} />
        <span className="translate-y-[1px]">{item.label}</span>
      </Link>
    );
  };

  const productActive = linkActive("/my-product");
  const apiActive = linkActive("/api-keys");
  const settingsActive = linkActive("/settings");
  const contactActive = linkActive("/contact");

  const bottomLinks = (onClick?: () => void) => (
    <>
      {!localMode ? (
        <Link
          href="/api-keys"
          onClick={onClick}
          aria-current={apiActive ? "page" : undefined}
          className={`mb-1 ${navClassName(apiActive)}`}
        >
          <NavIcon name="key" active={apiActive} />
          <span className="translate-y-[1px]">API</span>
        </Link>
      ) : null}
      <Link
        href="/my-product"
        onClick={onClick}
        aria-current={productActive ? "page" : undefined}
        className={`mb-1 ${navClassName(productActive)}`}
      >
        <NavIcon name="package_2" active={productActive} />
        <span className="translate-y-[1px]">My Product</span>
      </Link>
      <Link
        href="/settings"
        onClick={onClick}
        aria-current={settingsActive ? "page" : undefined}
        className={`mb-1 ${navClassName(settingsActive)}`}
      >
        <NavIcon name="settings" active={settingsActive} />
        <span className="translate-y-[1px]">Settings</span>
      </Link>
      {!localMode ? (
        <Link
          href="/contact"
          onClick={onClick}
          aria-current={contactActive ? "page" : undefined}
          className={`mb-1 ${navClassName(contactActive)}`}
        >
          <NavIcon name="support_agent" active={contactActive} />
          <span className="translate-y-[1px]">Contact</span>
        </Link>
      ) : null}
    </>
  );

  return (
    <>
      {/* Mobile top app bar: 56px compact; no bottom border — surface contrast only */}
      <div className="fixed inset-x-0 top-0 z-[90] flex h-14 items-center bg-[var(--md-sys-color-surface-container)] px-2 md:hidden">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={openMobileMenu}
            aria-expanded={mobileOpen}
            aria-label="Open menu"
            className="ms-icon-button shrink-0 touch-manipulation text-[var(--md-sys-color-on-surface)]"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              menu
            </span>
          </button>
          <span className="text-[22px] font-medium leading-none tracking-tight text-[var(--md-sys-color-on-surface)]">
            {pageTitle}
          </span>
        </div>
      </div>

      {/* Mobile scrim — Pattern D: always mounted so exit can fade (300ms) */}
      <div
        className={`m3-drawer-scrim fixed inset-0 z-[95] bg-black/40 md:hidden ${
          mobileOpen ? "m3-drawer-scrim--open" : "m3-drawer-scrim--closed"
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden={!mobileOpen}
      />

      {/* Mobile modal drawer: 80% width, 28px rounded leading edge */}
      <aside
        className={`m3-drawer fixed inset-y-0 left-0 z-[100] flex w-[80%] max-w-[360px] flex-col rounded-r-[28px] bg-[var(--md-sys-color-surface-container)] shadow-[var(--md-sys-elevation-3)] md:hidden ${
          mobileOpen ? "m3-drawer--open" : "m3-drawer--closed"
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className="flex h-14 shrink-0 items-center justify-between px-4">
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 text-[22px] font-medium text-[var(--md-sys-color-on-surface)]"
          >
            <LogoMark className="h-8 w-8" />
            <span className="select-none">Omentir</span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="ms-icon-button cursor-pointer rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-state-hover)]"
          >
            <span className="material-symbols-outlined ms-size-20" aria-hidden="true">
              chevron_left
            </span>
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4 pt-2">
          {primaryNav.map((item) => renderNavLink(item, () => setMobileOpen(false)))}
        </nav>

        {/* Secondary nav: 12px nest indent vs primary list */}
        <div className="shrink-0 px-3 pb-4 pl-6 pt-3">
          {bottomLinks(() => setMobileOpen(false))}
        </div>
      </aside>

      {/* Desktop sidebar - collapsible; no edge border — surface contrast only */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden bg-[var(--md-sys-color-surface-container)] transition-[width] duration-300 ease-[cubic-bezier(0.2,0,0,1)] md:flex ${isCollapsed ? "w-16" : "w-60"
          }`}
      >
        <div
          className={`relative flex h-16 shrink-0 items-center transition-[padding] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${isCollapsed ? "justify-center px-2" : "px-4"
            }`}
        >
          <Link
            href="/dashboard"
            className={`flex min-w-0 items-center gap-2 overflow-hidden text-[22px] font-medium text-[var(--md-sys-color-on-surface)] transition-[opacity,width] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${isCollapsed ? "pointer-events-none w-0 opacity-0" : "w-full opacity-100"
              }`}
          >
            <LogoMark className="h-8 w-8" />
            <span className="select-none whitespace-nowrap">Omentir</span>
          </Link>
          <button
            type="button"
            onClick={toggle}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`ms-icon-button shrink-0 cursor-pointer rounded-full text-[var(--md-sys-color-on-surface-variant)] transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)] hover:bg-[var(--md-sys-state-hover)] hover:text-[var(--md-sys-color-on-surface)] ${
              isCollapsed ? "rotate-180" : "rotate-0"
            }`}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              chevron_left
            </span>
          </button>
        </div>

        <nav
          className={`flex flex-1 flex-col gap-1 overflow-y-auto pb-4 pt-2 transition-[padding] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${isCollapsed ? "px-2" : "px-3"
            }`}
        >
          {primaryNav.map((item) => {
            const active = linkActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={desktopNavClassName(active, isCollapsed)}
              >
                <NavIcon name={item.icon} active={active} />
                <SidebarLabel collapsed={isCollapsed}>{item.label}</SidebarLabel>
              </Link>
            );
          })}
        </nav>

        <div
          className={`shrink-0 pb-4 pt-2 transition-[padding] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${isCollapsed ? "px-2" : "px-3 pl-6"
            }`}
        >
          {!localMode ? (
            <Link
              href="/api-keys"
              title={isCollapsed ? "API" : undefined}
              aria-current={apiActive ? "page" : undefined}
              className={`mb-1 ${desktopNavClassName(apiActive, isCollapsed, true)}`}
            >
              <NavIcon name="key" active={apiActive} />
              <SidebarLabel collapsed={isCollapsed}>API</SidebarLabel>
            </Link>
          ) : null}
          <Link
            href="/my-product"
            title={isCollapsed ? "My Product" : undefined}
            aria-current={productActive ? "page" : undefined}
            className={`mb-1 ${desktopNavClassName(productActive, isCollapsed, true)}`}
          >
            <NavIcon name="package_2" active={productActive} />
            <SidebarLabel collapsed={isCollapsed}>My Product</SidebarLabel>
          </Link>
          <Link
            href="/settings"
            title={isCollapsed ? "Settings" : undefined}
            aria-current={settingsActive ? "page" : undefined}
            className={`mb-1 ${desktopNavClassName(settingsActive, isCollapsed, true)}`}
          >
            <NavIcon name="settings" active={settingsActive} />
            <SidebarLabel collapsed={isCollapsed}>Settings</SidebarLabel>
          </Link>
          {!localMode ? (
            <Link
              href="/contact"
              title={isCollapsed ? "Contact" : undefined}
              aria-current={contactActive ? "page" : undefined}
              className={`mb-1 ${desktopNavClassName(contactActive, isCollapsed, true)}`}
            >
              <NavIcon name="support_agent" active={contactActive} />
              <SidebarLabel collapsed={isCollapsed}>Contact</SidebarLabel>
            </Link>
          ) : null}
        </div>
      </aside>
    </>
  );
}
