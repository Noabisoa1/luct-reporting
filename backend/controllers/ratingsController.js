const { db, admin } = require("../config/firebaseAdmin");
const submitRating = async (req, res) => {
  try {
    const {
      studentId,
      studentName,
      studentEmail,
      studentFaculty,
      studentSemester,
      moduleId,
      moduleName,
      moduleCode,
      courseId,
      courseName,
      lecturerId,
      lecturerName,
      ratings,
      averageRating,
      comment,
    } = req.body;

    if (!studentId || !moduleId || !ratings) {
      return res.status(400).json({ message: "missing required fields" });
    }

    // check if student already rated this module
    const existingQuery = await db
      .collection("ratings")
      .where("studentId", "==", studentId)
      .where("moduleId", "==", moduleId)
      .get();

    if (!existingQuery.empty) {
      return res.status(400).json({ message: "you have already rated this module" });
    }

    const now = new Date().toISOString();

    const ratingData = {
      studentId,
      studentName,
      studentEmail,
      studentFaculty,
      studentSemester,
      moduleId,
      moduleName,
      moduleCode,
      courseId,
      courseName,
      lecturerId,
      lecturerName,
      ratings,
      averageRating,
      comment: comment || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const ratingRef = await db.collection("ratings").add(ratingData);

    // update module's ratings
    const moduleRef = db.collection("modules").doc(moduleId);
    const moduleSnap = await moduleRef.get();
    
    if (!moduleSnap.exists) {
      return res.status(404).json({ message: "module not found" });
    }
    
    const moduleData = moduleSnap.data();
    const existingModuleRatings = moduleData.ratings || [];
    
    const newRating = {
      studentId: studentId,
      rating: averageRating,
      comment: comment || "",
      createdAt: now,
    };
    
    const updatedModuleRatings = [...existingModuleRatings, newRating];
    
    const totalRatings = updatedModuleRatings.length;
    const sumRatings = updatedModuleRatings.reduce((sum, r) => sum + r.rating, 0);
    const newAverageRating = sumRatings / totalRatings;
    
    await moduleRef.update({
      ratings: updatedModuleRatings,
      averageRating: parseFloat(newAverageRating.toFixed(2)),
      totalRatings: totalRatings,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(201).json({
      message: "rating submitted successfully",
      id: ratingRef.id,
    });
  } catch (error) {
    console.error("submit rating error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

// get ratings by student
const getRatingsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const snapshot = await db
      .collection("ratings")
      .where("studentId", "==", studentId)
      .get();

    const ratings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(ratings);
  } catch (error) {
    console.error("get ratings by student error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

// get ratings by module
const getRatingsByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const snapshot = await db
      .collection("ratings")
      .where("moduleId", "==", moduleId)
      .get();

    const ratings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(ratings);
  } catch (error) {
    console.error("get ratings by module error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

// get ratings by lecturer
const getRatingsByLecturer = async (req, res) => {
  try {
    const { lecturerId } = req.params;

    const snapshot = await db
      .collection("ratings")
      .where("lecturerId", "==", lecturerId)
      .get();

    const ratings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const moduleRatings = {};
    ratings.forEach((rating) => {
      if (!moduleRatings[rating.moduleId]) {
        moduleRatings[rating.moduleId] = {
          moduleName: rating.moduleName,
          ratings: [],
          total: 0,
        };
      }
      moduleRatings[rating.moduleId].ratings.push(rating.averageRating);
      moduleRatings[rating.moduleId].total += rating.averageRating;
    });

    const summary = Object.keys(moduleRatings).map((moduleId) => ({
      moduleId,
      moduleName: moduleRatings[moduleId].moduleName,
      averageRating: (moduleRatings[moduleId].total / moduleRatings[moduleId].ratings.length).toFixed(2),
      totalRatings: moduleRatings[moduleId].ratings.length,
    }));

    return res.status(200).json({
      ratings,
      summary,
    });
  } catch (error) {
    console.error("get ratings by lecturer error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

// GET ALL RATINGS 
const getAllRatings = async (req, res) => {
  try {
    const snapshot = await db.collection("ratings").get();

    const ratings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // sort by createdAt
    ratings.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
      return dateB - dateA;
    });

    console.log(`fetched ${ratings.length} ratings`);
    return res.status(200).json(ratings);
  } catch (error) {
    console.error("get all ratings error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitRating,
  getRatingsByStudent,
  getRatingsByModule,
  getRatingsByLecturer,
  getAllRatings,
};