# 10 — Quản lý User và mật khẩu

**What to build:** Admin dùng trang quản trị để tạo User, đặt lại mật khẩu, khoá hoặc mở khoá User. Mọi User tự đổi được mật khẩu ở trang "Tài khoản". Spec: user story 16, 21–27.

**Blocked by:** 02 — Đăng nhập và Admin seeder

**Status:** ready-for-agent

**Model:** Sonnet 5.5 — CRUD dùng lại hash và session của 02 (~2 giờ). Review bằng Opus 5.5.

- [ ] Có các hàm `listUsers`, `createUser`, `resetPassword`, `setLocked`. Tất cả yêu cầu User gọi là Admin.
- [ ] `createUser` từ chối email trùng hoặc sai định dạng.
- [ ] `setLocked` từ chối khi Admin tự khoá chính mình. Khoá User không xoá lịch sử Attempt.
- [ ] `changePassword` yêu cầu nhập đúng mật khẩu cũ.
- [ ] UI: trang Admin (danh sách và các form) chỉ hiện cho Admin; trang Tài khoản cho mọi User.
- [ ] Test: User thường gọi hàm Admin bị từ chối; email trùng; Admin tự khoá mình; sau khi đặt lại mật khẩu thì đăng nhập được bằng mật khẩu mới; `changePassword` sai mật khẩu cũ bị từ chối.
