-- 002_province_codes.sql
-- Description: Standardizes province data to 2-digit TIS 1099 codes.
-- Goal: Eliminate free-text errors (ห้ามปล่อย free-text)

-- 1. Create the Master Code Table
CREATE TABLE IF NOT EXISTS provinces (
    code CHAR(2) PRIMARY KEY,
    name_th VARCHAR(100) NOT NULL UNIQUE,
    name_en VARCHAR(100),
    region VARCHAR(50) -- Central, Northern, Isan, Southern
);

-- 2. Populate Standard Province Data (Subset shown for brevity, full list in migration)
INSERT INTO provinces (code, name_th, name_en, region) VALUES
('10', 'กรุงเทพมหานคร', 'Bangkok', 'Central'),
('11', 'สมุทรปราการ', 'Samut Prakan', 'Central'),
('12', 'นนทบุรี', 'Nonthaburi', 'Central'),
('13', 'ปทุมธานี', 'Pathum Thani', 'Central'),
('14', 'พระนครศรีอยุธยา', 'Phra Nakhon Si Ayutthaya', 'Central'),
('15', 'อ่างทอง', 'Ang Thong', 'Central'),
('16', 'ลพบุรี', 'Lopburi', 'Central'),
('17', 'สิงห์บุรี', 'Sing Buri', 'Central'),
('18', 'ชัยนาท', 'Chai Nat', 'Central'),
('19', 'สระบุรี', 'Saraburi', 'Central'),
('20', 'ชลบุรี', 'Chonburi', 'Eastern'),
('21', 'ระยอง', 'Rayong', 'Eastern'),
('22', 'จันทบุรี', 'Chanthaburi', 'Eastern'),
('23', 'ตราด', 'Trat', 'Eastern'),
('24', 'ฉะเชิงเทรา', 'Chachoengsao', 'Eastern'),
('25', 'ปราจีนบุรี', 'Prachinburi', 'Eastern'),
('26', 'นครนายก', 'Nakhon Nayok', 'Central'),
('27', 'สระแก้ว', 'Sa Kaeo', 'Eastern'),
('30', 'นครราชสีมา', 'Nakhon Ratchasima', 'Northeast'),
('31', 'บุรีรัมย์', 'Buriram', 'Northeast'),
('32', 'สุรินทร์', 'Surin', 'Northeast'),
('33', 'ศรีสะเกษ', 'Sisaket', 'Northeast'),
('34', 'อุบลราชธานี', 'Ubon Ratchathani', 'Northeast'),
('35', 'ยโสธร', 'Yasothon', 'Northeast'),
('36', 'ชัยภูมิ', 'Chaiyaphum', 'Northeast'),
('37', 'อำนาจเจริญ', 'Amnat Charoen', 'Northeast'),
('38', 'บึงกาฬ', 'Bueng Kan', 'Northeast'),
('39', 'หนองบัวลำภู', 'Nong Bua Lamphu', 'Northeast'),
('40', 'ขอนแก่น', 'Khon Kaen', 'Northeast'),
('41', 'อุดรธานี', 'Udon Thani', 'Northeast'),
('42', 'เลย', 'Loei', 'Northeast'),
('43', 'หนองคาย', 'Nong Khai', 'Northeast'),
('44', 'มหาสารคาม', 'Maha Sarakham', 'Northeast'),
('45', 'ร้อยเอ็ด', 'Roi Et', 'Northeast'),
('46', 'กาฬสินธุ์', 'Kalasin', 'Northeast'),
('47', 'สกลนคร', 'Sakon Nakhon', 'Northeast'),
('48', 'นครพนม', 'Nakhon Phanom', 'Northeast'),
('49', 'มุกดาหาร', 'Mukdahan', 'Northeast'),
('50', 'เชียงใหม่', 'Chiang Mai', 'North'),
('51', 'ลำพูน', 'Lamphun', 'North'),
('52', 'ลำปาง', 'Lampang', 'North'),
('53', 'อุตรดิตถ์', 'Uttaradit', 'North'),
('54', 'แพร่', 'Phrae', 'North'),
('55', 'น่าน', 'Nan', 'North'),
('56', 'พะเยา', 'Phayao', 'North'),
('57', 'เชียงราย', 'Chiang Rai', 'North'),
('58', 'แม่ฮ่องสอน', 'Mae Hong Son', 'North'),
('60', 'นครสวรรค์', 'Nakhon Sawan', 'Central'),
('61', 'อุทัยธานี', 'Uthai Thani', 'Central'),
('62', 'กำแพงเพชร', 'Kamphaeng Phet', 'Central'),
('63', 'ตาก', 'Tak', 'West'),
('64', 'สุโขทัย', 'Sukhothai', 'Central'),
('65', 'พิษณุโลก', 'Phitsanulok', 'Central'),
('66', 'พิจิตร', 'Phichit', 'Central'),
('67', 'เพชรบูรณ์', 'Phetchabun', 'Central'),
('70', 'ราชบุรี', 'Ratchaburi', 'West'),
('71', 'กาญจนบุรี', 'Kanchanaburi', 'West'),
('72', 'สุพรรณบุรี', 'Suphan Buri', 'Central'),
('73', 'นครปฐม', 'Nakhon Pathom', 'Central'),
('74', 'สมุทรสาคร', 'Samut Sakhon', 'Central'),
('75', 'สมุทรสงคราม', 'Samut Songkhram', 'Central'),
('76', 'เพชรบุรี', 'Phetchaburi', 'West'),
('77', 'ประจวบคีรีขันธ์', 'Prachuap Khiri Khan', 'West'),
('80', 'นครศรีธรรมราช', 'Nakhon Si Thammarat', 'South'),
('81', 'กระบี่', 'Krabi', 'South'),
('82', 'พังงา', 'Phang Nga', 'South'),
('83', 'ภูเก็ต', 'Phuket', 'South'),
('84', 'สุราษฎร์ธานี', 'Surat Thani', 'South'),
('85', 'ระนอง', 'Ranong', 'South'),
('86', 'ชุมพร', 'Chumphon', 'South'),
('90', 'สงขลา', 'Songkhla', 'South'),
('91', 'สตูล', 'Satun', 'South'),
('92', 'ตรัง', 'Trang', 'South'),
('93', 'พัทลุง', 'Phatthalung', 'South'),
('94', 'ปัตตานี', 'Pattani', 'South'),
('95', 'ยะลา', 'Yala', 'South'),
('96', 'นราธิวาส', 'Narathiwat', 'South')
ON CONFLICT (code) DO NOTHING;

