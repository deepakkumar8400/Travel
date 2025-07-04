const pool = require('../config/database');

exports.createBudget = async (req, res) => {
  try {
    const { tripId, travelCost, hotelCost, foodCost, extraCost, notes } = req.body;
    
    const totalBudget = travelCost + hotelCost + foodCost + extraCost;
    
    const [result] = await pool.execute(
      `INSERT INTO budgets 
      (trip_id, travel_cost, hotel_cost, food_cost, extra_cost, total_budget, notes) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tripId, travelCost, hotelCost, foodCost, extraCost, totalBudget, notes]
    );
    
    res.status(201).json({ 
      budgetId: result.insertId,
      totalBudget 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};