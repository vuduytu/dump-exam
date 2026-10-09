# PMP Practice

Website riêng tư cho một nhóm nhỏ luyện thi PMP bằng bộ câu hỏi lấy từ ExamTopics.

## Ngân hàng câu hỏi

**Question** (Câu hỏi):
Một câu trắc nghiệm import từ ExamTopics, giữ nguyên số thứ tự gốc (`Question #N`). Có một hoặc nhiều Choice.
_Avoid_: item, bài

**Choice** (Lựa chọn):
Một phương án trả lời của Question, có nhãn chữ cái (A, B, C…).
_Avoid_: option, đáp án (khi chưa biết đúng hay sai)

**Suggested Answer**:
Đáp án do ExamTopics công bố. Chỉ lưu để tham khảo, không dùng chấm điểm khi đã có Most Voted.

**Most Voted Answer**:
Đáp án được cộng đồng ExamTopics vote nhiều nhất cho một Question.

**Correct Answer** (Đáp án đúng):
Đáp án dùng để chấm điểm. Bằng Most Voted Answer nếu có, nếu không thì bằng Suggested Answer.
_Avoid_: key, answer (đứng một mình)

**Vote**:
Một dòng vote của cộng đồng ExamTopics cho một tổ hợp Choice (ví dụ "AC"), không phải cho từng Choice riêng lẻ. Tỉ lệ vote từng Choice phải tính ra từ các Vote.

**Domain**:
Một trong ba nhóm nội dung của đề thi PMP theo PMP Examination Content Outline (ECO) July 2026: People, Process, Business Environment.

**Task**:
Một nhiệm vụ cụ thể trong một Domain theo ECO (ví dụ "Manage conflict"). Mỗi Question được gắn đúng một Task, và qua đó thuộc một Domain.

**Approach** (Cách tiếp cận):
Cách tiếp cận dự án mà một Question giả định: Predictive, Agile hoặc Hybrid.

**Unusable Question**:
Question thiếu Choice hoặc thiếu Correct Answer. Vẫn lưu nhưng không bao giờ được đưa vào Exam.

## Đề thi

**Exam** (Đề):
Một bộ cố định 180 Question, tạo một lần và không đổi. Các Exam không trùng câu với nhau, trừ Exam cuối được lấy câu từ Exam khác để đủ 180 câu.
_Avoid_: test, quiz, bộ đề (khi chỉ một đề)

**Drill** (Ôn theo chủ đề):
Một bộ 10 hoặc 20 Question rút ra lúc bắt đầu từ một Domain hoặc một Task, ưu tiên câu User chưa làm rồi câu làm sai gần nhất. Không cố định như Exam. Được làm như một Attempt không bấm giờ, có Score và Result.
_Avoid_: bài tập, luyện tập, Exam (cho bộ này)

## Làm bài

**User** (Người dùng):
Người được admin tạo tài khoản (email và mật khẩu). Không có chức năng tự đăng ký.
_Avoid_: account, member

**Attempt** (Lượt làm):
Một lần một User làm một Exam. Một Exam có nhiều Attempt. Attempt đang làm dở thì làm tiếp được, đã nộp rồi thì không sửa được.
_Avoid_: submission, session, lần thi

**Admin**:
User có quyền quản lý các User khác trên trang quản trị.

**Timed Attempt**:
Attempt mà User chọn bấm giờ. Đồng hồ chạy 240 phút (bằng thời gian đề thi PMP từ tháng 7/2026) theo giờ thật tính từ lúc bắt đầu, đóng tab thì đồng hồ vẫn chạy. Hết giờ thì Attempt tự nộp.

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
Phần xem lại một Attempt đã nộp: Score và từng Question kèm lựa chọn của User, Correct Answer, Suggested Answer và tỉ lệ Vote.
_Avoid_: review (dễ lẫn với Marked Question)

**Scoreboard** (Bảng điểm):
Bảng chỉ Admin xem, mỗi hàng là một User, mỗi cột là một Exam. Mỗi ô hiện Score của Attempt nộp gần nhất kèm số Attempt đã nộp, và nếu có Attempt đang làm dở thì hiện thêm số câu đã trả lời. Admin chỉ xem, không sửa được gì. Admin mở được Result và lịch sử Attempt đã nộp của từng User, không xem được Attempt đang làm dở. Chỉ gồm Exam, không gồm Drill.
_Avoid_: Progress, tiến độ (dễ lẫn với tiến độ trong một Attempt)
