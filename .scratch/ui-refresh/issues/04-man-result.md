# 04 — Màn Result

**What to build:** Result của Attempt đã nộp dùng lại bố cục màn làm bài ở chế độ chỉ đọc, xem từng câu, lưới tô xanh/đỏ, có thanh % vote và tab lọc. Spec: `.scratch/ui-refresh/spec.md` (quyết định 8).

**Blocked by:** 03 — Màn làm bài

**Status:** resolved

**Model:** Sonnet 5.5 (~1,5 giờ). Review bằng Opus 5.5.

- [x] Đầu trang: tên Exam, Score X/180 (%), bấm giờ hay không, thời gian làm.
- [x] Dùng lại bố cục và lưới của màn làm bài: ô xanh = đúng, đỏ = sai (kể cả bỏ trống), vẫn có viền đánh dấu; mỗi lần một câu, phím ← → dùng được.
- [x] Mỗi Choice hiện lựa chọn của User, Correct Answer, Suggested Answer và thanh % vote. Màu dùng token, đọc được ở dark mode.
- [x] Tab lọc Tất cả / Sai / Đánh dấu; lưới và Trước/Sau chỉ đi qua các câu trong tab đang chọn.
- [x] Cập nhật test e2e (nộp xong thấy Result, lọc câu sai). Ảnh chụp mobile và desktop vào `.scratch/ui-refresh/screenshots/04-*`.

## Comments

- `app/attempts/[id]/result-screen.tsx` (client) dùng `QuestionLayout` + `usePosition`, chỉ đọc (không `onCommand`/`actions`). Page tải đủ 180 câu một lần (`getResult` không truyền filter nữa; tham số filter vẫn giữ, có test). Tab Tất cả/Sai/Đánh dấu lọc phía client; `?f=` và `?q=` cập nhật bằng `replaceState`; đổi tab mà câu hiện tại không thuộc tab thì nhảy tới câu đầu của tab. Tab rỗng có thông báo.
- Luật thuần `resultCell`, `inTab` trong `logic.ts`, test ở `tests/attempt-screen.test.ts`. Ô: xanh/đỏ theo token; câu đánh dấu viền `border-marked` dày 2px.
- Mỗi Choice: badge "Bạn chọn", "Correct Answer", "Suggested Answer" (chỉ khi khác Correct Answer) và thanh % vote (`role="meter"`).
- Chữ "đã nộp" không còn ở header; e2e chờ Score `N/180`. Dữ liệu seed e2e không có Vote nên ảnh chụp luôn 0% và toàn ô đỏ.
- Ảnh: `SHOTS=04 npm run e2e -- screenshots` → `04-desktop`, `04-desktop-dark`, `04-mobile`, `04-mobile-drawer`, và `-sai` cho mỗi bản.
- Header chung với màn làm bài: `Điểm: X/180 (Y%)`, thống kê Đúng/Sai/Bỏ trống/Đánh dấu (Sai không gồm bỏ trống), meta `Thi thử · thời gian / 230 phút` hoặc `Luyện tập · thời gian` (`formatDuration` trong `logic.ts`, có test). Tab có số đếm (tab Sai gồm câu bỏ trống, theo luật Score); desktop tab nằm trên lưới ở cột phải, mobile dưới dòng 3.
