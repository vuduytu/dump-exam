# 03 — Domain/Task PgMP và Drill

**What to build:** Mọi Question PgMP được gắn một Task theo ECO PgMP mới nhất. User PgMP dùng được trang "Theo chủ đề", Drill và điểm theo Domain giống PMP. Spec: `.scratch/pgmp/spec.md` (quyết định 6).

**Blocked by:** 02 — Import 22 Exam PgMP

**Status:** done

**Model:** Opus 5.5 (~4 giờ, phần lớn là gắn nhãn). Review bằng Opus 5.5.

- [x] Tra cứu ECO PgMP mới nhất (Domain, Task, tỉ trọng) và ghi vào `.scratch/pgmp/research-eco.md` kèm nguồn. Thông tin nào không chắc chắn thì ghi rõ, không tự đoán.
- [x] Taxonomy theo Certification: Domain/Task của PMP và PgMP tách riêng. PgMP không có Approach.
- [x] Gắn nhãn khoảng 3023 câu bằng subagent chia lô như PMP. Gộp lô và validate. Báo cáo mức khớp với 450 nhãn ECO cũ (chỉ để tham khảo).
- [x] Chủ dự án duyệt các câu tin cậy thấp và 30 câu ngẫu nhiên trước khi seed. (2026-10-09: duyệt 30 câu ngẫu nhiên, chấp nhận 678 câu tin cậy thấp)
- [x] Trang "Theo chủ đề", Drill và điểm theo Domain trong Result hoạt động với Certification đang chọn. Test: Drill PgMP chỉ rút câu PgMP, và có seed nhãn.

## Comments

- 2026-10-09 (agent): Đã gắn nhãn 3023 câu (25 lô, `data/tags/pgmp/lot-NN.json`), gộp vào `data/pgmp-question-tags.json`. Chưa seed vào DB dev. Chủ dự án cần duyệt `.scratch/pgmp/review-labels.md` (678 câu tin cậy thấp và 30 câu ngẫu nhiên, seed 20261009). Sau đó sửa lô nếu cần, chạy `npx tsx scripts/tags.ts merge PgMP`, rồi `npm run db:seed` (lệnh này nay seed cả nhãn PgMP). Nguồn ECO ở `.scratch/pgmp/research-eco.md`. Mức khớp với nhãn ECO cũ: Task 106/425 (24,9%), Domain 304/425 (71,5%).
