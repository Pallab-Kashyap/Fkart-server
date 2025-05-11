import ApiError from "../utils/APIError.js";
import { Error } from "sequelize";

const errorHandler = (err, req, res, next) => {

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      status: false,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }), 
    });
  }

  if (err instanceof Error) {
    // Handle Sequelize Unique Constraint Error
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        status: false,
        message: err.errors[0].message,
      });
    }
    // Handle Other Sequelize Errors;
    return res.status(400).json({
      status: false,
      message: err.errors[0].message,
    });
  }
  console.log(err);
  return res.status(500).json({
    status: false,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }), 
  });
};

export default errorHandler;
