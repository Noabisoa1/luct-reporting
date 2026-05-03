const express = require("express");
const router = express.Router();
const {
  submitRating,
  getRatingsByStudent,
  getRatingsByModule,
  getRatingsByLecturer,
  getAllRatings,
  ratingsHealthCheck,
} = require("../controllers/ratingsController");

router.get("/ratings/health", ratingsHealthCheck);
router.get("/ratings", getAllRatings);
router.get("/ratings/student/:studentId", getRatingsByStudent);
router.get("/ratings/module/:moduleId", getRatingsByModule);
router.get("/ratings/lecturer/:lecturerId", getRatingsByLecturer);
router.post("/ratings", submitRating);

module.exports = router;