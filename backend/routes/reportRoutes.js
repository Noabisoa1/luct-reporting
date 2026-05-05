const express = require("express");
const router = express.Router();
const {
  createReport,
  getReportsByLecturer,
  getReportsByModule,
  getReportById,
  updateReport,
  deleteReport,
  getAllReports,
  getLatestReport,
} = require("../controllers/reportsController");

router.post("/", createReport);
router.get("/lecturer/:lecturerId", getReportsByLecturer);
router.get("/lecturer/:lecturerId/latest", getLatestReport);
router.get("/module/:moduleId", getReportsByModule);
router.get("/:reportId", getReportById);
router.put("/:reportId", updateReport);
router.delete("/:reportId", deleteReport);
router.get("/", getAllReports);

module.exports = router;