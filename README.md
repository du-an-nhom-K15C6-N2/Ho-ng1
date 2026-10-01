# Đổi mật khẩu + thu hồi phiên đăng nhập khác

## Cơ chế
Mỗi lần đăng nhập, backend tạo một `sid` (session ID) và lưu vào bảng `user_sessions`.
JWT chứa cả `id` người dùng và `sid`.

Khi đổi mật khẩu:
- Kiểm tra mật khẩu cũ.
- Kiểm tra chính sách mật khẩu mới.
- Cập nhật password hash.
- Nếu `revokeOtherSessions = true`, thu hồi tất cả session khác của người dùng.
- Session hiện tại (`sid` trong JWT đang dùng) KHÔNG bị thu hồi.

Khi một JWT cũ được dùng lại, middleware kiểm tra `user_sessions.revoked_at`; nếu đã có giá trị thì request bị từ chối.

## Chạy
1. Tạo database bằng `database.sql`.
2. Sao chép `.env.example` thành `.env` và điền thông tin MySQL/JWT_SECRET.
3. Chạy:
   npm install
   npm start
4. Mở `index.html` bằng trình duyệt.
5. Frontend gửi JWT trong:
   Authorization: Bearer <token>

## API
### POST /api/auth/login
Body:
{
  "email": "user@example.com",
  "password": "MatKhauCu1!"
}

Response trả về `token`. Frontend lưu token vào localStorage với key `token`.

### POST /api/auth/change-password
Header:
Authorization: Bearer <token>

Body:
{
  "oldPassword": "MatKhauCu1!",
  "newPassword": "MatKhauMoi2@",
  "confirmPassword": "MatKhauMoi2@",
  "revokeOtherSessions": true
}

Nếu `revokeOtherSessions` là true, các phiên khác bị thu hồi nhưng phiên hiện tại vẫn hoạt động.

## Chính sách mật khẩu
- Ít nhất 8 ký tự
- Có chữ hoa
- Có chữ thường
- Có chữ số
- Có ký tự đặc biệt trong !@#$%^&*
