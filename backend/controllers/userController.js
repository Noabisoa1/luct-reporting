const { db } = require("../config/firebaseAdmin");

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const doc = await db.collection("users").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = doc.data();

    return res.status(200).json({
      id: doc.id,
      ...userData,
      modules: userData.modules || [],
    });
  } catch (error) {
    console.error("getUserById error:", error);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getUserById };