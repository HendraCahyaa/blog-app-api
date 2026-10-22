import { NextFunction, Request, Response } from "express";
import multer from "multer";
import fileType from "file-type";
import { ApiError } from "../utils/api-error.js";

export const upload = (maxSize: number = 2) => {
  const storage = multer.memoryStorage();
  const limits = {
    fileSize: maxSize * 1024 * 1024,
  };
  return multer({ storage, limits });
};
export const fileFilter = (allowedType: fileType.MimeType[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as { [fieldName: string]: Express.Multer.File[] };

      for (const fieldName in files) {
        const fileArray = files[fieldName];
        for (const file of fileArray) {
          const type = await fileType.fromBuffer(file.buffer);

          if (!type || allowedType.includes(type.mime)) {
            throw new ApiError("File type is not allowed", 400);
          }
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
