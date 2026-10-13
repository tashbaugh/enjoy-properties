'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
        }
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

type Props = { onVerify: (token: string) => void };

/**
 * Renders a Turnstile widget and reports its token back to the caller.
 * The script tag itself loads once, site-wide, from app/layout.tsx
 * (strategy="afterInteractive") -- this just waits for window.turnstile
 * to exist rather than loading its own copy, since multiple forms on
 * one page would otherwise each inject the script.
 */
export default function Turnstile({ onVerify }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey || !containerRef.current) return;

    let pollId: ReturnType<typeof setInterval> | null = null;

    function render() {
      if (!containerRef.current || !window.turnstile || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey!,
        callback: onVerify,
        'expired-callback': () => onVerify(''),
        'error-callback': () => onVerify(''),
      });
    }

    if (window.turnstile) {
      render();
    } else {
      pollId = setInterval(() => {
        if (window.turnstile) {
          if (pollId) clearInterval(pollId);
          render();
        }
      }, 100);
    }

    return () => {
      if (pollId) clearInterval(pollId);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onVerify]);

  if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return null;

  return <div ref={containerRef} />;
}
