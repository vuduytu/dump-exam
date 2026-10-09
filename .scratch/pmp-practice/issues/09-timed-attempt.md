# 09 — Timed Attempt

**What to build:** Khi bắt đầu, User chọn bấm giờ 230 phút hoặc không bấm giờ. Có bấm giờ thì đồng hồ đếm ngược chạy theo giờ thật, kể cả khi đóng tab. Hết giờ thì bài tự nộp và User được chuyển sang trang kết quả. Spec: user story 29, 39–43.

**Blocked by:** 05 — Attempt tối thiểu

**Status:** ready-for-agent

**Model:** Opus 5.5 — deadline server, tham số `now`, tự nộp (~2 giờ). Review bằng Opus 5.5.

- [ ] Màn hình bắt đầu có lựa chọn "Bấm giờ 230 phút" và "Không bấm giờ".
- [ ] Deadline bằng thời điểm bắt đầu cộng 230 phút, tính ở server. Các hàm nhận tham số `now` để test được.
- [ ] Gửi `saveAnswer` hoặc `toggleMark` sau deadline đều bị từ chối.
- [ ] Gọi `getAttempt` sau deadline thì Attempt được chốt là đã nộp, Score chỉ tính các đáp án lưu trước deadline.
- [ ] Đồng hồ phía client về 0 thì gọi nộp rồi chuyển sang trang kết quả.
- [ ] Test: lưu trước deadline được, lưu sau deadline bị từ chối, tự nộp khi quá hạn, Attempt không bấm giờ không bao giờ hết hạn.
