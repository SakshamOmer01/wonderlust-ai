"use client";

import {
  forwardRef,
  type ReactNode,
  useRef,
  useEffect,
  useCallback,
  useState,
} from "react";
import { cn } from "@/lib/utils";

interface PopoverProps {
  open?: boolean;
  setOpen?: (open: boolean) => void;
  children: ReactNode;
  content: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
}

export const Popover = forwardRef<HTMLDivElement, PopoverProps>(
  ({ open, setOpen, children, content, side = "bottom", align = "center" }, ref) => {
    const [internalOpen, setInternalOpen] = useState(!!open);
    const isControlled = open !== undefined;
    const triggerRef = useRef<HTMLButtonElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const popoverOpen = isControlled ? open : internalOpen;

    useEffect(() => {
      if (isControlled) setInternalOpen(open ?? false);
      else if (open === undefined) setInternalOpen(true);
    }, [open, isControlled]);

    const handleTriggerClick = useCallback(() => {
      const next = !popoverOpen;
      setInternalOpen(next);
      if (setOpen) setOpen(next);
    }, [popoverOpen, setOpen]);

    const handleContentClick = useCallback(() => {
      if (setOpen) setOpen(true);
    }, [setOpen]);

    const handleClose = useCallback(() => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = setTimeout(() => {
        setInternalOpen(false);
        if (setOpen) setOpen(false);
      }, 250);
    }, [setOpen]);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (contentRef.current?.contains(e.target as Node)) return;
      handleClose();
    };

    useEffect(() => {
      if (!popoverOpen) return;
      document.addEventListener(
        "pointerdown",
        (e: PointerEvent) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          handlePointerDown(e as any);
        }
      );
      return () => {
        document.removeEventListener("pointerdown", (e: PointerEvent) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          handlePointerDown(e as any);
        });
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      };
    }, [popoverOpen, handlePointerDown]);

    const sideClasses = {
      top: "bottom-full left-0 right-0",
      bottom: "top-full left-0 right-0",
      left: "right-full top-0",
      right: "left-full top-0",
    };

    const alignClasses: Record<NonNullable<PopoverProps["align"]>, string> = {
      start: "",
      center: "margin-left-1/2 -translate-x-1/2",
      end: "margin-left-auto margin-right-1/2 -translate-x-1/2",
    };

    return (
      <div className="relative" ref={ref}>
        <button
          ref={triggerRef}
          type="button"
          onClick={handleTriggerClick}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          aria-expanded={popoverOpen}
          aria-haspopup="menu"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          More
        </button>

        {popoverOpen && (
          <div
            ref={contentRef}
            className={cn(
              "absolute z-50 w-48 rounded-xl border border-border bg-white p-2 shadow-xl animate-[fadeIn_0.2s_ease-out]",
              sideClasses[side],
              alignClasses[align]
            )}
            onPointerDown={handlePointerDown}
          >
            <div className="border-b border-border pb-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Quick actions
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                handleClose();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add to itinerary
            </button>
            <button
              type="button"
              onClick={() => {
                handleClose();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
              </svg>
              Share
            </button>
            <button
              type="button"
              onClick={() => {
                handleClose();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m0 0l-3-3m3 3l3-3" />
              </svg>
              Report
            </button>
          </div>
        )}
      </div>
    );
  }
);

Popover.displayName = "Popover";
