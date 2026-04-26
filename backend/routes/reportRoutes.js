const express = require("express");
const router = express.Router();

const {
  createReport,
  getLecturerReports,
  getReportsByModule,
  getAllReports,
} = require("../controllers/reportController");

router.get("/", getAllReports);
router.post("/", createReport);
router.get("/lecturer/:lecturerId", getLecturerReports);
router.get("/module/:moduleId", getReportsByModule);

module.exports = router;