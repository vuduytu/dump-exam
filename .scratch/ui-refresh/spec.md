# UI refresh

Chốt qua buổi grilling ngày 2026-10-09. Thuật ngữ theo `CONTEXT.md` (thêm **Untimed Attempt**, **Result**).

## Vấn đề

UI hiện tại xấu và khó dùng: không có header chung, nút mỗi chỗ một kiểu, đồng hồ trôi mất khi cuộn, lưới 1–180 cố định 10 cột ở cuối trang, mỗi lần đổi câu phải tải lại từ server, `confirm()` của trình duyệt, dark mode hỏng màu, hàng Exam ở trang chủ tràn trên mobile, trang Result mở hết 180 câu.

## Quyết định

1. **Ưu tiên:** màn làm bài trước, rồi header và component dùng chung.
2. **Thiết bị:** mobile-first, desktop tận dụng khoảng trống.
3. **Component:** shadcn/ui (Button, Card, Dialog, Badge, Progress, Sheet/Drawer). Thay mọi `confirm()` bằng Dialog.
4. **Theme "Calm Focus":**
   - Nền slate trung tính, một màu nhấn `blue-600`.
   - Đúng / sai / đánh dấu = xanh lá / đỏ / hổ phách, có biến thể dark mode (không viết cứng `bg-green-50`…).
   - Font **Be Vietnam Pro** qua `next/font/google`; bỏ `font-family: Arial` trong `globals.css`.
   - Nội dung Question 17–18px, line-height 1.7, khoảng 70 ký tự mỗi dòng.
   - Không gradient, không bóng đổ nặng.
   - Dark mode theo hệ điều hành.
   - Nút đánh dấu có icon cờ; lưới câu mở được ở mọi màn làm bài.
5. **Trang chủ:** danh sách thẻ Exam (tên, số câu, điểm cao nhất, badge "đang làm dở"). Bấm thẻ → `/exams/[id]`.
6. **Trang `/exams/[id]`:**
   - Tiêu đề, số câu, điểm cao nhất.
   - Hai thẻ: "Thi thử 230 phút" (giống thi thật, đóng tab đồng hồ vẫn chạy) và "Luyện tập không bấm giờ". Mỗi thẻ một dòng giải thích hậu quả.
   - Có Attempt dở: thay bằng thẻ "Làm tiếp" (số câu đã làm, thời gian còn lại nếu là Timed Attempt) và nút "Bỏ, làm lại" có Dialog xác nhận.
   - Dưới cùng: các Attempt đã nộp của Exam này.
7. **Màn làm bài:**
   - Desktop: Question cột trái ~2/3; cột phải sticky gồm đồng hồ, thanh tiến độ (đã làm X/180), lưới 1–180, nút Nộp.
   - Mobile: thanh trên sticky ("Câu 12/180", đồng hồ, nút mở lưới dạng drawer từ dưới lên); thanh dưới sticky (← Trước, Đánh dấu, Sau →).
   - Chuyển câu phía client: tải đủ 180 câu một lần, đổi câu tức thì; URL vẫn phản ánh câu hiện tại.
   - Phím tắt: ← → đổi câu, `A`–`E` chọn/bỏ Choice (câu nhiều đáp án vẫn giới hạn N), `M` đánh dấu. Không bắt phím khi đang gõ trong ô nhập. Dòng gợi ý phím tắt chỉ hiện trên desktop.
   - Có trạng thái "đang lưu / đã lưu / lỗi" cho đáp án và đánh dấu.
8. **Màn Result:** dùng lại bố cục màn làm bài ở chế độ chỉ đọc. Ô lưới xanh = đúng, đỏ = sai, vẫn có viền đánh dấu. Mỗi lần một câu. Dưới mỗi Choice có thanh % vote. Tab lọc: Tất cả / Sai / Đánh dấu.
9. **Login, History, Account, Admin:** chỉ đổi sang component và header dùng chung, không đổi bố cục.
10. **Kiểm tra UI:** Playwright + một test e2e luồng chính (đăng nhập → vào Exam → bắt đầu → chọn Choice → nộp → xem Result), User test có mật khẩu trong `.env.test`. Mỗi ticket UI chụp ảnh mobile (390px) và desktop (1280px) vào `.scratch/ui-refresh/screenshots/` để chủ dự án duyệt.

## Ngoài phạm vi

Không đổi logic nghiệp vụ trong `lib/`, trừ khi màn mới cần thêm dữ liệu (ví dụ số câu đã làm của Attempt dở).
