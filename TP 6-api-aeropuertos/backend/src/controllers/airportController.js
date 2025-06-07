const Airport = require('../models/Airport');
const { redisGeoClient, redisPopClient } = require('../config');
const fs = require('fs');
const path = require('path');

const AIRPORTS_GEO_KEY = 'airports-geo';
const AIRPORT_POPULARITY_KEY = 'airport_popularity';
const POPULARITY_TTL = 86400; 

let initialDataLoaded = false;


const parseCityCountry = (cityCountryString) => {
  if (!cityCountryString) return { city: 'N/A', country: 'N/A' };
  const parts = cityCountryString.split(',');
  const city = parts[0] ? parts[0].trim() : 'N/A';
  const country = parts.length > 1 ? parts.slice(1).join(',').trim() : 'N/A';
  return { city, country };
};

exports.runInitialDataLoad = async () => {
  if (initialDataLoaded) {
    console.log('Initial data load process already attempted.');
    return;
  }
  initialDataLoaded = true; 

  try {
    const count = await Airport.countDocuments();
    if (count === 0) {
      console.log('No airports found in MongoDB. Loading initial data from airports.json...');
      const filePath = path.join(__dirname, '..', '..', 'airports.json');
      if (!fs.existsSync(filePath)) {
        console.error(`ERROR: airports.json not found at ${filePath}`);
        return;
      }
      const airportsFileContent = fs.readFileSync(filePath, 'utf-8');
      const airportsData = JSON.parse(airportsFileContent);

      await Airport.deleteMany({});
      console.log('Previous airports collection dropped from MongoDB.');

      await redisGeoClient.del(AIRPORTS_GEO_KEY);
      console.log('Previous Redis GEO data cleared.');
      await redisPopClient.del(AIRPORT_POPULARITY_KEY);
      console.log('Previous Redis Popularity data cleared.');

      let loadedCount = 0;
      for (const rawAirport of airportsData) {
        if (!rawAirport.iata_faa || !rawAirport.name || !rawAirport.city || rawAirport.lat == null || rawAirport.lng == null) {
          console.warn(`Skipping airport due to missing critical data: ${rawAirport.name || rawAirport.iata_faa}`);
          continue;
        }
        const { city, country } = parseCityCountry(rawAirport.city);

        const airportDoc = {
          iata_code: rawAirport.iata_faa.toUpperCase(),
          name: rawAirport.name,
          city: city,
          country: country,
          latitude: parseFloat(rawAirport.lat),
          longitude: parseFloat(rawAirport.lng),
          altitude: rawAirport.alt ? parseInt(rawAirport.alt) : null,
          timezone: rawAirport.tz,
          raw_city_info: rawAirport.city
        };

        try {
          const airport = new Airport(airportDoc);
          await airport.save();
          await redisGeoClient.geoadd(AIRPORTS_GEO_KEY, airport.longitude, airport.latitude, airport.iata_code);
          loadedCount++;
        } catch (dbError) {
          if (dbError.code === 11000) { 
            console.warn(`Skipping duplicate IATA code: ${airportDoc.iata_code}. Airport: ${airportDoc.name}`);
          } else {
            console.error(`Error saving airport ${airportDoc.iata_code} (${airportDoc.name}) to MongoDB:`, dbError.message);
          }
        }
      }
      console.log(`${loadedCount} airports loaded into MongoDB and Redis GEO.`);

      if (loadedCount > 0 || await redisPopClient.exists(AIRPORT_POPULARITY_KEY) === 0) {
        await redisPopClient.zadd(AIRPORT_POPULARITY_KEY, 'NX', 0, '_init_placeholder_');
        await redisPopClient.zrem(AIRPORT_POPULARITY_KEY, '_init_placeholder_');
        await redisPopClient.expire(AIRPORT_POPULARITY_KEY, POPULARITY_TTL);
        console.log(`Redis Popularity ZSET '${AIRPORT_POPULARITY_KEY}' initialized/TTL set: ${POPULARITY_TTL}s.`);
      }

    } else {
      console.log(`${count} airports already in DB. Initial data load skipped.`);
      if (await redisPopClient.exists(AIRPORT_POPULARITY_KEY)) {
        await redisPopClient.expire(AIRPORT_POPULARITY_KEY, POPULARITY_TTL);
        console.log(`TTL for existing '${AIRPORT_POPULARITY_KEY}' refreshed.`);
      }
    }
  } catch (error) {
    console.error('Error during initial data load:', error);
  }
};


exports.createAirport = async (req, res) => {
  try {
    const { iata_faa, name, city_raw, lat, lng, alt, tz } = req.body;

    if (!iata_faa || !name || !city_raw || lat == null || lng == null) {
      return res.status(400).json({ message: 'Missing required fields: iata_faa, name, city_raw, lat, lng' });
    }
    const iata_code = iata_faa.toUpperCase();
    const { city, country } = parseCityCountry(city_raw);

    let airport = await Airport.findOne({ iata_code });
    if (airport) {
      return res.status(400).json({ message: 'Airport with this IATA code already exists' });
    }

    const airportDoc = {
        iata_code, name, city, country,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        altitude: alt ? parseInt(alt) : null,
        timezone: tz,
        raw_city_info: city_raw
    };

    airport = new Airport(airportDoc);
    await airport.save();

    await redisGeoClient.geoadd(AIRPORTS_GEO_KEY, airport.longitude, airport.latitude, airport.iata_code);


    res.status(201).json(airport);
  } catch (error) {
    console.error("Error creating airport:", error.message);
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Server error creating airport', error: error.message });
  }
};

