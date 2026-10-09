# 01 — Nền móng: theme, component dùng chung, header, e2e

**What to build:** Toàn bộ app có chung theme "Calm Focus", header, và bộ component shadcn/ui. `confirm()` được thay bằng Dialog. Có Playwright và một test e2e luồng chính để các ticket sau tự kiểm UI. Spec: `.scratch/ui-refresh/spec.md` (quyết định 3, 4, 9, 10).

**Blocked by:** None — can start immediately

**Status:** resolved

**Model:** Sonnet 5.5 (~3 giờ). Review bằng Opus 5.5.

- [x] Cài shadcn/ui (Tailwind v4) với Button, Card, Dialog, Badge, Progress, Sheet. Theme token cho nền, màu nhấn, đúng / sai / đánh dấu, có biến thể dark mode theo hệ điều hành.
- [x] Font Be Vietnam Pro qua `next/font/google`, bỏ `font-family: Arial`. Có style typography cho nội dung Question (17–18px, line-height 1.7).
- [x] Header chung trong layout: tên app, link Lịch sử / Tài khoản / Quản lý User (chỉ Admin), email và nút đăng xuất. Không hiện ở `/login`. Bỏ các link "Trang chủ" tự chế.
- [x] Mọi `confirm()` (bỏ Attempt, nộp bài) thay bằng Dialog. Nút có trạng thái chờ khi Server Action đang chạy.
- [x] Login, History, Account, Admin đổi sang component dùng chung, không đổi bố cục. Màu viết cứng (`bg-green-50`, `bg-amber-200`…) đổi sang token.
- [x] Playwright + test e2e: đăng nhập → bắt đầu Exam → chọn Choice → nộp → thấy Score. User test tạo bằng seeder test, mật khẩu trong `.env.test`. Có lệnh `npm run e2e`.
- [x] Ảnh chụp mobile (390px) và desktop (1280px) của trang chủ, màn làm bài, Result vào `.scratch/ui-refresh/screenshots/01-*`.

## Comments

- Chạy e2e: `npm run e2e` (cần `E2E_PASSWORD` trong `.env.test`, mẫu ở `.env.example`). Chạy `next dev -p 3123` trên DB `_test`, reset + seed mỗi lần. Không chạy cùng lúc với `npm test` (cùng DB `_test`).
- Chụp ảnh: `SHOTS=01 npm run e2e -- screenshots` ghi `.scratch/ui-refresh/screenshots/01-*.png` (mobile 390, desktop 1280, thêm màn làm bài dark).
- shadcn CLI mới dùng style `base-nova` (Base UI) và sinh `lib/utils.ts` import gói `cn` sai; đã sửa thành `clsx` + `tailwind-merge`. Button của Base UI mặc định `type="button"`, nên nút submit phải ghi `type="submit"` (`SubmitButton` đã làm sẵn).
- Dark mode theo hệ điều hành bằng `@media (prefers-color-scheme: dark)`, không dùng class `.dark`. Header ẩn khi không có session (tức `/login`).
- Link kiểu nút dùng `buttonVariants` trên `<Link>` để giữ vai trò link. Màn làm bài/Result chỉ đổi token và component, bố cục để ticket sau.
