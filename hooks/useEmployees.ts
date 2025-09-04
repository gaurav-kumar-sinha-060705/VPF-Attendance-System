import { useContext } from 'react';
import { EmployeeContext } from '../context/EmployeeContext.tsx';

export const useEmployees = () => {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error('useEmployees must be used within an EmployeeProvider');
  }
  return context;
};