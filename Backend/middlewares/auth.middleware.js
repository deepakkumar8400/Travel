const { pool } = require('../config/database');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');
const { validateDateRange } = require('../utils/validators');

exports.createTrip = async (req, res, next) => {
  try {
    const { destination, startDate, endDate, purpose, companions, notes } = req.body;
    const userId = req.user.id;

    // Validation
    if (!destination || !startDate || !endDate || !purpose) {
      throw new ApiError(400, 'Missing required fields');
    }

    if (!validateDateRange(startDate, endDate)) {
      throw new ApiError(400, 'End date must be after start date');
    }

    // Validate companions array if provided
    if (companions && !Array.isArray(companions)) {
      throw new ApiError(400, 'Companions must be an array');
    }

    // Create trip
    const [result] = await pool.execute(
      `INSERT INTO trips 
      (user_id, destination, start_date, end_date, purpose, companions, notes) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, 
        destination, 
        startDate, 
        endDate, 
        purpose, 
        companions ? JSON.stringify(companions) : null,
        notes || null
      ]
    );

    logger.info(`Trip created: ${result.insertId} by user ${userId}`);
    
    res.status(201).json({ 
      tripId: result.insertId,
      message: 'Trip created successfully'
    });
  } catch (error) {
    logger.error('Trip creation error:', error);
    next(error);
  }
};

exports.getTrip = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;

    const [trips] = await pool.execute(
      `SELECT 
        id, destination, start_date as startDate, 
        end_date as endDate, purpose, companions, notes, 
        created_at as createdAt
      FROM trips 
      WHERE id = ? AND user_id = ?`,
      [tripId, userId]
    );

    if (trips.length === 0) {
      throw new ApiError(404, 'Trip not found');
    }

    const trip = {
      ...trips[0],
      companions: trips[0].companions ? JSON.parse(trips[0].companions) : []
    };

    res.json(trip);
  } catch (error) {
    logger.error('Get trip error:', error);
    next(error);
  }
};

exports.updateTrip = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;
    const { destination, startDate, endDate, purpose, companions, notes } = req.body;

    // Verify trip exists and belongs to user
    const [existingTrips] = await pool.execute(
      'SELECT id FROM trips WHERE id = ? AND user_id = ?',
      [tripId, userId]
    );

    if (existingTrips.length === 0) {
      throw new ApiError(404, 'Trip not found');
    }

    // Build update query dynamically based on provided fields
    const updateFields = [];
    const queryParams = [];
    
    if (destination) {
      updateFields.push('destination = ?');
      queryParams.push(destination);
    }
    
    if (startDate) {
      updateFields.push('start_date = ?');
      queryParams.push(startDate);
    }
    
    if (endDate) {
      updateFields.push('end_date = ?');
      queryParams.push(endDate);
    }
    
    if (purpose) {
      updateFields.push('purpose = ?');
      queryParams.push(purpose);
    }
    
    if (companions !== undefined) {
      updateFields.push('companions = ?');
      queryParams.push(companions ? JSON.stringify(companions) : null);
    }
    
    if (notes !== undefined) {
      updateFields.push('notes = ?');
      queryParams.push(notes);
    }

    if (updateFields.length === 0) {
      throw new ApiError(400, 'No fields to update');
    }

    // Add tripId at the end for WHERE clause
    queryParams.push(tripId);

    const query = `UPDATE trips SET ${updateFields.join(', ')} WHERE id = ?`;
    
    await pool.execute(query, queryParams);

    logger.info(`Trip updated: ${tripId} by user ${userId}`);
    
    res.json({ message: 'Trip updated successfully' });
  } catch (error) {
    logger.error('Update trip error:', error);
    next(error);
  }
};

exports.deleteTrip = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;

    // Verify trip exists and belongs to user
    const [existingTrips] = await pool.execute(
      'SELECT id FROM trips WHERE id = ? AND user_id = ?',
      [tripId, userId]
    );

    if (existingTrips.length === 0) {
      throw new ApiError(404, 'Trip not found');
    }

    // Using transactions to ensure data consistency
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Delete related data first (due to foreign key constraints)
      await connection.execute(
        'DELETE FROM budgets WHERE trip_id = ?',
        [tripId]
      );
      
      await connection.execute(
        'DELETE FROM locations WHERE trip_id = ?',
        [tripId]
      );
      
      await connection.execute(
        'DELETE FROM expenses WHERE trip_id = ?',
        [tripId]
      );

      // Finally delete the trip
      await connection.execute(
        'DELETE FROM trips WHERE id = ?',
        [tripId]
      );

      await connection.commit();
      
      logger.info(`Trip deleted: ${tripId} by user ${userId}`);
      
      res.json({ message: 'Trip deleted successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    logger.error('Delete trip error:', error);
    next(error);
  }
};

exports.listTrips = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, sortBy = 'start_date', sortOrder = 'ASC' } = req.query;

    // Validate sort parameters
    const validSortFields = ['start_date', 'end_date', 'destination', 'created_at'];
    if (!validSortFields.includes(sortBy)) {
      throw new ApiError(400, 'Invalid sort field');
    }

    if (!['ASC', 'DESC'].includes(sortOrder.toUpperCase())) {
      throw new ApiError(400, 'Invalid sort order');
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Get total count for pagination metadata
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM trips WHERE user_id = ?',
      [userId]
    );
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // Get paginated trips
    const [trips] = await pool.execute(
      `SELECT 
        id, destination, start_date as startDate, 
        end_date as endDate, purpose, created_at as createdAt
      FROM trips 
      WHERE user_id = ?
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), offset]
    );

    res.json({
      data: trips,
      pagination: {
        total,
        totalPages,
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('List trips error:', error);
    next(error);
  }
};