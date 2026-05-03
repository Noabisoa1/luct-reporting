import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";

import StudentAttendance from "../screens/student/StudentAttendance";
import StudentDashboard from "../screens/student/StudentDashboard";
import StudentRating from "../screens/student/StudentRating";
import StudentRegisterModules from "../screens/student/StudentRegisterModules";

import LecturerAttendance from "../screens/lecturer/LecturerAttendance";
import LecturerClasses from "../screens/lecturer/LecturerClasses";
import LecturerDashboard from "../screens/lecturer/LecturerDashboard";
import LecturerRating from "../screens/lecturer/LecturerRating";
import LecturerReportForm from "../screens/lecturer/LecturerReportForm";
import LecturerReports from "../screens/lecturer/LecturerReports";

import PRLClasses from "../screens/prl/PRLClasses";
import PRLCourses from "../screens/prl/PRLCourses";
import PRLDashboard from "../screens/prl/PRLDashboard";
import PRLRating from "../screens/prl/PRLRating";

import PLClasses from "../screens/pl/PLClasses";
import PLCourses from "../screens/pl/PLCourses";
import PLDashboard from "../screens/pl/PLDashboard";
import PLLecturers from "../screens/pl/PLLecturers";
import PLMonitoring from "../screens/pl/PLMonitoring";
import PLRating from "../screens/pl/PLRating";
import PLReports from "../screens/pl/PLReports";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="StudentDashboard" component={StudentDashboard} />
        <Stack.Screen name="StudentRating" component={StudentRating} />
        <Stack.Screen name="StudentAttendance" component={StudentAttendance} />
        <Stack.Screen name="StudentRegisterModules" component={StudentRegisterModules} />
        <Stack.Screen name="LecturerDashboard" component={LecturerDashboard} />
        <Stack.Screen name="LecturerClasses" component={LecturerClasses} />
        <Stack.Screen name="LecturerReports" component={LecturerReports} />
        <Stack.Screen name="LecturerReportForm" component={LecturerReportForm} />
        <Stack.Screen name="LecturerAttendance" component={LecturerAttendance} />
        <Stack.Screen name="LecturerRating" component={LecturerRating} />
        <Stack.Screen name="PRLDashboard" component={PRLDashboard} />
        <Stack.Screen name="PRLCourses" component={PRLCourses} />
        <Stack.Screen name="PRLRating" component={PRLRating} />
        <Stack.Screen name="PRLClasses" component={PRLClasses} />
        <Stack.Screen name="PLDashboard" component={PLDashboard} />
        <Stack.Screen name="PLCourses" component={PLCourses} />
        <Stack.Screen name="PLReports" component={PLReports} />
        <Stack.Screen name="PLMonitoring" component={PLMonitoring} />
        <Stack.Screen name="PLClasses" component={PLClasses} />
        <Stack.Screen name="PLLectures" component={PLLecturers} />
        <Stack.Screen name="PLRating" component={PLRating} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}