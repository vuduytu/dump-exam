# 04 — Tạo Exam và trang chủ

**What to build:** Sau khi seed có các Exam cố định ("Đề 1" … "Đề 7"), mỗi Exam 180 Question. User đăng nhập vào và thấy danh sách Exam trên trang chủ. Spec: user story 9–12, 28 (phần liệt kê Exam).

**Blocked by:** 01 — Import ngân hàng Question; 02 — Đăng nhập và Admin seeder

**Status:** ready-for-agent

**Model:** Sonnet 5.5 — PRNG và chia nhóm, spec đã rõ (~1,5 giờ). Review bằng Opus 5.5.

- [ ] `generateExams()` xáo các Question dùng được bằng PRNG có seed cố định rồi chia thành nhóm 180 câu. Exam cuối được bù câu từ Exam khác, không trùng câu trong cùng một Exam.
- [ ] Đã có Exam thì không tạo lại. Seeder gọi hàm này sau bước upsert Question.
- [ ] Có bảng `exams` và `exam_questions` (vị trí 1–180 cố định).
- [ ] Trang chủ liệt kê các Exam kèm số câu.
- [ ] Test: mỗi Exam đúng 180 câu, không có Unusable Question, không trùng câu trong một Exam, chạy hai lần ra cùng kết quả.
