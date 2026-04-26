const express = require("express");
const router = express.Router();

const { getUsers } = require("../controllers/authController");
const { getUserById } = require("../controllers/userController");

router.get("/", getUsers);
router.get("/:id", getUserById);

module.exports = router;