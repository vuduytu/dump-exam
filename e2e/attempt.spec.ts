import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("login, start an Exam, pick a Choice, submit, see the Score", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("link", { name: "Lịch sử" })).toBeVisible(); // shared header
  await page.getByRole("link", { name: /câu/ }).first().click(); // Exam card
  await page.waitForURL(/\/exams\/\d+/);
  await page.getByRole("button", { name: "Bắt đầu luyện tập" }).click();
  await page.waitForURL(/\/attempts\/\d+/);
  await page.getByRole("radio").or(page.getByRole("checkbox")).first().check();
  await page.goBack(); // Exam page now offers to resume or abandon
  await page.getByRole("button", { name: "Bỏ, làm lại" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Huỷ" }).click();
  await page.getByRole("link", { name: "Làm tiếp" }).click();
  await page.waitForURL(/\/attempts\/\d+/);
  await page.getByRole("button", { name: "Nộp bài" }).click(); // opens the confirm Dialog
  await page.getByRole("dialog").getByRole("button", { name: "Nộp bài" }).click();
  await expect(page.getByText(/đã nộp/)).toBeVisible();
  await expect(page.getByText(/^\d+\/\d+/).first()).toBeVisible(); // Score
});
