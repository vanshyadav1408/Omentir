"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import LogoMark from "./logo-mark";
import { useHydrated } from "./use-hydrated";

const primaryNav = [
  { href: "/overview", label: "Overview", icon: "apps" },
  { href: "/agents", label: "AI Agents", icon: "model_training" },
  { href: "/messages", label: "Messages", icon: "inbox" },
  { href: "/leads", label: "Leads", icon: "identity_platform" },
];
const STORAGE_KEY = "omentir-sidebar-collapsed";

/* 32px row; outline icons. Selected + hover share a 6px charcoal plate. */
const navBase =
  "flex min-h-8 items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-normal transition-colors duration-150";
const navActive =
  "bg-[var(--md-sys-nav-item-active)] text-[var(--md-sys-color-on-surface)]";
const navIdle =
  "text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-nav-item-active)] hover:text-[var(--md-sys-color-on-surface)]";

const desktopNavBase =
  "flex min-h-8 items-center rounded-md py-1.5 text-[13px] font-normal transition-[background-color,color,padding,gap] duration-150";

const collapseBtnClass =
  "flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-0 text-[var(--md-sys-color-on-surface-variant)]";

function navClassName(active: boolean) {
  return `${navBase} ${active ? navActive : navIdle}`;
}

function desktopNavClassName(active: boolean, collapsed: boolean) {
  const layout = collapsed
    ? "h-8 w-8 shrink-0 justify-center gap-0 self-center overflow-hidden p-0"
    : "gap-2.5 px-2";
  return `${desktopNavBase} ${layout} ${active ? navActive : navIdle}`;
}

function NavIcon({ name }: { name: string }) {
  return (
    <span className="material-symbols-outlined ms-size-20 leading-none" aria-hidden="true">
      {name}
    </span>
  );
}

function isHrefActive(pathname: string, href: string) {
  if (href === "/overview") return pathname === "/overview";
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
      className={`min-w-0 translate-y-[0.5px] whitespace-nowrap transition-[max-width,opacity,transform] duration-300 ease-out ${collapsed
          ? "max-w-0 -translate-x-2 overflow-hidden opacity-0"
          : "max-w-40 opacity-100"
        }`}
    >
      {children}
    </span>
  );
}

