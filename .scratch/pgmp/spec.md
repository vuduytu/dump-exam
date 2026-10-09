# PgMP và phân quyền theo Certification

Chốt qua buổi grilling ngày 2026-10-09. Thuật ngữ theo `CONTEXT.md`: **Certification**, **Certification Access**, **Explanation**, **Duplicate Question** (mới). ADR: `docs/adr/0001-pgmp-exam-theo-file.md`.

## Vấn đề

Web hiện chỉ có PMP, và mọi chỗ đều gắn cứng PMP: 180 câu, ECO PMP, Vote của ExamTopics, `questions.id` là số gốc trên ExamTopics. Nhóm cần thêm bộ dump PgMP (`/Volumes/TuVD_Data/Study/PgMP/Atoha_PgMP 1 1 1_From Tuan`), và mỗi User chỉ được thấy Certification mà Admin cho phép.

## Dữ liệu nguồn PgMP

- Có 22 file `.txt` (UTF-8, CRLF), tổng 3023 câu, mỗi file đánh số lại từ 1. Bỏ qua file `Application Form _ TuVD`.
- Đáp án lấy theo dòng `The correct answer is: <text>` hoặc `The correct answers are: x, y` (khoảng 143 câu chọn nhiều đáp án). Khớp đáp án theo **nội dung Choice**, không theo chữ cái. Chú ý nội dung Choice có thể chứa dấu phẩy.
- Có các biến thể sau:
  - Choice viết `a.` (chữ thường) ở 3 file.
  - Có câu 3 Choice và câu 5 Choice.
  - Có dòng nhiễu `The answer is incorrect.` / `Your answer is correct.`, và dòng tiêu đề `Explanation:`.
  - Một stem bắt đầu bằng `:`.
- Khoảng 271 câu không có Explanation. 10 câu không có đáp án.

## Quyết định

1. **Certification Access:** Admin tick PMP/PgMP cho từng User. User đang có tự động được PMP. Form tạo User bắt buộc chọn ít nhất 1 Certification. Admin có quyền với tất cả Certification. Khi gỡ quyền, Exam, Drill, Attempt, Result và Lịch sử của Certification đó bị ẩn (kể cả khi gõ thẳng URL) nhưng không bị xoá.
2. **Chọn Certification:** bộ chọn nằm trong side menu, nhớ lựa chọn gần nhất. Bộ chọn chỉ hiện khi User có từ 2 Certification. Trang chủ, Drill và Lịch sử chỉ hiện nội dung của Certification đang chọn.
3. **Exam PgMP:** mỗi file là 1 Exam, tên Exam là tên file (bỏ `.txt`). Exam xếp theo giờ trong tên file và giữ số câu gốc. Unusable Question (10 câu không có đáp án) bị bỏ khỏi Exam, các câu còn lại không đánh số lại. Câu thiếu hình và câu có chữ cái lệch với đáp án vẫn vào đề. Timed Attempt là 240 phút.
4. **Duplicate Question:** không gộp câu trùng. Hai câu coi là trùng khi nội dung stem giống nhau sau khi bỏ hoa thường và ký tự không phải chữ/số. Lúc làm bài và trong Result đều hiện "Trùng: <tên Exam> · Câu N" (liệt kê hết nếu trùng nhiều câu).
5. **Result:** câu PgMP hiện Explanation (nếu có) ở vị trí PMP đang hiện tỉ lệ Vote. PgMP không có Vote, không có Most Voted. Correct Answer bằng Suggested Answer.
6. **Domain/Task PgMP:** theo ECO PgMP mới nhất (cần tra cứu, ghi vào `research-eco.md`). AI gắn nhãn giống cách làm với PMP (subagent chia lô, mỗi lô ghi `data/tags/...`). 450 nhãn ECO cũ có sẵn trong 3 file 150 câu chỉ dùng để đối chiếu. PgMP không có Approach. Drill PgMP dùng cùng quy tắc với PMP.
7. **Scoreboard:** chia tab PMP / PgMP. Mỗi tab chỉ gồm User có Certification Access tương ứng.

## Ngoài phạm vi

Gộp câu trùng, hình minh hoạ cho các câu nhắc tới chart/table, Certification thứ ba.
