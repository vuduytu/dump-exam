# 06 — Trang kết quả đầy đủ và Lịch sử

**What to build:** Sau khi nộp, User xem lại từng câu: mình chọn gì, Correct Answer, Suggested Answer, tỉ lệ vote, đúng hay sai. Có bộ lọc và trang Lịch sử các Attempt. Trang chủ hiện điểm cao nhất của từng Exam. Spec: user story 28 (điểm cao nhất), 50–54.

**Blocked by:** 05 — Attempt tối thiểu

**Status:** ready-for-agent

**Model:** Sonnet 5.5 — đọc dữ liệu và UI (~2 giờ). Review bằng Opus 5.5.

- [ ] Có các hàm `getResult` và `listAttempts`.
- [ ] Mỗi câu hiển thị lựa chọn của User, Correct Answer, Suggested Answer, % vote từng phương án, và đánh dấu đúng/sai rõ ràng.
- [ ] Có bộ lọc "Chỉ câu sai" và "Chỉ câu đã đánh dấu" (bộ lọc sau chỉ có tác dụng khi ticket 07 đã xong; trước đó trả về danh sách rỗng).
- [ ] Trang Lịch sử hiện mỗi Attempt đã nộp: Exam, ngày, có bấm giờ hay không, thời gian làm, Score và %. Bấm vào thì mở trang kết quả.
- [ ] Trang chủ hiện điểm cao nhất của User cho từng Exam.
- [ ] Test: User khác không đọc được kết quả (đoán đúng URL cũng không); `listAttempts` chỉ trả Attempt đã nộp của chính User.
