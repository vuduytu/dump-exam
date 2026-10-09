# 06 — Trang kết quả đầy đủ và Lịch sử

**What to build:** Sau khi nộp, User xem lại từng câu: mình chọn gì, Correct Answer, Suggested Answer, tỉ lệ vote, đúng hay sai. Có bộ lọc và trang Lịch sử các Attempt. Trang chủ hiện điểm cao nhất của từng Exam. Spec: user story 28 (điểm cao nhất), 50–54.

**Blocked by:** 05 — Attempt tối thiểu

**Status:** resolved

**Model:** Sonnet 5.5 — đọc dữ liệu và UI (~2 giờ). Review bằng Opus 5.5.

- [x] Có các hàm `getResult` và `listAttempts`.
- [x] Mỗi câu hiển thị lựa chọn của User, Correct Answer, Suggested Answer, % vote từng phương án, và đánh dấu đúng/sai rõ ràng.
- [x] Có bộ lọc "Chỉ câu sai" và "Chỉ câu đã đánh dấu" (bộ lọc sau chỉ có tác dụng khi ticket 07 đã xong; trước đó trả về danh sách rỗng).
- [x] Trang Lịch sử hiện mỗi Attempt đã nộp: Exam, ngày, có bấm giờ hay không, thời gian làm, Score và %. Bấm vào thì mở trang kết quả.
- [x] Trang chủ hiện điểm cao nhất của User cho từng Exam.
- [x] Test: User khác không đọc được kết quả (đoán đúng URL cũng không); `listAttempts` chỉ trả Attempt đã nộp của chính User.

## Comments

- Chạy: `npm test` (tests/results.test.ts), `npm run dev` rồi mở `/history`, `/attempts/<id>` (bộ lọc `?f=wrong|marked`), trang chủ hiện "cao nhất".
- `getResult(userId, attemptId, filter?)` ném `AttemptNotSubmitted` nếu chưa nộp; `AttemptNotFound` nếu của User khác. % vote = tổng count của các Vote có chứa chữ cái đó / tổng count mọi Vote, làm tròn.
- Lệch: schema chưa có cột "bấm giờ" (Timed Attempt chưa làm), nên trang Lịch sử chưa hiện cột này; thêm khi có ticket Timed. Bộ lọc "đã đánh dấu" trả rỗng tới ticket 07.
- Điểm cao nhất trên trang chủ tính từ `listAttempts` (không thêm hàm riêng).
