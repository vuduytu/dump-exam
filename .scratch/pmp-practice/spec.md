# PMP Practice — Spec

Status: ready-for-agent
Created: 2026-10-09

Thuật ngữ in đậm theo `CONTEXT.md`. Spec này không có ADR liên quan.

## Problem Statement

Tôi có một file HTML lưu 1.250 câu hỏi PMP từ ExamTopics. Đọc thẳng file này thì không luyện thi được:
- Không làm bài được theo đề 180 câu như thi thật.
- Không bấm giờ được.
- Không chấm điểm được.
- Không xem lại được các lần đã làm.

Vài người trong nhóm cũng muốn luyện cùng bộ câu này. Mỗi người cần có kết quả riêng.

## Solution

Làm một website riêng cho nhóm nhỏ, không mở ra public.
- Toàn bộ **Question** được import một lần vào database.
- Từ các Question dùng được, hệ thống chia sẵn khoảng 7 **Exam** cố định, mỗi Exam 180 câu.
- **User** đăng nhập bằng email và mật khẩu do **Admin** tạo.
- User chọn một Exam, chọn làm có bấm giờ (230 phút) hoặc không, trả lời, đánh dấu câu để xem lại rồi nộp bài.
- Sau mỗi **Attempt**, User xem được **Score** và xem lại từng câu: mình chọn gì, **Correct Answer** là gì, **Suggested Answer** là gì, tỉ lệ vote ra sao.
- Admin quản lý User trên trang quản trị.

## User Stories

### Import và ngân hàng câu hỏi

1. As a chủ dự án, I want chạy một lệnh để đọc file HTML của ExamTopics và lưu toàn bộ Question vào database, so that không phải nhập tay 1.250 câu.
2. As a chủ dự án, I want mỗi Question giữ số thứ tự gốc (`Question #N`), so that đối chiếu được với nguồn khi thấy câu có vấn đề.
3. As a chủ dự án, I want mỗi Question lưu cả Suggested Answer, **Most Voted Answer** và số vote của từng phương án, so that trang kết quả hiển thị được đủ các nguồn đáp án.
4. As a chủ dự án, I want Correct Answer được lấy theo Most Voted Answer, và chỉ khi không có vote mới lấy Suggested Answer, so that điểm phản ánh ý kiến cộng đồng thay vì đáp án site đưa ra, vốn hay sai.
5. As a chủ dự án, I want Question thiếu **Choice** hoặc thiếu Correct Answer (kéo thả, đáp án là ảnh) được lưu và đánh dấu **Unusable Question**, so that dữ liệu đủ nhưng các câu này không bao giờ vào Exam.
6. As a chủ dự án, I want ảnh trong đề được lưu cùng website thay vì trỏ về ExamTopics, so that đề vẫn hiển thị đúng khi link gốc chết.
7. As a chủ dự án, I want nội dung HTML của câu hỏi được lọc chỉ còn vài thẻ định dạng an toàn, so that nội dung scrape về không chèn được script vào trang.
8. As a chủ dự án, I want import chạy lại nhiều lần trên cùng file vẫn ra cùng kết quả mà không nhân đôi dữ liệu, so that tôi sửa lỗi import thoải mái.

### Exam

9. As a chủ dự án, I want hệ thống tạo sẵn các Exam cố định, mỗi Exam đúng 180 Question và không chứa Unusable Question, so that các Exam giống format thi thật.
10. As a chủ dự án, I want các Exam không trùng câu với nhau, trừ Exam cuối được lấy câu từ Exam khác để đủ 180, so that dùng hết ngân hàng câu với ít trùng lặp nhất.
11. As a chủ dự án, I want việc chia Exam là tất định (cùng dữ liệu thì cùng kết quả), và đã có Exam thì không tạo lại, so that điểm của các Attempt cũ vẫn so sánh được.
12. As a User, I want thứ tự Question trong một Exam luôn cố định, so that làm lại cùng Exam thì so được với lần trước.
13. As a User, I want các Choice giữ thứ tự A/B/C/D(/E) gốc, so that đáp án và tỉ lệ vote ở trang kết quả khớp với chữ cái tôi thấy khi làm bài.

