const express = require("express");
const router = express.Router();
const { db, admin } = require("../config/firebaseAdmin");


router.post("/", async (req, res) => {
  try {
    const { moduleId, moduleName, lecturerId, attendance } = req.body;

    if (!moduleId || !lecturerId) {
      return res.status(400).json({ message: "Missing fields" });
    }

    await db.collection("attendance").add({
      moduleId,
      moduleName,
      lecturerId,
      attendance,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ message: "Attendance saved" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;