import { CorsOptions } from "cors";

export const corsOption: CorsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:4173",
    process.env.BASE_URL_FE!,
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // 💡 Pastikan OPTIONS terdaftar
  optionsSuccessStatus: 200,
};
