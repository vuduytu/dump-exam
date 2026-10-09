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
  await page.getByRole("button", { name: "Nộp bài" }).filter({ visible: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Còn 9 câu chưa trả lời");
  await page.getByRole("dialog").getByRole("button", { name: "Nộp bài" }).click();
  await expect(page.getByText(/^Điểm: [01]\/10/).filter({ visible: true })).toBeVisible();
  await expect(page.getByRole("tab", { name: /^Tất cả 10$/ })).toBeVisible();
  await expect(page.getByText(/^Ôn · /).filter({ visible: true })).toBeVisible();

  await page.getByRole("link", { name: "Lịch sử" }).click();
  await expect(page.getByRole("link", { name: /Ôn: People · Manage conflicts.*\/10/ })).toBeVisible();
});
