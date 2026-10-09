# 05 — Attempt tối thiểu: làm, nộp, xem Score

**What to build:** User chọn một Exam, bắt đầu một Attempt không bấm giờ, trả lời từng câu (có nút Trước/Sau), mỗi lựa chọn được lưu ngay lên server, nộp bài và thấy Score. Đây là luồng chính mà các ticket 06–09 xây tiếp lên. Spec: user story 13, 33, 36, 37, 38, 44, 46–49.

**Blocked by:** 04 — Tạo Exam và trang chủ

**Status:** resolved

**Model:** Opus 5.5 — luồng chính cho 06–09, chấm điểm và kiểm quyền (~2,5 giờ). Review bằng Opus 5.5.

- [x] Có bảng `attempts` và `attempt_answers`. Có các hàm `startAttempt`, `getAttempt`, `saveAnswer`, `submitAttempt`.
- [x] Câu một đáp án hiện radio. Câu nhiều đáp án hiện checkbox kèm dòng "Chọn N đáp án" và không cho chọn quá N. Server cũng từ chối chữ cái không hợp lệ hoặc vượt N.
- [x] Choice giữ thứ tự gốc. Nội dung HTML đã lọc được render kèm ảnh.
- [x] Đóng tab rồi mở lại vẫn thấy đáp án đã lưu.
- [x] Nộp bài: Score bằng số câu đúng trên 180. Câu nhiều đáp án phải đúng hết. Câu bỏ trống tính sai. Score được lưu lại. Attempt đã nộp không sửa được nữa.
- [x] Test: chấm câu một đáp án đúng/sai; câu nhiều đáp án chọn đủ, thiếu, thừa; câu bỏ trống; `saveAnswer` sau khi nộp bị từ chối; User khác không ghi được vào Attempt.

## Comments

**Cách chạy:** `npm run db:migrate` (migration `0003`), `npm run dev`, đăng nhập, bấm "Làm bài" ở một Exam. Test: `npm test` (`tests/attempts.test.ts`). Đã kiểm luồng thật bằng Playwright: radio/checkbox, giới hạn N, mở tab mới vẫn còn đáp án, Trước/Sau, ảnh ở Đề 3 câu 112, nộp ra Score, Attempt không tồn tại trả 404.

**Lệch so với spec:**
- `submitted_at` dùng `datetime`, không dùng `timestamp`: MySQL 5.7 biến `timestamp` nullable thành `NOT NULL DEFAULT '0000-00-00'`.
- Chưa có cột `timed`, `marked`, `updatedAt` và chưa có `total`. Ticket 07/09 tự thêm. Tổng điểm lấy bằng số Question của Exam (luôn 180).
- `startAttempt(userId, examId)` chưa nhận `timed` và chưa chặn Attempt dở thứ hai. Ticket 08/09 làm việc này.
- "Chọn thừa" không lưu được vì server từ chối khi vượt N. Test chấm điểm thay ca này bằng ca chọn đủ N chữ nhưng có một chữ sai.
- Score hiện trên chính trang `/attempts/[id]` sau khi nộp. Trang kết quả đầy đủ thuộc ticket 06.
