const crypto = require("crypto");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const asyncHandler = require("../middlewares/asyncHandler");
const { AppError, sendSuccess } = require("../utils/sendResponse");
const { sendTokenResponse, verifyRefreshToken, generateAccessToken } = require("../utils/generateToken");
const { sendEmail, emailTemplates } = require("../utils/sendEmail");
const config = require("../config/env");

const handleValidation = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400, errors.array());
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  handleValidation(req);
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("An account with this email already exists.", 409);
  }

  const user = await User.create({ name, email, password });

  const verifyToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const verifyUrl = `${config.clientUrl}/verify-email?token=${verifyToken}`;
  const template = emailTemplates.verifyEmail(user.name, verifyUrl);

  try {
    await sendEmail({ to: user.email, ...template });
  } catch (err) {
    // Registration should still succeed even if the verification
    // email fails to send; the user can request a resend later.
    console.error(`Failed to send verification email: ${err.message}`);
  }

  sendTokenResponse(res, user._id, 201, user.toSafeObject());
});

// @desc    Log in an existing user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  handleValidation(req);
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Invalid email or password.", 401);
  }

  if (!user.isActive) {
    throw new AppError("This account has been deactivated.", 403);
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(res, user._id, 200, user.toSafeObject());
});

// @desc    Log out the current user (clears auth cookies)
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  res.cookie("token", "none", { expires: new Date(Date.now() + 1000), httpOnly: true });
  res.cookie("refreshToken", "none", { expires: new Date(Date.now() + 1000), httpOnly: true });
  sendSuccess(res, 200, "Logged out successfully.");
});

// @desc    Get the currently authenticated user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, "Current user fetched.", req.user.toSafeObject());
});

// @desc    Refresh the access token using a valid refresh token
// @route   POST /api/auth/refresh
// @access  Public (requires refreshToken cookie)
const refreshAccessToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    throw new AppError("No refresh token provided. Please log in again.", 401);
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    throw new AppError("Refresh token expired or invalid. Please log in again.", 401);
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    throw new AppError("User not found or deactivated.", 401);
  }

  const accessToken = generateAccessToken(user._id);

  res
    .cookie("token", accessToken, {
      expires: new Date(Date.now() + config.jwtCookieExpire * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: config.env === "production",
      sameSite: config.env === "production" ? "none" : "lax",
    })
    .status(200)
    .json({ success: true, accessToken });
});

// @desc    Verify a user's email using the token from the verification email
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new AppError("Verification token is required.", 400);
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpire: { $gt: Date.now() },
  }).select("+emailVerificationToken +emailVerificationExpire");

  if (!user) {
    throw new AppError("Verification link is invalid or has expired.", 400);
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save({ validateBeforeSave: false });

  sendSuccess(res, 200, "Email verified successfully.");
});

// @desc    Request a password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  handleValidation(req);
  const { email } = req.body;

  const user = await User.findOne({ email });

  // Always return a generic success message, regardless of whether
  // the email exists, to avoid leaking which emails are registered.
  if (!user) {
    return sendSuccess(
      res,
      200,
      "If an account with that email exists, a reset link has been sent."
    );
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${config.clientUrl}/reset-password?token=${resetToken}`;
  const template = emailTemplates.resetPassword(user.name, resetUrl);

  try {
    await sendEmail({ to: user.email, ...template });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    throw new AppError("Failed to send password reset email. Please try again.", 500);
  }

  sendSuccess(res, 200, "If an account with that email exists, a reset link has been sent.");
});

// @desc    Reset password using a valid reset token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  handleValidation(req);
  const { token, password } = req.body;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select("+resetPasswordToken +resetPasswordExpire");

  if (!user) {
    throw new AppError("Reset link is invalid or has expired.", 400);
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(res, user._id, 200, user.toSafeObject());
});

// @desc    Change password for the logged-in user
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  handleValidation(req);
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");

  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError("Current password is incorrect.", 401);
  }

  user.password = newPassword;
  await user.save();

  sendSuccess(res, 200, "Password changed successfully.");
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  refreshAccessToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
};
