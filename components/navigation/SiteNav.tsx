"use client";

import { useState, useEffect } from "react";
import { Button } from "@/ui/Button";
import { cn } from "@/lib/utils";
import { Menu, X, Compass, Calendar, User, LogIn, Sparkles } from "lucide-react";
import { NAV_LINKS } from "@/lib/data";
import { Popover } from "@/components/Popover";

const LINKS = NAV_LINKS.map((l) => l.href);

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
          <a href="/" className="flex items-center gap-2 group">
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
          </a>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {LINKS.map((href) => {
              const label = NAV_LINKS.find((l) => l.href === href)?.label ?? href;
              return (
                <a
                  key={href}
                  href={href}
                  className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  {label}
                </a>
              );
            })}
            <div className="ml-2 flex items-center gap-2">
              <Popover
                open={userMenuOpen}
                setOpen={setUserMenuOpen}
                side="bottom"
                align="end"
                content={
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Add to itinerary
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                      </svg>
                      Share
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m0 0l-3-3m3 3l3-3" />
                      </svg>
                      Report
                    </button>
                  </div>
                }
              >
                <Button variant="ghost" size="sm" leftIcon={<User />}>
                  Sign in
                </Button>
              </Popover>
              <Button
                variant="primary"
                leftIcon={<Sparkles />}
                className="bg-wonderlust-primary"
              >
                Get started
              </Button>
            </div>
          </nav>

          {/* Mobile controls */}
          <div className="flex items-center gap-2 lg:hidden">
            <Button variant="ghost" size="sm" onClick={() => setMobileOpen((o) => !o)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="sm" leftIcon={<User />}>
              Sign in
            </Button>
            <Button
              variant="primary"
              leftIcon={<Sparkles />}
              className="bg-wonderlust-primary"
            >
              Get started
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden">
          <div className="space-y-1 border-t border-border bg-white px-4 py-4">
            {LINKS.map((href) => {
              const label = NAV_LINKS.find((l) => l.href === href)?.label ?? href;
              return (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  <span className="h-4 w-4 rounded" />
                  {label}
                </a>
              );
            })}
            <div className="mt-3 flex gap-2">
              <Button variant="ghost" size="sm" className="flex-1">
                Sign in
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                leftIcon={<Sparkles />}
              >
                Get started
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
