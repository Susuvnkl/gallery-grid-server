import { Request, Response, NextFunction } from "express";
import CustomError from "../errors/CustomError";

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  console.error("Unexpected Error: ", err);

  res.status(500).json({
    status: "error",
    message: "Internal Server Error",
  });
};

export default errorHandler;
