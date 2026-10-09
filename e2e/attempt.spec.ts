import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("login, start an Exam, pick a Choice, submit, see the Score", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("link", { name: "Lịch sử" })).toBeVisible(); // shared header
  await page.getByRole("button", { name: "Không bấm giờ" }).first().click();
  await page.waitForURL(/\/attempts\/\d+/);
  await page.getByRole("radio").or(page.getByRole("checkbox")).first().check();
  await page.getByRole("button", { name: "Nộp bài" }).click(); // opens the confirm Dialog
  await page.getByRole("dialog").getByRole("button", { name: "Nộp bài" }).click();
  await expect(page.getByText(/đã nộp/)).toBeVisible();
  await expect(page.getByText(/^\d+\/\d+/).first()).toBeVisible(); // Score
});
