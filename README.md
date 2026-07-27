# 🇯🇵 日本語  - HÃY HỌC THEO CÁCH CỦA BẠN 

Một ứng dụng web full-stack hỗ trợ học tiếng Nhật (từ vựng, Kanji, ngữ pháp) thông qua các bộ dữ liệu cá nhân hóa (JSON). Ứng dụng tích hợp cơ chế Gamification tăng áp lực học tập và cung cấp trang phân tích thống kê chi tiết tiến độ.

---

## 🛠️ Cấu Trúc Dự Án (Tech Stack)

* **Backend:** Java Spring Boot 3.x, Spring Data JPA, Spring Security (đã mở CORS).
* **Frontend:** React 19, Vite, Tailwind CSS v4, Custom premium animations.
* **Database:** MySQL (chạy qua MAMP hoặc local), mã hóa `utf8mb4` hỗ trợ hoàn toàn Kanji/tiếng Nhật.

---

## 🚀 Hướng Dẫn Chạy Dưới Local (Local Development)

> [!IMPORTANT]
> Dự án gồm hai phần Frontend và Backend nằm trong hai thư mục riêng biệt. Không chạy lệnh trực tiếp ở thư mục gốc nếu không có chỉ dẫn.

### Bước 1: Thiết Lập Database (MySQL)
1. **Khởi động MySQL:** Bật **MAMP** trên máy tính của bạn và đảm bảo MySQL Server đã chạy (mặc định port `3306`).
2. **Tạo Database & Cấu trúc bảng:**
   * Mở phpMyAdmin (hoặc MySQL Workbench / DBeaver).
   * Import file database schema đã được tối ưu hóa tiếng Nhật tại: [db_schema.sql](./db_schema.sql)

### Bước 2: Chạy Backend (Spring Boot)
1. Mở Terminal mới và di chuyển vào thư mục `backend`:
   ```bash
   cd backend
   ```
2. Cấu hình kết nối MySQL (nếu cần thiết, cấu hình mặc định là `root / root` cho MAMP):
   * File cấu hình: `backend/src/main/resources/application.properties`
3. Khởi động Backend:
   ```bash
   ./mvnw spring-boot:run
   ```
   * Server sẽ chạy tại: **`http://localhost:8080`**

### Bước 3: Chạy Frontend (React)
1. Mở một cửa sổ Terminal mới (hoặc tab mới) và di chuyển vào thư mục `frontend`:
   ```bash
   cd frontend
   ```
2. Cài đặt các thư viện/dependencies (chỉ cần chạy lần đầu tiên):
   ```bash
   npm install
   ```
3. Khởi chạy môi trường phát triển:
   ```bash
   npm run dev
   ```
   * Ứng dụng sẽ chạy tại: **`http://localhost:5173`**

---

## ☁️ Hướng Dẫn Deploy Miễn Phí Lên Cloud (Free Production Deployment)

Hệ thống được thiết kế tối ưu để có thể deploy hoàn toàn miễn phí trên Cloud thông qua mô hình tích hợp 3 nền tảng: **Clever Cloud** (Database), **Render** (Backend), và **Vercel** (Frontend).

### 1. Database: Clever Cloud (MySQL Free Plan)
Clever Cloud cung cấp add-on MySQL miễn phí 10MB, hỗ trợ tốt bảng mã UTF8MB4 (tiếng Nhật/Kanji) và tự động sao lưu.

