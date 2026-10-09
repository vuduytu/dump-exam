# PMP Practice

Website riêng tư cho một nhóm nhỏ luyện thi chứng chỉ PMI (PMP, PgMP) bằng các bộ câu hỏi dump.

## Chứng chỉ

**Certification** (Chứng chỉ):
Một chứng chỉ PMI có bộ đề riêng: PMP hoặc PgMP. Mỗi Question, Exam và Drill thuộc đúng một Certification. Mỗi Certification có Domain, Task, số câu mỗi Exam và thời gian riêng.
_Avoid_: nhóm bộ đề, track, bank

**Certification Access** (Quyền chứng chỉ):
Quyền của một User được dùng một Certification, do Admin cấp. Admin luôn có quyền với mọi Certification. Khi bị gỡ quyền, toàn bộ Exam, Drill, Attempt và Result của Certification đó bị ẩn với User nhưng không bị xoá; cấp lại quyền thì hiện lại như cũ.

## Ngân hàng câu hỏi

**Question** (Câu hỏi):
Một câu trắc nghiệm import từ bộ dump của một Certification. PMP lấy từ ExamTopics và giữ số thứ tự gốc (`Question #N`). PgMP lấy từ các file dump và giữ nguyên mọi câu, kể cả câu trùng nội dung, với số thứ tự trong file của nó. Có một hoặc nhiều Choice.
_Avoid_: item, bài

**Duplicate Question** (Câu trùng):
Question PgMP có nội dung giống một Question khác (không tính khác biệt về hoa thường và dấu câu). Cả hai đều được giữ và hiển thị, kèm ghi chú vị trí của câu kia (Exam và số câu).

**Choice** (Lựa chọn):
Một phương án trả lời của Question, có nhãn chữ cái (A, B, C…).
_Avoid_: option, đáp án (khi chưa biết đúng hay sai)

**Suggested Answer**:
Đáp án do nguồn dump công bố. Chỉ lưu để tham khảo, không dùng chấm điểm khi đã có Most Voted.

**Most Voted Answer**:
Đáp án được cộng đồng ExamTopics vote nhiều nhất cho một Question. Chỉ có ở PMP.

**Correct Answer** (Đáp án đúng):
Đáp án dùng để chấm điểm. Bằng Most Voted Answer nếu có, nếu không thì bằng Suggested Answer.
_Avoid_: key, answer (đứng một mình)

**Vote**:
Một dòng vote của cộng đồng ExamTopics cho một tổ hợp Choice (ví dụ "AC"), không phải cho từng Choice riêng lẻ. Tỉ lệ vote từng Choice phải tính ra từ các Vote. Chỉ có ở PMP.

**Explanation** (Lời giải):
Đoạn giải thích đáp án kèm nguồn tham khảo đi theo một Question trong bộ dump. Chỉ có ở một phần các câu PgMP.

**Domain**:
Một nhóm nội dung của đề thi theo Examination Content Outline (ECO) của Certification. PMP theo ECO July 2026, gồm People, Process và Business Environment. PgMP theo ECO PgMP mới nhất.

**Task**:
Một nhiệm vụ cụ thể trong một Domain theo ECO (ví dụ "Manage conflict"). Mỗi Question được gắn đúng một Task, và qua đó thuộc một Domain.

**Approach** (Cách tiếp cận):
Cách tiếp cận dự án mà một Question giả định: Predictive, Agile hoặc Hybrid. Chỉ áp dụng cho PMP.

**Unusable Question**:
Question thiếu Choice hoặc thiếu Correct Answer. Vẫn lưu nhưng không bao giờ được đưa vào Exam.

## Đề thi

**Exam** (Đề):
Một bộ Question cố định của một Certification, tạo một lần và không đổi. PMP: mỗi Exam 180 câu, chia ngẫu nhiên, các Exam không trùng câu với nhau, trừ Exam cuối được lấy câu từ Exam khác để đủ 180 câu. PgMP: mỗi file dump là một Exam, mang tên file (ví dụ "6_6_2024 11_05_01 AM") và giữ nguyên số câu gốc trong file, nên số câu mỗi Exam khác nhau (55 đến 170 câu). Unusable Question bị bỏ khỏi Exam nhưng các câu còn lại không đánh số lại.
_Avoid_: test, quiz, bộ đề (khi chỉ một đề)

**Drill** (Ôn theo chủ đề):
Một bộ 10 hoặc 20 Question rút ra lúc bắt đầu từ một Domain hoặc một Task, ưu tiên câu User chưa làm rồi câu làm sai gần nhất. Không cố định như Exam. Được làm như một Attempt không bấm giờ, có Score và Result. Domain hoặc Task đó gọi là nguồn (source) của Drill; mỗi nguồn có tối đa một Drill đang làm dở.
_Avoid_: bài tập, luyện tập, Exam (cho bộ này)

## Làm bài

**User** (Người dùng):
Người được admin tạo tài khoản (email và mật khẩu). Không có chức năng tự đăng ký. Chỉ thấy các Certification mình có Certification Access.
_Avoid_: account, member

**Attempt** (Lượt làm):
Một lần một User làm một Exam hoặc một Drill (thuộc đúng một trong hai). Một Exam có nhiều Attempt; mỗi Drill chỉ có một Attempt. Attempt đang làm dở thì làm tiếp được, đã nộp rồi thì không sửa được.
_Avoid_: submission, session, lần thi

**Admin**:
User có quyền quản lý các User khác trên trang quản trị.

**Timed Attempt**:
Attempt mà User chọn bấm giờ. Đồng hồ chạy 240 phút (bằng thời gian đề thi thật của cả PMP từ tháng 7/2026 và PgMP) theo giờ thật tính từ lúc bắt đầu, đóng tab thì đồng hồ vẫn chạy. Hết giờ thì Attempt tự nộp.

**Untimed Attempt**:
Attempt mà User chọn không bấm giờ (giao diện gọi là "Luyện tập không bấm giờ"). Không bao giờ hết hạn, chỉ kết thúc khi User nộp hoặc bỏ.
_Avoid_: practice mode, chế độ luyện tập (như một tính năng riêng)

**Abandoned Attempt**:
Attempt đang làm dở mà User chọn bỏ để làm lại. Attempt này bị xoá và không tính vào lịch sử. Với mỗi Exam, một User có tối đa một Attempt đang làm dở.

**Marked Question** (Câu đánh dấu):
Question mà User đánh dấu để xem lại trong một Attempt. Việc đánh dấu không ảnh hưởng tới Score.

**Score** (Điểm):
Số Question trong Attempt được trả lời đúng. Câu chọn nhiều đáp án phải chọn đúng toàn bộ Correct Answer mới tính đúng. Câu bỏ trống tính là sai.

**Result** (Kết quả):
Phần xem lại một Attempt đã nộp: Score và từng Question kèm lựa chọn của User, Correct Answer, Suggested Answer, tỉ lệ Vote (PMP) hoặc Explanation (nếu có).
_Avoid_: review (dễ lẫn với Marked Question)

**Scoreboard** (Bảng điểm):
Bảng chỉ Admin xem, mỗi hàng là một User, mỗi cột là một Exam. Mỗi ô hiện Score của Attempt nộp gần nhất kèm số Attempt đã nộp, và nếu có Attempt đang làm dở thì hiện thêm số câu đã trả lời. Admin chỉ xem, không sửa được gì. Admin mở được Result và lịch sử Attempt đã nộp của từng User, không xem được Attempt đang làm dở. Chỉ gồm Exam, không gồm Drill.
_Avoid_: Progress, tiến độ (dễ lẫn với tiến độ trong một Attempt)
