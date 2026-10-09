import type { Page } from "@playwright/test";

export async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("e2e@dump-exam.local");
  await page.getByLabel("Mật khẩu").fill(process.env.E2E_PASSWORD!);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("/");
}
