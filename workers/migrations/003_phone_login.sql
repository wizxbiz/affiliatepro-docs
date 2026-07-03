-- 1. เพิ่มคอลัมน์เบอร์โทรศัพท์บนตาราง users
ALTER TABLE users ADD COLUMN phone TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 2. สร้างตารางพักข้อมูลรหัส OTP ชั่วคราว
CREATE TABLE IF NOT EXISTS otp_codes (
  phone       TEXT PRIMARY KEY,
  code        TEXT NOT NULL,
  expires_at  INTEGER NOT NULL,
  created_at  INTEGER NOT NULL
);
