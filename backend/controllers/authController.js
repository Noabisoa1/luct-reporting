const axios = require("axios");
const { auth, db, admin } = require("../config/firebaseAdmin");

// register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, faculty, semester } = req.body;

    // basic validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "name, email, password, and role are required",
      });
    }

    // email validation
    const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "invalid email format" });
    }

    // password validation
    if (password.length < 6) {
      return res.status(400).json({ message: "password must be at least 6 characters" });
    }

    const allowedRoles = ["student", "lecturer", "pl", "prl"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "invalid role" });
    }

    // faculty is required for all roles
    if (!faculty || faculty.trim() === "") {
      return res.status(400).json({ message: "faculty is required for all roles" });
    }

    // semester validation for students
    if (role === "student") {
      if (!semester || semester < 1 || semester > 8) {
        return res.status(400).json({ message: "semester must be between 1 and 8 for students" });
      }
    }

    // check if user already exists
    try {
      const existingUser = await auth.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "user with this email already exists" });
      }
    } catch (err) {
      // user doesn't exist, continue
      if (err.code !== "auth/user-not-found") {
        console.log("auth check error:", err.message);
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
      faculty: faculty,
      semester: role === "student" ? semester : "",
      modules: [],
      registeredModules: [],
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("users").doc(uid).set(userData);

    console.log(`user registered: ${email} as ${role}`);

    return res.status(201).json({
      message: "user created successfully",
      uid,
    });
  } catch (error) {
    console.error("registration error:", error.message);
    
    // handle specific firebase auth errors
    if (error.code === "auth/email-already-exists") {
      return res.status(409).json({ message: "email already exists" });
    }
    if (error.code === "auth/invalid-email") {
      return res.status(400).json({ message: "invalid email format" });
    }
    if (error.code === "auth/weak-password") {
      return res.status(400).json({ message: "password is too weak" });
    }
    
    return res.status(500).json({
      message: error.message,
    });
  }
};

// login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "email and password required",
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
      console.log("user missing in firestore, creating...");

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
        return res.status(403).json({ message: "account disabled. contact admin." });
      }
      
      await userRef.update({
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return res.status(200).json({
      uid: userData.uid,
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
    console.error("login error:", error.response?.data?.error?.message || error.message);
    return res.status(401).json({
      message:
        error.response?.data?.error?.message ||
        "invalid email or password",
    });
  }
};

// get all users
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
    console.error("get users error:", error.message);
    return res.status(500).json({
      message: error.message,
    });
  }
};

// get user by id
const getUserById = async (req, res) => {
  try {
    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({ message: "user id required" });
    }

    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ message: "user not found" });
    }

    return res.status(200).json({
      id: userSnap.id,
      ...userSnap.data(),
    });
  } catch (error) {
    console.error("get user error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

// update user
const updateUser = async (req, res) => {
  try {
    const { uid } = req.params;
    const { name, role, faculty, semester } = req.body;

    if (!uid) {
      return res.status(400).json({ message: "user id required" });
    }

    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ message: "user not found" });
    }

    const updates = {};

    if (name) updates.name = name;
    if (role) {
      const allowedRoles = ["student", "lecturer", "pl", "prl"];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: "invalid role" });
      }
      updates.role = role;
    }
    if (faculty !== undefined) updates.faculty = faculty;
    if (semester !== undefined) updates.semester = semester;

    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await userRef.update(updates);

    return res.status(200).json({
      message: "user updated successfully",
    });
  } catch (error) {
    console.error("update user error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

// delete user (soft delete)
const deleteUser = async (req, res) => {
  try {
    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({ message: "user id required" });
    }

    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ message: "user not found" });
    }

    await userRef.update({
      isActive: false,
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    try {
      await auth.updateUser(uid, { disabled: true });
    } catch (authError) {
      console.log("could not disable auth user:", authError.message);
    }

    return res.status(200).json({
      message: "user disabled successfully",
    });
  } catch (error) {
    console.error("delete user error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

// logout user
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
      message: "logged out successfully",
    });
  } catch (error) {
    console.error("logout error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

// change password
const changePassword = async (req, res) => {
  try {
    const { uid, currentPassword, newPassword } = req.body;
    
    if (!uid || !currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: "uid, current password, and new password required" 
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: "new password must be at least 6 characters" 
      });
    }
    
    const userSnap = await db.collection("users").doc(uid).get();
    
    if (!userSnap.exists) {
      return res.status(404).json({ message: "user not found" });
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
      return res.status(401).json({ message: "current password is incorrect" });
    }
    
    await auth.updateUser(uid, { password: newPassword });
    
    return res.status(200).json({ 
      message: "password updated successfully" 
    });
  } catch (error) {
    console.error("change password error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

// refresh token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: "refresh token required" });
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
    console.error("refresh token error:", error.message);
    return res.status(401).json({ message: "invalid refresh token" });
  }
};

// real-time user listener
const subscribeToUsers = (uid, callback) => {
  return db.collection("users").doc(uid).onSnapshot(
    (doc) => {
      if (doc.exists) {
        callback(null, { id: doc.id, ...doc.data() });
      } else {
        callback("user not found", null);
      }
    },
    (error) => {
      console.error("real-time listener error:", error.message);
      callback(error, null);
    }
  );
};

// real-time all users listener
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
      console.error("real-time users listener error:", error.message);
      callback(error, null);
    }
  );
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