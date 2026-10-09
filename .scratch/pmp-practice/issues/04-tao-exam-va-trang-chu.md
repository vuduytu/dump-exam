# 04 — Tạo Exam và trang chủ

**What to build:** Sau khi seed có các Exam cố định ("Đề 1" … "Đề 7"), mỗi Exam 180 Question. User đăng nhập vào và thấy danh sách Exam trên trang chủ. Spec: user story 9–12, 28 (phần liệt kê Exam).

**Blocked by:** 01 — Import ngân hàng Question; 02 — Đăng nhập và Admin seeder

**Status:** resolved

**Model:** Sonnet 5.5 — PRNG và chia nhóm, spec đã rõ (~1,5 giờ). Review bằng Opus 5.5.

- [x] `generateExams()` xáo các Question dùng được bằng PRNG có seed cố định rồi chia thành nhóm 180 câu. Exam cuối được bù câu từ Exam khác, không trùng câu trong cùng một Exam.
- [x] Đã có Exam thì không tạo lại. Seeder gọi hàm này sau bước upsert Question.
- [x] Có bảng `exams` và `exam_questions` (vị trí 1–180 cố định).
- [x] Trang chủ liệt kê các Exam kèm số câu.
- [x] Test: mỗi Exam đúng 180 câu, không có Unusable Question, không trùng câu trong một Exam, chạy hai lần ra cùng kết quả.

## Comments

- Xong. Chạy: `npm run db:migrate && npm run db:seed` (thứ tự: Question → `generateExams()` nếu chưa có Exam → Admin). Test: `npm test` (`tests/exams.test.ts`). Dev DB: 7 Exam × 180 câu, chạy seed lần hai không đổi.
- Bù Exam cuối: 1.229 câu dùng được = 6 × 180 + 149, nên Đề 7 lấy 149 câu còn lại + 31 câu đầu của chuỗi đã xáo (nằm trong Đề 1). Seed PRNG (mulberry32) cố định là hằng số `SHUFFLE_SEED` trong `db/seed.ts`.
- Trang chủ chỉ liệt kê tên Exam và số câu; điểm cao nhất và "đang làm dở" (story 28) thuộc ticket sau. Trang đặt `force-dynamic` để đọc DB mỗi request.
