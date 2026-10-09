# 02 — Trang Exam và thẻ Exam ở trang chủ

**What to build:** Trang chủ chỉ còn danh sách thẻ Exam. Bấm thẻ vào `/exams/[id]`, nơi User chọn "Thi thử 230 phút" hoặc "Luyện tập không bấm giờ", hoặc Làm tiếp / Bỏ Attempt dở, và xem các Attempt đã nộp của Exam đó. Spec: `.scratch/ui-refresh/spec.md` (quyết định 5, 6).

**Blocked by:** 01 — Nền móng

**Status:** ready-for-agent

**Model:** Sonnet 5.5 (~1,5 giờ). Review bằng Opus 5.5.

- [ ] Trang chủ: lưới thẻ Exam (tên, số câu, điểm cao nhất, badge "đang làm dở"), không tràn trên mobile 390px.
- [ ] `/exams/[id]`: tiêu đề, số câu, điểm cao nhất. Exam không tồn tại thì 404.
- [ ] Không có Attempt dở: hai thẻ "Thi thử 230 phút" và "Luyện tập không bấm giờ", mỗi thẻ một dòng giải thích hậu quả.
- [ ] Có Attempt dở: thẻ "Làm tiếp" (số câu đã làm; thời gian còn lại nếu là Timed Attempt) và nút "Bỏ, làm lại" có Dialog xác nhận.
- [ ] Danh sách Attempt đã nộp của chính User cho Exam này (ngày, bấm giờ hay không, Score), bấm vào mở Result.
- [ ] Test hàm nghiệp vụ mới nếu có (ví dụ số câu đã làm). Cập nhật test e2e đi qua trang Exam. Ảnh chụp mobile và desktop vào `.scratch/ui-refresh/screenshots/02-*`.
