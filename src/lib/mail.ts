import { readFile } from "node:fs/promises";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createTransport } from "nodemailer";
import handlebars from "handlebars";

const isProduction = process.env.NODE_ENV === "production";

const transporter = createTransport(
  isProduction
    ? {
        service: "gmail",
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      }
    : {
        host: "localhost",
        port: 1025,
        secure: false,
      },
);

export const sendMail = async ({
  to,
  subject,
  templateName,
  context,
}: {
  to: string;
  subject: string;
  templateName: string;
  context: object;
}) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const templatesDir = path.resolve(__dirname, "../templates");
  const templatesPath = path.join(templatesDir, templateName);
  const templatesSource = await readFile(templatesPath, "utf-8");
  const html = handlebars.compile(templatesSource)(context);
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: to,
    subject: subject,
    html: html,
  });
};
