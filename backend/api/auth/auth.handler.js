const { asyncHandler } = require("../../middleware/errorHandler");
const { login, register, logout } = require("./crud/authActions");
const { getProfile, updateProfile } = require("./crud/profile");

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await login(email, password);
  res.json(result);
});

exports.register = asyncHandler(async (req, res) => {
  const { email, password, full_name, role } = req.body;
  const result = await register(email, password, full_name, role);
  res.status(201).json(result);
});

exports.logout = asyncHandler(async (req, res) => {
  await logout(req.accessToken);
  res.json({ message: "Logged out successfully" });
});

exports.getProfile = asyncHandler(async (req, res) => {
  const profile = await getProfile(req.user.id);
  res.json(profile);
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const updated = await updateProfile(req.user.id, req.body);
  res.json(updated);
});
