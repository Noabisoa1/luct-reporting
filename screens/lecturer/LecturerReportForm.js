import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LecturerReportForm() {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState(null);

  const [week, setWeek] = useState("");
  const [venue, setVenue] = useState("");
  const [topic, setTopic] = useState("");
  const [outcomes, setOutcomes] = useState("");
  const [recommendations, setRecommendations] = useState("");

  const [presentCount, setPresentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());

  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  const [userData, setUserData] = useState(null);

  const BASE_URL = "https://luct-reporting-2-932p.onrender.com";

  // load modules
  const fetchModules = async (lecturerId) => {
    try {
      const res = await fetch(
        `${BASE_URL}/api/courses/modules/lecturer/${lecturerId}`
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setModules(Array.isArray(data) ? data : []);
      console.log(`loaded ${data.length} modules`);
    } catch (err) {
      console.log("module error:", err.message);
      Alert.alert("error", "failed to load modules");
    }
  };

  // load students for module
  const loadStudents = async (moduleId) => {
    try {
      const res = await fetch(
        `${BASE_URL}/api/courses/modules/${moduleId}/students`
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setStudents(Array.isArray(data) ? data : []);
      console.log(`loaded ${data.length} students for module`);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.log("load students error:", err.message);
      Alert.alert("error", "failed to load students");
      return [];
    }
  };

  // fetch today's attendance
  const fetchAttendance = async (moduleId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const res = await fetch(
        `${BASE_URL}/api/attendance/module/${moduleId}?date=${today}`
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      if (data && data.length > 0) {
        const attendance = data[0];
        const present = Object.values(attendance.attendance || {}).filter(v => v === "present").length;
        setPresentCount(present);
        setAttendanceData(attendance);
        console.log(`today's attendance: ${present} present`);
      } else {
        setPresentCount(0);
        setAttendanceData(null);
        console.log("no attendance recorded for today");
      }
    } catch (err) {
      console.log("fetch attendance error:", err.message);
      setPresentCount(0);
    }
  };

  // initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const stored = await AsyncStorage.getItem("user");
        if (!stored) {
          Alert.alert("error", "user not found. please login again.");
          setLoading(false);
          return;
        }
        
        const user = JSON.parse(stored);
        setUserData(user);

        const lecturerId = user.uid || user.id;
        
        if (!lecturerId) {
          Alert.alert("error", "invalid user data");
          setLoading(false);
          return;
        }

        await fetchModules(lecturerId);
      } catch (err) {
        console.log("init error:", err.message);
        Alert.alert("error", "failed to load data");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    if (userData) {
      const lecturerId = userData.uid || userData.id;
      await fetchModules(lecturerId);
      if (selectedModule) {
        await loadStudents(selectedModule.id);
        await fetchAttendance(selectedModule.id);
      }
    }
    setRefreshing(false);
  };

  // select module handler
  const handleSelectModule = async (module) => {
    setSelectedModule(module);
    setLoading(true);
    
    await loadStudents(module.id);
    await fetchAttendance(module.id);
    
    setLoading(false);
  };

  // view attendance details
  const viewAttendanceDetails = () => {
    if (!attendanceData) {
      Alert.alert("no attendance", "no attendance recorded for today. please mark attendance first.");
      return;
    }
    
    const attendanceList = Object.entries(attendanceData.attendance || {});
    const presentStudents = attendanceList.filter(([_, status]) => status === "present").length;
    const absentStudents = attendanceList.filter(([_, status]) => status === "absent").length;
    
    Alert.alert(
      "attendance details",
      `today's attendance summary\n\n` +
      `total students: ${students.length}\n` +
      `present: ${presentStudents}\n` +
      `absent: ${absentStudents}\n` +
      `date: ${attendanceData.date}\n\n` +
      `note: please ensure you have marked attendance before submitting report.`,
      [{ text: "ok" }]
    );
  };

  // submit report validation
  const submitReport = async () => {
    if (!selectedModule) {
      Alert.alert("error", "please select a module");
      return;
    }

    if (!week) {
      Alert.alert("error", "please enter the week number");
      return;
    }

    if (!topic) {
      Alert.alert("error", "please enter the topic");
      return;
    }

    if (!venue) {
      Alert.alert("error", "please enter the venue");
      return;
    }

    if (presentCount === 0 && students.length > 0) {
      Alert.alert(
        "warning",
        "no attendance recorded for today. do you want to continue?",
        [
          { text: "cancel", style: "cancel" },
          { text: "continue", onPress: () => submitReportToBackend() }
        ]
      );
      return;
    }

    await submitReportToBackend();
  };

  // submit report to backend
  const submitReportToBackend = async () => {
    setSubmitting(true);

    try {
      const payload = {
        lecturerId: userData.uid || userData.id,
        lecturerName: userData.name,
        lecturerEmail: userData.email,
        lecturerFaculty: userData.faculty,

        courseId: selectedModule.courseId,
        courseName: selectedModule.courseName,
        courseCode: selectedModule.courseCode,

        moduleId: selectedModule.id,
        moduleName: selectedModule.moduleName,
        moduleCode: selectedModule.moduleCode,

        week: parseInt(week) || week,
        date: date.toISOString().split("T")[0],
        scheduledTime: time.toTimeString().split(" ")[0],

        venue: venue,
        topic: topic,
        learningOutcomes: outcomes,
        recommendations: recommendations,

        attendancePresent: presentCount,
        totalStudents: students.length,
        attendanceRate: students.length > 0 ? ((presentCount / students.length) * 100).toFixed(2) : 0,
      };

      console.log("submitting report:", payload);

      const res = await fetch(`${BASE_URL}/api/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      Alert.alert("success", "report submitted successfully!");

      // reset form
      setWeek("");
      setVenue("");
      setTopic("");
      setOutcomes("");
      setRecommendations("");
      setSelectedModule(null);
      setStudents([]);
      setPresentCount(0);
      setAttendanceData(null);
      
    } catch (err) {
      console.log("submit error:", err.message);
      Alert.alert("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>loading modules...</Text>
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
      <Text style={styles.title}>lecture report form</Text>
      <Text style={styles.subtitle}>select module</Text>

      {modules.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[
            styles.card,
            selectedModule?.id === item.id && styles.cardSelected,
          ]}
          onPress={() => handleSelectModule(item)}
        >
          <Text style={styles.moduleName}>
            {item.moduleName || "no name"}
          </Text>
          <Text style={styles.moduleCode}>
            {item.moduleCode || "no code"}
          </Text>
          <Text style={styles.courseName}>
            {item.courseName || "no course"} {item.classYear || ""}
          </Text>
        </TouchableOpacity>
      ))}

      {selectedModule && (
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>module information</Text>
          <Text style={styles.infoText}>📚 {selectedModule.moduleName}</Text>
          <Text style={styles.infoText}>📖 code: {selectedModule.moduleCode}</Text>
          <Text style={styles.infoText}>🏫 course: {selectedModule.courseName}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{students.length}</Text>
              <Text style={styles.statLabel}>total students</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.presentStat]}>{presentCount}</Text>
              <Text style={styles.statLabel}>present today</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, students.length > 0 ? 
                (presentCount/students.length >= 0.75 ? styles.goodStat : 
                 presentCount/students.length >= 0.5 ? styles.warningStat : styles.badStat) : styles.badStat]}>
                {students.length > 0 ? ((presentCount / students.length) * 100).toFixed(0) : 0}%
              </Text>
              <Text style={styles.statLabel}>attendance rate</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.viewAttendanceBtn} onPress={viewAttendanceDetails}>
            <Text style={styles.viewAttendanceText}>view attendance details</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* date picker */}
      <TouchableOpacity onPress={() => setShowDate(true)} style={styles.selector}>
        <Text style={styles.selectorText}>
          📅 date: {date.toDateString()}
        </Text>
      </TouchableOpacity>

      {showDate && (
        <DateTimePicker
          value={date}
          mode="date"
          onChange={(e, selected) => {
            setShowDate(false);
            if (selected) setDate(selected);
          }}
        />
      )}

      {/* time picker */}
      <TouchableOpacity onPress={() => setShowTime(true)} style={styles.selector}>
        <Text style={styles.selectorText}>
          🕐 time: {time.toTimeString().slice(0, 5)}
        </Text>
      </TouchableOpacity>

      {showTime && (
        <DateTimePicker
          value={time}
          mode="time"
          onChange={(e, selected) => {
            setShowTime(false);
            if (selected) setTime(selected);
          }}
        />
      )}

      {/* form inputs */}
      <TextInput 
        style={styles.input} 
        placeholder="week (e.g., week 1, week 2)" 
        placeholderTextColor="#94a3b8"
        value={week} 
        onChangeText={setWeek} 
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="venue (e.g., room 101, online)" 
        placeholderTextColor="#94a3b8"
        value={venue} 
        onChangeText={setVenue} 
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="topic" 
        placeholderTextColor="#94a3b8"
        value={topic} 
        onChangeText={setTopic} 
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="learning outcomes"
        placeholderTextColor="#94a3b8"
        value={outcomes}
        onChangeText={setOutcomes}
        multiline
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="recommendations / action items"
        placeholderTextColor="#94a3b8"
        value={recommendations}
        onChangeText={setRecommendations}
        multiline
      />

      {/* submit button */}
      <TouchableOpacity 
        style={[styles.button, submitting && styles.buttonDisabled]} 
        onPress={submitReport}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.buttonText}>submit report</Text>
        )}
      </TouchableOpacity>

      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 16,
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
    fontSize: 24,
    fontWeight: "800",
    color: "#facc15",
    marginBottom: 10,
    textTransform: "lowercase",
  },

  subtitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#94a3b8",
    marginBottom: 10,
    textTransform: "lowercase",
  },

  card: {
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },

  cardSelected: {
    backgroundColor: "#16a34a",
    borderColor: "#22c55e",
  },

  moduleName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#e2e8f0",
    textTransform: "lowercase",
  },

  moduleCode: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
    textTransform: "lowercase",
  },

  courseName: {
    fontSize: 12,
    color: "#cbd5f5",
    marginTop: 2,
    textTransform: "lowercase",
  },

  infoBox: {
    backgroundColor: "#1e293b",
    padding: 15,
    borderRadius: 12,
    marginVertical: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#22c55e",
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#facc15",
    marginBottom: 10,
    textTransform: "lowercase",
  },

  infoText: {
    color: "#e2e8f0",
    fontSize: 13,
    marginBottom: 4,
    textTransform: "lowercase",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },

  statItem: {
    alignItems: "center",
    flex: 1,
  },

  statNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#e2e8f0",
  },

  presentStat: {
    color: "#22c55e",
  },

  goodStat: {
    color: "#22c55e",
  },

  warningStat: {
    color: "#facc15",
  },

  badStat: {
    color: "#ef4444",
  },

  statLabel: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 4,
    textTransform: "lowercase",
  },

  viewAttendanceBtn: {
    backgroundColor: "#334155",
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
    alignItems: "center",
  },

  viewAttendanceText: {
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "lowercase",
  },

  selector: {
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },

  selectorText: {
    color: "#e2e8f0",
    fontWeight: "600",
    textTransform: "lowercase",
  },

  input: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    color: "#e2e8f0",
  },

  textArea: {
    height: 90,
    textAlignVertical: "top",
  },

  button: {
    backgroundColor: "#22c55e",
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },

  buttonDisabled: {
    backgroundColor: "#166534",
  },

  buttonText: {
    textAlign: "center",
    fontWeight: "800",
    color: "#fff",
    fontSize: 16,
    textTransform: "lowercase",
  },

  footer: {
    height: 30,
  },
});