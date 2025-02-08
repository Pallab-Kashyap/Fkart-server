import ApiError from "../utils/APIError.js";

const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      status: false,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }), 
    });
  }

  if (err.name && err.name.startsWith('Sequelize')) {
    // Handle Sequelize Unique Constraint Error
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        status: false,
        message: 'Duplicate value detected. Please check your input.',
      });
    }
    // Handle Other Sequelize Errors;
    return res.status(400).json({
      status: false,
      message: 'Database error occurred.',
      details: err.message,
    });
  }
  return res.status(500).json({
    status: false,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }), 
  });
};

export default errorHandler;
