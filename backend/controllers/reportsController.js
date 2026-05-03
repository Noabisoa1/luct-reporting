const { db, admin } = require("../config/firebaseAdmin");

// create report
const createReport = async (req, res) => {
  try {
    const {
      lecturerId,
      lecturerName,
      lecturerEmail,
      lecturerFaculty,
      courseId,
      courseName,
      courseCode,
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
      attendanceRate,
    } = req.body;

    // validate required fields
    if (!lecturerId) {
      return res.status(400).json({ message: "lecturer id is required" });
    }

    if (!moduleId) {
      return res.status(400).json({ message: "module id is required" });
    }

    if (!week) {
      return res.status(400).json({ message: "week is required" });
    }

    if (!topic) {
      return res.status(400).json({ message: "topic is required" });
    }

    const reportData = {
      lecturerId,
      lecturerName: lecturerName || "",
      lecturerEmail: lecturerEmail || "",
      lecturerFaculty: lecturerFaculty || "",
      courseId: courseId || "",
      courseName: courseName || "",
      courseCode: courseCode || "",
      moduleId,
      moduleName: moduleName || "",
      moduleCode: moduleCode || "",
      week: week.toString(),
      date: date || new Date().toISOString().split('T')[0],
      scheduledTime: scheduledTime || "",
      venue: venue || "",
      topic,
      learningOutcomes: learningOutcomes || "",
      recommendations: recommendations || "",
      attendancePresent: attendancePresent || 0,
      totalStudents: totalStudents || 0,
      attendanceRate: attendanceRate || 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const reportRef = await db.collection("reports").add(reportData);

    console.log(`report created: ${reportRef.id} for module ${moduleName}`);

    return res.status(201).json({
      success: true,
      message: "report submitted successfully",
      id: reportRef.id,
    });
  } catch (error) {
    console.error("create report error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// get reports by lecturer - FIXED (no index needed)
const getReportsByLecturer = async (req, res) => {
  try {
    const { lecturerId } = req.params;

    if (!lecturerId) {
      return res.status(400).json({ success: false, message: "lecturer id required" });
    }

    console.log(`fetching reports for lecturer: ${lecturerId}`);

    // Simple query without any ordering - this doesn't require an index
    const snapshot = await db
      .collection("reports")
      .where("lecturerId", "==", lecturerId)
      .get();

    const reports = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      reports.push({
        id: doc.id,
        ...data,
        // convert firestore timestamp to ISO string for sorting
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
      });
    });

    // sort manually in memory (no database index needed)
    reports.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA;
    });

    console.log(`found ${reports.length} reports for lecturer ${lecturerId}`);

    return res.status(200).json(reports);
  } catch (error) {
    console.error("get reports error:", error.message);
    // If there's an error, return empty array instead of crashing
    return res.status(200).json([]);
  }
};

// get reports by module
const getReportsByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    if (!moduleId) {
      return res.status(400).json({ success: false, message: "module id required" });
    }

    const snapshot = await db
      .collection("reports")
      .where("moduleId", "==", moduleId)
      .get();

    const reports = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      reports.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
      });
    });

    reports.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA;
    });

    return res.status(200).json(reports);
  } catch (error) {
    console.error("get reports by module error:", error.message);
    return res.status(200).json([]);
  }
};

// get single report by id
const getReportById = async (req, res) => {
  try {
    const { reportId } = req.params;

    if (!reportId) {
      return res.status(400).json({ success: false, message: "report id required" });
    }

    const reportSnap = await db.collection("reports").doc(reportId).get();

    if (!reportSnap.exists) {
      return res.status(404).json({ success: false, message: "report not found" });
    }

    const data = reportSnap.data();
    return res.status(200).json({
      id: reportSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
    });
  } catch (error) {
    console.error("get report by id error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// update report
const updateReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { topic, learningOutcomes, recommendations, venue, week } = req.body;

    if (!reportId) {
      return res.status(400).json({ success: false, message: "report id required" });
    }

    const reportRef = db.collection("reports").doc(reportId);
    const reportSnap = await reportRef.get();

    if (!reportSnap.exists) {
      return res.status(404).json({ success: false, message: "report not found" });
    }

    const updates = {};
    if (topic !== undefined) updates.topic = topic;
    if (learningOutcomes !== undefined) updates.learningOutcomes = learningOutcomes;
    if (recommendations !== undefined) updates.recommendations = recommendations;
    if (venue !== undefined) updates.venue = venue;
    if (week !== undefined) updates.week = week;
    
    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await reportRef.update(updates);

    console.log(`report ${reportId} updated successfully`);

    return res.status(200).json({
      success: true,
      message: "report updated successfully",
    });
  } catch (error) {
    console.error("update report error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// delete report
const deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    if (!reportId) {
      return res.status(400).json({ success: false, message: "report id required" });
    }

    const reportRef = db.collection("reports").doc(reportId);
    const reportSnap = await reportRef.get();

    if (!reportSnap.exists) {
      return res.status(404).json({ success: false, message: "report not found" });
    }

    await reportRef.delete();

    console.log(`report ${reportId} deleted successfully`);

    return res.status(200).json({
      success: true,
      message: "report deleted successfully",
    });
  } catch (error) {
    console.error("delete report error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// get all reports (admin)
const getAllReports = async (req, res) => {
  try {
    const snapshot = await db.collection("reports").get();

    const reports = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      reports.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
      });
    });

    reports.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA;
    });

    return res.status(200).json(reports);
  } catch (error) {
    console.error("get all reports error:", error.message);
    return res.status(200).json([]);
  }
};

// get latest report for a lecturer
const getLatestReport = async (req, res) => {
  try {
    const { lecturerId } = req.params;

    if (!lecturerId) {
      return res.status(400).json({ success: false, message: "lecturer id required" });
    }

    const snapshot = await db
      .collection("reports")
      .where("lecturerId", "==", lecturerId)
      .get();

    const reports = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      reports.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
      });
    });

    if (reports.length === 0) {
      return res.status(200).json(null);
    }

    reports.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA;
    });

    const latestReport = reports[0];

    return res.status(200).json(latestReport);
  } catch (error) {
    console.error("get latest report error:", error.message);
    return res.status(200).json(null);
  }
};

module.exports = {
  createReport,
  getReportsByLecturer,
  getReportsByModule,
  getReportById,
  updateReport,
  deleteReport,
  getAllReports,
  getLatestReport,
};