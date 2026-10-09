# 02 — Import 22 Exam PgMP

**What to build:** Một parser đọc 22 file dump PgMP, sau đó seed Question và Exam PgMP. User có quyền PgMP làm được Exam PgMP và xem Result có Explanation cùng ghi chú câu trùng. Spec: `.scratch/pgmp/spec.md` (quyết định 3, 4, 5; mục "Dữ liệu nguồn PgMP").

**Blocked by:** 01 — Certification và phân quyền

**Status:** done (chờ review)

**Model:** Opus 5.5 (~3 giờ). Review bằng Opus 5.5.

- [x] Parser (`scripts/`) ra `data/pgmp-questions.json`. Xử lý được mọi biến thể trong spec, khớp đáp án theo nội dung Choice, đánh dấu Unusable cho câu không có đáp án. Báo cáo số câu theo file, số Unusable và số câu khớp đáp án thất bại (phải bằng 0).
- [x] Question PgMP có định danh không đụng với id PMP. Lưu tên file, số gốc và Explanation. Seeder chạy hai lần không nhân đôi.
- [x] 22 Exam PgMP: tên là tên file, xếp theo giờ trong tên file, giữ số câu gốc, không có Unusable Question. Seed thêm không làm đổi Exam PMP.
- [x] Màn làm bài và Result: hiện số câu gốc, ghi chú "Trùng: <tên Exam> · Câu N", và Explanation thay cho Vote. Câu chọn nhiều đáp án chấm như PMP.
- [x] Test parser với fixture nhỏ chứa đủ các biến thể; test chạy seeder hai lần; test phát hiện câu trùng. Cập nhật e2e một luồng Exam PgMP.
