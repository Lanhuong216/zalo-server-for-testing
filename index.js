const express = require("express");
const path = require("path");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

// 1. PHỤC VỤ FILE XÁC THỰC DOMAIN
// Mọi file bạn bỏ vào thư mục /public sẽ được truy cập trực tiếp
// Ví dụ: https://domain.com/zalo_verifier_xxx.html
app.use(express.static(path.join(__dirname, "public")));

// 2. XỬ LÝ CALLBACK URL (Lấy Access Token)
app.get("/zalo/callback", async (req, res) => {
  const { code } = req.query; // Zalo gửi mã code về qua URL
  if (!code) return res.send("Không tìm thấy mã code!");

  try {
    // Gọi API sang Zalo để đổi mã code lấy Access Token
    const response = await axios.post(
      "https://oauth.zaloapp.com/v4/access_token",
      new URLSearchParams({
        code: code,
        app_id: process.env.ZALO_APP_ID,
        grant_type: "authorization_code",
      }),
      {
        headers: { secret_key: process.env.ZALO_APP_SECRET },
      }
    );

    const { access_token, refresh_token } = response.data;
    console.log("Token nhận được:", access_token);

    // lưu token này vào database
    res.send("Kết nối Zalo thành công! Bạn có thể đóng cửa sổ này.");
  } catch (error) {
    console.error("Lỗi lấy Token:", error.response?.data || error.message);
    res.status(500).send("Lỗi trong quá trình lấy Token");
  }
});

// 3. XỬ LÝ WEBHOOK (Nhận tracking và info khách)
app.post("/zalo/webhook", (req, res) => {
  const data = req.body;
  console.log("Dữ liệu Webhook gửi về:", data);

  // Xử lý sự kiện: ví dụ khách gửi thông tin (user_submit_info)
  if (data.event_name === "user_submit_info") {
    const userInfo = data.info;
    console.log(
      "Khách hàng đã cung cấp thông tin:",
      userInfo.name,
      userInfo.phone
    );
    // Lưu userInfo vào database tại đây để thực hiện KR2
  }

  // Luôn phản hồi 200 OK trong vòng < 2 giây để Zalo không báo lỗi
  res.status(200).send({ message: "Received" });
});

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server đang chạy tại port ${PORT}`));
