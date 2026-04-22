import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { auth, db } from "../../config/firebase";

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

  useEffect(() => {
    const fetchData = async () => {
      const uid = auth.currentUser.uid;

      const userSnap = await getDoc(doc(db, "users", uid));
      const user = userSnap.data();
      setUserData(user);

      const moduleObjects = user.modules || [];
      const moduleIds = moduleObjects.map((m) => m.moduleId);

      if (moduleIds.length === 0) return;

      const q = query(
        collection(db, "modules"),
        where("__name__", "in", moduleIds)
      );

      const snap = await getDocs(q);

      setModules(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    };

    fetchData();
  }, []);

  const loadStudents = async (module) => {
    if (!module?.studentIds?.length) {
      setStudents([]);
      return;
    }

    const q = query(
      collection(db, "users"),
      where("__name__", "in", module.studentIds)
    );

    const snap = await getDocs(q);

    setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const fetchAttendance = async (moduleId) => {
    const q = query(
      collection(db, "attendance"),
      where("moduleId", "==", moduleId)
    );

    const snap = await getDocs(q);

    if (!snap.empty) {
      const latest = snap.docs
        .map((d) => d.data())
        .sort(
          (a, b) =>
            (b.createdAt?.seconds || 0) -
            (a.createdAt?.seconds || 0)
        )[0];

      setPresentCount(latest.presentCount || 0);
    } else {
      setPresentCount(0);
    }
  };

  const handleSelectModule = (m) => {
    setSelectedModule(m);
    loadStudents(m);
    fetchAttendance(m.id);
  };

  const submitReport = async () => {
    if (!selectedModule || !week || !topic) {
      Alert.alert("Error", "Fill required fields");
      return;
    }

    try {
      await addDoc(collection(db, "reports"), {
        lecturerId: auth.currentUser.uid,
        lecturerName: userData?.name,
        faculty: userData?.faculty,

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
        totalStudents:
          selectedModule.studentIds?.length || students.length || 0,

        prlFeedback: "",
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", "Report submitted");

      setWeek("");
      setVenue("");
      setTopic("");
      setOutcomes("");
      setRecommendations("");
      setSelectedModule(null);
      setStudents([]);
      setPresentCount(0);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Lecture Report Form</Text>
      <Text style={styles.subtitle}>Select Module</Text>

      <FlatList
        data={modules}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 10 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              selectedModule?.id === item.id && styles.cardSelected,
            ]}
            onPress={() => handleSelectModule(item)}
          >
            <Text style={styles.moduleName}>{item.moduleName}</Text>
            <Text style={styles.moduleCode}>{item.moduleCode}</Text>
            <Text style={styles.courseName}>{item.courseName}</Text>
          </TouchableOpacity>
        )}
      />

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

      <TouchableOpacity style={styles.selector} onPress={() => setShowDate(true)}>
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

      <TouchableOpacity style={styles.selector} onPress={() => setShowTime(true)}>
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

      <TextInput
        placeholder="Week"
        placeholderTextColor="#94a3b8"
        style={styles.input}
        value={week}
        onChangeText={setWeek}
      />

      <TextInput
        placeholder="Venue"
        placeholderTextColor="#94a3b8"
        style={styles.input}
        value={venue}
        onChangeText={setVenue}
      />

      <TextInput
        placeholder="Topic"
        placeholderTextColor="#94a3b8"
        style={styles.input}
        value={topic}
        onChangeText={setTopic}
      />

      <TextInput
        placeholder="Learning Outcomes"
        placeholderTextColor="#94a3b8"
        style={[styles.input, styles.textArea]}
        multiline
        value={outcomes}
        onChangeText={setOutcomes}
      />

      <TextInput
        placeholder="Recommendations"
        placeholderTextColor="#94a3b8"
        style={[styles.input, styles.textArea]}
        multiline
        value={recommendations}
        onChangeText={setRecommendations}
      />

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