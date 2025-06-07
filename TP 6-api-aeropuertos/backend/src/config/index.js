require('dotenv').config();
const mongoose = require('mongoose');
const Redis = require('ioredis');

const mongoURI = process.env.MONGO_URI || 'mongodb://mongo:27017/airport_db';
const redisGeoHost = process.env.REDIS_GEO_HOST || 'redis-geo';
const redisGeoPort = process.env.REDIS_GEO_PORT || 6379;
const redisPopHost = process.env.REDIS_POP_HOST || 'redis-pop';
const redisPopPort = process.env.REDIS_POP_PORT || 6379;

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    setTimeout(connectDB, 5000);
  }
};

const redisGeoClient = new Redis({
  host: redisGeoHost,
  port: redisGeoPort,
  retryStrategy: times => Math.min(times * 50, 2000) 
});

const redisPopClient = new Redis({
  host: redisPopHost,
  port: redisPopPort,
  retryStrategy: times => Math.min(times * 50, 2000) 
});

redisGeoClient.on('connect', () => console.log('Redis GEO Connected...'));
redisGeoClient.on('error', err => console.error('Redis GEO Connection Error:', err));

redisPopClient.on('connect', () => console.log('Redis Popularity Connected...'));
redisPopClient.on('error', err => console.error('Redis Popularity Connection Error:', err));

module.exports = {
  connectDB,
  redisGeoClient,
  redisPopClient,
  mongoose
};