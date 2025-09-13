import React, { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Employee } from '../types';

interface EmployeeContextType {
  employees: Employee[];
  loading: boolean;
  error: string | null;
  addEmployee: (id: string, name: string, file: File) => Promise<void>;
  deleteEmployee: (employee: Employee) => Promise<void>;
  refetchEmployees: () => Promise<void>;
}

export const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL  as string;

// Helper to read file as base64 string
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Return only the base64 part
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });
};

export const EmployeeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
     try {
      const response = await fetch(`${APPS_SCRIPT_URL}?action=getEmployees`);
       if (!response.ok) {
        throw new Error(`Failed to fetch employees: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success) {
        setEmployees(data.employees.sort((a: Employee, b: Employee) => a.Name.localeCompare(b.Name)));
      } else {
        throw new Error(data.message || "An unknown error occurred fetching employees.");
      }
    } catch (err) {
      console.error("Failed to load employees from Google Sheets", err);
      setError(err instanceof Error ? err.message : "Failed to load employee data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);


  const addEmployee = async (id: string, name: string, file: File) => {
    setError(null);
    try {
      const imageBase64 = await fileToBase64(file);
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          // FIX: Use 'text/plain' to avoid CORS preflight issues with Google Apps Script.
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify({
          action: 'addEmployee',
          id,
          name,
          imageBase64,
          mimeType: file.type
        })
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to add employee on the server.');
      }
      // Refresh employee list after adding
      await fetchEmployees();
    } catch (err) {
      console.error("Error adding employee:", err);
      setError(err instanceof Error ? err.message : "Could not add the new employee.");
      throw err; // Re-throw error to be handled by the component
    }
  };

  const deleteEmployee = async (employeeToDelete: Employee) => {
    setError(null);
    try {
       const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          // FIX: Use 'text/plain' to avoid CORS preflight issues with Google Apps Script.
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify({
          action: 'deleteEmployee',
          id: employeeToDelete.ID
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || `Could not delete ${employeeToDelete.Name}.`);
      }
       // Refresh employee list after deleting
      await fetchEmployees();
    } catch (err) {
      console.error("Error deleting employee:", err);
      setError(err instanceof Error ? err.message : `Could not delete ${employeeToDelete.Name}.`);
      throw err; // Re-throw error to be handled by the component
    }
  };

  return (
    <EmployeeContext.Provider value={{ employees, loading, error, addEmployee, deleteEmployee, refetchEmployees: fetchEmployees }}>
      {children}
    </EmployeeContext.Provider>
  );
};
