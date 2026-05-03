const express = require("express");
const router = express.Router();
const {
  submitAttendance,
  getAttendanceByModule,
  getAttendanceByLecturer,
  getStudentAttendance,
} = require("../controllers/attendanceController");

router.post("/attendance", submitAttendance);
router.get("/attendance/module/:moduleId", getAttendanceByModule);
router.get("/attendance/lecturer/:lecturerId", getAttendanceByLecturer);
router.get("/attendance/student/:studentId", getStudentAttendance);

module.exports = router;