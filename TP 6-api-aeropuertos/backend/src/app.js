const express = require('express');
const cors = require('cors');
const { connectDB, redisGeoClient, redisPopClient, mongoose } = require('./config'); 
const airportRoutes = require('./routes/airports');
const { runInitialDataLoad } = require('./controllers/airportController');

const app = express();


connectDB(); 


app.use(cors()); 
app.use(express.json()); 


app.use('/api/airports', airportRoutes);


app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    mongodb_status: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    redis_geo_status: redisGeoClient.status,
    redis_pop_status: redisPopClient.status
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Backend server running on port ${PORT}`);
  setTimeout(async () => {
    if (redisGeoClient.status === 'ready' && redisPopClient.status === 'ready' && mongoose.connection.readyState === 1) {
      await runInitialDataLoad();
    } else {
      console.warn('DBs not ready, skipping initial data load on app start. Will retry if endpoint is hit or manually triggered.');
    }
  }, 5000);
});


process.on('SIGINT', async () => {
  console.log('Cerrando conexiones...');
  await mongoose.disconnect();
  redisGeoClient.quit();
  redisPopClient.quit();
  console.log('Conexiones cerradas. Saliendo.');
  process.exit(0);
});