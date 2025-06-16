# Kế hoạch phát triển plugin `postgres-connector` cho NocoBase

## 1. Mục tiêu
- Xây dựng plugin cho phép kết nối và quản lý nguồn dữ liệu PostgreSQL/MySQL trên nền tảng NocoBase.
- Hỗ trợ cấu hình (username, password, host, port, database).
- Cho phép thực thi câu lệnh SQL (MySQL/Postgres) trực tiếp trên widget table.
- Hỗ trợ thực thi procedure, view, function.
- Có tính năng tự động thực thi câu lệnh PostgreSQL theo lịch hoặc trigger.

## 2. Các bước thực hiện

### Bước 1: Phân tích & Thiết kế
- Xác định các interface cần thiết để tích hợp với NocoBase (DataSource, Widget, API).
- Thiết kế cấu trúc plugin: thư mục, file cấu hình, entry point.
- Lên danh sách các trường cấu hình cần thiết cho nguồn dữ liệu.

### Bước 2: Khởi tạo plugin
- Tạo thư mục và file plugin theo chuẩn NocoBase.
- Định nghĩa schema cấu hình nguồn dữ liệu (MySQL/Postgres).
- Xây dựng UI cấu hình (username, password, host, port, database).

### Bước 3: Kết nối & Quản lý nguồn dữ liệu
- Cài đặt thư viện kết nối PostgreSQL và MySQL (node-postgres, mysql2 hoặc tương đương).
- Xây dựng logic thêm/sửa/xóa nguồn dữ liệu.
- Lưu trữ thông tin cấu hình an toàn.

### Bước 4: Thực thi câu lệnh SQL trên widget table
- Tạo API nhận câu lệnh SQL từ widget table.
- Thực thi câu lệnh trên nguồn dữ liệu tương ứng, trả về kết quả.
- Xử lý lỗi và bảo mật (chỉ cho phép các câu lệnh SELECT, hoặc kiểm soát quyền).

### Bước 5: Hỗ trợ procedure, view, function
- Phân tích loại câu lệnh (CALL, EXEC, SELECT FROM VIEW, v.v.).
- Thực thi và trả về kết quả phù hợp.

### Bước 6: Tự động thực thi câu lệnh PostgreSQL
- Cho phép cấu hình lịch hoặc trigger cho các câu lệnh tự động.
- Xây dựng scheduler (dùng node-cron hoặc tương đương).
- Ghi log kết quả thực thi.

### Bước 7: Kiểm thử & Hoàn thiện
- Viết test case cho từng chức năng.
- Kiểm thử UI/UX và bảo mật.
- Viết tài liệu hướng dẫn sử dụng.

## 3. Tiến độ dự kiến
- Phân tích & Thiết kế: 1 ngày
- Khởi tạo plugin & cấu hình: 1 ngày
- Kết nối & quản lý nguồn dữ liệu: 1 ngày
- Thực thi SQL & hỗ trợ procedure/view/function: 2 ngày
- Tự động hóa & kiểm thử: 1 ngày
- Hoàn thiện tài liệu: 0.5 ngày

## 4. Ghi chú
- Ưu tiên bảo mật thông tin cấu hình.
- Đảm bảo plugin dễ mở rộng cho các loại DBMS khác trong tương lai.