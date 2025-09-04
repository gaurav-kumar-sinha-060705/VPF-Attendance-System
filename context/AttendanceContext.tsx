import React, { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { AttendanceLog } from '../types';

interface AttendanceContextType {
  logs: AttendanceLog[];
  loading: boolean;
  refetchLogs: () => Promise<void>;
  // FIX: Add a new function to the context type to allow efficient, single-log updates.
  updateSingleLog: (log: AttendanceLog) => void;
}

export const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL as string;

export const AttendanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendanceLogs = useCallback(async () => {
    setLoading(true);
    try {
      // FIX: Corrected the action name from 'getAttendanceLogs' to 'getAttendance' to match the
      // API endpoint defined in the Google Apps Script backend. This was the root cause of the
      // data failing to refresh. The cache-busting parameter is kept as a best practice.
      const response = await fetch(`${APPS_SCRIPT_URL}?action=getAttendance&cacheBust=${new Date().getTime()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch attendance data: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success) {
        // The backend returns 'records', so we use data.records here.
        const attendanceLogs = data.records || [];
        // Sort logs by date descending, then by employee name
        attendanceLogs.sort((a: AttendanceLog, b: AttendanceLog) => {
          const dateComparison = new Date(b.Date).getTime() - new Date(a.Date).getTime();
          if (dateComparison !== 0) return dateComparison;
          return a.EmployeeName.localeCompare(b.EmployeeName);
        });
        setLogs(attendanceLogs);
      } else {
        throw new Error(data.message || "An unknown error occurred fetching logs.");
      }
    } catch (error) {
      console.error("Error fetching attendance logs from Google Sheets:", error);
    } finally {
        setLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchAttendanceLogs();
  }, [fetchAttendanceLogs]);

  // FIX: Implement the logic to update or add a single log entry. This is more
  // efficient than refetching all logs and avoids race conditions.
  const updateSingleLog = (newLog: AttendanceLog) => {
    setLogs(prevLogs => {
      const existingLogIndex = prevLogs.findIndex(log => log.LogID === newLog.LogID);
      if (existingLogIndex > -1) {
        // Update existing log (e.g., adding a punch-out)
        const updatedLogs = [...prevLogs];
        updatedLogs[existingLogIndex] = newLog;
        return updatedLogs;
      } else {
        // Add new log (e.g., a new punch-in)
        return [newLog, ...prevLogs];
      }
    });
  };

  return (
    <AttendanceContext.Provider value={{ logs, loading, refetchLogs: fetchAttendanceLogs, updateSingleLog }}>
      {children}
    {/* FIX: Corrected a typo in the closing tag for AttendanceContext.Provider. */}
    </AttendanceContext.Provider>
  );
};