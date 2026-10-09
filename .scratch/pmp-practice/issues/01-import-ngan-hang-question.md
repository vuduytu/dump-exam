# 01 — Import ngân hàng Question

**What to build:** Chủ dự án chạy một lệnh seed và toàn bộ Question trong file HTML của ExamTopics được đưa vào database. Phần parser đã có bản đầu (xem spec, mục Further Notes). Ticket này bổ sung test cho parser, dựng DB và bộ test chạy trên MySQL thật, rồi viết seeder upsert Question. Spec: `.scratch/pmp-practice/spec.md` (user story 1–8).

**Blocked by:** None — can start immediately

**Status:** resolved

**Model:** Opus 5.5 — hạ tầng test và DB cho 9 ticket sau (~2 giờ). Review bằng Opus 5.5.

- [x] Parser có test chạy trên file HTML mẫu khoảng 5 card: câu một đáp án, câu nhiều đáp án, câu kéo thả không có Choice, câu có ảnh, câu có thẻ lạ hoặc script.
- [x] Test kiểm: Choice, Suggested Answer, Most Voted Answer, Correct Answer (lấy Most Voted, không có thì lấy Suggested), cờ Unusable Question, ảnh trỏ về đường dẫn local, nội dung chỉ còn các thẻ trong whitelist.
- [x] Bảng `questions` được tạo bằng Drizzle trên MySQL (MAMP local), kết nối qua `DATABASE_URL`.
- [x] Lệnh seed nạp 1.250 Question, trong đó 1.229 dùng được. Chạy hai lần không nhân đôi (upsert theo số gốc).
- [x] Có hạ tầng test `node:test` + `tsx` dùng database test riêng, reset dữ liệu theo từng file test. Các ticket sau dùng lại hạ tầng này.

## Comments

- Xong. Chạy: `npm run db:migrate && npm run db:seed` (đọc `.env.local`), test: `npm test` (đọc `.env.test`, tên DB phải kết thúc `_test`). Mẫu biến môi trường ở `.env.example`.
- Hạ tầng test cho ticket sau: `tests/db.ts` có `resetDb()` (chạy migration rồi truncate mọi bảng) và `closeDb()`; gọi trong `before`/`after` của mỗi file test. Các file test chạy tuần tự (`--test-concurrency=1`).
- Test parser bắt được lỗi XSS: text của Choice bị `html.unescape` sau khi lọc, nên `&lt;img onerror&gt;` thành thẻ thật. Đã đổi sang unescape trước khi lọc, và bỏ luôn nội dung `<script>`/`<style>`. `data/questions.json` sinh lại không đổi.
