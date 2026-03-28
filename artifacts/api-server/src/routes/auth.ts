import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { connectDB, User } from "@workspace/db";
import crypto from "crypto";

const router: IRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || "elowell-secret-key-2024";

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via email using nodemailer
async function sendOTPEmail(email: string, otp: string, type: 'signup' | 'login' | 'reset' = 'signup') {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const subject = {
      signup: 'Verify Your Email - Elowell',
      login: 'Login Verification - Elowell', 
      reset: 'Password Reset - Elowell'
    }[type];

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2d5016; margin: 0;">Elowell Natural Products</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
          <h2 style="color: #333; margin-bottom: 20px;">${subject}</h2>
          <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
            ${type === 'signup' ? 'Welcome! Please verify your email address to complete your registration.' : 
              type === 'reset' ? 'You requested a password reset. Use the code below to reset your password.' :
              'Please verify your identity to continue.'}
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #333; font-size: 14px; margin-bottom: 10px;">Your verification code is:</p>
            <h1 style="color: #2d5016; font-size: 32px; letter-spacing: 8px; margin: 0; font-family: monospace;">${otp}</h1>
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            This code will expire in 2 minutes. If you didn't request this, please ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Elowell Natural Products. All rights reserved.</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Elowell Natural Products" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: email,
      subject,
      html,
    });

    console.log(`OTP email sent to ${email} for ${type}`);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}

// Google SSO
router.post("/google-signin", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { credential } = req.body;
    
    // Decode Google JWT (in production, verify with Google's public keys)
    const payload = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString());
    const { email, name, sub: googleId } = payload;
    
    if (!email || !name) {
      res.status(400).json({ error: "Invalid Google credential" });
      return;
    }

    let user = await User.findOne({ email });
    
    if (user) {
      // Existing user - sign in directly (SSO doesn't need OTP)
      if (!user.isVerified) {
        user.isVerified = true;
        user.ssoProvider = "google";
        user.ssoId = googleId;
        await user.save();
      }
      const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
      res.json({
        user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role },
        token
      });
    } else {
      // New user - create and sign in directly (no OTP for SSO)
      const newUser = await User.create({
        name,
        email,
        isVerified: true, // SSO users are automatically verified
        ssoProvider: "google",
        ssoId: googleId,
        role: "customer"
      });
      const token = jwt.sign({ userId: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: "7d" });
      res.json({
        user: { id: newUser._id, name: newUser.name, email: newUser.email, phone: newUser.phone, role: newUser.role },
        token
      });
    }
  } catch (err) {
    req.log.error({ err }, "Google signin error");
    res.status(500).json({ error: "Google sign-in failed" });
  }
});

// SSO/Email signup with OTP (only for email signup, not SSO)
router.post("/signup", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { name, email, phone } = req.body;
    
    if (!name || !email) {
      res.status(400).json({ error: "Name and email are required" });
      return;
    }

    const existing = await User.findOne({ email });
    if (existing && existing.isVerified) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    if (existing) {
      // Update existing unverified user
      existing.name = name;
      existing.phone = phone;
      existing.otp = otp;
      existing.otpExpiry = otpExpiry;
      existing.otpAttempts = 0;
      // Don't set SSO fields for email signup
      existing.ssoProvider = undefined;
      existing.ssoId = undefined;
      await existing.save();
    } else {
      // Create new user
      await User.create({
        name,
        email,
        phone,
        otp,
        otpExpiry,
        otpAttempts: 0,
        role: "customer"
        // No SSO fields for email signup
      });
    }

    await sendOTPEmail(email, otp, 'signup');
    res.json({ message: "OTP sent to your email", email });
  } catch (err) {
    req.log.error({ err }, "Signup error");
    res.status(500).json({ error: "Signup failed" });
  }
});

// Verify OTP and complete registration (only for email signup)
router.post("/verify-otp", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (user.otpAttempts >= 3) {
      res.status(429).json({ error: "Too many attempts. Please request a new OTP" });
      return;
    }

    if (!user.otp || user.otp !== otp) {
      user.otpAttempts += 1;
      await user.save();
      res.status(400).json({ error: "Invalid OTP" });
      return;
    }

    if (user.otpExpiry && user.otpExpiry < new Date()) {
      res.status(400).json({ error: "OTP expired" });
      return;
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    await user.save();

    // For email signup, user needs to set password
    res.json({ message: "Email verified successfully", needsPassword: !user.password });
  } catch (err) {
    req.log.error({ err }, "OTP verification error");
    res.status(500).json({ error: "Verification failed" });
  }
});

