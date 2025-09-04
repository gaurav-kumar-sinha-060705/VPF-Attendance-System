export interface Employee {
  ID: string;
  Name: string;
  ReferenceImageURL: string;
}

export interface AttendanceLog {
  LogID: string;
  EmployeeID: string;
  EmployeeName: string;
  Date: string; // ISO Date string (YYYY-MM-DD)
  PunchInTime: string | null; // Full ISO Timestamp string
  PunchInImageURL: string | null;
  PunchOutTime: string | null; // Full ISO Timestamp string
  PunchOutImageURL: string | null;
}

// FIX: Add and export the User interface for authentication context.
export interface User {
  id: string;
  name:string;
  email: string;
  picture: string;
}