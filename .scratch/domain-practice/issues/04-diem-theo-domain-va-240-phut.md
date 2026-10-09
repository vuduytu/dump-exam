# 04 — Điểm theo Domain trong Result, Timed Attempt 240 phút

**What to build:** Result của một Exam có thêm khối điểm theo Domain. Timed Attempt chạy 240 phút như đề thi mới. Spec: `.scratch/domain-practice/spec.md` (quyết định 6, 7).

**Blocked by:** 02 — Lưu nhãn và Drill

**Status:** resolved

**Model:** Sonnet 5.5 (~1 giờ). Review bằng Opus 5.5.

- [x] Result của Exam hiện "People X% · Process Y% · Business Environment Z%" (số câu đúng / số câu của Domain trong Exam đó), dưới dòng thống kê. Result của Drill theo một Domain không cần khối này.
- [x] Timed Attempt: giới hạn 240 phút ở server, đồng hồ client, nhãn "Thi thử · 240 phút" trên trang Exam, màn làm bài và Result. Attempt bấm giờ đang làm dở được tính theo 240 phút.
- [x] Không còn số 230 trong code, test và giao diện (trừ tài liệu lịch sử trong `.scratch/pmp-practice/`).
- [x] Test: điểm theo Domain tính đúng; deadline = bắt đầu + 240 phút. Cập nhật e2e và ảnh chụp liên quan.
