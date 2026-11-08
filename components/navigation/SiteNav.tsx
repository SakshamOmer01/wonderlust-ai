"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/ui/Button";
import { cn } from "@/lib/utils";
import { Menu, X, Compass, User, Sparkles, LayoutDashboard, Bookmark, LogOut, Settings } from "lucide-react";
import { NAV_LINKS } from "@/lib/data";
import { Popover } from "@/components/Popover";

export type NavUser = {
  id: string;
  email: string;
  name: string | null;
  avatar?: string | null;
};

/**
 * Primary site navigation.
 *
 * `user` is the server-rendered user (if the page already knows it). When it is
 * absent the component falls back to the client-side `useSession()` result, so
 * signed-in state is always accurate without forcing every page to be dynamic.
 */
export function SiteNav({ user }: { user: NavUser | null }) {
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const currentUser: NavUser | null =
    user ??
    (session?.user
      ? {
          id: session.user.id,
          email: session.user.email ?? "",
          name: session.user.name ?? null,
          avatar: session.user.image ?? null,
        }
      : null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const greeting = currentUser?.name
    ? `Hi, ${currentUser.name.split(" ")[0]}`
    : currentUser?.email
      ? `Hi, ${currentUser.email.split("@")[0]}`
      : "Account";

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
        scrolled || mobileOpen
          ? "bg-white/90 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-wonderlust-primary text-white transition-transform duration-200 group-hover:scale-110">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Wonderlust
              </span>
              <span className="hidden sm:block text-xs text-slate-400 font-medium">
                {" "}
                · Travel
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                {label}
              </a>
            ))}

            <div className="ml-2 flex items-center gap-2">
              {currentUser ? (
                <Popover
                  open={userMenuOpen}
                  setOpen={setUserMenuOpen}
                  side="bottom"
                  align="end"
                  content={
                    <div className="flex flex-col gap-1">
                      <div className="border-b border-slate-100 px-2 pb-2">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {greeting}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {currentUser.email}
                        </p>
                      </div>
                      <a
                        href="/dashboard"
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </a>
                      <a
                        href="/trips"
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                      >
                        <Compass className="h-4 w-4" />
                        My trips
                      </a>
                      <a
                        href="/dashboard#saved"
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                      >
                        <Bookmark className="h-4 w-4" />
                        Saved destinations
                      </a>
                      <a
                        href="/dashboard/settings"
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          void signOut({ callbackUrl: "/" });
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  }
                >
                  <Button variant="ghost" size="sm" aria-label="Account menu">
                    <User className="h-4 w-4" />
                  </Button>
                </Popover>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <a href="/login">Sign in</a>
                  </Button>
                  <Button variant="primary" size="sm" asChild>
                    <a href="/register">
                      <Sparkles className="h-4 w-4" />
                      Get started
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </nav>

          {/* Mobile controls */}
          <div className="flex items-center gap-2 lg:hidden">
            {!currentUser && (
              <Button variant="ghost" size="sm" asChild>
                <a href="/login">Sign in</a>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              aria-label="Toggle navigation"
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden">
          <div className="space-y-1 border-t border-border bg-white px-4 py-4">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {label}
              </a>
            ))}

            <div className="mt-3 flex gap-2">
              {currentUser ? (
                <>
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <a href="/dashboard" onClick={() => setMobileOpen(false)}>
                      Dashboard
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <a href="/dashboard/settings" onClick={() => setMobileOpen(false)}>
                      Settings
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setMobileOpen(false);
                      void signOut({ callbackUrl: "/" });
                    }}
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="flex-1" asChild>
                    <a href="/login">Sign in</a>
                  </Button>
                  <Button variant="primary" size="sm" className="flex-1" asChild>
                    <a href="/register">
                      <Sparkles className="h-4 w-4" />
                      Get started
                    </a>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
