# 🍱 Đặt Cơm Chưa? - CS2 Style Lunch Roulette

Trang web quay số ngẫu nhiên chọn món ăn trưa công sở lấy cảm hứng từ giao diện mở hòm (case opening) của tựa game **Counter-Strike 2**.

---

## 🌟 Tính năng nổi bật

1. **Giao diện & Hiệu ứng phong cách CS2**:
   - Băng chuyền cuộn ngang mượt mà với kim chỉ trung tâm phát sáng.
   - Hiệu ứng âm thanh cơ học (tick-tick) khi các ô món lướt qua kim bằng **Web Audio API** (không cần tải file âm thanh ngoài).
   - Fanfare âm thanh chiến thắng tương ứng theo từng cấp độ phẩm chất món ăn.
   - Độ lệch ngẫu nhiên sub-card khi dừng để tạo cảm giác hồi hộp chân thực (gần trúng ô kế bên).
2. **Hệ thống phẩm cấp món ăn (Rarity System)**:
   - ⚪ **Consumer Grade (Bình dân)**: ~45% tỉ lệ
   - 🔵 **Industrial Grade (Quen thuộc)**: ~30% tỉ lệ
   - 🔷 **Mil-Spec Grade (Đặc trưng)**: ~15% tỉ lệ
   - 🟣 **Restricted Grade (Thượng hạng)**: ~7% tỉ lệ
   - 🔴 **Classified Grade (Đỉnh chóp)**: ~3% tỉ lệ
3. **Bộ lọc khẩu vị & Dị ứng**:
   - Lọc món: *Chỉ ăn chay, Không thịt lợn, Không thịt bò, Không hải sản, Không ăn cay, Không món nước ngoài*.
   - Lưu trạng thái bộ lọc vào `localStorage` — mở lại trang vẫn giữ nguyên thiết lập.
4. **Siêu nhẹ & Tối ưu**:
   - 100% Vanilla HTML + CSS + JavaScript (không cần thư viện, không build step, tải trang tức thì).
   - Hỗ trợ chế độ **Dark / Light mode** và **Bật / Tắt âm thanh**.
   - Phím tắt tiện lợi: Nhấn phím `Space` để quay nhanh.
   - Lưu lịch sử các lần quay gần nhất.
   - Hoàn toàn responsive cho cả điện thoại di động và máy tính.

---

## 🚀 Hướng dẫn triển khai lên Cloudflare Pages

Vì là trang tĩnh (Static HTML), việc deploy lên Cloudflare Pages cực kỳ nhanh và hoàn toàn **miễn phí 100%**.

### Cách 1: Kéo thả trực tiếp (Direct Upload - Không cần Git)
1. Đăng nhập [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Chọn menu **Workers & Pages** -> **Create application** -> Tab **Pages** -> **Upload assets**.
3. Đặt tên project (ví dụ: `dat-com-chua` hoặc `lunchbox`).
4. Kéo thả toàn bộ thư mục `LunchBox` vào ô upload rồi nhấn **Deploy site**.
5. Bạn sẽ nhận được ngay link web dạng `https://ten-du-an.pages.dev` vĩnh viễn!

---

### Cách 2: Kết nối GitHub Repo (Khuyên dùng khi muốn cập nhật lâu dài)
1. Tạo một repository mới trên GitHub (Public hoặc Private đều được).
2. Khởi tạo Git và đẩy code lên:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit for Dat Com Chua"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
3. Trên [Cloudflare Dashboard](https://dash.cloudflare.com/):
   - Chọn **Workers & Pages** -> **Create application** -> Tab **Pages** -> **Connect to Git**.
   - Chọn repository bạn vừa tạo.
   - Ở phần **Build settings**:
     - *Framework preset*: Chọn **None**
     - *Build command*: Để trống
     - *Build output directory*: Để trống (hoặc ghi `/`)
   - Bấm **Save and Deploy**.
4. Xong! Mỗi lần bạn thêm món vào `foods.json` và push code lên GitHub, Cloudflare sẽ tự động cập nhật ngay lập tức.

---

## 🛠️ Thêm / bớt món ăn
Mở file `foods.json` để thêm hoặc sửa món ăn theo định dạng:
```json
{
  "id": 37,
  "name": "Tên món ăn",
  "emoji": "🍲",
  "rarity": "milspec",
  "description": "Mô tả ngắn gọn về món ăn",
  "tags": ["khong_chay", "thit_bo", "mon_cay"]
}
```
*Các tag hỗ trợ: `chay`, `khong_chay`, `thit_lon`, `thit_bo`, `hai_san`, `mon_cay`, `mon_nuoc_ngoai`.*
