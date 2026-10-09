import { expect, test, type Page } from "@playwright/test";
import { login, navTo } from "./helpers";

const visible = (page: Page, text: string | RegExp) => page.getByText(text, typeof text === "string" ? { exact: true } : {}).filter({ visible: true });
const button = (page: Page, name: string | RegExp) => page.getByRole("button", { name }).filter({ visible: true });

async function startPractice(page: Page) {
  await login(page);
  await page.getByRole("link", { name: /câu/ }).first().click(); // Exam card
  await page.waitForURL(/\/exams\/\d+/);
  await page.getByRole("button", { name: "Bắt đầu luyện tập" }).click();
  await page.waitForURL(/\/attempts\/\d+/);
  await page.waitForLoadState("networkidle"); // hydrated: shortcuts are live
}

test("desktop: keyboard switches, answers and marks; the answer survives a reload; submit shows the Score", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await startPractice(page);
  await expect(page.getByRole("button", { name: "Menu" })).toBeVisible(); // shared side menu
  await expect(visible(page, "Đề 1 · Câu 1/180")).toBeVisible();

  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/\?q=2$/);
  await expect(visible(page, "Đề 1 · Câu 2/180")).toBeVisible();
  await expect(visible(page, "Đã làm: 0/180 (0%)")).toBeVisible();
  await page.keyboard.press("a");
  await expect(page.getByRole("button", { name: "Câu 2, đã trả lời" })).toBeVisible();
  await expect(visible(page, "Đã làm: 1/180 (1%)")).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Đã lưu");
  await page.keyboard.press("m");
  await expect(page.getByRole("button", { name: "Câu 2, đánh dấu" })).toBeVisible();
  await expect(button(page, "Đã đánh dấu")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("status")).toHaveText("Đã lưu");
  await expect(page.getByRole("button", { name: "Câu 1, chưa trả lời" })).toBeVisible();

  await navTo(page, "Lịch sử");
  await page.waitForURL(/\/history/);
  await page.goBack(); // the Router Cache holds the page as first loaded, with nothing answered: it must refresh
  await expect(page.getByRole("button", { name: "Câu 2, đánh dấu" })).toBeVisible();
  await expect(visible(page, "Đề 1 · Câu 2/180")).toBeVisible();
  await expect(page.locator("fieldset input").first()).toBeChecked();

  await page.reload(); // saved on the server, and ?q=2 opens the same Question
  await expect(visible(page, "Đề 1 · Câu 2/180")).toBeVisible();
  await expect(page.locator("fieldset input").first()).toBeChecked();
  await expect(page.getByRole("button", { name: "Câu 2, đánh dấu" })).toBeVisible();

  await page.waitForLoadState("networkidle"); // hydrated: shortcuts are live
  await page.keyboard.press("ArrowLeft");
  await expect(page).toHaveURL(/\?q=1$/);
  await page.goBack(); // Exam page now offers to resume or abandon
  await page.getByRole("button", { name: "Bỏ, làm lại" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Huỷ" }).click();
  await page.getByRole("link", { name: "Làm tiếp" }).click();
  await page.waitForURL(/\/attempts\/\d+/);

  await button(page, "Nộp bài").click(); // opens the confirm Dialog
  await expect(page.getByRole("dialog")).toContainText("Còn 179 câu chưa trả lời, 1 câu đánh dấu");
  await page.keyboard.press("ArrowRight"); // ignored while a Dialog is open
  await expect(page).not.toHaveURL(/\?q=2/);
  await page.getByRole("dialog").getByRole("button", { name: "Nộp bài" }).click();
  await expect(page.getByText(/^Điểm: \d+\/180/).filter({ visible: true })).toBeVisible(); // Score
  await expect(visible(page, "· Câu 1/180")).toBeVisible(); // Result: the position sits on the Question line
  await expect(page.getByRole("tab", { name: /^Tất cả 180$/ })).toBeVisible();
  await page.waitForLoadState("networkidle");

  // Result: tab Sai keeps only wrong Questions in the grid, ←/→ walk inside it, the URL follows
  const grid = page.locator("aside ol button");
  await expect(grid).toHaveCount(180);
  await page.getByRole("tab", { name: /^Sai \d+$/ }).click();
  await expect(page).toHaveURL(/f=wrong/);
  await expect(page.getByRole("tab", { name: /^Sai \d+$/ })).toHaveAttribute("aria-selected", "true");
  const n = await grid.count();
  expect(n).toBeGreaterThanOrEqual(179); // only Câu 2 could be right
  await expect(page.locator('aside ol button[aria-label*=", đúng"]')).toHaveCount(0);
  const first = Number((await grid.nth(0).textContent())!);
  const second = Number((await grid.nth(1).textContent())!);
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(new RegExp(`q=${second}(&|$)`));
  await page.keyboard.press("ArrowLeft");
  await expect(page).toHaveURL(new RegExp(`q=${first}(&|$)`));
  await page.getByRole("tab", { name: "Đánh dấu" }).click();
  await expect(grid).toHaveCount(1); // the one marked Question
});

test("mobile: bottom bar moves, the grid drawer jumps to a Question, submit from the drawer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startPractice(page);
  await expect(visible(page, "Đề 1 · Câu 1/180")).toBeVisible();
  await button(page, "Sau").click();
  await expect(visible(page, "Đề 1 · Câu 2/180")).toBeVisible();
  await button(page, "Đánh dấu").click();

  await button(page, "Lưới câu").click();
  const drawer = page.getByRole("dialog");
  await expect(drawer.getByRole("button", { name: "Câu 2, đánh dấu" })).toBeVisible();
  await drawer.getByRole("button", { name: "Câu 10, chưa trả lời" }).click();
  await expect(drawer).toBeHidden();
  await expect(visible(page, "Đề 1 · Câu 10/180")).toBeVisible();
  await expect(page).toHaveURL(/\?q=10$/);

  await button(page, "Lưới câu").click();
  await page.getByRole("dialog").getByRole("button", { name: "Nộp bài" }).click();
  const confirm = page.getByRole("dialog").filter({ hasText: "Nộp bài?" });
  await expect(confirm).toContainText("Còn 180 câu chưa trả lời, 1 câu đánh dấu");
  await confirm.getByRole("button", { name: "Nộp bài" }).click();
  await expect(page.getByText(/^Điểm: \d+\/180/).filter({ visible: true })).toBeVisible();
});

test("Timed Attempt: 240-minute label on the Exam page, attempt screen and Result; Result of an Exam shows Domain scores", async ({ page }) => {
  await login(page);
  await page.getByRole("link", { name: /câu/ }).first().click();
  await page.waitForURL(/\/exams\/\d+/);
  await expect(page.getByRole("heading", { name: "Thi thử · 240 phút" })).toBeVisible();
  await page.getByRole("button", { name: "Bắt đầu thi thử" }).click();
  await page.waitForURL(/\/attempts\/\d+/);
  await expect(visible(page, "Thi thử · 240 phút")).toBeVisible();
  await page.waitForLoadState("networkidle");
  await button(page, "Nộp bài").click();
  await page.getByRole("dialog").getByRole("button", { name: "Nộp bài" }).click();
  await expect(visible(page, /^Thi thử · .* \/ 240 phút$/)).toBeVisible();
  for (const d of ["People", "Process", "Business Environment"]) await expect(page.getByRole("meter", { name: new RegExp(`^${d} \\d+%$`) })).toBeVisible();
});
