import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("Drill: start Ôn 10 on a Task, answer, submit, see the Score and the Drill in History", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await login(page);
  await page.getByRole("link", { name: "Theo chủ đề" }).click();
  await page.waitForURL(/\/drills/);
  await page.getByRole("listitem").filter({ hasText: "Manage conflicts" }).getByRole("button", { name: "Ôn 10" }).click();
  await page.waitForURL(/\/attempts\/\d+/);
  await page.waitForLoadState("networkidle"); // hydrated: shortcuts are live
  const heading = (text: string) => page.getByText(text, { exact: true }).filter({ visible: true });
  await expect(heading("Ôn: People · Manage conflicts · Câu 1/10")).toBeVisible();

  await page.keyboard.press("a");
  await expect(page.getByRole("status")).toHaveText("Đã lưu");
  await page.goto("/drills"); // the open Drill shows Làm tiếp / Bỏ instead of Ôn buttons
  const row = page.getByRole("listitem").filter({ hasText: "Manage conflicts" });
  await expect(row.getByRole("button", { name: "Ôn 10" })).toHaveCount(0);
  await expect(row.getByRole("button", { name: "Bỏ" })).toBeVisible();
  await row.getByRole("link", { name: "Làm tiếp" }).click();
  await page.waitForURL(/\/attempts\/\d+/);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Nộp bài" }).filter({ visible: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Còn 9 câu chưa trả lời");
  await page.getByRole("dialog").getByRole("button", { name: "Nộp bài" }).click();
  await expect(page.getByText(/^Điểm: [01]\/10/).filter({ visible: true })).toBeVisible();
  await expect(page.getByRole("tab", { name: /^Tất cả 10$/ })).toBeVisible();
  await expect(page.getByText(/^Ôn · /).filter({ visible: true })).toBeVisible();

  await page.goto("/drills");
  await expect(page.getByRole("listitem").filter({ hasText: "Manage conflicts" })).toContainText(/1\/\d+ câu · (0|100)% đúng/);
  await expect(page.getByRole("button", { name: "Ôn 10" }).first()).toBeVisible();

  await page.getByRole("link", { name: "Lịch sử" }).click();
  await expect(page.getByRole("link", { name: /Ôn: People · Manage conflicts.*\/10/ })).toBeVisible();
});
