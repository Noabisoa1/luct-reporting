const { db, admin } = require("../config/firebaseAdmin");

const createReport = async (req, res) => {
  try {
    const {
      lecturerId,
      lecturerName,
      faculty,

      courseId,
      courseName,

      moduleId,
      moduleName,
      moduleCode,

      week,
      date,
      scheduledTime,

      venue,
      topic,
      learningOutcomes,
      recommendations,

      attendancePresent,
      totalStudents,
    } = req.body;

    if (!lecturerId || !moduleId || !week || !topic) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const reportRef = await db.collection("reports").add({
      lecturerId,
      lecturerName,
      faculty,

      courseId,
      courseName,

      moduleId,
      moduleName,
      moduleCode,

      week,
      date,
      scheduledTime,

      venue: venue || "",
      topic,
      learningOutcomes: learningOutcomes || "",
      recommendations: recommendations || "",

      attendancePresent: attendancePresent || 0,
      totalStudents: totalStudents || 0,

      prlFeedback: "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(201).json({
      message: "Report created successfully",
      reportId: reportRef.id,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const getLecturerReports = async (req, res) => {
  try {
    const { lecturerId } = req.params;

    const snapshot = await db
      .collection("reports")
      .where("lecturerId", "==", lecturerId)
      .get();

    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(reports);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// ✅ GET REPORTS BY MODULE
const getReportsByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const snapshot = await db
      .collection("reports")
      .where("moduleId", "==", moduleId)
      .get();

    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(reports);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
const getAllReports = async (req, res) => {
  try {
    const snapshot = await db.collection("reports").get();

    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(reports);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createReport,
  getLecturerReports,
  getReportsByModule,
  getAllReports,
};