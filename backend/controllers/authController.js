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

    if (role === "student") {
      if (!faculty) {
        return res.status(400).json({ message: "Faculty required for students" });
      }
      if (!semester || semester < 1 || semester > 8) {
        return res.status(400).json({ message: "Semester must be 1-8 for students" });
      }
    }

    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    const uid = userRecord.uid;

    const userData = {
      uid,
      name,
      email,
      role,
      faculty: faculty || "",
      semester: semester || "",
      modules: [],
      registeredModules: [],
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("users").doc(uid).set(userData);

    return res.status(201).json({
      message: "User created successfully",
      uid,
    });
  } catch (error) {
    console.error("Registration error:", error.message);
    return res.status(500).json({
      message: error.message,
    });
  }
};

//LOGIN USER
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required",
      });
    }

    const apiKey = "AIzaSyDfu64uC71n-koud4VYD3FTYrfiFl6CEQw";

    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        email,
        password,
        returnSecureToken: true,
      }
    );

    const { localId, idToken, displayName } = response.data;

    const userRef = db.collection("users").doc(localId);
    const userSnap = await userRef.get();

    let userData;

    if (!userSnap.exists) {
      console.log("User missing in Firestore, creating...");

      userData = {
        uid: localId,
        name: displayName || "User",
        email,
        role: "student",
        faculty: "",
        semester: "",
        modules: [],
        registeredModules: [],
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await userRef.set(userData);
    } else {
      userData = userSnap.data();
      
      if (userData.isActive === false) {
        return res.status(403).json({ message: "Account disabled. Contact admin." });
      }
      
      await userRef.update({
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // IMPORTANT: Return consistent user object
    return res.status(200).json({
      uid: userData.uid,  // Make sure uid is included
      token: idToken,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      faculty: userData.faculty,
      semester: userData.semester,
      modules: userData.modules || [],
      registeredModules: userData.registeredModules || [],
      isActive: userData.isActive,
    });

  } catch (error) {
    console.error("Login error:", error.response?.data?.error?.message || error.message);
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
    console.error("Get users error:", error.message);
    return res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * GET USER BY ID
 */
const getUserById = async (req, res) => {
  try {
    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({ message: "User ID required" });
    }

    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      id: userSnap.id,
      ...userSnap.data(),
    });
  } catch (error) {
    console.error("Get user error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * UPDATE USER
 */
const updateUser = async (req, res) => {
  try {
    const { uid } = req.params;
    const { name, role, faculty, semester } = req.body;

    if (!uid) {
      return res.status(400).json({ message: "User ID required" });
    }

    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    const updates = {};

    if (name) updates.name = name;
    if (role) {
      const allowedRoles = ["student", "lecturer", "pl", "prl"];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      updates.role = role;
    }
    if (faculty !== undefined) updates.faculty = faculty;
    if (semester !== undefined) updates.semester = semester;

    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await userRef.update(updates);

    return res.status(200).json({
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Update user error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * DELETE USER (Soft Delete)
 */
const deleteUser = async (req, res) => {
  try {
    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({ message: "User ID required" });
    }

    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    await userRef.update({
      isActive: false,
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    try {
      await auth.updateUser(uid, { disabled: true });
    } catch (authError) {
      console.log("Could not disable auth user:", authError.message);
    }

    return res.status(200).json({
      message: "User disabled successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * REAL-TIME USER LISTENER (onSnapshot)
 */
const subscribeToUsers = (uid, callback) => {
  return db.collection("users").doc(uid).onSnapshot(
    (doc) => {
      if (doc.exists) {
        callback(null, { id: doc.id, ...doc.data() });
      } else {
        callback("User not found", null);
      }
    },
    (error) => {
      console.error("Real-time listener error:", error.message);
      callback(error, null);
    }
  );
};

/**
 * REAL-TIME ALL USERS LISTENER
 */
const subscribeToAllUsers = (callback, roleFilter = null) => {
  let query = db.collection("users");
  
  if (roleFilter) {
    query = query.where("role", "==", roleFilter);
  }
  
  return query.onSnapshot(
    (snapshot) => {
      const users = [];
      snapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      callback(null, users);
    },
    (error) => {
      console.error("Real-time users listener error:", error.message);
      callback(error, null);
    }
  );
};

/**
 * FIRESTORE SECURITY RULES (Add to Firebase Console)
 */
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (request.auth.uid == userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['pl', 'prl']);
      allow delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['pl', 'prl'];
    }
  }
}
*/

/**
 * LOGOUT USER
 */
const logoutUser = async (req, res) => {
  try {
    const { uid } = req.body;
    
    if (uid) {
      const userRef = db.collection("users").doc(uid);
      await userRef.update({
        lastLogoutAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    return res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * CHANGE PASSWORD
 */
const changePassword = async (req, res) => {
  try {
    const { uid, currentPassword, newPassword } = req.body;
    
    if (!uid || !currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: "UID, current password, and new password required" 
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: "New password must be at least 6 characters" 
      });
    }
    
    const userSnap = await db.collection("users").doc(uid).get();
    
    if (!userSnap.exists) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const userEmail = userSnap.data().email;
    const apiKey = "AIzaSyDfu64uC71n-koud4VYD3FTYrfiFl6CEQw";
    
    try {
      await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
        {
          email: userEmail,
          password: currentPassword,
          returnSecureToken: false,
        }
      );
    } catch (error) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }
    
    await auth.updateUser(uid, { password: newPassword });
    
    return res.status(200).json({ 
      message: "Password updated successfully" 
    });
  } catch (error) {
    console.error("Change password error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * REFRESH TOKEN
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required" });
    }
    
    const apiKey = "AIzaSyDfu64uC71n-koud4VYD3FTYrfiFl6CEQw";
    
    const response = await axios.post(
      `https://securetoken.googleapis.com/v1/token?key=${apiKey}`,
      {
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }
    );
    
    const { id_token, refresh_token, expires_in } = response.data;
    
    return res.status(200).json({
      token: id_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
    });
  } catch (error) {
    console.error("Refresh token error:", error.message);
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  logoutUser,
  changePassword,
  refreshToken,
  subscribeToUsers,
  subscribeToAllUsers,
};