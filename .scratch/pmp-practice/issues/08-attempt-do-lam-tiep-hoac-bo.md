# 08 — Attempt dở: Làm tiếp / Bỏ

**What to build:** Mỗi Exam một User chỉ có tối đa một Attempt đang làm dở. Mở lại Exam đó thì có hai nút "Làm tiếp" hoặc "Bỏ, làm lại từ đầu". Trang chủ hiện trạng thái "đang làm dở". Spec: user story 28 (trạng thái), 30–32.

**Blocked by:** 05 — Attempt tối thiểu

**Status:** ready-for-agent

**Model:** Sonnet 5.5 — transaction phạm vi nhỏ; viết lại 2 lần vẫn hỏng thì chuyển Opus 5.5 (~1,5 giờ). Review bằng Opus 5.5.

- [ ] Khi đã có Attempt dở, `startAttempt` trả lỗi `AttemptInProgress`. Việc kiểm tra nằm trong transaction.
- [ ] Hàm `abandonAttempt` xoá Attempt cùng các đáp án. Abandoned Attempt không hiện trong Lịch sử.
- [ ] UI: mở Exam đang có Attempt dở thì hiện hai nút "Làm tiếp" và "Bỏ". Bấm Bỏ phải xác nhận trước.
- [ ] Test: gọi `startAttempt` lần hai bị từ chối; sau khi bỏ thì bắt đầu lại được; Attempt đã bỏ không có trong `listAttempts`; User khác không bỏ được Attempt của mình.
