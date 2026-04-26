import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import {
  Alert,
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

  const [week, setWeek] = useState("");
  const [venue, setVenue] = useState("");
  const [topic, setTopic] = useState("");
  const [outcomes, setOutcomes] = useState("");
  const [recommendations, setRecommendations] = useState("");

  const [presentCount, setPresentCount] = useState(0);

  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());

  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  const [userData, setUserData] = useState(null);

  // ✅ LOAD MODULES (backend controller)
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const stored = await AsyncStorage.getItem("user");
        const user = JSON.parse(stored);

        if (!user?.uid) return;

        setUserData(user);

        const res = await fetch(
          `http://192.168.156.177:5000/api/courses/modules/lecturer/${user.uid}`
        );

        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        setModules(data || []);
      } catch (err) {
        console.log("MODULE ERROR:", err.message);
      }
    };

    fetchModules();
  }, []);

  // ✅ LOAD STUDENTS (backend controller)
  const loadStudents = async (moduleId) => {
    try {
      const res = await fetch(
        `http://192.168.156.177:5000/api/courses/module-students/${moduleId}`
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setStudents(data || []);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  // ✅ LOAD ATTENDANCE (backend controller)
  const fetchAttendance = async (moduleId) => {
    try {
      const res = await fetch(
        `http://192.168.156.177:5000/api/courses/attendance/${moduleId}`
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setPresentCount(data?.presentCount || 0);
    } catch (err) {
      setPresentCount(0);
    }
  };

  // ✅ SELECT MODULE (backend-driven)
  const handleSelectModule = async (module) => {
    setSelectedModule(module);

    await loadStudents(module.id);
    await fetchAttendance(module.id);
  };

  // ✅ SUBMIT REPORT (matches createReport controller)
  const submitReport = async () => {
    if (!selectedModule || !week || !topic) {
      Alert.alert("Error", "Fill required fields");
      return;
    }

    try {
      const payload = {
        lecturerId: userData.uid,
        lecturerName: userData.name,
        faculty: userData.faculty,

        courseId: selectedModule.courseId,
        courseName: selectedModule.courseName,

        moduleId: selectedModule.id,
        moduleName: selectedModule.moduleName,
        moduleCode: selectedModule.moduleCode,

        week,
        date: date.toISOString().split("T")[0],
        scheduledTime: time.toTimeString().split(" ")[0],

        venue,
        topic,
        learningOutcomes: outcomes,
        recommendations,

        attendancePresent: presentCount,
        totalStudents: students.length,
      };

      const res = await fetch("http://192.168.156.177:5000/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      Alert.alert("Success", "Report submitted");

      // reset
      setWeek("");
      setVenue("");
      setTopic("");
      setOutcomes("");
      setRecommendations("");
      setSelectedModule(null);
      setStudents([]);
      setPresentCount(0);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <ScrollView style={styles.container}>

      <Text style={styles.title}>Lecture Report Form</Text>

      <Text style={styles.subtitle}>Select Module</Text>

      {/* ✅ FIXED: NO FlatList (prevents render bug) */}
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
            {item.moduleName || "No Name"}
          </Text>

          <Text style={styles.moduleCode}>
            {item.moduleCode || "No Code"}
          </Text>

          <Text style={styles.courseName}>
            {item.courseName || "No Course"}
          </Text>
        </TouchableOpacity>
      ))}

      {/* INFO */}
      {selectedModule && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Total Students: {students.length}
          </Text>
          <Text style={styles.infoText}>
            Present Students: {presentCount}
          </Text>
        </View>
      )}

      {/* DATE */}
      <TouchableOpacity onPress={() => setShowDate(true)} style={styles.selector}>
        <Text style={styles.selectorText}>
          Date: {date.toDateString()}
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

      {/* TIME */}
      <TouchableOpacity onPress={() => setShowTime(true)} style={styles.selector}>
        <Text style={styles.selectorText}>
          Time: {time.toTimeString().slice(0, 5)}
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

      {/* INPUTS */}
      <TextInput style={styles.input} placeholder="Week" value={week} onChangeText={setWeek} />
      <TextInput style={styles.input} placeholder="Venue" value={venue} onChangeText={setVenue} />
      <TextInput style={styles.input} placeholder="Topic" value={topic} onChangeText={setTopic} />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Learning Outcomes"
        value={outcomes}
        onChangeText={setOutcomes}
        multiline
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Recommendations"
        value={recommendations}
        onChangeText={setRecommendations}
        multiline
      />

      {/* SUBMIT */}
      <TouchableOpacity style={styles.button} onPress={submitReport}>
        <Text style={styles.buttonText}>Submit Report</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#facc15",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#94a3b8",
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 14,
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
  },

  moduleCode: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },

  courseName: {
    fontSize: 12,
    color: "#cbd5f5",
    marginTop: 2,
  },

  infoBox: {
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 12,
    marginVertical: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#22c55e",
  },

  infoText: {
    color: "#e2e8f0",
    fontWeight: "600",
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
    marginBottom: 30,
  },

  buttonText: {
    textAlign: "center",
    fontWeight: "800",
    color: "#0f172a",
  },
});