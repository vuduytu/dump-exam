# 03 — Deploy Vercel và TiDB

**What to build:** Bản có đăng nhập của ticket 02 chạy trên Vercel và kết nối TiDB Cloud Serverless qua TLS. Admin đăng nhập được trên URL thật. Làm sớm để phát hiện sớm lỗi kết nối và TLS. Spec: user story 55, 57.

**Blocked by:** 02 — Đăng nhập và Admin seeder

**Status:** ready-for-human

**Model:** Người làm dashboard (~1 giờ). Code TLS + README giao Sonnet 5.5 (~30 phút). Review bằng Opus 5.5.

- [ ] Chủ dự án tạo cluster TiDB Cloud Serverless và project Vercel (bước người làm, AI không làm thay).
- [ ] Kết nối DB bật TLS khi chạy trên TiDB, local MAMP vẫn chạy được không cần TLS.
- [ ] Đặt `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_PASSWORD` trong Vercel Environment Variables.
- [ ] Đã tạo schema và chạy seed lên TiDB.
- [ ] Đăng nhập Admin thành công trên URL Vercel. Có ghi chú ngắn các lệnh deploy và seed trong README.
