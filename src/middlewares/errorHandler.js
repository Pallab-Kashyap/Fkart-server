import ApiError from "../utils/APIError.js";


const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }), 
    });
  }


  return res.status(500).json({
    message: 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }), 
  });
};

export default errorHandler;
