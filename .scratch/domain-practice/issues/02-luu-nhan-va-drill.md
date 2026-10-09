# 02 — Lưu nhãn vào DB và Drill

**What to build:** Nhãn Task/Approach được seed vào DB. User bắt đầu được một Drill 10 hoặc 20 câu theo một Domain hoặc một Task, rút câu theo thứ tự ưu tiên, làm và nộp như một Attempt không bấm giờ rồi xem Result. Spec: `.scratch/domain-practice/spec.md` (quyết định 4).

**Blocked by:** 01 — Phân loại Question

**Status:** ready-for-agent

**Model:** Opus 5.5 (~2,5 giờ). Review bằng Opus 5.5.

- [ ] Schema: Question có Task và Approach (Domain suy ra từ Task); seeder đọc `data/question-tags.json`, upsert, chạy hai lần không nhân đôi.
- [ ] Attempt thuộc **hoặc** một Exam **hoặc** một Drill; Drill lưu nguồn (Domain hay Task) và danh sách Question cố định theo thứ tự đã rút. Các luật hiện có (một Attempt dở mỗi Exam, Timed Attempt, chấm Score, quyền sở hữu) vẫn đúng với Exam; Drill luôn không bấm giờ.
- [ ] `startDrill(userId, source, size, now)`: size 10 hoặc 20; rút câu chưa làm → sai lần gần nhất → ngẫu nhiên; không rút Unusable Question; thiếu câu thì lấy hết; nguồn không có câu thì báo lỗi rõ ràng.
- [ ] Màn làm bài, màn Result và Lịch sử hiển thị đúng với Drill (tiêu đề dạng "Ôn: People · Manage conflict", tổng câu = số câu của Drill).
- [ ] Drill không lên Scoreboard (chỉ gồm Exam); Drill hiện trong Lịch sử, kể cả khi Admin xem Lịch sử của User khác.
- [ ] Test: thứ tự ưu tiên rút câu; không có Unusable Question; thiếu câu; User khác không đọc/ghi được Drill; Score của Drill; seeder chạy hai lần. Cập nhật e2e một luồng Drill.