### Đăng nhập và tài khoản

14. As a User, I want đăng nhập bằng email và mật khẩu, so that kết quả của tôi tách riêng với người khác.
15. As a User, I want đăng xuất, so that dùng máy chung vẫn an toàn.
16. As a User, I want tự đổi mật khẩu trên trang "Tài khoản" (phải nhập mật khẩu cũ), so that thay được mật khẩu ban đầu Admin cấp.
17. As a khách chưa đăng nhập, I want mọi trang trừ trang đăng nhập đưa tôi về trang đăng nhập, so that không ai ngoài nhóm xem được đề.
18. As a User bị khoá, I want không đăng nhập được và phiên đang mở cũng mất hiệu lực ở request kế tiếp, so that khoá tài khoản có hiệu lực ngay.
19. As a User nhập sai mật khẩu, I want thông báo chung "Email hoặc mật khẩu không đúng", so that người khác không dò được email nào đã có tài khoản.

### Admin

20. As a chủ dự án, I want lần deploy đầu tiên seeder tạo sẵn Admin `admin@dump-exam.local`, mật khẩu lấy từ biến môi trường `ADMIN_PASSWORD`, so that có người đăng nhập vào trang quản trị mà mật khẩu không nằm trong code.
21. As an Admin, I want xem danh sách User gồm email, trạng thái khoá và ngày tạo, so that biết ai đang có quyền truy cập.
22. As an Admin, I want tạo User mới bằng email và mật khẩu ban đầu, so that thêm người vào nhóm.
23. As an Admin, I want hệ thống từ chối email đã tồn tại hoặc sai định dạng, so that không có tài khoản trùng.
24. As an Admin, I want đặt lại mật khẩu cho một User, so that hỗ trợ người quên mật khẩu, vì hệ thống không có chức năng quên mật khẩu.
25. As an Admin, I want khoá và mở khoá một User mà không xoá lịch sử Attempt của họ, so that thu quyền mà không mất dữ liệu.
26. As an Admin, I want không tự khoá được chính mình, so that hệ thống luôn còn ít nhất một Admin vào được.
27. As a User không phải Admin, I want mọi trang và thao tác quản trị đều trả lỗi không có quyền, so that không ai tự nâng quyền được.

### Làm bài

28. As a User, I want trang chủ liệt kê các Exam kèm điểm cao nhất của tôi và trạng thái "đang làm dở" nếu có, so that chọn được đề để làm tiếp.
29. As a User, I want trước khi bắt đầu được chọn "Bấm giờ 230 phút" hoặc "Không bấm giờ", so that luyện được cả kiểu thi thật lẫn kiểu học chậm.
30. As a User, I want mỗi Exam tôi chỉ có tối đa một Attempt đang làm dở, so that không bị rối giữa nhiều bài dở dang.
31. As a User mở một Exam đang có Attempt dở, I want chọn "Làm tiếp" hoặc "Bỏ, làm lại từ đầu", so that tự quyết định có giữ bài cũ không.
32. As a User chọn "Bỏ", I want Attempt đó bị xoá và không hiện trong lịch sử (**Abandoned Attempt**), so that lịch sử chỉ có các bài đã nộp.
33. As a User, I want xem từng câu một, có nút Trước/Sau, so that tập trung vào một câu mỗi lúc.
34. As a User, I want có lưới số 1–180 để nhảy tới câu bất kỳ, trong đó câu đã trả lời và **Marked Question** có màu khác nhau, so that biết còn câu nào chưa làm hoặc cần xem lại.
35. As a User, I want đánh dấu hoặc bỏ đánh dấu "xem lại" cho một câu, so that quay lại câu chưa chắc trước khi nộp.
36. As a User, I want câu một đáp án dùng radio, còn câu nhiều đáp án dùng checkbox kèm dòng "Chọn N đáp án", so that biết cần chọn bao nhiêu.
37. As a User, I want câu nhiều đáp án không cho chọn quá N lựa chọn, so that không lỡ chọn thừa.
38. As a User, I want mỗi lần chọn hoặc đánh dấu đều được lưu ngay lên server, so that đóng tab hoặc mất mạng rồi quay lại vẫn còn bài.
39. As a User đang làm Timed Attempt, I want thấy đồng hồ đếm ngược, so that canh được thời gian.
40. As a User đang làm Timed Attempt, I want đồng hồ chạy theo giờ thật tính từ lúc bắt đầu, kể cả khi đóng tab, so that giống điều kiện thi thật.
41. As a User đang làm Timed Attempt, I want hết giờ thì bài tự nộp và tôi được chuyển sang trang kết quả, so that không phải tự bấm nộp.
42. As a User quay lại Timed Attempt sau khi đã hết 230 phút, I want Attempt được coi là đã nộp với các đáp án đã lưu trước hạn, so that không lợi dụng việc đóng tab để kéo dài giờ.
43. As a User, I want đáp án gửi lên sau khi hết giờ bị từ chối, so that điểm không bị gian lận qua request trễ.
44. As a User làm bài không bấm giờ, I want để dở bao lâu cũng được, so that học theo nhịp của mình.
45. As a User, I want trước khi nộp thấy xác nhận "Còn X câu chưa trả lời, Y câu đánh dấu. Nộp?", so that không nộp nhầm khi còn sót.
46. As a User, I want Attempt đã nộp không sửa được nữa, so that kết quả giữ đúng như lúc nộp.

