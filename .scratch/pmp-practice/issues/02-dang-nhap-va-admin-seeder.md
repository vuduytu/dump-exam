# 02 — Đăng nhập và Admin seeder

**What to build:** User đăng nhập bằng email và mật khẩu rồi thấy trang chủ (tạm thời gần như trống). Khách chưa đăng nhập bị chuyển về trang đăng nhập. Seeder tạo Admin đầu tiên. Spec: user story 14, 15, 17, 18, 19, 20, 57.

**Blocked by:** 01 — Import ngân hàng Question (dùng lại DB, seeder và hạ tầng test)

**Status:** resolved

**Model:** Opus 5.5 — bảo mật: scrypt, cookie HMAC (~1,5 giờ). Review bằng Opus 5.5.

- [x] Có bảng `users` (email unique, password hash bằng scrypt có salt, isAdmin, locked, createdAt).
- [x] Seeder tạo `admin@dump-exam.local` với mật khẩu lấy từ `ADMIN_PASSWORD`, chỉ tạo khi Admin chưa tồn tại. Thiếu biến thì báo lỗi rõ ràng và dừng. Mật khẩu không xuất hiện trong code hoặc git.
- [x] Đăng nhập tạo cookie phiên httpOnly, ký HMAC bằng `SESSION_SECRET`, hết hạn sau 30 ngày. Đăng xuất xoá cookie.
- [x] Mọi trang trừ trang đăng nhập yêu cầu đăng nhập. Mỗi request đọc lại User từ DB, nên User bị khoá mất phiên ngay ở request kế tiếp.
- [x] Sai email hoặc sai mật khẩu đều trả cùng một thông báo "Email hoặc mật khẩu không đúng".
- [x] Test ở mức hàm nghiệp vụ: đăng nhập đúng, sai mật khẩu, User bị khoá; seeder chạy hai lần; seeder thiếu `ADMIN_PASSWORD`.

## Comments

- Xong. Chạy: thêm `SESSION_SECRET` và `ADMIN_PASSWORD` vào `.env.local` (mẫu ở `.env.example`), rồi `npm run db:migrate && npm run db:seed && npm run dev`. Test: `npm test` (`.env.test` cần `SESSION_SECRET`).
- Hàm nghiệp vụ ở `lib/auth.ts`: `login`, `createSessionToken`, `userFromSession` (lỗi có tên `InvalidCredentials`, `UserLocked`). `seedAdmin()` ở `db/seed.ts`, chạy sau `seedQuestions` trong `npm run db:seed`.
- Chặn trang bằng `middleware.ts` chạy runtime `nodejs` (Next 15.5), mỗi request đọc lại User từ DB, kể cả POST của server action.
- Lệch so với ticket: `created_at` dùng `DEFAULT CURRENT_TIMESTAMP` thay cho `defaultNow()` vì MySQL của MAMP không nhận `DEFAULT (now())`. User bị khoá nhập đúng mật khẩu thì thấy "Tài khoản đã bị khoá" (không lộ email vì phải đúng mật khẩu mới tới bước này). Email không có tài khoản vẫn chạy scrypt với hash giả để thời gian trả lời giống nhau.
- Test khoá User dùng `db.update` trực tiếp vì `setLocked` thuộc ticket 10.
