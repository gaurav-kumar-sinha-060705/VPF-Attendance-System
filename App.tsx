import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AttendanceProvider } from './context/AttendanceContext.tsx';
// FIX: Corrected import path. The EmployeeProvider component is in the EmployeeContext.tsx file.
import { EmployeeProvider } from './context/EmployeeContext.tsx';
// FIX: Import AuthProvider to enable authentication across the app.
import { AuthProvider } from './context/AuthContext.tsx';

import Header from './components/Header.tsx';
// FIX: Import ProtectedRoute to secure admin pages.
import ProtectedRoute from './components/ProtectedRoute.tsx';

import HomePage from './pages/HomePage.tsx';
import EmployeePage from './pages/EmployeePage.tsx';
import AdminPage from './pages/AdminPage.tsx';
import SuccessPage from './pages/SuccessPage.tsx';
// FIX: Import LoginPage for user authentication.
import LoginPage from './pages/LoginPage.tsx';


function App(): React.ReactNode {
  return (
      <EmployeeProvider>
        <AttendanceProvider>
          <HashRouter>
            {/* FIX: Wrap the application with AuthProvider to provide auth state. AuthProvider must be inside a Router because it uses useNavigate. */}
            <AuthProvider>
              <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col">
                <Header />
                <main className="flex-grow container mx-auto p-4 py-10 md:py-16 md:px-8">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/employee" element={<EmployeePage />} />
                    {/* FIX: Add a route for the login page. */}
                    <Route path="/login" element={<LoginPage />} />
                    {/* FIX: Protect the admin route to ensure only authenticated users can access it. */}
                    <Route 
                      path="/admin" 
                      element={
                        <ProtectedRoute>
                          <AdminPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="/success" element={<SuccessPage />} />
                  </Routes>
                </main>
              </div>
            </AuthProvider>
          </HashRouter>
        </AttendanceProvider>
      </EmployeeProvider>
  );
}

export default App;