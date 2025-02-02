const jwt = require("jsonwebtoken");

// Penyimpanan sementara untuk melacak waktu akses terakhir
const accessTimestamps = new Map();

const VerifyToken = (allowedRoles = [], rateLimit = null) => {
  return (req, res, next) => {
    try {
      // Ambil token dari header Authorization
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw { status: 400, message: "Token is missing or malformed" };
      }

      // Ekstrak token dari header
      const token = authHeader.split(" ")[1];
      if (!token) {
        throw { status: 401, message: "Authorization denied: Token is missing" };
      }

      // Verifikasi token menggunakan JWT_SECRET
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

      // Cek apakah token telah kedaluwarsa
      const currentTime = Math.floor(Date.now() / 1000); // Waktu sekarang (detik)
      if (decodedToken.exp < currentTime) {
        throw { status: 401, message: "Token has expired" };
      }

      // Validasi role pengguna berdasarkan allowedRoles
      const userRoles = decodedToken.ROLES || [];
      const isAuthorized = allowedRoles.length === 0 || allowedRoles.some((role) => userRoles.includes(role));
      if (!isAuthorized) {
        throw { status: 403, message: "Access denied: You do not have the required role" };
      }

      // **Pembatasan Akses (Rate Limiting)** jika rateLimit disediakan
      if (rateLimit) {
        const userId = decodedToken.id || decodedToken.userId || decodedToken.email; // ID unik pengguna
        const lastAccessTime = accessTimestamps.get(userId) || 0;
        const elapsedTime = Date.now() - lastAccessTime; // Waktu sejak akses terakhir dalam milidetik

        if (elapsedTime < rateLimit) {
          const waitTime = Math.ceil((rateLimit - elapsedTime) / 1000); // Sisa waktu tunggu dalam detik
          throw { 
            status: 429, 
            message: `Please wait ${waitTime} seconds before accessing this endpoint again.` 
          };
        }

        // Simpan waktu akses terakhir
        accessTimestamps.set(userId, Date.now());
      }

      // Simpan informasi pengguna di `req.user`
      req.user = decodedToken;
      next(); // Lanjutkan ke middleware berikutnya
    } catch (error) {
      // Penanganan error dengan status dan pesan yang konsisten
      const statusCode = error.status || 400;
      res.status(statusCode).json({
        status: statusCode,
        message: error.message || "An error occurred during token verification",
        data: null,
      });
    }
  };
};

module.exports = VerifyToken;
