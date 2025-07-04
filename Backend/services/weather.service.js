const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

exports.getWeatherForecast = async (lat, lon, startDate, endDate) => {
  try {
    const response = await axios.get('https://api.openweathermap.org/data/2.5/onecall', {
      params: {
        lat,
        lon,
        exclude: 'minutely,hourly',
        units: 'metric',
        appid: process.env.OPENWEATHER_API_KEY
      }
    });
    
    // Filter weather data for the trip duration
    const tripDays = getDatesInRange(startDate, endDate);
    const dailyForecasts = response.data.daily.filter(day => {
      const dayDate = new Date(day.dt * 1000).toISOString().split('T')[0];
      return tripDays.includes(dayDate);
    });
    
    return dailyForecasts.map(day => ({
      date: new Date(day.dt * 1000).toLocaleDateString(),
      temp: day.temp.day,
      weather: day.weather[0].main,
      icon: day.weather[0].icon
    }));
  } catch (error) {
    throw new Error('Failed to fetch weather data');
  }
};

function getDatesInRange(startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate);
  const end = new Date(endDate);
  
  while (currentDate <= end) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}