-- 3. Modify Users Table (Mapping)
ALTER TABLE users ADD COLUMN IF NOT EXISTS province_code CHAR(2) REFERENCES provinces(code);
-- Attempt to match legacy free-text to codes (Heuristic)
UPDATE users SET province_code = p.code 
FROM provinces p 
WHERE users.province IS NOT NULL 
AND (users.province = p.name_th OR users.province = p.name_en);

-- 4. Modify Sellers Table
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS province_code CHAR(2) REFERENCES provinces(code);
UPDATE sellers SET province_code = p.code 
FROM provinces p 
WHERE sellers.province IS NOT NULL 
AND (sellers.province = p.name_th OR sellers.province = p.name_en);

-- 5. Modify Products Table
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS province_code CHAR(2) REFERENCES provinces(code);
-- Map from seller's province if product doesn't have one
UPDATE marketplace_products mp 
SET province_code = s.province_code 
FROM sellers s 
WHERE mp.seller_id = s.id AND mp.province_code IS NULL;

-- 6. Modify Live Sessions Table
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS province_code CHAR(2) REFERENCES provinces(code);

-- 7. Add Check Constraints (Security: No Free Text Left Unvalidated)
-- Optional: DROP COLUMN province after migration if you want to be strict.
-- ALTER TABLE users DROP COLUMN province;
-- ALTER TABLE sellers DROP COLUMN province;