1. Đăng ký/Đăng nhập tài khoản [Clever Cloud](https://www.clever-cloud.com/).
2. Tạo một **Organization** mới và chọn **Add an add-on** -> chọn **MySQL**.
3. Chọn gói **Shared plan (Free - 10MB)**.
4. Sau khi khởi tạo xong, truy cập vào bảng điều khiển add-on để lấy thông tin kết nối:
   * **Host:** `xxxx-mysql.services.clever-cloud.com`
   * **Database Name:** `db_xxxxxxx`
   * **User:** `u_xxxxxxx`
   * **Password:** `xxxxxxxxx`
   * **Port:** `3306`
5. Sử dụng PHPMyAdmin tích hợp sẵn trên Clever Cloud để import file `db_schema.sql`.

### 2. Backend: Render (Docker Web Service - Free)
Vì dự án chạy Spring Boot Java, chúng ta sử dụng cơ chế Docker để Render tự động build thông qua `backend/Dockerfile` có sẵn.

1. Đăng ký/Đăng nhập [Render](https://render.com/).
2. Nhấn **New +** -> chọn **Web Service**.
3. Kết nối với tài khoản GitHub và chọn kho lưu trữ (repository) chứa dự án.
4. Cấu hình thông tin dịch vụ:
   * **Root Directory:** `backend` (Cần chỉ định thư mục chứa backend)
   * **Language:** `Docker` (Render sẽ tự động đọc `Dockerfile` trong thư mục `backend`)
   * **Instance Type:** `Free`
5. Thêm các biến môi trường (Environment Variables) trong phần **Advanced**:
   * `DB_HOST`: Điền *Host* nhận từ Clever Cloud.
   * `DB_PORT`: `3306`
   * `DB_NAME`: Điền *Database Name* từ Clever Cloud.
   * `DB_USER`: Điền *User* từ Clever Cloud.
   * `DB_PASSWORD`: Điền *Password* từ Clever Cloud.
   * `CORS_ALLOWED_ORIGINS`: Điền domain frontend Vercel của bạn (ví dụ: `https://your-nihongo-app.vercel.app`).
6. Nhấn **Deploy**. Máy chủ Render sẽ tự động build và chạy dịch vụ. Copy URL của Web Service (ví dụ: `https://nihongo-backend.onrender.com`) để cấu hình cho Frontend.

### 3. Frontend: Vercel (Vite React - Free)
Vercel tự động theo dõi repository GitHub của bạn và tự động biên dịch, deploy mỗi khi bạn đẩy code mới lên nhánh `main`.

1. Đăng ký/Đăng nhập [Vercel](https://vercel.com/).
2. Nhấn **Add New** -> chọn **Project** -> Chọn kho lưu trữ GitHub của dự án.
3. Cấu hình thông tin build:
   * **Root Directory:** `frontend`
   * **Framework Preset:** `Vite`
4. Cấu hình biến môi trường trong phần **Environment Variables**:
   * `VITE_API_BASE_URL`: Điền URL Backend Render bạn vừa sao chép ở bước trước (ví dụ: `https://nihongo-backend.onrender.com`).
5. Nhấn **Deploy**. Dự án sẽ được build chỉ trong vòng 30 giây.

---

## 📝 Định Dạng Dữ Liệu Import (JSON Schema)

Bạn có thể tạo các bộ thẻ tùy chỉnh bằng file JSON theo cấu trúc chuẩn sau:

```json
{
  "title": "Tên bộ học tập",
  "description": "Mô tả ngắn gọn",
  "cards": [
    {
      "prompt": "Từ tiếng Nhật (Hiragana/Kanji/Cấu trúc)",
      "answer": "Nghĩa tiếng Việt",
      "hint": "Gợi ý / Ví dụ",
      "type": "VOCAB" 
    }
  ]
}
```
* **Lưu ý ở trường `type`:** Nhận một trong các giá trị: `VOCAB` (Từ vựng), `KANJI` (Chữ Hán), `GRAMMAR` (Ngữ pháp).

---

## 🏆 Các Tính Năng Đã Hoàn Thiện

1. **Giao diện Minimalist Zen Premium:** Thiết kế tối giản tinh tế, hiệu ứng di chuột (card-hover lift), glassmorphism navbar, hỗ trợ hoàn hảo chế độ Mobile (tránh lỗi lệch layout navbar và các chế độ thẻ học).
2. **Bộ Xáo Trộn Đề Thông Minh:** Thứ tự các câu hỏi sẽ tự động xáo trộn hoàn toàn ngẫu nhiên ở mỗi lượt chơi mới.
3. **Chế Độ Thiên Tài (Genius Mode):** Giới hạn thời gian 10 giây mỗi câu, tự động phân phối ngẫu nhiên giữa Trắc nghiệm (MCQ) và Tự luận (Typing) một cách mượt mà (đã sửa lỗi skip sớm khi hết giờ).
4. **Tính Năng Tạm Ẩn Hint:** Gợi ý (`hint`) mặc định sẽ được ẩn dưới nút `[ 💡 Show Hint ]` để kích thích người học tự tư duy trước khi xem.
5. **Tính Năng Sắp Xếp Bài Học:** Cho phép sắp xếp bộ bài học theo: Mới nhất, Cũ nhất, A -> Z, Z -> A tức thì ngay trên Client.
6. **Admin Quản Trị Tiện Lợi:** 
   * Đăng nhập/Đăng ký tài khoản (Hỗ trợ nút Show/Hide mật khẩu).
   * Import dữ liệu bài học nhanh chóng (có Spinner loading chống click trùng lặp).
   * Chỉnh sửa Tên & Mô tả trực tiếp của bộ bài học thông qua giao diện trực quan và API PUT.
   * Xóa bộ bài học.
7. **Phân Tích Tiến Độ (統計):**
   * **🔥 Streak System:** Đếm số ngày học liên tục được đồng bộ hóa chuẩn thời gian thực từ Database.
   * **🎯 Chỉ số chính xác (Accuracy):** Tính phần trăm trả lời đúng trên toàn bộ hệ thống.
   * **⚠ Điểm yếu (Weak Points):** Tự động lọc ra top 10 từ/cụm từ hay bị trả lời sai nhiều nhất để hỗ trợ ôn tập.
   * **📜 Lịch sử phiên học:** Lưu vết và review chi tiết từng câu trả lời đúng/sai của từng lượt chơi trước đó.
