import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const origin = process.env.PERF_BASE_URL || "https://nexo-six-beta.vercel.app";
if (
  !["https://nexo-six-beta.vercel.app", "http://localhost:3000"].includes(
    origin,
  )
)
  throw new Error("NEXO only");
const user = JSON.parse(readFileSync(".local/qa-users.json", "utf8"))[1];
const browser = await chromium.launch();
const results = [];
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext({
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1440, height: 1000 },
      locale: "pt-BR",
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    if (mobile) {
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      await cdp.send("Network.enable");
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 100,
        downloadThroughput: 200000,
        uploadThroughput: 100000,
      });
    }
    await page.addInitScript(() => {
      window.__metrics = {
        lcp: 0,
        cls: 0,
        longestTask: 0,
        longestInteraction: 0,
      };
      for (const type of [
        "largest-contentful-paint",
        "layout-shift",
        "longtask",
        "event",
      ]) {
        try {
          new PerformanceObserver((list) => {
            for (const e of list.getEntries()) {
              if (type === "largest-contentful-paint")
                window.__metrics.lcp = e.startTime;
              if (type === "layout-shift" && !e.hadRecentInput)
                window.__metrics.cls += e.value;
              if (type === "longtask")
                window.__metrics.longestTask = Math.max(
                  window.__metrics.longestTask,
                  e.duration,
                );
              if (type === "event" && e.interactionId)
                window.__metrics.longestInteraction = Math.max(
                  window.__metrics.longestInteraction,
                  e.duration,
                );
            }
          }).observe({ type, buffered: true, durationThreshold: 16 });
        } catch {}
      }
    });
    for (const path of ["/", "/entrar"]) {
      await page.goto(origin + path);
      await page.waitForLoadState("networkidle");
      results.push(await measure(page, path, mobile));
    }
    await page.getByLabel("E-mail", { exact: true }).fill(user.email);
    await page.getByLabel("Senha", { exact: true }).fill(user.password);
    const loginStart = Date.now();
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.waitForURL("**/inicio");
    await page.locator("h1").waitFor();
    results.push({
      mobile,
      action: "login",
      elapsedMs: Date.now() - loginStart,
    });
    for (const path of ["/estudar", "/simulados", "/perfil", "/inicio"]) {
      const start = Date.now();
      await page.locator(`nav:visible a[href="${path}"]`).first().click();
      await page.waitForURL("**" + path);
      await page.locator("h1").waitFor();
      await page.waitForLoadState("networkidle");
      results.push({
        ...(await measure(page, path, mobile)),
        navigationMsIncludingIdle: Date.now() - start,
      });
    }
    await context.close();
  }
} finally {
  await browser.close();
}
mkdirSync(".local/evidence", { recursive: true });
const file = `.local/evidence/performance-${process.env.PERF_LABEL || "baseline"}.json`;
writeFileSync(
  file,
  JSON.stringify(
    {
      origin,
      capturedAt: new Date().toISOString(),
      note: "Lab samples, not field INP. Navigation includes networkidle (500 ms). Mobile: 4x CPU, 100ms RTT, 1.6Mbps.",
      results,
    },
    null,
    2,
  ),
);
console.log(JSON.stringify(results, null, 2));
async function measure(page, path, mobile) {
  return page.evaluate(
    ({ path, mobile }) => {
      const nav = performance.getEntriesByType("navigation")[0];
      const resources = performance.getEntriesByType("resource");
      return {
        path,
        mobile,
        ...window.__metrics,
        documentTtfbMs: nav.responseStart - nav.requestStart,
        scriptsBytes: resources
          .filter((r) => r.initiatorType === "script")
          .reduce((n, r) => n + r.transferSize, 0),
        requests: resources.length,
        slowest: resources
          .filter((r) => ["fetch", "xmlhttprequest"].includes(r.initiatorType))
          .sort((a, b) => b.duration - a.duration)
          .slice(0, 5)
          .map((r) => ({
            path: new URL(r.name).pathname,
            durationMs: r.duration,
          })),
      };
    },
    { path, mobile },
  );
}
