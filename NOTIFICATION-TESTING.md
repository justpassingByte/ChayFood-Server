# Hướng Dẫn Test Hệ Thống Thông Báo ChayFood

Tài liệu này hướng dẫn cách test hệ thống thông báo tự động trong ChayFood API.

## Giới thiệu

Hệ thống thông báo ChayFood hoạt động tự động, gửi thông báo dựa trên các sự kiện trong hệ thống (khuyến mãi, đơn hàng, flash sale...). Không cần API endpoints riêng vì thông báo được kích hoạt từ service layer.

## Cài đặt Module

Nếu bạn muốn test flash sale tự động, cài đặt module node-cron:

```bash
npm install node-cron
```

## Các File Test

Chúng tôi đã tạo hai file test để kiểm tra hệ thống thông báo:

1. `src/test-notifications.js` - Test thông báo cơ bản
2. `src/notification-scheduler.js` - Test thông báo tự động theo lịch (flash sale)

## Thiết Lập Môi Trường Test

### 1. Tạo User Test

File test của chúng tôi cần một user trong database để kiểm tra. Nếu kết quả test hiển thị "No test user found. Create a user first", hãy tạo một user test trước:

```typescript
// Lưu vào file src/create-test-user.ts
import mongoose from 'mongoose';
import { User } from './models/User';
import dotenv from 'dotenv';
dotenv.config();

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chayfood')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

async function createTestUser() {
  try {
    // Kiểm tra xem user đã tồn tại chưa
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (existingUser) {
      console.log('Test user already exists with ID:', existingUser._id);
      return;
    }

    // Tạo user test
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      phone: '0901234567',
      password: 'hashed_password_here', // Trong môi trường thực, bạn cần hash password
      googleId: 'test_google_id',
      picture: 'https://example.com/profile.jpg',
      addresses: [{
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        postalCode: '12345',
        isDefault: true
      }],
      dietaryPreferences: ['vegetarian']
    });

    await testUser.save();
    console.log('Test user created successfully with ID:', testUser._id);
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestUser();
```

Chạy file này để tạo user test:

```bash
npx ts-node src/create-test-user.ts
```

### 2. Cài Đặt TypeScript Globaly (nếu cần)

```bash
npm install -g ts-node typescript
```

## Chạy Tests

### 1. Test Thông Báo Cơ Bản

```bash
node src/test-notifications.js
```

File này thực hiện các bước test:
- Tìm người dùng test
- Tạo thông báo hệ thống
- Lấy danh sách thông báo của người dùng
- Tạo khuyến mãi thử nghiệm & gửi thông báo
- Tạo khuyến mãi flash sale & gửi thông báo

### 2. Test Lên Lịch Thông Báo Tự Động

```bash
node src/notification-scheduler.js
```

File này mô phỏng cách hệ thống tự động lên lịch và gửi thông báo:
- Tự động tìm các flash sale sắp diễn ra
- Lên lịch gửi thông báo trước khi flash sale bắt đầu
- Xử lý các thông báo đã được lên lịch đến thời gian gửi
- Tạo và kích hoạt một flash sale ngay lập tức để minh họa

## Lỗi Thường Gặp & Cách Khắc Phục

### Lỗi "Cannot find module"

Nếu bạn gặp lỗi import module, hãy kiểm tra:

1. Đường dẫn import trong file test
   ```javascript
   // Đúng
   const Notification = require('./models/Notification').Notification;
   ```

2. Cấu trúc CommonJS vs ES Modules
   ```javascript
   // CommonJS (Node.js)
   const { model } = require('./path');
   
   // ES Modules (TypeScript)
   import { model } from './path';
   ```

3. Chạy TypeScript
   ```bash
   # Chuyển đổi từ TS sang JS trước
   npx tsc src/your-test-file.ts
   
   # Hoặc chạy trực tiếp với ts-node
   npx ts-node src/your-test-file.ts
   ```

### Lỗi Kết Nối MongoDB

Đảm bảo:
1. MongoDB đang chạy
2. Biến môi trường MONGODB_URI đúng trong file .env
3. Có quyền truy cập vào database

## Kiểm Tra Thông Báo

### Kiểm Tra Thủ Công Trong Database

```javascript
// Kiểm tra thông báo của người dùng
db.notifications.find({ user: ObjectId("user_id_here") })

// Kiểm tra thông báo flash sale đã lên lịch
db.notifications.find({ 
   type: 'promotion',
   'related.type': 'promotion',
   scheduledFor: { $exists: true }
})
```

### Kiểm Tra Khuyến Mãi Đã Tạo

```javascript
// Xem khuyến mãi flash sale
db.promotions.find({ promotionType: 'flash_sale' })
```

## Tạo Thông Báo Theo Cách Thủ Công

Nếu muốn test riêng một loại thông báo:

```javascript
const { createNotification } = require('./services/notification-service');

// Thông báo đơn giản
await createNotification(
  userId,              // ID người dùng
  'Tiêu đề thông báo', // Tiêu đề
  'Nội dung thông báo', // Nội dung
  'system',            // Loại: 'promotion', 'order_status', 'system', 'referral'
  {
    channels: ['in_app', 'email'] // Kênh gửi
  }
);

// Thông báo về đơn hàng
await createNotification(
  userId,
  'Đơn hàng đã xác nhận',
  'Đơn hàng #123 của bạn đã được xác nhận',
  'order_status',
  {
    related: { type: 'order', id: orderId },
    channels: ['in_app', 'email', 'push']
  }
);
```

## Cấu hình Thông Báo Thời Gian Thực

ChayFood hỗ trợ gửi thông báo thời gian thực qua các kênh như:
- In-app notifications (WebSocket/Server-Sent Events)
- Email (SMTP)


Để cấu hình chi tiết cho từng kênh, vui lòng tham khảo tài liệu cấu hình riêng. 