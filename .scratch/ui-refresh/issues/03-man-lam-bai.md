# 03 — Màn làm bài

**What to build:** Màn làm bài đổi câu tức thì, đồng hồ và điều hướng luôn trong tầm mắt, lưới câu dùng được trên mobile, có phím tắt. Spec: `.scratch/ui-refresh/spec.md` (quyết định 7).

**Blocked by:** 01 — Nền móng

**Status:** ready-for-agent

**Model:** Opus 5.5 (~3 giờ). Review bằng Opus 5.5.

- [ ] Desktop (≥1024px): Question cột trái ~2/3; cột phải sticky gồm đồng hồ (Timed Attempt), thanh tiến độ "đã làm X/180", lưới 1–180, nút Nộp.
- [ ] Mobile: thanh trên sticky ("Câu N/180", đồng hồ, nút mở lưới dạng drawer); thanh dưới sticky (← Trước, Đánh dấu có icon cờ, Sau →).
- [ ] Chuyển câu phía client, không tải lại server; URL `?q=N` vẫn đúng, tải lại trang mở đúng câu. Lưới phản ánh ngay trạng thái chưa làm / đã làm / đánh dấu.
- [ ] Mỗi lựa chọn và đánh dấu vẫn lưu lên server ngay, có trạng thái đang lưu / đã lưu / lỗi. Attempt hết giờ hoặc đã nộp thì chuyển sang Result như hiện tại.
- [ ] Phím tắt ← →, `A`–`E` (câu nhiều đáp án giới hạn N), `M`; không bắt phím khi đang gõ. Gợi ý phím tắt chỉ hiện trên desktop.
- [ ] Dialog nộp bài hiện "Còn X câu chưa trả lời, Y câu đánh dấu". Cập nhật test e2e (đổi câu bằng phím, đánh dấu, nộp). Ảnh chụp mobile (kể cả drawer mở) và desktop vào `.scratch/ui-refresh/screenshots/03-*`.
