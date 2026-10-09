# 03 — Deploy Vercel và TiDB

**What to build:** Bản có đăng nhập của ticket 02 chạy trên Vercel và kết nối TiDB Cloud Serverless qua TLS. Admin đăng nhập được trên URL thật. Làm sớm để phát hiện sớm lỗi kết nối và TLS. Spec: user story 55, 57.

**Blocked by:** 02 — Đăng nhập và Admin seeder

**Status:** ready-for-human

**Model:** Người làm dashboard (~1 giờ). Code TLS + README giao Sonnet 5.5 (~30 phút). Review bằng Opus 5.5.

- [ ] Chủ dự án tạo cluster TiDB Cloud Serverless và project Vercel (bước người làm, AI không làm thay).
- [x] Kết nối DB bật TLS khi chạy trên TiDB, local MAMP vẫn chạy được không cần TLS.
- [ ] Đặt `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_PASSWORD` trong Vercel Environment Variables.
- [ ] Đã tạo schema và chạy seed lên TiDB.
- [ ] Đăng nhập Admin thành công trên URL Vercel. Có ghi chú ngắn các lệnh deploy và seed trong README.

## Comments

- Code TLS xong (`db/connection.ts`, dùng bởi `db/index.ts` và `drizzle.config.ts`) nhưng CHƯA kiểm chứng với TiDB thật. `npm run build`, tsc, eslint, test đều pass. Migration là MySQL 8 thuần, không cần sửa.
- README đã có mục Deploy; ô cuối chưa tick vì chưa đăng nhập được trên URL thật.

Việc còn lại cho người làm:

1. Tạo cluster TiDB Cloud Serverless, tạo database, lấy host/user/password (port 4000).
2. Chạy `DATABASE_URL=... npm run db:migrate` rồi `DATABASE_URL=... ADMIN_PASSWORD=... npm run db:seed` từ máy local (xem README). Nếu lỗi TLS, báo lại.
3. Tạo project Vercel từ repo, đặt `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_PASSWORD` trong Environment Variables.
4. Deploy (push `main` hoặc `npx vercel --prod`).
5. Đăng nhập `admin@dump-exam.local` trên URL Vercel, rồi tick các ô còn lại và đổi Status.
