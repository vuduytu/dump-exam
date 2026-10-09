# 10 — Quản lý User và mật khẩu

**What to build:** Admin dùng trang quản trị để tạo User, đặt lại mật khẩu, khoá hoặc mở khoá User. Mọi User tự đổi được mật khẩu ở trang "Tài khoản". Spec: user story 16, 21–27.

**Blocked by:** 02 — Đăng nhập và Admin seeder

**Status:** resolved

**Model:** Sonnet 5.5 — CRUD dùng lại hash và session của 02 (~2 giờ). Review bằng Opus 5.5.

- [x] Có các hàm `listUsers`, `createUser`, `resetPassword`, `setLocked`. Tất cả yêu cầu User gọi là Admin.
- [x] `createUser` từ chối email trùng hoặc sai định dạng.
- [x] `setLocked` từ chối khi Admin tự khoá chính mình. Khoá User không xoá lịch sử Attempt.
- [x] `changePassword` yêu cầu nhập đúng mật khẩu cũ.
- [x] UI: trang Admin (danh sách và các form) chỉ hiện cho Admin; trang Tài khoản cho mọi User.
- [x] Test: User thường gọi hàm Admin bị từ chối; email trùng; Admin tự khoá mình; sau khi đặt lại mật khẩu thì đăng nhập được bằng mật khẩu mới; `changePassword` sai mật khẩu cũ bị từ chối.

## Comments

- Hàm Admin ở `lib/users.ts` nhận `actingId`, đọc lại User từ DB và ném `NotAdmin` nếu không phải Admin (hoặc đang bị khoá). `changePassword` ở `lib/auth.ts`.
- Spec không nêu luật mật khẩu; thêm tối thiểu 8 ký tự (`WeakPassword`) cho tạo, đặt lại và đổi mật khẩu.
- UI chưa kiểm khi đã đăng nhập (không có mật khẩu Admin thật); chỉ kiểm chưa đăng nhập `/admin`, `/account` về `/login`.
