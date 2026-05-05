const express = require("express");
const router = express.Router();

const {
  createCourse,
  getCourses,
  getModulesByCourse,
  getAllModules,
  getLecturerModules,
  assignLecturerToModule,
  removeLecturerFromModule,
  registerStudentModules,
  rateModule,
  getModuleStudents,
  getModuleById,
} = require("../controllers/courseController");

router.post("/", createCourse);
router.get("/", getCourses);
router.get("/modules", getAllModules);
router.get("/modules/course/:courseId", getModulesByCourse);
router.get("/modules/:moduleId", getModuleById);
router.get("/modules/lecturer/:lecturerId", getLecturerModules);
router.post("/modules/assign-lecturer", assignLecturerToModule);
router.delete("/modules/:moduleId/lecturer", removeLecturerFromModule);
router.post("/modules/:moduleId/rate", rateModule);
router.get("/modules/:moduleId/students", getModuleStudents);
router.post("/register-modules", registerStudentModules);

module.exports = router;