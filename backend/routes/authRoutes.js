const express = require("express");
const {
  registerUser,
  loginUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  logoutUser,
  changePassword,
  refreshToken
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshToken);
router.post("/logout", logoutUser);
router.get("/users", getUsers);
router.get("/users/:uid", getUserById);
router.put("/users/:uid", updateUser);
router.delete("/users/:uid", deleteUser);
router.post("/change-password", changePassword);

module.exports = router;