"use client";

import { useEffect } from "react";

export function useKeyboardInset() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    function apply() {
      const view = window.visualViewport;
      if (!view) return;
      const inset = Math.max(0, window.innerHeight - view.height - view.offsetTop);
      document.documentElement.style.setProperty("--keyboard-inset", `${Math.round(inset)}px`);
    }

    apply();
    viewport.addEventListener("resize", apply);
    viewport.addEventListener("scroll", apply);
    window.addEventListener("orientationchange", apply);
    return () => {
      viewport.removeEventListener("resize", apply);
      viewport.removeEventListener("scroll", apply);
      window.removeEventListener("orientationchange", apply);
      document.documentElement.style.setProperty("--keyboard-inset", "0px");
    };
  }, []);
}

export function revealRating(coffeeId: string) {
  window.setTimeout(() => {
    document.getElementById(`rating-${coffeeId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 350);
}