// Set password after OTP verification
router.post("/set-password", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { email, password } = req.body;

    if (!password || password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    const user = await User.findOne({ email, isVerified: true });
    if (!user) {
      res.status(404).json({ error: "User not found or not verified" });
      return;
    }

    if (user.password) {
      res.status(400).json({ error: "Password already set" });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    user.password = hashed;
    await user.save();

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.json({
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role },
      token,
      message: "Account created successfully"
    });
  } catch (err) {
    req.log.error({ err }, "Set password error");
    res.status(500).json({ error: "Failed to set password" });
  }
});

// Resend OTP
router.post("/resend-otp", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ error: "Email already verified" });
      return;
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 2 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    user.otpAttempts = 0;
    await user.save();

    await sendOTPEmail(email, otp, 'signup');
    res.json({ message: "OTP resent successfully" });
  } catch (err) {
    req.log.error({ err }, "Resend OTP error");
    res.status(500).json({ error: "Failed to resend OTP" });
  }
});

// Login
router.post("/login", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }

    const user = await User.findOne({ email });
    if (!user || !user.isVerified) {
      res.status(401).json({ error: "Invalid credentials or email not verified" });
      return;
    }

    if (!user.password) {
      res.status(401).json({ error: "Please use SSO login or set a password" });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.json({
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role },
      token
    });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Login failed" });
  }
});

// Forgot password
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { email } = req.body;

    const user = await User.findOne({ email, isVerified: true });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 2 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    user.otpAttempts = 0;
    await user.save();

    await sendOTPEmail(email, otp, 'reset');
    res.json({ message: "Password reset OTP sent to your email" });
  } catch (err) {
    req.log.error({ err }, "Forgot password error");
    res.status(500).json({ error: "Failed to send reset OTP" });
  }
});

// Reset password
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { email, otp, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    const user = await User.findOne({ email, isVerified: true });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (user.otpAttempts >= 3) {
      res.status(429).json({ error: "Too many attempts. Please request a new OTP" });
      return;
    }

    if (!user.otp || user.otp !== otp) {
      user.otpAttempts += 1;
      await user.save();
      res.status(400).json({ error: "Invalid OTP" });
      return;
    }

    if (user.otpExpiry && user.otpExpiry < new Date()) {
      res.status(400).json({ error: "OTP expired" });
      return;
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    req.log.error({ err }, "Reset password error");
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// Change password (authenticated)
router.post("/change-password", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: "New password must be at least 6 characters" });
      return;
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (user.password && currentPassword) {
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        res.status(400).json({ error: "Current password is incorrect" });
        return;
      }
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    req.log.error({ err }, "Change password error");
    res.status(500).json({ error: "Failed to change password" });
  }
});

// Update profile (authenticated)
router.put("/profile", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const { name, phone } = req.body;

    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    await user.save();

    res.json({
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role },
      message: "Profile updated successfully"
    });
  } catch (err) {
    req.log.error({ err }, "Update profile error");
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Create/verify admin user (development only)
router.post("/create-admin", async (req: Request, res: Response) => {
  try {
    await connectDB();
    
    let admin = await User.findOne({ email: "admin@elowell.com" });
    
    if (!admin) {
      const hashed = await bcrypt.hash("admin123", 10);
      admin = await User.create({
        name: "Elowell Admin",
        email: "admin@elowell.com",
        password: hashed,
        role: "admin",
        isVerified: true
      });
      res.json({ message: "Admin user created successfully", email: "admin@elowell.com" });
    } else {
      admin.isVerified = true;
      await admin.save();
      res.json({ message: "Admin user verified successfully", email: "admin@elowell.com" });
    }
  } catch (err) {
    req.log.error({ err }, "Create admin error");
    res.status(500).json({ error: "Failed to create admin user" });
  }
});

router.get("/me", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    res.json({ id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, isVerified: user.isVerified });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

router.post("/logout", (_req: Request, res: Response) => {
  res.json({ success: true });
});

export default router;