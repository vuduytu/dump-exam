# 09 — Timed Attempt

**What to build:** Khi bắt đầu, User chọn bấm giờ 230 phút hoặc không bấm giờ. Có bấm giờ thì đồng hồ đếm ngược chạy theo giờ thật, kể cả khi đóng tab. Hết giờ thì bài tự nộp và User được chuyển sang trang kết quả. Spec: user story 29, 39–43.

**Blocked by:** 05 — Attempt tối thiểu

**Status:** resolved

**Model:** Opus 5.5 — deadline server, tham số `now`, tự nộp (~2 giờ). Review bằng Opus 5.5.

- [x] Màn hình bắt đầu có lựa chọn "Bấm giờ 230 phút" và "Không bấm giờ".
- [x] Deadline bằng thời điểm bắt đầu cộng 230 phút, tính ở server. Các hàm nhận tham số `now` để test được.
- [x] Gửi `saveAnswer` hoặc `toggleMark` sau deadline đều bị từ chối.
- [x] Gọi `getAttempt` sau deadline thì Attempt được chốt là đã nộp, Score chỉ tính các đáp án lưu trước deadline.
- [x] Đồng hồ phía client về 0 thì gọi nộp rồi chuyển sang trang kết quả.
- [x] Test: lưu trước deadline được, lưu sau deadline bị từ chối, tự nộp khi quá hạn, Attempt không bấm giờ không bao giờ hết hạn.

## Comments

- Cột `attempts.timed`. Deadline = `startedAt` + 230 phút (`deadlineOf`, `TIME_LIMIT_MS` trong `lib/attempts.ts`).
- `saveAnswer` / `toggleMark` / `abandonAttempt` kiểm deadline trong `lockOpenAttempt` (cùng row lock) và ném `AttemptExpired`. Server Action bắt lỗi này rồi chuyển về trang Attempt, trang đó hiện kết quả.
- Không có job nền. `finalizeExpired(userId, now)` chốt mọi Timed Attempt quá hạn của User với `submittedAt` = deadline. Hàm này chạy đầu `getAttempt`, `getResult`, `listAttempts`, `findOpenAttempt` và `startAttempt`, nên trang chủ, Lịch sử và nút "Làm bài" đều thấy Attempt quá hạn là đã nộp. Nhiều request chốt cùng lúc vẫn an toàn vì `submitAttempt` khoá dòng.
- `submitAttempt` gọi sau deadline (đồng hồ client trễ) cũng chốt ở deadline.
- Trang chủ có hai nút "Bấm giờ 230 phút" và "Không bấm giờ". Lịch sử có thêm cột bấm giờ (việc ticket 06 để lại).
- Chưa chạy luồng UI đăng nhập trên trình duyệt. Đã kiểm luồng nghiệp vụ trên DB dev bằng script, rồi xoá Attempt test.
