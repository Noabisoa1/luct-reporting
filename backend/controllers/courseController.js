const { db, admin } = require("../config/firebaseAdmin");



/* =========================
   CREATE COURSE + MODULES
========================= */
const createCourse = async (req, res) => {
  try {
    const { courseName, faculty, classYear, modules } = req.body;

    if (!courseName || !faculty || !classYear) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const courseCode = `${courseName}${classYear}`;

    const courseRef = await db.collection("courses").add({
      courseName,
      faculty,
      classYear,
      courseCode,
      studentIds: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const validModules = (modules || []).filter(
      (m) => m.moduleName && m.moduleCode
    );

    for (let mod of validModules) {
      await db.collection("modules").add({
        courseId: courseRef.id,
        courseName,
        courseCode,
        classYear,
        faculty,
        moduleName: mod.moduleName,
        moduleCode: mod.moduleCode,

        lecturerId: "",
        lecturerName: "",
        lecturerFaculty: "",

        studentIds: [],
        ratings: [],

        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return res.status(201).json({
      message: "Course created successfully",
      courseId: courseRef.id,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};



/* =========================
   GET COURSES
========================= */
const getCourses = async (req, res) => {
  try {
    const snapshot = await db.collection("courses").get();

    const courses = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(courses);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};



/* =========================
   MODULES BY COURSE (FIXED)
========================= */
const getModulesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const snapshot = await db
      .collection("modules")
      .where("courseId", "==", courseId)
      .get();

    const modules = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      assigned: !!doc.data().lecturerId,
    }));

    return res.status(200).json(modules);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};



/* =========================
   ALL MODULES
========================= */
const getAllModules = async (req, res) => {
  try {
    const snapshot = await db.collection("modules").get();

    const modules = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      assigned: !!doc.data().lecturerId,
    }));

    return res.status(200).json(modules);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
const getLecturerModules = async (req, res) => {
  try {
    const lecturerId = req.params.lecturerId;

    const snapshot = await db
      .collection("modules")
      .where("lecturerId", "==", lecturerId)
      .get();

    const modules = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(modules);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};



/* =========================
   ASSIGN LECTURER (FIXED)
========================= */
const assignLecturerToModule = async (req, res) => {
  try {
    const { moduleId, lecturerId } = req.body;

    if (!moduleId || !lecturerId) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const lecturerSnap = await db.collection("users").doc(lecturerId).get();

    if (!lecturerSnap.exists) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    const lecturerData = lecturerSnap.data();

    await db.collection("modules").doc(moduleId).update({
      lecturerId: lecturerId, 
      lecturerName: lecturerData.name,
      lecturerFaculty: lecturerData.faculty || "",
    });

    return res.status(200).json({
      message: "Lecturer assigned successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};



/* =========================
   REGISTER STUDENTS
========================= */
const registerStudentModules = async (req, res) => {
  try {
    const { studentId, courseId, modules } = req.body;

    if (!studentId || !courseId || !modules?.length) {
      return res.status(400).json({ message: "Missing fields" });
    }

    await db.collection("courses").doc(courseId).update({
      studentIds: admin.firestore.FieldValue.arrayUnion(studentId),
    });

    for (let mod of modules) {
      await db.collection("modules").doc(mod.moduleId).update({
        studentIds: admin.firestore.FieldValue.arrayUnion(studentId),
      });
    }

    await db.collection("users").doc(studentId).update({
      registeredModules: admin.firestore.FieldValue.arrayUnion(
        ...modules.map((m) => ({
          moduleId: m.moduleId,
          moduleName: m.moduleName,
          courseId,
        }))
      ),
    });

    return res.status(200).json({
      message: "Modules registered successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};



/* =========================
   MODULE RATING
========================= */
const rateModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { studentId, rating, comment } = req.body;

    if (!studentId || !rating) {
      return res.status(400).json({ message: "Missing fields" });
    }

    await db.collection("modules").doc(moduleId).update({
      ratings: admin.firestore.FieldValue.arrayUnion({
        studentId,
        rating,
        comment: comment || "",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }),
    });

    return res.status(200).json({
      message: "Rating submitted",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};



/* =========================
   MODULE STUDENTS
========================= */
const getModuleStudents = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const moduleSnap = await db.collection("modules").doc(moduleId).get();

    if (!moduleSnap.exists) {
      return res.status(404).json({ message: "Module not found" });
    }

    const studentIds = moduleSnap.data().studentIds || [];

    if (studentIds.length === 0) {
      return res.status(200).json([]);
    }

    const studentsSnap = await db
      .collection("users")
      .where(admin.firestore.FieldPath.documentId(), "in", studentIds)
      .get();

    const students = studentsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(students);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};



/* =========================
   EXPORTS
========================= */
module.exports = {
  createCourse,
  getCourses,
  getModulesByCourse,
  getAllModules,
  getLecturerModules,
  assignLecturerToModule,
  registerStudentModules,
  rateModule,
  getModuleStudents,
};