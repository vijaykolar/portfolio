import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export const sendEmail = async (email: string) => {
  const msg = {
    to: email,
    from: "your_verified_sendgrid_email@example.com",
    subject: "Welcome to our Mailing List!",
    text: "Thank you for joining our mailing list. We will keep you updated with our latest news and offers.",
    html: "<strong>Thank you for joining our mailing list. We will keep you updated with our latest news and offers.</strong>",
  };

  await sgMail.send(msg);
};
