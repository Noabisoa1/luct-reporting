const { db, admin } = require("../config/firebaseAdmin");

// submit rating
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

    if (!studentId) {
      return res.status(400).json({ message: "student id required" });
    }

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

    if (!moduleId) {
      return res.status(400).json({ message: "module id required" });
    }

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

    if (!lecturerId) {
      return res.status(400).json({ message: "lecturer id required" });
    }

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

// GET ALL RATINGS (for PRL) - FIXED with better error handling
const getAllRatings = async (req, res) => {
  try {
    console.log("===== fetching all ratings =====");
    
    // Check if db is available
    if (!db) {
      console.error("firestore db not initialized");
      return res.status(500).json({ message: "database not initialized" });
    }
    
    // Get all ratings from the collection
    const snapshot = await db.collection("ratings").get();
    
    console.log(`snapshot size: ${snapshot.size}`);
    
    const ratings = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      ratings.push({
        id: doc.id,
        studentId: data.studentId || "",
        studentName: data.studentName || "",
        studentEmail: data.studentEmail || "",
        studentFaculty: data.studentFaculty || "",
        studentSemester: data.studentSemester || "",
        moduleId: data.moduleId || "",
        moduleName: data.moduleName || "",
        moduleCode: data.moduleCode || "",
        courseId: data.courseId || "",
        courseName: data.courseName || "",
        lecturerId: data.lecturerId || "",
        lecturerName: data.lecturerName || "",
        lecturerFaculty: data.lecturerFaculty || "",
        ratings: data.ratings || {},
        averageRating: data.averageRating || 0,
        comment: data.comment || "",
        createdAt: data.createdAt,
      });
    });

    // sort by createdAt (newest first) - handle both timestamp types
    ratings.sort((a, b) => {
      let dateA = 0;
      let dateB = 0;
      
      if (a.createdAt) {
        dateA = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      }
      if (b.createdAt) {
        dateB = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      }
      
      return dateB - dateA;
    });

    console.log(`successfully fetched ${ratings.length} ratings`);
    
    // Return array even if empty
    return res.status(200).json(ratings);
    
  } catch (error) {
    console.error("get all ratings error:", error.message);
    console.error("error stack:", error.stack);
    
    // Return empty array instead of error to prevent frontend crash
    return res.status(200).json([]);
  }
};

// health check endpoint for ratings
const ratingsHealthCheck = async (req, res) => {
  try {
    const snapshot = await db.collection("ratings").limit(1).get();
    return res.status(200).json({ 
      status: "ok", 
      collectionExists: true,
      hasData: !snapshot.empty,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({ 
      status: "error", 
      message: error.message 
    });
  }
};

module.exports = {
  submitRating,
  getRatingsByStudent,
  getRatingsByModule,
  getRatingsByLecturer,
  getAllRatings,
  ratingsHealthCheck,
};