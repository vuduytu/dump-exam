# 08 — Attempt dở: Làm tiếp / Bỏ

**What to build:** Mỗi Exam một User chỉ có tối đa một Attempt đang làm dở. Mở lại Exam đó thì có hai nút "Làm tiếp" hoặc "Bỏ, làm lại từ đầu". Trang chủ hiện trạng thái "đang làm dở". Spec: user story 28 (trạng thái), 30–32.

**Blocked by:** 05 — Attempt tối thiểu

**Status:** resolved

**Model:** Sonnet 5.5 — transaction phạm vi nhỏ; viết lại 2 lần vẫn hỏng thì chuyển Opus 5.5 (~1,5 giờ). Review bằng Opus 5.5.

- [x] Khi đã có Attempt dở, `startAttempt` trả lỗi `AttemptInProgress`. Việc kiểm tra nằm trong transaction.
- [x] Hàm `abandonAttempt` xoá Attempt cùng các đáp án. Abandoned Attempt không hiện trong Lịch sử.
- [x] UI: mở Exam đang có Attempt dở thì hiện hai nút "Làm tiếp" và "Bỏ". Bấm Bỏ phải xác nhận trước.
- [x] Test: gọi `startAttempt` lần hai bị từ chối; sau khi bỏ thì bắt đầu lại được; Attempt đã bỏ không có trong `listAttempts`; User khác không bỏ được Attempt của mình.

## Comments

- `startAttempt` khoá dòng `users` của User (`SELECT … FOR UPDATE`) trong transaction rồi mới kiểm tra, nên hai lần bấm đồng thời xếp hàng. Test chạy 3 `startAttempt` song song: đúng 1 thành công.
- Dữ liệu cũ có nhiều Attempt dở cho một Exam: `findOpenAttempt` lấy cái mới nhất. Attempt cũ hơn không bị xoá.
- Nút "Làm tiếp" / "Bỏ, làm lại từ đầu" nằm ngay hàng Exam ở trang chủ (chưa có trang riêng cho Exam). Bỏ có `confirm`.
