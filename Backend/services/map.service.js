const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

exports.getLocationCoordinates = async (destination) => {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: destination,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });
    
    if (response.data.results.length > 0) {
      return response.data.results[0].geometry.location;
    }
    return null;
  } catch (error) {
    throw new Error('Failed to fetch location data');
  }
};