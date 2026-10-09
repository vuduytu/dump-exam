# 03 — Trang "Theo chủ đề"

**What to build:** User mở trang "Theo chủ đề", thấy mình đã làm bao nhiêu câu và đúng bao nhiêu phần trăm ở từng Domain và Task, rồi bấm "Ôn 10" / "Ôn 20" để bắt đầu Drill. Spec: `.scratch/domain-practice/spec.md` (quyết định 5).

**Blocked by:** 02 — Lưu nhãn và Drill

**Status:** resolved

**Model:** Sonnet 5.5 (~1,5 giờ). Review bằng Opus 5.5.

- [x] Hàm thống kê theo Domain và Task cho một User: số câu đã làm / tổng câu dùng được, % đúng (theo lần làm gần nhất của mỗi câu), chỉ tính Attempt đã nộp của chính User.
- [x] Trang có link trong header. Mỗi Domain một nhóm: hàng "Cả Domain" + các Task, sắp % đúng từ thấp lên; chưa làm câu nào thì hiện "—".
- [x] Nút "Ôn 10" / "Ôn 20" bắt đầu Drill; nếu đang có Drill dở cùng nguồn thì hỏi Làm tiếp / Bỏ như với Exam.
- [x] Task không có câu nào hiện mờ, ghi "chưa có câu", không có nút.
- [x] Không tràn ở mobile 390px, dùng theme token, đọc được ở dark mode.
- [x] Test hàm thống kê (User khác không ảnh hưởng, câu làm nhiều lần lấy lần gần nhất). Cập nhật e2e: vào trang, bấm Ôn 10. Ảnh chụp mobile và desktop vào `.scratch/domain-practice/screenshots/03-*`.
