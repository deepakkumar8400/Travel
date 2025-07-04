const pool = require('../config/database');

exports.addExpense = async (req, res) => {
  try {
    const { tripId, category, amount, description } = req.body;
    
    const [result] = await pool.execute(
      `INSERT INTO expenses 
      (trip_id, category, amount, description) 
      VALUES (?, ?, ?, ?)`,
      [tripId, category, amount, description]
    );
    
    // Get budget for comparison
    const [budget] = await pool.execute(
      'SELECT * FROM budgets WHERE trip_id = ?', 
      [tripId]
    );
    
    // Calculate total expenses
    const [expenses] = await pool.execute(
      'SELECT SUM(amount) as total FROM expenses WHERE trip_id = ?', 
      [tripId]
    );
    
    const comparison = {
      budget: budget[0]?.total_budget || 0,
      spent: expenses[0].total || 0,
      remaining: (budget[0]?.total_budget || 0) - (expenses[0].total || 0)
    };
    
    res.status(201).json({ 
      expenseId: result.insertId,
      comparison 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};