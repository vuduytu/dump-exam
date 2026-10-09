# 04 — Màn Result

**What to build:** Result của Attempt đã nộp dùng lại bố cục màn làm bài ở chế độ chỉ đọc, xem từng câu, lưới tô xanh/đỏ, có thanh % vote và tab lọc. Spec: `.scratch/ui-refresh/spec.md` (quyết định 8).

**Blocked by:** 03 — Màn làm bài

**Status:** ready-for-agent

**Model:** Sonnet 5.5 (~1,5 giờ). Review bằng Opus 5.5.

- [ ] Đầu trang: tên Exam, Score X/180 (%), bấm giờ hay không, thời gian làm.
- [ ] Dùng lại bố cục và lưới của màn làm bài: ô xanh = đúng, đỏ = sai (kể cả bỏ trống), vẫn có viền đánh dấu; mỗi lần một câu, phím ← → dùng được.
- [ ] Mỗi Choice hiện lựa chọn của User, Correct Answer, Suggested Answer và thanh % vote. Màu dùng token, đọc được ở dark mode.
- [ ] Tab lọc Tất cả / Sai / Đánh dấu; lưới và Trước/Sau chỉ đi qua các câu trong tab đang chọn.
- [ ] Cập nhật test e2e (nộp xong thấy Result, lọc câu sai). Ảnh chụp mobile và desktop vào `.scratch/ui-refresh/screenshots/04-*`.