### Chấm điểm và kết quả

47. As a User, I want Score tính bằng số câu đúng trên 180 và hiện cả phần trăm, so that biết mình đang ở mức nào.
48. As a User, I want câu nhiều đáp án chỉ tính đúng khi tôi chọn đúng toàn bộ Correct Answer, không thừa không thiếu, so that giống cách chấm của PMI.
49. As a User, I want câu bỏ trống tính là sai, so that điểm phản ánh đúng bài làm.
50. As a User, I want trang kết quả hiện từng câu gồm: tôi chọn gì, Correct Answer, Suggested Answer, tỉ lệ vote từng phương án, và đúng hay sai, so that học được từ lỗi sai.
51. As a User, I want lọc trang kết quả theo "Chỉ câu sai" và "Chỉ câu đã đánh dấu", so that ôn trúng chỗ yếu.
52. As a User, I want trang "Lịch sử" liệt kê mọi Attempt đã nộp (Exam, ngày làm, có bấm giờ hay không, thời gian làm, Score), so that thấy tiến bộ qua các lần.
53. As a User, I want mở lại trang kết quả của bất kỳ Attempt cũ nào, so that ôn lại bất cứ lúc nào.
54. As a User, I want không xem được Attempt hoặc kết quả của người khác, kể cả khi đoán được URL, so that dữ liệu của mỗi người được giữ riêng.

### Vận hành

55. As a chủ dự án, I want deploy được lên Vercel, dùng database TiDB Cloud Serverless (tương thích MySQL), so that gần như không tốn phí hosting.
56. As a chủ dự án, I want chạy được toàn bộ trên máy local với MySQL của MAMP, so that phát triển và test không cần cloud.
57. As a chủ dự án, I want mọi cấu hình nhạy cảm (chuỗi kết nối DB, khoá ký phiên đăng nhập, mật khẩu Admin ban đầu) nằm trong biến môi trường, so that không lộ trong git.

## Implementation Decisions

- **Stack:** Next.js (App Router, TypeScript), Drizzle ORM với driver mysql2, Tailwind. Deploy trên Vercel. Database dùng TiDB Cloud Serverless, kết nối qua TLS. Local dùng MySQL của MAMP. Chỉ có một codebase, không tách backend riêng.
- **Import (module Parser):** đọc file HTML và trả về danh sách Question đã chuẩn hoá. Module đã có bản đầu viết bằng Python stdlib, dùng một lần, ghi ra file JSON trung gian. Seeder TypeScript đọc file JSON đó và upsert vào DB theo số thứ tự gốc. Từ dữ liệu thật, đã xác định:
  - 1.250 câu, trong đó 1.229 câu dùng được và 21 câu Unusable.
  - 53 câu nhiều đáp án, đều có 5 lựa chọn.
  - Suggested Answer trùng Most Voted Answer ở tất cả các câu đã có cả hai.
  - Chỉ 3 ảnh cần cho các câu dùng được.
