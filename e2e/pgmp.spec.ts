import { expect, test, type Page } from "@playwright/test";
import { login } from "./helpers";

const visible = (page: Page, text: string | RegExp) => page.getByText(text, typeof text === "string" ? { exact: true } : {}).filter({ visible: true });
const EXAM = "6_6_2024 11_45_11 AM";

test("PgMP Exam: original number, Duplicate Question note, Result with Explanation instead of Vote", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await login(page);
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("group", { name: "Certification" }).getByRole("button", { name: "PgMP" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("link", { name: /câu/ }).first()).toContainText("6_6_2024 11_05_01 AM"); // Exams in file-name time order
  await page.getByRole("link", { name: new RegExp(EXAM) }).click();
  await page.waitForURL(/\/exams\/\d+/);
  await page.getByRole("button", { name: "Bắt đầu luyện tập" }).click();
  await page.waitForURL(/\/attempts\/\d+/);

  await page.goto(page.url() + "?q=80");
  await page.waitForLoadState("networkidle"); // hydrated: shortcuts are live
  await expect(visible(page, `${EXAM} · Câu 80/170`)).toBeVisible();
  await expect(visible(page, `Trùng: ${EXAM} · Câu 170`)).toBeVisible();
  await page.keyboard.press("a");
  await expect(page.getByRole("status")).toHaveText("Đã lưu");

  await page.getByRole("button", { name: "Nộp bài" }).filter({ visible: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Nộp bài" }).click();
  await expect(visible(page, /^Điểm: 1\/170/)).toBeVisible();
  await page.getByRole("button", { name: "Câu 80, đúng" }).click();
  await expect(page.getByRole("heading", { name: "Lời giải" })).toBeVisible();
  await expect(visible(page, "The standard. section 1.9")).toBeVisible();
  await expect(visible(page, `Trùng: ${EXAM} · Câu 170`)).toBeVisible();
  await expect(page.getByRole("meter", { name: /vote/ })).toHaveCount(0);
  await expect(page.getByText(/ExamTopics/)).toHaveCount(0);
});
