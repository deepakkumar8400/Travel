const pool = require('../config/database');

exports.createTrip = async (req, res) => {
  try {
    const { destination, startDate, endDate, purpose, companions } = req.body;
    const userId = req.user.id;
    
    const [result] = await pool.execute(
      `INSERT INTO trips 
      (user_id, destination, start_date, end_date, purpose, companions) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, destination, startDate, endDate, purpose, JSON.stringify(companions)]
    );
    
    res.status(201).json({ tripId: result.insertId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserTrips = async (req, res) => {
  try {
    const userId = req.user.id;
    const [trips] = await pool.execute('SELECT * FROM trips WHERE user_id = ?', [userId]);
    
    res.json(trips.map(trip => ({
      ...trip,
      companions: JSON.parse(trip.companions)
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};