exports.getAllAirports = async (req, res) => {
  try {
    const airports = await Airport.find().sort({ name: 1 }); 
    res.json(airports);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching all airports', error: error.message });
  }
};

exports.getAirportByIataCode = async (req, res) => {
  try {
    const { iata_code } = req.params;
    const airport = await Airport.findOne({ iata_code: iata_code.toUpperCase() });

    if (!airport) {
      return res.status(404).json({ message: 'Airport not found' });
    }

    await redisPopClient.zincrby(AIRPORT_POPULARITY_KEY, 1, airport.iata_code);
    await redisPopClient.expire(AIRPORT_POPULARITY_KEY, POPULARITY_TTL); // Asegurar TTL

    res.json(airport);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching airport by IATA', error: error.message });
  }
};

exports.updateAirport = async (req, res) => {
  try {
    const { iata_code } = req.params;
    const updates = req.body;

  
    if (updates.city_raw) {
        const {city, country} = parseCityCountry(updates.city_raw);
        updates.city = city;
        updates.country = country;
        updates.raw_city_info = updates.city_raw;
    }

    if (updates.lat !== undefined) updates.latitude = parseFloat(updates.lat);
    if (updates.lng !== undefined) updates.longitude = parseFloat(updates.lng);
    if (updates.alt !== undefined) updates.altitude = parseInt(updates.alt);
    if (updates.tz !== undefined) updates.timezone = updates.tz;

  
    if (updates.iata_faa && updates.iata_faa.toUpperCase() !== iata_code.toUpperCase()) {
        return res.status(400).json({ message: 'Cannot change IATA code (iata_faa) via update. Delete and create new.' });
    }
    delete updates.iata_faa;
    delete updates.iata_code; 
    delete updates.lat; delete updates.lng; delete updates.alt; delete updates.tz; delete updates.city_raw;


    const airport = await Airport.findOneAndUpdate(
      { iata_code: iata_code.toUpperCase() },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!airport) {
      return res.status(404).json({ message: 'Airport not found' });
    }

  
    if (updates.latitude !== undefined || updates.longitude !== undefined) {
      await redisGeoClient.geoadd(AIRPORTS_GEO_KEY, airport.longitude, airport.latitude, airport.iata_code);
    }

    res.json(airport);
  } catch (error)
 {
    console.error("Error updating airport:", error.message);
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Server error updating airport', error: error.message });
  }
};

exports.deleteAirport = async (req, res) => {
  try {
    const { iata_code } = req.params;
    const code = iata_code.toUpperCase();

    const airport = await Airport.findOneAndDelete({ iata_code: code });

    if (!airport) {
      return res.status(404).json({ message: 'Airport not found' });
    }

    await redisGeoClient.zrem(AIRPORTS_GEO_KEY, code);
    await redisPopClient.zrem(AIRPORT_POPULARITY_KEY, code);

    res.json({ message: 'Airport deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting airport', error: error.message });
  }
};


exports.getNearbyAirports = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng || !radius) {
      return res.status(400).json({ message: 'Missing required query parameters: lat, lng, radius' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusKm)) {
        return res.status(400).json({ message: 'Invalid numeric value for lat, lng, or radius.' });
    }

    const nearbyResults = await redisGeoClient.georadius(
      AIRPORTS_GEO_KEY,
      longitude,
      latitude,
      radiusKm,
      'km',
      'WITHDIST',
      'WITHCOORD',
      'COUNT', 20, 
      'ASC'
    );

  
    const airportsDetails = [];
    for (const result of nearbyResults) {
      const iataCode = result[0];
      const distance = result[1];
      const coords = result[2]; 

      const airportDoc = await Airport.findOne({ iata_code: iataCode }).lean(); 
      if (airportDoc) {
        airportsDetails.push({
          ...airportDoc,
          distance_km: parseFloat(distance).toFixed(2),
        });
      }
    }

    res.json(airportsDetails);
  } catch (error) {
    console.error("Error fetching nearby airports:", error);
    res.status(500).json({ message: 'Server error fetching nearby airports', error: error.message });
  }
};


exports.getPopularAirports = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10; 

    const popular = await redisPopClient.zrevrange(AIRPORT_POPULARITY_KEY, 0, limit - 1, 'WITHSCORES');


    const popularAirportsDetails = [];
    for (let i = 0; i < popular.length; i += 2) {
      const iataCode = popular[i];
      const score = popular[i + 1];
      const airportDoc = await Airport.findOne({ iata_code: iataCode }).lean();
      if (airportDoc) {
        popularAirportsDetails.push({
          ...airportDoc,
          visits: parseInt(score)
        });
      }
    }

    await redisPopClient.expire(AIRPORT_POPULARITY_KEY, POPULARITY_TTL);

    res.json(popularAirportsDetails);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching popular airports', error: error.message });
  }
};