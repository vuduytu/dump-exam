# 02 — Trang Exam và thẻ Exam ở trang chủ

**What to build:** Trang chủ chỉ còn danh sách thẻ Exam. Bấm thẻ vào `/exams/[id]`, nơi User chọn "Thi thử 230 phút" hoặc "Luyện tập không bấm giờ", hoặc Làm tiếp / Bỏ Attempt dở, và xem các Attempt đã nộp của Exam đó. Spec: `.scratch/ui-refresh/spec.md` (quyết định 5, 6).

**Blocked by:** 01 — Nền móng

**Status:** resolved

**Model:** Sonnet 5.5 (~1,5 giờ). Review bằng Opus 5.5.

- [x] Trang chủ: lưới thẻ Exam (tên, số câu, điểm cao nhất, badge "đang làm dở"), không tràn trên mobile 390px.
- [x] `/exams/[id]`: tiêu đề, số câu, điểm cao nhất. Exam không tồn tại thì 404.
- [x] Không có Attempt dở: hai thẻ "Thi thử 230 phút" và "Luyện tập không bấm giờ", mỗi thẻ một dòng giải thích hậu quả.
- [x] Có Attempt dở: thẻ "Làm tiếp" (số câu đã làm; thời gian còn lại nếu là Timed Attempt) và nút "Bỏ, làm lại" có Dialog xác nhận.
- [x] Danh sách Attempt đã nộp của chính User cho Exam này (ngày, bấm giờ hay không, Score), bấm vào mở Result.
- [x] Test hàm nghiệp vụ mới nếu có (ví dụ số câu đã làm). Cập nhật test e2e đi qua trang Exam. Ảnh chụp mobile và desktop vào `.scratch/ui-refresh/screenshots/02-*`.

## Comments

- Thêm `openAttemptSummary(userId, examId)` trong `lib/attempts.ts` (id, timed, deadline, answered, total; "đã làm" chỉ tính ô có đáp án, đánh dấu một mình không tính). Có test.
- `/exams/[id]`: 404 khi Exam không có hoặc id không phải số; chưa đăng nhập thì redirect `/login`. "Còn X phút" tính lúc render server, không tự đếm.
- `abandonAttemptAction` giờ revalidate thêm `/exams/[id]`. E2E đi home → thẻ Exam → luyện tập → quay lại → Dialog Bỏ (Huỷ) → Làm tiếp → nộp.
- Ảnh: `SHOTS=02 npm run e2e -- screenshots` → `.scratch/ui-refresh/screenshots/02-*.png`. `npx eslint .` quét cả `.next*` nên báo hàng nghìn lỗi; quét `app lib components e2e tests` thì sạch.
