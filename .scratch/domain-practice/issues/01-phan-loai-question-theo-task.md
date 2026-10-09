# 01 — Phân loại Question theo Task và Approach

**What to build:** Mọi Question trong `data/questions.json` có nhãn Task (qua đó Domain), Approach và mức tin cậy, lưu cố định trong `data/question-tags.json`, đã được chủ dự án duyệt. Phân loại bằng subagent của Claude Code, không dùng Claude API. Spec: `.scratch/domain-practice/spec.md` (quyết định 1–3).

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

**Model:** Sonnet 5.5 cho các subagent phân loại (~45 phút), phiên chính điều phối. Chủ dự án duyệt ~15 phút.

- [ ] Có file danh sách 26 Task (mã ổn định, ví dụ `people-1`…`process-10`…`business-8`, tên Task, Domain) lấy từ `research-eco.md`, dùng chung cho subagent và code.
- [ ] Chia câu thành ~13 lô; mỗi subagent ghi `data/tags/lot-NN.json` dạng `[{ "id": 72, "task": "process-3", "approach": "agile", "confidence": "high" }]`. Chạy tối đa 4 lô song song.
- [ ] Script gộp → `data/question-tags.json`, kiểm tra: đủ mọi `id` trong `questions.json`, không trùng, `task` và `approach` hợp lệ. Script có một test nhỏ cho phần kiểm tra.
- [ ] Báo cáo số câu dùng được theo Domain và theo Task, số câu theo Approach, số câu tin cậy thấp.
- [ ] Xuất file duyệt (`.scratch/domain-practice/review.md`): mọi câu tin cậy thấp + 30 câu ngẫu nhiên, mỗi câu kèm nội dung rút gọn, Task, Approach. Chủ dự án duyệt và sửa trực tiếp trong `question-tags.json` hoặc ghi chú để agent sửa.
- [ ] Ticket chỉ chuyển `resolved` sau khi chủ dự án xác nhận đã duyệt.