- **Lọc HTML:** nội dung câu hỏi và lựa chọn chỉ giữ các thẻ `br, img, b, strong, i, em, u, ul, ol, li, p, sub, sup`, bỏ mọi thuộc tính, riêng `img` chỉ giữ `src` đã đổi sang đường dẫn local. Trang web render đoạn HTML đã lọc này.
- **Module nghiệp vụ (seam test chính):** một lớp hàm server thuần, nhận User hiện tại và tham số, đọc/ghi DB, ném lỗi nghiệp vụ có tên. Server action và trang chỉ gọi lại các hàm này:
  - Exam: `generateExams()` tạo các Exam nếu chưa có. Dùng PRNG có seed cố định để xáo các Question dùng được, chia thành nhóm 180 câu, rồi bù Exam cuối bằng câu đầu tiên của các Exam khác, không trùng câu trong cùng một Exam.
  - Attempt:
    - `startAttempt(user, examId, timed)`: nếu đã có Attempt dở thì trả lỗi `AttemptInProgress`.
    - `abandonAttempt(user, attemptId)`
    - `saveAnswer(user, attemptId, questionId, letters)`: kiểm tra đúng chủ, chưa nộp, còn giờ, các chữ cái hợp lệ và không vượt số đáp án cần chọn.
    - `toggleMark(user, attemptId, questionId)`
    - `submitAttempt(user, attemptId)`
    - `getAttempt(user, attemptId)`: nếu là Timed Attempt đã quá hạn thì tự chốt nộp trước khi trả về.
    - `getResult(user, attemptId)`
    - `listAttempts(user)`
  - Tài khoản: `login(email, password)`, `changePassword(user, old, new)`.
  - Admin: `createUser`, `resetPassword`, `setLocked` (từ chối khi Admin tự khoá mình), `listUsers`. Tất cả đều yêu cầu `user.isAdmin`.
- **Hạn của Timed Attempt:** deadline = thời điểm bắt đầu + 230 phút, tính ở server. Đồng hồ phía client chỉ để hiển thị và gọi nộp khi về 0. Hệ thống không chạy job nền: Attempt quá hạn được chốt ở request kế tiếp chạm vào Attempt đó. Score của Attempt quá hạn chỉ tính các đáp án lưu trước deadline.
- **Một Attempt dở cho mỗi cặp (User, Exam):** kiểm trong một transaction ở `startAttempt`, vì MySQL không có partial unique index.
- **Chấm điểm:** một câu đúng khi tập chữ cái User chọn bằng đúng tập chữ cái của Correct Answer. Score được tính và lưu lại lúc nộp, gồm số câu đúng và tổng 180, nên trang lịch sử không phải tính lại.
- **Mật khẩu:** băm bằng `scrypt` của Node (thư viện chuẩn), có salt riêng cho từng User. Không thêm thư viện bcrypt.
- **Phiên đăng nhập:** cookie `httpOnly`, `secure`, `sameSite=lax`, chứa userId và thời hạn, ký HMAC bằng `SESSION_SECRET`. Mỗi request đọc lại User từ DB để áp dụng ngay trạng thái khoá. Hết hạn sau 30 ngày.
- **Schema (khái niệm):**
  - `users` (email unique, password hash, isAdmin, locked, createdAt)
  - `questions` (id = số gốc, text, choices JSON, suggestedAnswer, mostVotedAnswer, correctAnswer, votes JSON, usable)
  - `exams` (id, tên)
  - `exam_questions` (examId, position 1–180, questionId)
  - `attempts` (userId, examId, timed, startedAt, submittedAt null, score null)
  - `attempt_answers` (attemptId, questionId, selected, marked, updatedAt; khoá chính (attemptId, questionId))
- **Seeder:** idempotent, chạy theo thứ tự: upsert Question → `generateExams()` nếu chưa có Exam → tạo Admin `admin@dump-exam.local` với mật khẩu lấy từ `ADMIN_PASSWORD` nếu Admin chưa tồn tại. Thiếu `ADMIN_PASSWORD` thì seeder báo lỗi và dừng.
- **Biến môi trường:** `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_PASSWORD`.
- **Ảnh:** nằm trong thư mục tĩnh của web và deploy cùng code. Không dùng dịch vụ lưu file.

