# 01 — Scoreboard cho Admin

**What to build:** Admin xem Scoreboard (xem `CONTEXT.md`) ở `/admin/scoreboard`, mở được Result và Lịch sử của từng User ở chế độ chỉ đọc. Quyết định chốt ở buổi grill ngày 2026-10-09 (Q1–Q12).

**Blocked by:** —

**Status:** resolved

**Model:** Opus 5.5 (~2 giờ).

- [x] `lib/scoreboard.ts`: `getScoreboard(actingId, now)` yêu cầu Admin. Trả về User (xếp theo email, có `locked`), Exam (theo thứ tự tạo), và mỗi ô gồm Score của Attempt nộp gần nhất, số Attempt đã nộp, và số câu đã trả lời của Attempt đang làm dở (nếu có). Gọi `finalizeExpired` cho từng User trước khi đọc.
- [x] `attemptOwnerForAdmin(actingId, attemptId)` yêu cầu Admin, trả về User sở hữu Attempt.
- [x] `/attempts/[id]`: Admin mở được Result đã nộp của User khác. Attempt đang làm dở của User khác thì trả 404.
- [x] `/history?user=<id>`: Admin xem Lịch sử của User khác, chỉ đọc, có hiện email.
- [x] `/admin/scoreboard`: bảng User × Exam. Ô dẫn tới Result gần nhất, tên User dẫn tới Lịch sử. User bị khoá hiện mờ. `/admin` có link sang.
- [x] Test: User thường bị từ chối; ô có Score gần nhất và số lượt; ô có cả lượt đã nộp lẫn lượt đang làm; Timed Attempt hết giờ được tính là đã nộp; Attempt đã bỏ không được tính.

## Comments

- `requireAdmin` ở `lib/users.ts` được export để `lib/scoreboard.ts` dùng lại.
- Admin mở Result của người khác qua `attemptOwnerForAdmin` trong `app/attempts/[id]/page.tsx`. Attempt đang làm dở của người khác trả 404.
- Link "Bảng điểm" nằm trên header, cạnh "Quản lý User".
- UI chưa kiểm khi đăng nhập bằng Admin, vì không có mật khẩu Admin thật. Mới kiểm bằng `tsc`, `eslint` và 62 test.
- Màn Result chưa hiện email chủ Attempt khi Admin mở từ Scoreboard.
