const express = require("express");
const router = express.Router();
const {
  submitRating,
  getRatingsByStudent,
  getRatingsByModule,
  getRatingsByLecturer,
  getAllRatings,
} = require("../controllers/ratingsController");

router.post("/ratings", submitRating);
router.get("/ratings/student/:studentId", getRatingsByStudent);
router.get("/ratings/module/:moduleId", getRatingsByModule);
router.get("/ratings/lecturer/:lecturerId", getRatingsByLecturer);
router.get("/ratings", getAllRatings);  

module.exports = router;