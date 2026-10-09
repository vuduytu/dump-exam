# 07 — Đánh dấu xem lại, lưới số câu, xác nhận nộp

**What to build:** Trong lúc làm bài, User đánh dấu Marked Question, dùng lưới 1–180 để nhảy tới câu bất kỳ, và thấy hộp xác nhận trước khi nộp. Spec: user story 34, 35, 45.

**Blocked by:** 05 — Attempt tối thiểu

**Status:** ready-for-agent

**Model:** Sonnet 5.5 — UI cộng một hàm toggle (~1,5 giờ). Review bằng Opus 5.5.

- [ ] Có hàm `toggleMark`. Trạng thái đánh dấu được lưu server và còn sau khi tải lại trang.
- [ ] Lưới 1–180 phân biệt được 3 trạng thái câu: chưa trả lời, đã trả lời, đã đánh dấu. Bấm vào ô thì nhảy tới câu đó.
- [ ] Bấm nộp thì hiện "Còn X câu chưa trả lời, Y câu đánh dấu. Nộp?".
- [ ] Đánh dấu không ảnh hưởng Score.
- [ ] Test: bật rồi tắt đánh dấu; đánh dấu sau khi nộp bị từ chối; đánh dấu không đổi Score.
