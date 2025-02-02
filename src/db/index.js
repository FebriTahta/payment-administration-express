const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const dbConnect = async () => {
    try {
        // Hubungkan ke database
        await prisma.$connect();
        console.log("Database connected successfully!");
    } catch (error) {
        console.error("Error connecting to the database:", error.message);
        process.exit(0); // Keluar dari proses jika gagal
    }
};

const dbDisconnect = async () => {
    try {
        // Tutup koneksi database
        await prisma.$disconnect();
        console.log("Database disconnected successfully!");
    } catch (error) {
        console.error("Error disconnecting from the database:", error.message);
    }
};

module.exports = { prisma, dbConnect, dbDisconnect };