function getPageTitle(pathname: string) {
  if (pathname === "/overview") return "Overview";
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

function itemHref(href: string, setupDone: boolean) {
  if (setupDone || href === "/overview") return href;
  return "/overview";
}

export default function Sidebar({
  localMode = false,
  showApi = false,
  setupDone = true,
}: {
  localMode?: boolean;
  /** Startup+ only. Hidden for Basic so the nav matches plan benefits. */
  showApi?: boolean;
  /** When false, top nav (except Overview) and API send the user back to setup. */
  setupDone?: boolean;
}) {
  const pathname = usePathname() ?? "";
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
    const href = itemHref(item.href, setupDone);
    const active = setupDone
      ? linkActive(item.href)
      : item.href === "/overview" && linkActive("/overview");
    return (
      <Link
        key={item.href}
        href={href}
        onClick={onClick}
        title={isCollapsed ? item.label : undefined}
        aria-current={active ? "page" : undefined}
        className={navClassName(active)}
      >
        <NavIcon name={item.icon} />
        <span>{item.label}</span>
      </Link>
    );
  };

  const productActive = linkActive("/my-product");
  const apiActive = setupDone && linkActive("/api-keys");
  const settingsActive = linkActive("/settings");
  const contactActive = linkActive("/contact");

  const bottomLinks = (onClick?: () => void) => (
    <>
      {!localMode && showApi ? (
        <Link
          href={itemHref("/api-keys", setupDone)}
          onClick={onClick}
          aria-current={apiActive ? "page" : undefined}
          className={`mb-0.5 ${navClassName(apiActive)}`}
        >
          <NavIcon name="key" />
          <span>API</span>
        </Link>
      ) : null}
      <Link
        href="/my-product"
        onClick={onClick}
        aria-current={productActive ? "page" : undefined}
        className={`mb-0.5 ${navClassName(productActive)}`}
      >
        <NavIcon name="package_2" />
        <span>My Product</span>
      </Link>
      <Link
        href="/settings"
        onClick={onClick}
        aria-current={settingsActive ? "page" : undefined}
        className={`mb-0.5 ${navClassName(settingsActive)}`}
      >
        <NavIcon name="settings" />
        <span>Settings</span>
      </Link>
      {!localMode ? (
        <Link
          href="/contact"
          onClick={onClick}
          aria-current={contactActive ? "page" : undefined}
          className={`mb-0.5 ${navClassName(contactActive)}`}
        >
          <NavIcon name="support_agent" />
          <span>Contact</span>
        </Link>
      ) : null}
    </>
  );

  return (
    <>
      {/* Mobile top app bar: 56px compact; no bottom border — surface contrast only */}
      <div className="fixed inset-x-0 top-0 z-[90] flex h-14 items-center bg-[var(--md-sys-color-surface)] px-2 md:hidden">
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
          <span className="text-[15px] font-medium leading-none tracking-tight text-[var(--md-sys-color-on-surface)]">
            {pageTitle}
          </span>
        </div>
      </div>

      {/* Mobile scrim — Pattern D: always mounted so exit can fade (300ms).
          When closed, CSS sets pointer-events:none + visibility:hidden so it
          cannot steal dashboard clicks (a prior bug when only opacity was 0). */}
      <div
        className={`m3-drawer-scrim fixed inset-0 z-[95] bg-black/40 md:hidden ${
          mobileOpen ? "m3-drawer-scrim--open" : "m3-drawer-scrim--closed"
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden={!mobileOpen}
        inert={!mobileOpen ? true : undefined}
      />

      {/* Mobile modal drawer */}
      <aside
        className={`m3-drawer fixed inset-y-0 left-0 z-[100] flex w-[80%] max-w-[320px] flex-col bg-[var(--md-sys-color-surface)] md:hidden ${
          mobileOpen ? "m3-drawer--open" : "m3-drawer--closed"
        }`}
        aria-hidden={!mobileOpen}
        inert={!mobileOpen ? true : undefined}
      >
        <div className="flex h-12 shrink-0 items-center px-2">
          <Link
            href="/overview"
            onClick={() => setMobileOpen(false)}
            className="flex min-w-0 flex-1 items-center gap-2.5 px-2 text-[13px] font-medium text-[var(--md-sys-color-on-surface)]"
          >
            <LogoMark className="h-5 w-5 shrink-0" />
            <span className="select-none">Omentir</span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className={collapseBtnClass}
          >
            <span className="material-symbols-outlined ms-size-20" aria-hidden="true">
              chevron_left
            </span>
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-3 pt-1">
          {primaryNav.map((item) => renderNavLink(item, () => setMobileOpen(false)))}
        </nav>

        <div className="shrink-0 px-2 pb-3 pt-2">
          {bottomLinks(() => setMobileOpen(false))}
        </div>
      </aside>

      {/* Desktop sidebar - collapsible; no edge border — surface contrast only */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden bg-[var(--md-sys-color-surface)] transition-[width] duration-300 ease-[cubic-bezier(0.2,0,0,1)] md:flex ${isCollapsed ? "w-[3.25rem]" : "w-48"
          }`}
      >
        <div
          className={`flex h-12 shrink-0 items-center ${
            isCollapsed ? "justify-center px-1.5" : "px-2"
          }`}
        >
          {isCollapsed ? null : (
            <Link
              href="/overview"
              className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden px-2 text-[13px] font-medium text-[var(--md-sys-color-on-surface)]"
            >
              <LogoMark className="h-5 w-5 shrink-0" />
              <span className="select-none whitespace-nowrap">Omentir</span>
            </Link>
          )}
          <button
            type="button"
            onClick={toggle}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`${collapseBtnClass} transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)] ${
              isCollapsed ? "rotate-180" : "rotate-0"
            }`}
          >
            <span className="material-symbols-outlined ms-size-20" aria-hidden="true">
              chevron_left
            </span>
          </button>
        </div>

        <nav
          className={`flex flex-1 flex-col gap-0.5 overflow-y-auto pb-3 pt-1 transition-[padding] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${isCollapsed ? "px-1.5" : "px-2"
            }`}
        >
          {primaryNav.map((item) => {
            const href = itemHref(item.href, setupDone);
            const active = setupDone
              ? linkActive(item.href)
              : item.href === "/overview" && linkActive("/overview");
            return (
              <Link
                key={item.href}
                href={href}
                title={isCollapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={desktopNavClassName(active, isCollapsed)}
              >
                <NavIcon name={item.icon} />
                <SidebarLabel collapsed={isCollapsed}>{item.label}</SidebarLabel>
              </Link>
            );
          })}
        </nav>

        <div
          className={`shrink-0 pb-3 pt-1 transition-[padding] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${isCollapsed ? "px-1.5" : "px-2"
            }`}
        >
          {!localMode && showApi ? (
            <Link
              href={itemHref("/api-keys", setupDone)}
              title={isCollapsed ? "API" : undefined}
              aria-current={apiActive ? "page" : undefined}
              className={`mb-0.5 ${desktopNavClassName(apiActive, isCollapsed)}`}
            >
              <NavIcon name="key" />
              <SidebarLabel collapsed={isCollapsed}>API</SidebarLabel>
            </Link>
          ) : null}
          <Link
            href="/my-product"
            title={isCollapsed ? "My Product" : undefined}
            aria-current={productActive ? "page" : undefined}
            className={`mb-0.5 ${desktopNavClassName(productActive, isCollapsed)}`}
          >
            <NavIcon name="package_2" />
            <SidebarLabel collapsed={isCollapsed}>My Product</SidebarLabel>
          </Link>
          <Link
            href="/settings"
            title={isCollapsed ? "Settings" : undefined}
            aria-current={settingsActive ? "page" : undefined}
            className={`mb-0.5 ${desktopNavClassName(settingsActive, isCollapsed)}`}
          >
            <NavIcon name="settings" />
            <SidebarLabel collapsed={isCollapsed}>Settings</SidebarLabel>
          </Link>
          {!localMode ? (
            <Link
              href="/contact"
              title={isCollapsed ? "Contact" : undefined}
              aria-current={contactActive ? "page" : undefined}
              className={`mb-0.5 ${desktopNavClassName(contactActive, isCollapsed)}`}
            >
              <NavIcon name="support_agent" />
              <SidebarLabel collapsed={isCollapsed}>Contact</SidebarLabel>
            </Link>
          ) : null}
        </div>
      </aside>
    </>
  );
}
