"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOTPEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const createTransporter = () => {
    // For development, you can use a service like Gmail
    // In production, use a dedicated email service like SendGrid, AWS SES, etc.
    return nodemailer_1.default.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER || "your-email@gmail.com",
            pass: process.env.EMAIL_PASS || "your-app-password", // Use app password for Gmail
        },
    });
};
const sendOTPEmail = (email, otp) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // For development: Log OTP to console if email service is not configured
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log("📧 EMAIL NOT CONFIGURED - OTP for development:", otp);
            console.log("📋 Configure EMAIL_USER and EMAIL_PASS in .env file to send actual emails");
            return true; // Return true for development purposes
        }
        const transporter = createTransporter();
        const mailOptions = {
            from: process.env.EMAIL_USER || "RSSB Library <rssbsearch@gmail.com>",
            to: email,
            subject: "RSSB Library - Admin Login OTP",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #ea580c; margin-bottom: 10px;">🙏 RSSB Spiritual Library</h1>
                            <p style="color: #666; margin: 0;">Radha Soami Satsang Beas</p>
                <p style="color: #888; margin: 0; font-size: 12px;">Science of the Soul</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 12px; border-left: 4px solid #ea580c;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Admin Login OTP</h2>
            <p style="color: #374151; margin-bottom: 20px;">
              Your One-Time Password for admin access to the RSSB Spiritual Library:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background: #ea580c; color: white; padding: 15px 30px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 3px;">
                ${otp}
              </div>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
              • This OTP is valid for 10 minutes only
            </p>
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
              • Do not share this OTP with anyone
            </p>
            <p style="color: #6b7280; font-size: 14px;">
              • If you didn't request this OTP, please ignore this email
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
            <p>RSSB Spiritual Library System</p>
            <p>🙏 Radha Soami Satsang Beas 🙏</p>
          </div>
        </div>
      `,
        };
        yield transporter.sendMail(mailOptions);
        console.log(`📧 OTP email sent successfully to ${email}`);
        return true;
    }
    catch (error) {
        console.error("❌ Error sending OTP email:", error);
        console.log("💡 Make sure EMAIL_USER and EMAIL_PASS are configured in .env file");
        console.log("📚 Check EMAIL_SETUP_GUIDE.md for detailed setup instructions");
        return false;
    }
});
exports.sendOTPEmail = sendOTPEmail;
