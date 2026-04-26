const axios = require("axios");
const { auth, db, admin } = require("../config/firebaseAdmin");

/**
 * REGISTER USER
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, faculty, semester } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Name, email, password, and role are required",
      });
    }

    const allowedRoles = ["student", "lecturer", "pl", "prl"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // 1. Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    const uid = userRecord.uid;

    // 2. Save user in Firestore
    const userData = {
      uid,
      name,
      email,
      role,
      faculty: faculty || "",
      semester: semester || "",
      modules: [],
      registeredModules: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("users").doc(uid).set(userData);

    return res.status(201).json({
      message: "User created successfully",
      uid,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * LOGIN USER
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required",
      });
    }

    const apiKey = "AIzaSyDfu64uC71n-koud4VYD3FTYrfiFl6CEQw";

    // 1. Authenticate user
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        email,
        password,
        returnSecureToken: true,
      }
    );

    const { localId, idToken, displayName } = response.data;

    // 2. Check Firestore user
    const userRef = db.collection("users").doc(localId);
    const userSnap = await userRef.get();

    let userData;

    // 3. AUTO-FIX: if user does NOT exist in Firestore
    if (!userSnap.exists) {
      console.log("⚠️ User missing in Firestore, creating...");

      userData = {
        uid: localId,
        name: displayName || "User",
        email,
        role: "student", // default fallback
        faculty: "",
        semester: "",
        modules: [],
        registeredModules: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await userRef.set(userData);
    } else {
      userData = userSnap.data();
    }

    // 4. Return full user
    return res.status(200).json({
      uid: localId,
      token: idToken,
      ...userData,
    });

  } catch (error) {
    return res.status(401).json({
      message:
        error.response?.data?.error?.message ||
        "Invalid email or password",
    });
  }
};

/**
 * GET ALL USERS
 */
const getUsers = async (req, res) => {
  try {
    const { role } = req.query;

    let queryRef = db.collection("users");

    if (role) {
      queryRef = queryRef.where("role", "==", role);
    }

    const snapshot = await queryRef.get();

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUsers,
};