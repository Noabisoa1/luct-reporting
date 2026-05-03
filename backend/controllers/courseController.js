const { db, admin } = require("../config/firebaseAdmin");

/* create course and modules */
const createCourse = async (req, res) => {
  try {
    const { courseName, faculty, classYear, modules } = req.body;

    //validating required fields before creating a course
    if (!courseName || !faculty || !classYear) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const courseCode = `${courseName}${classYear}`;

    //create course document in firestore
    const courseRef = await db.collection("courses").add({
      courseName,
      faculty,
      classYear,
      courseCode,
      studentIds: [],
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    //filter valid modules only
    const validModules = (modules || []).filter(
      (m) => m.moduleName && m.moduleCode
    );

    //create modules linked to the course
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
        averageRating: 0,
        totalRatings: 0,
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    console.log(`Course created: ${courseName} (${courseRef.id})`);

    return res.status(201).json({
      message: "Course created successfully",
      courseId: courseRef.id,
      courseCode,
    });
  } catch (error) {
    console.error("Create course error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

/* get courses */
const getCourses = async (req, res) => {
  try {
    const { faculty, isActive } = req.query;

    let queryRef = db.collection("courses");

    //filter by faculty if provided
    if (faculty) {
      queryRef = queryRef.where("faculty", "==", faculty);
    }

    //filter active or inactive courses
    if (isActive !== undefined) {
      queryRef = queryRef.where("isActive", "==", isActive === "true");
    }

    const snapshot = await queryRef.get();

    const courses = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(courses);
  } catch (error) {
    console.error("Get courses error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

/* get course by id */
const getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;

    const courseSnap = await db.collection("courses").doc(courseId).get();

    if (!courseSnap.exists) {
      return res.status(404).json({ message: "Course not found" });
    }

    return res.status(200).json({
      id: courseSnap.id,
      ...courseSnap.data(),
    });
  } catch (error) {
    console.error("Get course error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

/* update course */
const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { courseName, faculty, classYear, isActive } = req.body;

    const courseRef = db.collection("courses").doc(courseId);
    const courseSnap = await courseRef.get();

    if (!courseSnap.exists) {
      return res.status(404).json({ message: "Course not found" });
    }

    //update provided fields
    const updates = {};
    if (courseName) updates.courseName = courseName;
    if (faculty) updates.faculty = faculty;
    if (classYear) updates.classYear = classYear;
    if (isActive !== undefined) updates.isActive = isActive;

    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await courseRef.update(updates);

    return res.status(200).json({
      message: "Course updated successfully",
    });
  } catch (error) {
    console.error("Update course error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

/* soft delete course */
const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const courseRef = db.collection("courses").doc(courseId);
    const courseSnap = await courseRef.get();

    if (!courseSnap.exists) {
      return res.status(404).json({ message: "Course not found" });
    }

    //disable course
    await courseRef.update({
      isActive: false,
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    //disable all modules under this course
    const modulesSnapshot = await db
      .collection("modules")
      .where("courseId", "==", courseId)
      .get();

    const batch = db.batch();

    modulesSnapshot.forEach((doc) => {
      batch.update(doc.ref, {
        isActive: false,
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    return res.status(200).json({
      message: "Course and associated modules disabled successfully",
    });
  } catch (error) {
    console.error("Delete course error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

/* get modules by course */
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
    console.error("Get modules by course error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

/* get all modules */
const getAllModules = async (req, res) => {
  try {
    const { faculty, lecturerId, isActive } = req.query;

    let queryRef = db.collection("modules");

    if (faculty) {
      queryRef = queryRef.where("faculty", "==", faculty);
    }

    if (lecturerId) {
      queryRef = queryRef.where("lecturerId", "==", lecturerId);
    }

    if (isActive !== undefined) {
      queryRef = queryRef.where("isActive", "==", isActive === "true");
    }

    const snapshot = await queryRef.get();

    const modules = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      assigned: !!doc.data().lecturerId,
    }));

    return res.status(200).json(modules);
  } catch (error) {
    console.error("Get all modules error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

/* get module by id */
const getModuleById = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const moduleSnap = await db.collection("modules").doc(moduleId).get();

    if (!moduleSnap.exists) {
      return res.status(404).json({ message: "Module not found" });
    }

    return res.status(200).json({
      id: moduleSnap.id,
      ...moduleSnap.data(),
    });
  } catch (error) {
    console.error("Get module error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

/* get lecturer modules */
const getLecturerModules = async (req, res) => {
  try {
    const { lecturerId } = req.params;

    const snapshot = await db
      .collection("modules")
      .where("lecturerId", "==", lecturerId)
      .get();

    const modules = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(modules);
  } catch (error) {
    console.error("Get lecturer modules error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

/* assign lecturer to module */
const assignLecturerToModule = async (req, res) => {
  try {
    const { moduleId, lecturerId } = req.body;

    if (!moduleId || !lecturerId) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const moduleRef = db.collection("modules").doc(moduleId);
    const moduleSnap = await moduleRef.get();

    if (!moduleSnap.exists) {
      return res.status(404).json({ message: "Module not found" });
    }

    const lecturerSnap = await db.collection("users").doc(lecturerId).get();

    if (!lecturerSnap.exists) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    const lecturerData = lecturerSnap.data();

    if (lecturerData.role !== "lecturer") {
      return res.status(400).json({ message: "User is not a lecturer" });
    }

    //assign lecturer to module
    await moduleRef.update({
      lecturerId,
      lecturerName: lecturerData.name,
      lecturerFaculty: lecturerData.faculty || "",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      message: "Lecturer assigned successfully",
    });
  } catch (error) {
    console.error("Assign lecturer error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

/* remove lecturer from module */
const removeLecturerFromModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const moduleRef = db.collection("modules").doc(moduleId);
    const moduleSnap = await moduleRef.get();

    if (!moduleSnap.exists) {
      return res.status(404).json({ message: "Module not found" });
    }

    //remove lecturer details from module
    await moduleRef.update({
      lecturerId: "",
      lecturerName: "",
      lecturerFaculty: "",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      message: "Lecturer removed successfully",
    });
  } catch (error) {
    console.error("Remove lecturer error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

/* update module */
const updateModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { moduleName, moduleCode, isActive } = req.body;

    const moduleRef = db.collection("modules").doc(moduleId);
    const moduleSnap = await moduleRef.get();

    if (!moduleSnap.exists) {
      return res.status(404).json({ message: "Module not found" });
    }

    const updates = {};
    if (moduleName) updates.moduleName = moduleName;
    if (moduleCode) updates.moduleCode = moduleCode;
    if (isActive !== undefined) updates.isActive = isActive;

    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await moduleRef.update(updates);

    return res.status(200).json({
      message: "Module updated successfully",
    });
  } catch (error) {
    console.error("Update module error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

/* register student modules */
const registerStudentModules = async (req, res) => {
  try {
    const { studentId, courseId, modules } = req.body;

    if (!studentId || !courseId || !modules?.length) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const studentSnap = await db.collection("users").doc(studentId).get();
    if (!studentSnap.exists) {
      return res.status(404).json({ message: "Student not found" });
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
          registeredAt: new Date().toISOString(),
        }))
      ),
    });

    return res.status(200).json({
      message: "Modules registered successfully",
    });
  } catch (error) {
    console.error("Register modules error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

/* rate module */
const rateModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { studentId, rating, comment } = req.body;

    if (!studentId || !rating) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const moduleRef = db.collection("modules").doc(moduleId);
    const moduleSnap = await moduleRef.get();

    if (!moduleSnap.exists) {
      return res.status(404).json({ message: "Module not found" });
    }

    const moduleData = moduleSnap.data();
    const existingRatings = moduleData.ratings || [];

    const existingRatingIndex = existingRatings.findIndex(
      (r) => r.studentId === studentId
    );

    let updatedRatings;

    if (existingRatingIndex !== -1) {
      updatedRatings = [...existingRatings];
      updatedRatings[existingRatingIndex] = {
        studentId,
        rating,
        comment: comment || "",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: updatedRatings[existingRatingIndex].createdAt,
      };
    } else {
      updatedRatings = [
        ...existingRatings,
        {
          studentId,
          rating,
          comment: comment || "",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      ];
    }

    const totalRatings = updatedRatings.length;
    const averageRating =
      updatedRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;

    await moduleRef.update({
      ratings: updatedRatings,
      averageRating: parseFloat(averageRating.toFixed(2)),
      totalRatings,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      message:
        existingRatingIndex !== -1
          ? "Rating updated successfully"
          : "Rating submitted successfully",
      averageRating: parseFloat(averageRating.toFixed(2)),
    });
  } catch (error) {
    console.error("Rate module error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

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

    // Firebase has a limit of 10 for 'in' queries, so we need to batch
    const students = [];
    const batchSize = 10;
    
    for (let i = 0; i < studentIds.length; i += batchSize) {
      const batch = studentIds.slice(i, i + batchSize);
      const studentsSnap = await db
        .collection("users")
        .where(admin.firestore.FieldPath.documentId(), "in", batch)
        .get();
      
      studentsSnap.forEach((doc) => {
        students.push({
          id: doc.id,
          ...doc.data(),
        });
      });
    }

    return res.status(200).json(students);
  } catch (error) {
    console.error("Get module students error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

/* get module ratings */
const getModuleRatings = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const moduleSnap = await db.collection("modules").doc(moduleId).get();

    if (!moduleSnap.exists) {
      return res.status(404).json({ message: "Module not found" });
    }

    const moduleData = moduleSnap.data();

    return res.status(200).json({
      ratings: moduleData.ratings || [],
      averageRating: moduleData.averageRating || 0,
      totalRatings: moduleData.totalRatings || 0,
    });
  } catch (error) {
    console.error("Get module ratings error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

/* get student modules */
const getStudentModules = async (req, res) => {
  try {
    const { studentId } = req.params;

    const studentSnap = await db.collection("users").doc(studentId).get();

    if (!studentSnap.exists) {
      return res.status(404).json({ message: "Student not found" });
    }

    const registeredModules = studentSnap.data().registeredModules || [];

    const moduleDetails = [];

    for (const reg of registeredModules) {
      const moduleSnap = await db.collection("modules").doc(reg.moduleId).get();
      if (moduleSnap.exists) {
        moduleDetails.push({
          ...reg,
          moduleDetails: moduleSnap.data(),
        });
      }
    }

    return res.status(200).json(moduleDetails);
  } catch (error) {
    console.error("Get student modules error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

/* unregister student from module */
const unregisterStudentModule = async (req, res) => {
  try {
    const { studentId, moduleId, courseId } = req.body;

    if (!studentId || !moduleId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    await db.collection("modules").doc(moduleId).update({
      studentIds: admin.firestore.FieldValue.arrayRemove(studentId),
    });

    const studentRef = db.collection("users").doc(studentId);
    const studentSnap = await studentRef.get();
    const currentModules = studentSnap.data().registeredModules || [];

    const updatedModules = currentModules.filter(
      (m) => m.moduleId !== moduleId
    );

    await studentRef.update({
      registeredModules: updatedModules,
    });

    if (courseId) {
      const courseSnap = await db.collection("courses").doc(courseId).get();
      const stillHasModules = updatedModules.some(
        (m) => m.courseId === courseId
      );

      if (!stillHasModules) {
        await db.collection("courses").doc(courseId).update({
          studentIds: admin.firestore.FieldValue.arrayRemove(studentId),
        });
      }
    }

    return res.status(200).json({
      message: "Student unregistered successfully",
    });
  } catch (error) {
    console.error("Unregister module error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

/* exports */
module.exports = {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getModulesByCourse,
  getAllModules,
  getModuleById,
  getLecturerModules,
  assignLecturerToModule,
  removeLecturerFromModule,
  updateModule,
  registerStudentModules,
  rateModule,
  getModuleStudents,
  getModuleRatings,
  getStudentModules,
  unregisterStudentModule,
};