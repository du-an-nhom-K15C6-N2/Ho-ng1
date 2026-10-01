require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "user_db",
    waitForConnections: true,
    connectionLimit: 10
});

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Bạn chưa đăng nhập." });
    }

    jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
        if (error) {
            return res.status(403).json({
                message: "Token không hợp lệ hoặc đã hết hạn."
            });
        }

        req.user = user;
        next();
    });
}

// Kiểm tra chính sách mật khẩu ở SERVER.
// Không chỉ kiểm tra ở frontend vì frontend có thể bị bỏ qua.
function validatePasswordPolicy(password) {
    const errors = [];

    if (typeof password !== "string" || password.length < 8) {
        errors.push("Mật khẩu phải có ít nhất 8 ký tự.");
    }

    if (!/[A-Z]/.test(password)) {
        errors.push("Mật khẩu phải có ít nhất 1 chữ hoa.");
    }

    if (!/[a-z]/.test(password)) {
        errors.push("Mật khẩu phải có ít nhất 1 chữ thường.");
    }

    if (!/[0-9]/.test(password)) {
        errors.push("Mật khẩu phải có ít nhất 1 chữ số.");
    }

    if (!/[!@#$%^&*]/.test(password)) {
        errors.push("Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*).");
    }

    return errors;
}

app.post("/api/auth/change-password", authenticateToken, async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
            message: "Vui lòng nhập đầy đủ thông tin."
        });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({
            message: "Mật khẩu mới không khớp."
        });
    }

    const policyErrors = validatePasswordPolicy(newPassword);

    if (policyErrors.length > 0) {
        return res.status(400).json({
            message: "Mật khẩu chưa đáp ứng chính sách.",
            errors: policyErrors
        });
    }

    try {
        const userId = req.user.id;

        const [users] = await db.execute(
            "SELECT id, password FROM users WHERE id = ? LIMIT 1",
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "Không tìm thấy người dùng."
            });
        }

        const user = users[0];

        const correctPassword = await bcrypt.compare(
            oldPassword,
            user.password
        );

        if (!correctPassword) {
            return res.status(401).json({
                message: "Mật khẩu hiện tại không đúng."
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await db.execute(
            "UPDATE users SET password = ? WHERE id = ?",
            [hashedPassword, userId]
        );

        return res.json({
            message: "Đổi mật khẩu thành công."
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Lỗi máy chủ."
        });
    }
});

app.listen(3000, () => {
    console.log("API đang chạy tại http://localhost:3000");
});
