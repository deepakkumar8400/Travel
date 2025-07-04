const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth.routes');
const tripRoutes = require('./routes/trip.routes');
const budgetRoutes = require('./routes/budget.routes');
const mapRoutes = require('./routes/map.routes');
const weatherRoutes = require('./routes/weather.routes');
const expenseRoutes = require('./routes/expense.routes');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/maps', mapRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/expenses', expenseRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});