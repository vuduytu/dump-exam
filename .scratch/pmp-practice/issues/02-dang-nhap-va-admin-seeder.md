# 02 — Đăng nhập và Admin seeder

**What to build:** User đăng nhập bằng email và mật khẩu rồi thấy trang chủ (tạm thời gần như trống). Khách chưa đăng nhập bị chuyển về trang đăng nhập. Seeder tạo Admin đầu tiên. Spec: user story 14, 15, 17, 18, 19, 20, 57.

**Blocked by:** 01 — Import ngân hàng Question (dùng lại DB, seeder và hạ tầng test)

**Status:** ready-for-agent

**Model:** Opus 5.5 — bảo mật: scrypt, cookie HMAC (~1,5 giờ). Review bằng Opus 5.5.

- [ ] Có bảng `users` (email unique, password hash bằng scrypt có salt, isAdmin, locked, createdAt).
- [ ] Seeder tạo `admin@dump-exam.local` với mật khẩu lấy từ `ADMIN_PASSWORD`, chỉ tạo khi Admin chưa tồn tại. Thiếu biến thì báo lỗi rõ ràng và dừng. Mật khẩu không xuất hiện trong code hoặc git.
- [ ] Đăng nhập tạo cookie phiên httpOnly, ký HMAC bằng `SESSION_SECRET`, hết hạn sau 30 ngày. Đăng xuất xoá cookie.
- [ ] Mọi trang trừ trang đăng nhập yêu cầu đăng nhập. Mỗi request đọc lại User từ DB, nên User bị khoá mất phiên ngay ở request kế tiếp.
- [ ] Sai email hoặc sai mật khẩu đều trả cùng một thông báo "Email hoặc mật khẩu không đúng".
- [ ] Test ở mức hàm nghiệp vụ: đăng nhập đúng, sai mật khẩu, User bị khoá; seeder chạy hai lần; seeder thiếu `ADMIN_PASSWORD`.
