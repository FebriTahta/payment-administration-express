const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const router = require('./routes');
const cache = require('./redis');
const fcm = require("./fcm/fcm.services");
const http = require('http');
const { dbConnect, dbDisconnect } = require("./db");


// inisialisasi
const PORT = process.env.PORT || 2000; // inisialisasi port
const app = express(); // inisialisasi express
const server = http.createServer(app);  // inisialisasi server jalannya app
const allowedOrigins = [ // Inisialisasi cors
    'http://localhost:3000',
    'https://next-school-payment.vercel.app',
    'https://frontend.paysmkkrian1.site',
    'https://app.paysmkkrian1.site'
];
dotenv.config(); // Inisialisasi .env
fcm.initializeFCM(); // Inisialisasi Firebase

// use app
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/', router);

// start running server here
server.listen(PORT, () => {
    console.log('Express API running on PORT : ' + PORT);
});

(async () => {
    try {
        await dbConnect();
        const redis_connection = await cache.connectRedis();
        cache.set('redis_ok', 'connection was good', 600);
    } catch (error) {
        console.error('Failed to connect to Redis:', error);
    }
})();

process.on('SIGINT', async () => {
    try {
        console.log('Gracefully shutting down...');
        await cache.disconnectRedis();
        await dbDisconnect();
    } catch (err) {
        console.error('Error during shutdown:', err);
    } finally {
        process.exit(0);
    }
});
