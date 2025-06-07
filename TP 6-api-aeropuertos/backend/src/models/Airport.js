const mongoose = require('mongoose');

const AirportSchema = new mongoose.Schema({
  iata_code: { 
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 3,
    maxlength: 3 
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  city: { 
    type: String,
    required: true,
    trim: true
  },
  country: { 
    type: String,
    required: true,
    trim: true
  },
  latitude: { 
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  longitude: { 
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  altitude: { 
    type: Number
  },
  timezone: { 
    type: String
  },
  raw_city_info: { 
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Airport', AirportSchema);