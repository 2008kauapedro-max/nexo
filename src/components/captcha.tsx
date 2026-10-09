"use client";
import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useLocale, useTranslations } from "next-intl";

type Turnstile = {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  remove(id: string): void;
  reset(id: string): void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

export function Captcha({ resetKey }: { resetKey: object }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const locale = useLocale();
  const t = useTranslations("security");
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!siteKey || !ready || !container.current || !window.turnstile) return;
    widget.current = window.turnstile.render(container.current, {
      sitekey: siteKey,
      size: "flexible",
      language:
        locale === "pt-BR"
          ? "pt-br"
          : locale === "en-US"
            ? "en"
            : locale === "zh-CN"
              ? "zh-cn"
              : locale,
      "response-field-name": "captchaToken",
      "error-callback": () => setFailed(true),
      callback: () => setFailed(false),
    });
    return () => {
      if (widget.current !== undefined)
        window.turnstile?.remove(widget.current);
      widget.current = undefined;
    };
  }, [siteKey, ready, locale]);
  useEffect(() => {
    if (widget.current !== undefined) window.turnstile?.reset(widget.current);
  }, [resetKey]);
  if (!siteKey) return null;
  return (
    <div>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onReady={() => setReady(true)}
        onError={() => setFailed(true)}
      />
      <div ref={container} aria-label={t("captcha")} />
      {failed && (
        <p role="alert" className="notice error">
          {t("captchaError")}
        </p>
      )}
    </div>
  );
}