## Testing Decisions

- Test chỉ kiểm hành vi nhìn thấy từ ngoài seam: gọi hàm, nhận kết quả hoặc lỗi, đọc lại qua hàm khác. Không kiểm SQL bên trong, không mock DB.
- **Seam 1 (Parser):** một file HTML mẫu khoảng 5 card, cắt từ file thật, gồm: câu một đáp án, câu nhiều đáp án, câu kéo thả không có lựa chọn, câu có ảnh, câu có thẻ lạ hoặc script trong nội dung. Kiểm: số câu, lựa chọn, Suggested/Most Voted/Correct Answer, cờ usable, đường dẫn ảnh, nội dung không còn thẻ ngoài danh sách cho phép.
- **Seam 2 (module nghiệp vụ):** chạy với một MySQL test thật (database riêng trên MAMP, mỗi test file reset dữ liệu). Thời gian được truyền vào dạng tham số `now` để test hết giờ mà không phải chờ. Các ca bắt buộc:
  - `generateExams`: mỗi Exam đúng 180 câu, không có câu Unusable, không trùng câu trong một Exam, chạy hai lần ra cùng kết quả.
  - Chấm điểm: câu một đáp án đúng/sai, câu nhiều đáp án chọn đủ / thiếu / thừa, câu bỏ trống.
  - Một Attempt dở: `startAttempt` lần hai bị từ chối; sau `abandonAttempt` thì bắt đầu lại được và Attempt bị bỏ không có trong `listAttempts`.
  - Timed Attempt: `saveAnswer` sau deadline bị từ chối; `getAttempt` sau deadline trả về trạng thái đã nộp với Score chỉ tính đáp án trước deadline.
  - Quyền: User A không đọc hoặc ghi được Attempt của User B; User thường gọi hàm Admin bị từ chối; Admin không tự khoá được mình.
  - Tài khoản: User bị khoá không `login` được; `changePassword` sai mật khẩu cũ bị từ chối; `resetPassword` xong thì đăng nhập được bằng mật khẩu mới.
  - Seeder: chạy hai lần không nhân đôi dữ liệu; thiếu `ADMIN_PASSWORD` thì báo lỗi.
- **Test runner:** dùng `node:test` có sẵn của Node, chạy qua `tsx`. Không thêm framework test.
- **UI:** không viết test tự động, kiểm bằng tay theo luồng: đăng nhập → làm bài → nộp → xem kết quả → Admin tạo User.
- Repo chưa có test nào, nên đây là test đầu tiên.

## Out of Scope

- Exam ngẫu nhiên (rút 180 câu mỗi lần làm).
- Admin xem lịch sử hoặc điểm của User khác.
- Import thêm file mới hoặc cập nhật Exam khi ngân hàng câu thay đổi.
- Chức năng quên mật khẩu, gửi email, User tự đăng ký, đăng nhập Google.
- Xoá User (chỉ khoá).
- Cấp quyền Admin cho User khác qua giao diện. Chỉ có Admin do seeder tạo.
- Hiển thị discussion hoặc giải thích từ ExamTopics.
- Thống kê theo domain hoặc knowledge area của PMP.
- Xáo thứ tự câu hoặc lựa chọn.
- Đa ngôn ngữ (giao diện dùng tiếng Việt, nội dung câu hỏi giữ tiếng Anh gốc).
- Test UI tự động.

## Further Notes

- **Bản quyền:** nội dung câu hỏi thuộc ExamTopics. Website chỉ dùng nội bộ cho nhóm nhỏ, không public, không cho tự đăng ký.
- **Code đã có:** khung Next.js, script parser bản đầu, file JSON trung gian và 3 ảnh trong thư mục tĩnh. Ticket import cần bổ sung test cho parser theo Seam 1 ở trên.
- **Giả định:** tên Exam là "Đề 1" … "Đề 7"; giao diện chưa cần làm kỹ cho mobile nhưng không được vỡ layout.
