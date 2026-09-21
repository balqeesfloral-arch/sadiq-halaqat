// src/context/TeacherPreferencesContext.jsx

import { createContext, useContext } from "react";

export const TeacherPreferencesContext = createContext({
  teacher: null,
  teacherPreferences: null,
  refreshTeacherPreferences: async () => {},
});

export function useTeacherPreferences() {
  return useContext(TeacherPreferencesContext);
}
