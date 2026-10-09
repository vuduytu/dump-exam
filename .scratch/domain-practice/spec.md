# Ôn theo chủ đề (Drill theo Domain / Task)

Chốt qua buổi grilling ngày 2026-10-09. Thuật ngữ theo `CONTEXT.md`: **Domain**, **Task**, **Approach**, **Drill** (mới), Timed Attempt đổi sang 240 phút.

## Vấn đề

Ngân hàng 1.229 Question dùng được chỉ chia thành 7 Exam ngẫu nhiên. User không thể tập trung ôn phần mình yếu, và không biết mình yếu Domain/Task nào. Dữ liệu ExamTopics không có nhãn domain.

## Nguồn phân loại

PMP Examination Content Outline July 2026 (đề thi từ tháng 7/2026): People 33% (8 Task), Process 41% (10 Task), Business Environment 26% (8 Task) — tổng 26 Task. Khoảng 40% predictive, 60% agile/hybrid. Chi tiết và danh sách Task: `.scratch/domain-practice/research-eco.md`.

## Quyết định

1. **Nhãn:** mỗi Question (kể cả Unusable Question) gắn đúng **một Task chính** (qua đó thuộc một Domain), **một Approach** (Predictive / Agile / Hybrid) và **mức tin cậy** (high / medium / low). Không cho một câu thuộc nhiều Task.
2. **Cách phân loại:** không dùng Claude API. Dùng subagent của Claude Code trong một phiên: chia ~1.250 câu thành ~13 lô × ~100 câu, mỗi subagent nhận danh sách 26 Task và ghi `data/tags/lot-NN.json`; chạy tối đa 4 lô song song. Một script gộp thành `data/question-tags.json` và kiểm tra đủ câu, mã Task hợp lệ, không trùng.
3. **Duyệt:** chủ dự án duyệt toàn bộ câu tin cậy thấp và 30 câu ngẫu nhiên trước khi seed. Nhãn là dữ liệu cố định trong repo, không phân loại lại lúc chạy.
4. **Drill:**
   - Nguồn: một Domain hoặc một Task. Số câu: 10 hoặc 20.
   - Rút câu lúc bắt đầu: ưu tiên Question User **chưa từng làm**, rồi câu **làm sai lần gần nhất**, rồi ngẫu nhiên phần còn lại. "Đã làm" tính trên mọi Attempt đã nộp của User (Exam và Drill).
   - Không bao giờ rút Unusable Question. Task có ít câu hơn số yêu cầu thì lấy hết câu đang có.
   - Làm như một Attempt không bấm giờ: dùng lại màn làm bài và màn Result; nộp xong mới xem đáp án; có Score; hiện trong Lịch sử.
   - Một Attempt thuộc **hoặc** một Exam **hoặc** một Drill.
5. **Trang "Theo chủ đề":** bảng Domain → Task gồm số câu đã làm / tổng câu dùng được, % đúng, nút "Ôn 10" / "Ôn 20"; có hàng ôn theo cả Domain. Sắp % đúng từ thấp lên trong mỗi Domain. Task không có câu nào thì hiện mờ, ghi "chưa có câu". Số liệu chỉ của chính User.
6. **Result của Exam:** thêm khối điểm theo Domain (ví dụ "People 62% · Process 55% · Business Environment 40%").
7. **Timed Attempt:** 240 phút thay cho 230 (đề thi mới). Attempt bấm giờ đang làm dở được cộng thêm 10 phút.

## Rủi ro đã biết

Câu ExamTopics viết theo ECO 2021, nên Business Environment có thể có ít câu. Ticket 01 báo cáo số câu thật theo từng Domain/Task.

## Ngoài phạm vi

Chế độ xem đáp án ngay sau mỗi câu, Drill bấm giờ, bảng xếp hạng.
