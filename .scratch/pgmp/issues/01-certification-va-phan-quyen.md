# 01 — Certification và phân quyền

**What to build:** Toàn bộ dữ liệu hiện có được gắn Certification PMP. Admin cấp và gỡ Certification Access cho từng User. Mỗi User chỉ thấy và chỉ truy cập được nội dung của Certification mình có quyền. Spec: `.scratch/pgmp/spec.md` (quyết định 1, 2, 7).

**Blocked by:** —

**Status:** done (chờ review)

**Model:** Opus 5.5 (~4 giờ). Review bằng Opus 5.5.

- [x] Schema: Question, Exam và Drill thuộc một Certification. Thêm bảng quyền User × Certification. Migration gắn dữ liệu cũ vào PMP và cấp PMP cho mọi User hiện có.
- [x] Trang quản trị: tick Certification khi tạo hoặc sửa User; bắt buộc chọn ít nhất 1 Certification. Admin luôn có tất cả.
- [x] Side menu có bộ chọn Certification, nhớ lựa chọn gần nhất, chỉ hiện khi User có từ 2 Certification. Trang chủ, Drill và Lịch sử lọc theo Certification đang chọn.
- [x] Chặn ở server: User không có quyền thì không mở, không bắt đầu, không nộp được Exam, Drill hay Attempt của Certification đó, kể cả khi gõ thẳng URL. Gỡ quyền không xoá dữ liệu.
- [x] Scoreboard có tab theo Certification. Test: User không có quyền bị chặn; gỡ rồi cấp lại thì dữ liệu còn nguyên; migration chạy được trên dữ liệu cũ.
