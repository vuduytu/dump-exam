# Khuyến nghị model theo ticket

**Quy tắc:** ticket dựng nền móng hoặc dính bảo mật, transaction, thời gian thì dùng **Opus 5.5**. Ticket chủ yếu là UI hoặc CRUD xây trên nền đã có thì dùng **Sonnet 5.5**. Mọi ticket đều chạy `/code-review` bằng Opus 5.5 trước khi commit.

**Thứ tự chạy:** 01 → 02 → 03 → 04 → 05, sau đó 06, 07, 08, 09, 10 theo thứ tự tuỳ ý.

## Nhóm A: Opus 5.5

| Ticket | Lý do | Thời gian |
|---|---|---|
| 01 Import Question | Hạ tầng test và DB mà 9 ticket sau dùng lại | ~2 giờ |
| 02 Đăng nhập + Admin seeder | Bảo mật: scrypt, ký cookie HMAC, không để lộ email nào tồn tại | ~1,5 giờ |
| 05 Attempt tối thiểu | Luồng chính cho 06–09, gồm chấm điểm và kiểm quyền sở hữu | ~2,5 giờ |
| 09 Timed Attempt | Deadline phía server, tham số `now`, tự nộp khi hết giờ | ~2 giờ |

## Nhóm B: Sonnet 5.5

| Ticket | Lý do | Thời gian |
|---|---|---|
| 04 Tạo Exam | PRNG có seed và chia nhóm, spec đã rõ | ~1,5 giờ |
| 06 Kết quả + Lịch sử | Phần lớn là đọc dữ liệu và làm UI | ~2 giờ |
| 07 Đánh dấu + lưới câu | UI cộng một hàm toggle | ~1,5 giờ |
| 08 Làm tiếp / Bỏ | Có transaction nhưng phạm vi nhỏ. Viết lại 2 lần vẫn hỏng thì chuyển sang Opus | ~1,5 giờ |
| 10 Quản lý User | CRUD dùng lại hash và session của ticket 02 | ~2 giờ |

## Nhóm C: chủ dự án tự làm

| Ticket | Ghi chú | Thời gian |
|---|---|---|
| 03 Deploy Vercel + TiDB | Tạo cluster và project trên dashboard là việc của chủ dự án. Phần code TLS và README giao Sonnet 5.5 | ~30 phút code + ~1 giờ thao tác dashboard |
