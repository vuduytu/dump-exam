import { expect, test } from "@playwright/test";
import { login } from "./helpers";

// Manual: `SHOTS=01 npm run e2e -- screenshots` writes .scratch/ui-refresh/screenshots/<SHOTS>-*.png (ticket number as prefix).
const prefix = process.env.SHOTS;
const sizes = { mobile: { width: 390, height: 844 }, desktop: { width: 1280, height: 800 } };

test.describe("screenshots", () => {
  test.skip(!prefix || prefix === "03" || prefix === "04" || prefix === "dp03" || prefix === "dp04", "set SHOTS=<ticket number>");
  test.describe.configure({ mode: "serial" });
  for (const [name, viewport] of Object.entries(sizes)) {
    test(name, async ({ browser }) => {
      for (const scheme of name === "desktop" ? (["light", "dark"] as const) : (["light"] as const)) {
        const page = await (await browser.newContext({ viewport, colorScheme: scheme })).newPage();
        const shot = (what: string) => page.screenshot({ path: `.scratch/ui-refresh/screenshots/${prefix}-${name}-${what}${scheme === "dark" ? "-dark" : ""}.png` });
        await login(page);
        await shot("home");
        await page.getByRole("link", { name: /câu/ }).first().click();
        await page.waitForURL(/\/exams\/\d+/);
        await shot("exam");
        await page.getByRole("button", { name: "Bắt đầu luyện tập" }).click();
        await page.waitForURL(/\/attempts\/\d+/);
        await page.getByRole("radio").or(page.getByRole("checkbox")).first().check();
        await page.goBack();
        await page.getByRole("link", { name: "Làm tiếp" }).waitFor();
        await shot("exam-open");
        await page.getByRole("button", { name: "Bỏ, làm lại" }).click();
        await page.getByRole("dialog").waitFor();
        await shot("abandon-dialog");
        await page.getByRole("dialog").getByRole("button", { name: "Huỷ" }).click();
        await page.getByRole("link", { name: "Làm tiếp" }).click();
        await page.waitForURL(/\/attempts\/\d+/);
        await shot("attempt");
        await page.getByRole("button", { name: "Nộp bài" }).click();
        await page.getByRole("dialog").getByRole("button", { name: "Nộp bài" }).click();
        await page.getByText(/^Điểm: \d+\/180/).filter({ visible: true }).first().waitFor();
        await page.goto("/");
        await shot("home-after");
        await page.getByRole("link", { name: /câu/ }).first().click();
        await page.getByText("Đã nộp").waitFor();
        await shot("exam-history");
        await page.context().close();
      }
    });
  }
});

// SHOTS=03: the Attempt screen. Practice on desktop (light + dark), a Timed Attempt on desktop and mobile (drawer closed/open).
test.describe("screenshots 03", () => {
  test.skip(prefix !== "03", "set SHOTS=03");
  test.describe.configure({ mode: "serial" });
  const runs = [
    { name: "desktop", viewport: sizes.desktop, scheme: "light", timed: false },
    { name: "desktop-dark", viewport: sizes.desktop, scheme: "dark", timed: false },
    { name: "desktop-timed", viewport: sizes.desktop, scheme: "light", timed: true },
    { name: "mobile", viewport: sizes.mobile, scheme: "light", timed: true },
  ] as const;
  for (const run of runs) {
    test(run.name, async ({ browser }) => {
      const page = await (await browser.newContext({ viewport: run.viewport, colorScheme: run.scheme })).newPage();
      const shot = (what = "") => page.screenshot({ path: `.scratch/ui-refresh/screenshots/03-${run.name}${what}.png` });
      await login(page);
      await page.getByRole("link", { name: /câu/ }).first().click();
      await page.getByRole("button", { name: run.timed ? "Bắt đầu thi thử" : "Bắt đầu luyện tập" }).click();
      await page.waitForURL(/\/attempts\/\d+/);
      await page.waitForLoadState("networkidle"); // hydrated: shortcuts are live
      for (const key of ["a", "ArrowRight", "b", "m", "ArrowRight", "ArrowRight", "c", "ArrowLeft"]) await page.keyboard.press(key);
      await page.getByRole("status").filter({ hasText: "Đã lưu" }).waitFor();
      await shot();
      if (run.name === "mobile") {
        await page.getByRole("button", { name: "Lưới câu" }).click();
        await page.getByRole("dialog").waitFor();
        await page.waitForTimeout(300); // slide-in animation
        await shot("-drawer");
      }
      await page.getByRole("button", { name: "Nộp bài" }).filter({ visible: true }).first().click();
      await page.getByRole("dialog").getByRole("button", { name: "Nộp bài" }).click();
      await page.getByText(/^Điểm: \d+\/180/).filter({ visible: true }).first().waitFor();
      await page.context().close();
    });
  }
});

