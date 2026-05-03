const { db, admin } = require("../config/firebaseAdmin");

/* =========================
   SUBMIT ATTENDANCE
========================= */
const submitAttendance = async (req, res) => {
  try {
    const { moduleId, moduleName, lecturerId, attendance, date } = req.body;

    if (!moduleId || !lecturerId || !attendance) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const attendanceDate = date || new Date().toISOString().split('T')[0];

    // Get module details
    const moduleSnap = await db.collection("modules").doc(moduleId).get();
    if (!moduleSnap.exists) {
      return res.status(404).json({ message: "Module not found" });
    }

    const moduleData = moduleSnap.data();
    const courseId = moduleData.courseId;
    const courseSnap = await db.collection("courses").doc(courseId).get();
    const courseName = courseSnap.exists ? courseSnap.data().courseName : "";

    // Calculate statistics
    const presentCount = Object.values(attendance).filter(v => v === "present").length;
    const absentCount = Object.values(attendance).filter(v => v === "absent").length;

    // Create attendance record
    const attendanceData = {
      moduleId,
      moduleName,
      courseId,
      courseName,
      lecturerId,
      attendance: attendance,
      date: attendanceDate,
      presentCount,
      absentCount,
      totalStudents: Object.keys(attendance).length,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Check if attendance already exists for this module and date
    const existingQuery = await db
      .collection("attendance")
      .where("moduleId", "==", moduleId)
      .where("date", "==", attendanceDate)
      .get();

    let result;
    if (!existingQuery.empty) {
      const attendanceDoc = existingQuery.docs[0];
      await attendanceDoc.ref.update({
        attendance,
        presentCount,
        absentCount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      result = attendanceDoc.id;
    } else {
      const attendanceRef = await db.collection("attendance").add(attendanceData);
      result = attendanceRef.id;
    }

    // Delete existing student attendance records for this student/module/date to avoid duplicates
    for (const [studentId] of Object.entries(attendance)) {
      const existingRecords = await db
        .collection("studentAttendance")
        .where("studentId", "==", studentId)
        .where("moduleId", "==", moduleId)
        .where("date", "==", attendanceDate)
        .get();
      
      const batch = db.batch();
      existingRecords.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    // Store individual student attendance records
    for (const [studentId, status] of Object.entries(attendance)) {
      await db.collection("studentAttendance").add({
        studentId,
        moduleId,
        moduleName,
        courseId,
        courseName,
        date: attendanceDate,
        status,
        lecturerId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    console.log(`Attendance submitted for module ${moduleId} on ${attendanceDate}`);

    return res.status(201).json({
      message: existingQuery.empty ? "Attendance submitted successfully" : "Attendance updated successfully",
      id: result,
    });

  } catch (error) {
    console.error("Submit attendance error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

/* =========================
   GET ATTENDANCE BY MODULE
========================= */
const getAttendanceByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { date } = req.query;

    let query = db.collection("attendance").where("moduleId", "==", moduleId);
    
    if (date) {
      query = query.where("date", "==", date);
    }

    const snapshot = await query.get();
    const attendance = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return res.status(200).json(attendance);
  } catch (error) {
    console.error("Get attendance error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

/* =========================
   GET ATTENDANCE BY LECTURER
========================= */
const getAttendanceByLecturer = async (req, res) => {
  try {
    const { lecturerId } = req.params;

    const snapshot = await db
      .collection("attendance")
      .where("lecturerId", "==", lecturerId)
      .orderBy("createdAt", "desc")
      .get();

    const attendance = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return res.status(200).json(attendance);
  } catch (error) {
    console.error("Get lecturer attendance error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

/* =========================
   GET STUDENT ATTENDANCE (FIXED - No orderBy to avoid index error)
========================= */
const getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Simple query without orderBy to avoid composite index requirement
    const snapshot = await db
      .collection("studentAttendance")
      .where("studentId", "==", studentId)
      .get();

    const attendance = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort manually in JavaScript instead of using Firestore orderBy
    attendance.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    // Calculate summary per module
    const moduleStats = {};
    attendance.forEach((record) => {
      if (!moduleStats[record.moduleId]) {
        moduleStats[record.moduleId] = {
          moduleName: record.moduleName,
          total: 0,
          present: 0,
        };
      }
      moduleStats[record.moduleId].total++;
      if (record.status === "present") {
        moduleStats[record.moduleId].present++;
      }
    });

    const summary = Object.keys(moduleStats).map((moduleId) => ({
      moduleId,
      moduleName: moduleStats[moduleId].moduleName,
      totalClasses: moduleStats[moduleId].total,
      presentCount: moduleStats[moduleId].present,
      attendancePercentage: moduleStats[moduleId].total > 0 
        ? ((moduleStats[moduleId].present / moduleStats[moduleId].total) * 100).toFixed(2)
        : "0.00",
    }));

    return res.status(200).json({ records: attendance, summary });
  } catch (error) {
    console.error("Get student attendance error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

/* =========================
   GET MODULE ATTENDANCE SUMMARY
========================= */
const getModuleAttendanceSummary = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const snapshot = await db
      .collection("attendance")
      .where("moduleId", "==", moduleId)
      .orderBy("date", "desc")
      .get();

    const attendance = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    const totalSessions = attendance.length;
    let totalPresent = 0;
    let totalAbsent = 0;

    attendance.forEach((session) => {
      totalPresent += session.presentCount || 0;
      totalAbsent += session.absentCount || 0;
    });

    const totalStudents = attendance[0]?.totalStudents || 0;

    return res.status(200).json({
      moduleId,
      totalSessions,
      totalPresent,
      totalAbsent,
      totalStudents,
      averageAttendance: totalSessions > 0 && (totalPresent + totalAbsent) > 0
        ? ((totalPresent / (totalPresent + totalAbsent)) * 100).toFixed(2)
        : 0,
      sessions: attendance,
    });
  } catch (error) {
    console.error("Get module attendance summary error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitAttendance,
  getAttendanceByModule,
  getAttendanceByLecturer,
  getStudentAttendance,
  getModuleAttendanceSummary,
};