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

// create report - POST /api/reports
router.post("/", createReport);

// get reports by lecturer - GET /api/reports/lecturer/:lecturerId
router.get("/lecturer/:lecturerId", getReportsByLecturer);

// get latest report for lecturer - GET /api/reports/lecturer/:lecturerId/latest
router.get("/lecturer/:lecturerId/latest", getLatestReport);

// get reports by module - GET /api/reports/module/:moduleId
router.get("/module/:moduleId", getReportsByModule);

// get report by id - GET /api/reports/:reportId
router.get("/:reportId", getReportById);

// update report - PUT /api/reports/:reportId
router.put("/:reportId", updateReport);

// delete report - DELETE /api/reports/:reportId
router.delete("/:reportId", deleteReport);

// get all reports (admin) - GET /api/reports
router.get("/", getAllReports);

module.exports = router;