// SHOTS=04: the Result. Desktop light + dark, tab Sai, mobile and its grid drawer.
test.describe("screenshots 04", () => {
  test.skip(prefix !== "04", "set SHOTS=04");
  test.describe.configure({ mode: "serial" });
  const runs = [
    { name: "desktop", viewport: sizes.desktop, scheme: "light" },
    { name: "desktop-dark", viewport: sizes.desktop, scheme: "dark" },
    { name: "mobile", viewport: sizes.mobile, scheme: "light" },
  ] as const;
  for (const run of runs) {
    test(run.name, async ({ browser }) => {
      const page = await (await browser.newContext({ viewport: run.viewport, colorScheme: run.scheme })).newPage();
      const shot = (what = "") => page.screenshot({ path: `.scratch/ui-refresh/screenshots/04-${run.name}${what}.png` });
      await login(page);
      await page.getByRole("link", { name: /câu/ }).first().click();
      await page.getByRole("button", { name: "Bắt đầu luyện tập" }).click();
      await page.waitForURL(/\/attempts\/\d+/);
      await page.waitForLoadState("networkidle");
      for (const key of ["a", "ArrowRight", "b", "m", "ArrowRight", "ArrowRight", "c"]) await page.keyboard.press(key);
      await page.getByRole("status").filter({ hasText: "Đã lưu" }).waitFor();
      if (run.name === "mobile") await page.getByRole("button", { name: "Lưới câu" }).click();
      await page.getByRole("button", { name: "Nộp bài" }).filter({ visible: true }).first().click();
      await page.getByRole("dialog").getByRole("button", { name: "Nộp bài" }).click();
      await page.getByText(/^Điểm: \d+\/180/).filter({ visible: true }).first().waitFor();
      await page.waitForLoadState("networkidle");
      await shot();
      if (run.name === "mobile") {
        await page.getByRole("button", { name: "Lưới câu" }).click();
        await page.getByRole("dialog").waitFor();
        await page.waitForTimeout(300);
        await shot("-drawer");
        await page.keyboard.press("Escape");
      }
      await page.getByRole("tab", { name: /^Sai \d+$/ }).click();
      await page.waitForTimeout(200);
      await shot("-sai");
      await page.context().close();
    });
  }
});

// SHOTS=dp03: "Theo chủ đề" (domain-practice ticket 03) -> .scratch/domain-practice/screenshots/03-*.png, with one open Drill and some answers.
test.describe("screenshots dp03", () => {
  test.skip(prefix !== "dp03", "set SHOTS=dp03");
  test.describe.configure({ mode: "serial" });
  const runs = [
    { name: "desktop", viewport: sizes.desktop, scheme: "light" },
    { name: "desktop-dark", viewport: sizes.desktop, scheme: "dark" },
    { name: "mobile", viewport: sizes.mobile, scheme: "light" },
  ] as const;
  for (const run of runs) {
    test(run.name, async ({ browser }) => {
      const page = await (await browser.newContext({ viewport: run.viewport, colorScheme: run.scheme })).newPage();
      await login(page);
      await page.goto("/drills");
      const row = (name: string) => page.getByRole("listitem").filter({ hasText: name });
      if (run.name === "desktop") {
        await row("Manage conflicts").getByRole("button", { name: "Ôn 10" }).click(); // submitted, gives a %
        await page.waitForURL(/\/attempts\/\d+/);
        await page.waitForLoadState("networkidle");
        await page.keyboard.press("a");
        await page.getByRole("status").filter({ hasText: "Đã lưu" }).waitFor();
        await page.getByRole("button", { name: "Nộp bài" }).filter({ visible: true }).click();
        await page.getByRole("dialog").getByRole("button", { name: "Nộp bài" }).click();
        await page.getByText(/^Điểm: /).filter({ visible: true }).waitFor();
        await page.goto("/drills");
        await row("Engage stakeholders").getByRole("button", { name: "Ôn 10" }).click(); // left open
        await page.waitForURL(/\/attempts\/\d+/);
        await page.waitForLoadState("networkidle");
        await page.keyboard.press("a");
        await page.getByRole("status").filter({ hasText: "Đã lưu" }).waitFor();
        await page.goto("/drills");
      }
      await page.getByRole("link", { name: "Làm tiếp" }).first().waitFor();
      await page.screenshot({ path: `.scratch/domain-practice/screenshots/03-${run.name}.png`, fullPage: true });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.context().close();
    });
  }
});

// SHOTS=dp04: Result of a Timed Attempt with the Domain scores -> .scratch/domain-practice/screenshots/04-<size>.png
test.describe("screenshots dp04", () => {
  test.skip(prefix !== "dp04", "set SHOTS=dp04");
  test.describe.configure({ mode: "serial" });
  for (const [name, viewport] of Object.entries(sizes)) {
    test(name, async ({ browser }) => {
      const page = await (await browser.newContext({ viewport })).newPage();
      await login(page);
      await page.getByRole("link", { name: /câu/ }).first().click();
      await page.waitForURL(/\/exams\/\d+/);
      await page.getByRole("button", { name: "Bắt đầu thi thử" }).click();
      await page.waitForURL(/\/attempts\/\d+/);
      await page.waitForLoadState("networkidle");
      if (name === "mobile") await page.getByRole("button", { name: "Lưới câu" }).click(); // Submit lives in the drawer
      await page.getByRole("button", { name: "Nộp bài" }).filter({ visible: true }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Nộp bài" }).last().click();
      await page.getByText(/^Điểm: /).filter({ visible: true }).first().waitFor();
      await page.screenshot({ path: `.scratch/domain-practice/screenshots/04-${name}.png` });
      if (name === "mobile") await page.getByRole("button", { name: "Lưới câu" }).click(); // the summary lives in the drawer
      await page.getByRole("meter", { name: /^People \d+%$/ }).filter({ visible: true }).waitFor();
      if (name === "mobile") await page.waitForTimeout(500); // let the drawer finish sliding in
      if (name === "mobile") await page.screenshot({ path: `.scratch/domain-practice/screenshots/04-mobile-drawer.png` });
      await page.context().close();
    });
  }
});
