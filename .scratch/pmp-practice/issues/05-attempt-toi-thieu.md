# 05 — Attempt tối thiểu: làm, nộp, xem Score

**What to build:** User chọn một Exam, bắt đầu một Attempt không bấm giờ, trả lời từng câu (có nút Trước/Sau), mỗi lựa chọn được lưu ngay lên server, nộp bài và thấy Score. Đây là luồng chính mà các ticket 06–09 xây tiếp lên. Spec: user story 13, 33, 36, 37, 38, 44, 46–49.

**Blocked by:** 04 — Tạo Exam và trang chủ

**Status:** ready-for-agent

**Model:** Opus 5.5 — luồng chính cho 06–09, chấm điểm và kiểm quyền (~2,5 giờ). Review bằng Opus 5.5.

- [ ] Có bảng `attempts` và `attempt_answers`. Có các hàm `startAttempt`, `getAttempt`, `saveAnswer`, `submitAttempt`.
- [ ] Câu một đáp án hiện radio. Câu nhiều đáp án hiện checkbox kèm dòng "Chọn N đáp án" và không cho chọn quá N. Server cũng từ chối chữ cái không hợp lệ hoặc vượt N.
- [ ] Choice giữ thứ tự gốc. Nội dung HTML đã lọc được render kèm ảnh.
- [ ] Đóng tab rồi mở lại vẫn thấy đáp án đã lưu.
- [ ] Nộp bài: Score bằng số câu đúng trên 180. Câu nhiều đáp án phải đúng hết. Câu bỏ trống tính sai. Score được lưu lại. Attempt đã nộp không sửa được nữa.
- [ ] Test: chấm câu một đáp án đúng/sai; câu nhiều đáp án chọn đủ, thiếu, thừa; câu bỏ trống; `saveAnswer` sau khi nộp bị từ chối; User khác không ghi được vào Attempt.
