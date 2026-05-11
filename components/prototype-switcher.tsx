"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface PrototypeVariant {
  key: string;
  label: string;
}

interface PrototypeSwitcherProps {
  variants: PrototypeVariant[];
  current: string;
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    target.isContentEditable
  );
}

export function PrototypeSwitcher({
  variants,
  current,
}: PrototypeSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentIndex = Math.max(
    0,
    variants.findIndex((variant) => variant.key === current)
  );
  const currentVariant = variants[currentIndex] ?? variants[0];

  function go(offset: number) {
    const next =
      variants[(currentIndex + offset + variants.length) % variants.length];
    const params = new URLSearchParams(searchParams.toString());
    params.set("variant", next.key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        go(1);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
      <div className="flex items-center gap-2 rounded-full border border-gray-950 bg-gray-950 px-2 py-2 text-sm text-gray-50 shadow-2xl">
        <button
          type="button"
          onClick={() => go(-1)}
          className="grid h-9 w-9 place-items-center rounded-full bg-gray-800 text-base font-semibold hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-50"
          aria-label="Vorherige Variante"
        >
          &larr;
        </button>
        <div className="min-w-48 px-3 text-center tabular-nums">
          <span className="font-semibold">{currentVariant.key}</span>
          <span className="text-gray-300">: {currentVariant.label}</span>
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          className="grid h-9 w-9 place-items-center rounded-full bg-gray-800 text-base font-semibold hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-50"
          aria-label="Naechste Variante"
        >
          &rarr;
        </button>
      </div>
    </div>
  );
}
