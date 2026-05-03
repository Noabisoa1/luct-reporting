import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function StudentRegisterModules({ route }) {
  const user = route?.params?.user;
  const studentId = user?.uid;

  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [registeredModules, setRegisteredModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [showRegistered, setShowRegistered] = useState(false);
  const [hasRegistered, setHasRegistered] = useState(false);
  const [registeredCourseId, setRegisteredCourseId] = useState(null);

  const BASE_URL = "http://10.11.13.251:5000";

  useEffect(() => {
    if (!studentId) {
      Alert.alert("Error", "User not found. Please login again.");
      setLoading(false);
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadCourses(), loadStudentRegisteredModules()]);
    } catch (error) {
      console.log("Load data error:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    if (selectedCourse) {
      await loadModules(selectedCourse.id);
    }
    setRefreshing(false);
  };

  const loadCourses = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/courses`);
      const data = await res.json();
      const activeCourses = Array.isArray(data) ? data.filter(c => c.isActive !== false) : [];
      setCourses(activeCourses);
    } catch (err) {
      console.log("Load courses error:", err.message);
      Alert.alert("Error", "Failed to load courses");
    }
  };

  const loadStudentRegisteredModules = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/users/${studentId}`);
      
      if (res.ok) {
        const student = await res.json();
        const registered = student?.registeredModules || [];
        setRegisteredModules(registered);
        
        if (registered.length > 0) {
          setHasRegistered(true);
          if (registered[0]?.courseId) {
            setRegisteredCourseId(registered[0].courseId);
          }
          // Auto-select the course student is registered in
          const registeredCourse = courses.find(c => c.id === registered[0]?.courseId);
          if (registeredCourse && !selectedCourse) {
            setSelectedCourse(registeredCourse);
            loadModules(registeredCourse.id);
          }
        } else {
          setHasRegistered(false);
          setRegisteredCourseId(null);
        }
      } else {
        const usersRes = await fetch(`${BASE_URL}/api/users?role=student`);
        const users = await usersRes.json();
        const student = users.find((u) => u.id === studentId);
        const registered = student?.registeredModules || [];
        setRegisteredModules(registered);
        
        if (registered.length > 0) {
          setHasRegistered(true);
          if (registered[0]?.courseId) {
            setRegisteredCourseId(registered[0].courseId);
          }
          const registeredCourse = courses.find(c => c.id === registered[0]?.courseId);
          if (registeredCourse && !selectedCourse) {
            setSelectedCourse(registeredCourse);
            loadModules(registeredCourse.id);
          }
        } else {
          setHasRegistered(false);
          setRegisteredCourseId(null);
        }
      }
    } catch (err) {
      console.log("Load student registered modules error:", err.message);
      setRegisteredModules([]);
      setHasRegistered(false);
      setRegisteredCourseId(null);
    }
  };

  const loadModules = async (courseId) => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/courses/modules/course/${courseId}`);
      const data = await res.json();
      const modulesList = Array.isArray(data) ? data : [];
      
      const modulesWithStatus = modulesList.map(module => ({
        ...module,
        isRegistered: isModuleRegistered(module.id)
      }));
      
      setModules(modulesWithStatus);
    } catch (err) {
      console.log("Load modules error:", err.message);
      Alert.alert("Error", "Failed to load modules");
      setModules([]);
    } finally {
      setLoading(false);
    }
  };

  const selectCourse = (course) => {
    if (hasRegistered && registeredCourseId !== course.id) {
      Alert.alert(
        "Course Locked",
        "You have already registered for modules in another course. You cannot switch to a different course.",
        [{ text: "OK" }]
      );
      return;
    }
    
    setSelectedCourse(course);
    loadModules(course.id);
  };

  const isModuleRegistered = (moduleId) => {
    return registeredModules.some((m) => m.moduleId === moduleId);
  };

  const registerModule = async (module) => {
    try {
      if (isModuleRegistered(module.id)) {
        Alert.alert("Info", "Module already registered");
        return;
      }

      if (hasRegistered && registeredCourseId !== module.courseId) {
        Alert.alert(
          "Cannot Register",
          "You are already registered for modules in a different course.",
          [{ text: "OK" }]
        );
        return;
      }

      setRegistering(true);

      const res = await fetch(`${BASE_URL}/api/courses/register-modules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: studentId,
          courseId: module.courseId,
          modules: [
            {
              moduleId: module.id,
              moduleName: module.moduleName,
            },
          ],
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      Alert.alert("Success", `Registered for ${module.moduleName}!`);

      await loadStudentRegisteredModules();
      
      if (selectedCourse) {
        await loadModules(selectedCourse.id);
      }
    } catch (err) {
      console.log("Register error:", err.message);
      Alert.alert("Error", err.message);
    } finally {
      setRegistering(false);
    }
  };

  const unregisterModule = async (module) => {
    Alert.alert(
      "Confirm Unregistration",
      `Are you sure you want to unregister from ${module.moduleName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unregister",
          style: "destructive",
          onPress: async () => {
            try {
              setRegistering(true);
              
              const res = await fetch(`${BASE_URL}/api/courses/unregister-module`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  studentId: studentId,
                  moduleId: module.id,
                  courseId: module.courseId,
                }),
              });

              const data = await res.json();

              if (!res.ok) throw new Error(data.message);

              Alert.alert("Success", `Unregistered from ${module.moduleName}`);

              await loadStudentRegisteredModules();
              
              if (selectedCourse) {
                await loadModules(selectedCourse.id);
              }
              
              // If no modules left, unlock courses
              const updatedStudent = await fetch(`${BASE_URL}/api/users/${studentId}`);
              if (updatedStudent.ok) {
                const student = await updatedStudent.json();
                if (!student?.registeredModules || student.registeredModules.length === 0) {
                  setHasRegistered(false);
                  setRegisteredCourseId(null);
                  setSelectedCourse(null);
                  setModules([]);
                }
              }
            } catch (err) {
              console.log("Unregister error:", err.message);
              Alert.alert("Error", err.message);
            } finally {
              setRegistering(false);
            }
          },
        },
      ]
    );
  };

  const getCourseStatus = (course) => {
    if (!hasRegistered) return "available";
    if (registeredCourseId === course.id) return "registered";
    return "locked";
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Loading courses...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#22c55e"]} />
      }
    >
      <Text style={styles.title}>Module Registration</Text>
      <Text style={styles.subtitle}>Select your course to view modules</Text>

      {hasRegistered && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>You are already registered for modules in a course.</Text>
          <Text style={styles.warningSubtext}>Other courses are locked. You can only unregister from your current course.</Text>
        </View>
      )}

      {/* Courses Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Courses ({courses.length})</Text>
        
        <FlatList
          data={courses}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No courses available</Text>
          }
          renderItem={({ item }) => {
            const courseStatus = getCourseStatus(item);
            const isLocked = courseStatus === "locked";
            const isRegisteredCourse = courseStatus === "registered";
            
            return (
              <TouchableOpacity
                style={[
                  styles.courseCard,
                  selectedCourse?.id === item.id && styles.selected,
                  isLocked && styles.lockedCard,
                  isRegisteredCourse && styles.registeredCourseCard,
                ]}
                onPress={() => selectCourse(item)}
                disabled={isLocked}
              >
                <Text style={[
                  styles.courseName,
                  isLocked && styles.lockedText
                ]}>
                  {item.courseName}
                </Text>
                <Text style={styles.courseDetails}>{item.classYear}</Text>
                <Text style={styles.courseDetails}>{item.faculty}</Text>
                {isLocked && (
                  <Text style={styles.lockedLabel}>Locked</Text>
                )}
                {isRegisteredCourse && (
                  <Text style={styles.registeredLabel}>Your Course</Text>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Modules Section */}
      {selectedCourse && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Modules for {selectedCourse.courseName} ({modules.length})
          </Text>

          {modules.length === 0 ? (
            <Text style={styles.emptyText}>No modules available for this course</Text>
          ) : (
            modules.map((item) => {
              const registered = item.isRegistered;
              return (
                <View key={item.id} style={[styles.moduleCard, registered && styles.registeredCard]}>
                  <View style={styles.moduleHeader}>
                    <Text style={styles.moduleName}>{item.moduleName}</Text>
                    {registered && (
                      <View style={styles.registeredBadge}>
                        <Text style={styles.registeredBadgeText}>Registered</Text>
                      </View>
                    )}
                  </View>
                  
                  <Text style={styles.moduleCode}>Code: {item.moduleCode}</Text>
                  <Text style={styles.lecturerInfo}>
                    Lecturer: {item.lecturerName || "Not assigned yet"}
                  </Text>
                  
                  {item.lecturerName ? (
                    <Text style={styles.statusActive}>Available for registration</Text>
                  ) : (
                    <Text style={styles.statusWarning}>No lecturer assigned yet</Text>
                  )}

                  <View style={styles.buttonContainer}>
                    {!registered ? (
                      <TouchableOpacity
                        disabled={registering || !item.lecturerName}
                        onPress={() => registerModule(item)}
                        style={[
                          styles.registerBtn,
                          (!item.lecturerName || registering) && styles.disabledBtn,
                        ]}
                      >
                        {registering ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text style={styles.btnText}>Register</Text>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={() => unregisterModule(item)}
                        style={styles.unregisterBtn}
                      >
                        <Text style={styles.unregisterText}>Unregister</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* My Registered Modules Summary */}
      <View style={styles.section}>
        <TouchableOpacity 
          onPress={() => setShowRegistered(!showRegistered)}
          style={styles.summaryHeader}
        >
          <Text style={styles.sectionTitle}>
            My Registered Modules ({registeredModules.length})
          </Text>
          <Text style={styles.toggleIcon}>{showRegistered ? "▼" : "▶"}</Text>
        </TouchableOpacity>

        {showRegistered && (
          registeredModules.length === 0 ? (
            <Text style={styles.emptyText}>You have not registered for any modules yet</Text>
          ) : (
            registeredModules.map((reg, index) => (
              <View key={index} style={styles.registeredModuleCard}>
                <Text style={styles.registeredModuleName}>{reg.moduleName}</Text>
                <Text style={styles.registeredModuleId}>ID: {reg.moduleId}</Text>
                <Text style={styles.registeredDate}>
                  Registered: {reg.registeredAt ? new Date(reg.registeredAt).toLocaleDateString() : "Recently"}
                </Text>
              </View>
            ))
          )
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#0f172a",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
  },

  loadingText: {
    color: "#94a3b8",
    marginTop: 10,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#facc15",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 20,
  },

  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#e2e8f0",
    marginBottom: 12,
  },

  warningBox: {
    backgroundColor: "#facc15",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },

  warningText: {
    color: "#0f172a",
    fontWeight: "700",
    textAlign: "center",
  },

  warningSubtext: {
    color: "#0f172a",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },

  courseCard: {
    padding: 14,
    backgroundColor: "#1e293b",
    borderRadius: 16,
    marginRight: 12,
    minWidth: 140,
    borderWidth: 1,
    borderColor: "#334155",
  },

  selected: {
    borderWidth: 2,
    borderColor: "#22c55e",
    backgroundColor: "#1e293b",
  },

  lockedCard: {
    backgroundColor: "#334155",
    opacity: 0.5,
  },

  registeredCourseCard: {
    backgroundColor: "#064e3b",
    borderColor: "#22c55e",
  },

  courseName: {
    fontWeight: "700",
    fontSize: 16,
    color: "#e2e8f0",
    marginBottom: 4,
  },

  lockedText: {
    color: "#94a3b8",
  },

  courseDetails: {
    fontSize: 12,
    color: "#94a3b8",
  },

  lockedLabel: {
    fontSize: 10,
    color: "#ef4444",
    marginTop: 6,
    fontWeight: "600",
  },

  registeredLabel: {
    fontSize: 10,
    color: "#22c55e",
    marginTop: 6,
    fontWeight: "600",
  },

  moduleCard: {
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },

  registeredCard: {
    backgroundColor: "#064e3b",
    borderColor: "#22c55e",
  },

  moduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  moduleName: {
    fontWeight: "700",
    fontSize: 16,
    color: "#e2e8f0",
    flex: 1,
  },

  moduleCode: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 4,
  },

  lecturerInfo: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 8,
  },

  registeredBadge: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  registeredBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },

  statusActive: {
    fontSize: 12,
    color: "#22c55e",
    marginBottom: 12,
  },

  statusWarning: {
    fontSize: 12,
    color: "#facc15",
    marginBottom: 12,
  },

  buttonContainer: {
    marginTop: 4,
  },

  registerBtn: {
    backgroundColor: "#22c55e",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  unregisterBtn: {
    backgroundColor: "#dc2626",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  disabledBtn: {
    backgroundColor: "#475569",
  },

  btnText: {
    color: "#fff",
    fontWeight: "700",
  },

  unregisterText: {
    color: "#fff",
    fontWeight: "700",
  },

  emptyText: {
    color: "#94a3b8",
    textAlign: "center",
    padding: 20,
  },

  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  toggleIcon: {
    color: "#facc15",
    fontSize: 16,
  },

  registeredModuleCard: {
    backgroundColor: "#0f172a",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },

  registeredModuleName: {
    color: "#e2e8f0",
    fontWeight: "600",
    marginBottom: 4,
  },

  registeredModuleId: {
    color: "#94a3b8",
    fontSize: 11,
  },

  registeredDate: {
    color: "#94a3b8",
    fontSize: 10,
    marginTop: 4,
  },
});