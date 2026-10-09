# 03 — Màn làm bài

**What to build:** Màn làm bài đổi câu tức thì, đồng hồ và điều hướng luôn trong tầm mắt, lưới câu dùng được trên mobile, có phím tắt. Spec: `.scratch/ui-refresh/spec.md` (quyết định 7).

**Blocked by:** 01 — Nền móng

**Status:** resolved

**Model:** Opus 5.5 (~3 giờ). Review bằng Opus 5.5.

- [x] Desktop (≥1024px): Question cột trái ~2/3; cột phải sticky gồm đồng hồ (Timed Attempt), thanh tiến độ "đã làm X/180", lưới 1–180, nút Nộp.
- [x] Mobile: thanh trên sticky ("Câu N/180", đồng hồ, nút mở lưới dạng drawer); thanh dưới sticky (← Trước, Đánh dấu có icon cờ, Sau →).
- [x] Chuyển câu phía client, không tải lại server; URL `?q=N` vẫn đúng, tải lại trang mở đúng câu. Lưới phản ánh ngay trạng thái chưa làm / đã làm / đánh dấu.
- [x] Mỗi lựa chọn và đánh dấu vẫn lưu lên server ngay, có trạng thái đang lưu / đã lưu / lỗi. Attempt hết giờ hoặc đã nộp thì chuyển sang Result như hiện tại.
- [x] Phím tắt ← →, `A`–`E` (câu nhiều đáp án giới hạn N), `M`; không bắt phím khi đang gõ. Gợi ý phím tắt chỉ hiện trên desktop.
- [x] Dialog nộp bài hiện "Còn X câu chưa trả lời, Y câu đánh dấu". Cập nhật test e2e (đổi câu bằng phím, đánh dấu, nộp). Ảnh chụp mobile (kể cả drawer mở) và desktop vào `.scratch/ui-refresh/screenshots/03-*`.

## Comments

- Dùng lại cho 04: `app/attempts/[id]/question-layout.tsx` — `QuestionLayout` (bố cục desktop 2/3 + cột phải sticky, thanh trên/dưới mobile, drawer lưới, phím ←/→) và `usePosition` (`?q=N` qua `history.replaceState`). Truyền `cells` (`{pos, className, label}`; lọc tab thì truyền danh sách đã lọc, Trước/Sau tự đi theo), `timer`/`side`/`footer`/`actions` tuỳ chọn; Result bỏ `onCommand` và `actions` là chỉ đọc, gợi ý phím tự rút còn "← →".
- Luật thuần trong `app/attempts/[id]/logic.ts` (`keyCommand`, `toggleChoice`, `attemptCell`), test ở `tests/attempt-screen.test.ts`. Result viết hàm ô riêng (đúng/sai + viền đánh dấu).
- `attempt-screen.tsx` giữ state 180 câu; lưu lạc quan, chỉ request mới nhất của mỗi câu/field được rollback về giá trị server đã xác nhận. Action redirect (hết giờ/đã nộp) thì router tự chuyển sang Result.
- Bỏ `revalidatePath` trong `saveAnswerAction`/`toggleMarkAction`: màn tự giữ state, revalidate sẽ gửi lại cả 180 câu mỗi lần bấm. Không đổi check nào ở server.
- Lệch nhỏ: `Countdown` mount hai lần (thanh mobile + cột desktop), hết giờ có thể gọi nộp hai lần — vô hại vì `AttemptSubmitted` được bỏ qua. Nút Nộp trên mobile nằm trong drawer lưới.
- E2E chờ `networkidle` trước khi bấm phím (phím bấm trước hydrate bị mất). Ảnh: `SHOTS=03 npm run e2e -- screenshots` → `03-desktop`, `03-desktop-dark`, `03-desktop-timed`, `03-mobile`, `03-mobile-drawer`.
- Sửa sau review ba104b8: lỗi lưu theo dõi riêng từng câu/field (`failed` là Set key), báo "Không lưu được Câu N…" tới khi chính lần lưu mới nhất của key đó thành công. `toggleMark` → `setMark(…, marked)` (giá trị tường minh, lặp lại vô hại). ←/→ luôn `preventDefault` kể cả ở câu đầu/cuối; bỏ qua `repeat` (chữ cái, M) và `isComposing`. `?q=` rác/lẻ/ngoài khoảng → `Math.trunc` + kẹp, mặc định 1. Fieldset 1 đáp án có legend ẩn "Chọn 1 lựa chọn"; gợi ý phím "A–E: chọn".
- Back/Forward: `components/refresh-on-return.tsx` (`RefreshOnReturn renderId`) gọi `router.refresh()` chỉ khi mount lại một bản render đã hiển thị (Router Cache) hoặc `pageshow.persisted`; lần vào đầu không tốn thêm request. Gắn ở Attempt, `/exams/[id]`, home. `AttemptScreen` nhận `questions` mới thì thay state, trừ field còn đang lưu; `usePosition` theo `initialPos` mới. E2E: trả lời → Lịch sử → Back → câu vẫn đã trả lời/đánh dấu (đã thử tắt refresh thì đỏ).
- Header chung (`QuestionLayout`: `examName`/`meta`/`figure`/`stats`/`tabs`): dòng 1 `Đề N · Câu X/180` (thanh trên cùng trên mobile, cắt tên đề nếu dài) + meta bên phải, dòng 2 số chính (`Đã làm: X/180 (Y%)`), dòng 3 thống kê `Stats` bằng token theme. Bỏ chữ "Đã làm X/180" ở cột phải, giữ thanh tiến độ và Countdown.
