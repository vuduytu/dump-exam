import { test } from "@playwright/test";
import { login } from "./helpers";

// Manual: `SHOTS=01 npm run e2e -- screenshots` writes .scratch/ui-refresh/screenshots/<SHOTS>-*.png (ticket number as prefix).
const prefix = process.env.SHOTS;
const sizes = { mobile: { width: 390, height: 844 }, desktop: { width: 1280, height: 800 } };

test.describe("screenshots", () => {
  test.skip(!prefix, "set SHOTS=<ticket number>");
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
        await page.getByText(/đã nộp/).waitFor();
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
