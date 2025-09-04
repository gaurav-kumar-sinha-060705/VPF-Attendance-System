import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAttendance } from '../hooks/useAttendance';
import { useEmployees } from '../hooks/useEmployees';
import Spinner from '../components/Spinner';
import { Employee, AttendanceLog } from '../types';

// Icons
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const UploadIcon = () => <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>;
const NoRecordsIcon = () => <svg className="mx-auto h-24 w-24 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>;
// FIX: Update RefreshIcon to accept a className prop to fix a TypeScript error.
// The component was being called with a className, but it was not defined to accept any props.
const RefreshIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5m-5-5a9 9 0 0115.55 5.55M4 19v-5h5m-5 5a9 9 0 0115.55-5.55" /></svg>;

const TimeDisplay: React.FC<{ time: string | null; imageUrl: string | null }> = ({ time, imageUrl }) => {
  if (!time) {
    return <span className="text-gray-400 italic">Not recorded</span>;
  }
  return (
    <div className="flex items-center gap-3">
      {imageUrl && (
        <a href={imageUrl} target="_blank" rel="noopener noreferrer" title="View Punch Photo">
            <img src={imageUrl} alt="Punch" className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200 dark:ring-gray-700" />
        </a>
      )}
      <span>{new Date(time).toLocaleTimeString()}</span>
    </div>
  );
};


const AdminPage: React.FC = () => {
  const { logs, loading: attendanceLoading, refetchLogs } = useAttendance();
  const { employees, addEmployee, deleteEmployee, loading: employeesLoading, error: employeeError, refetchEmployees } = useEmployees();

  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeFile, setNewEmployeeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [formMessage, setFormMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [attendanceView, setAttendanceView] = useState<'today' | 'all'>('today');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewEmployeeFile(e.target.files[0]);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setNewEmployeeFile(e.dataTransfer.files[0]);
    }
  };


  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);
    if (!newEmployeeId.trim() || !newEmployeeName.trim() || !newEmployeeFile) {
      setFormMessage({ text: 'Please provide an ID, a name, and a photo.', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    try {
      await addEmployee(newEmployeeId, newEmployeeName, newEmployeeFile);
      setNewEmployeeId('');
      setNewEmployeeName('');
      setNewEmployeeFile(null);
      // Clear the file input visually
      const fileInput = document.getElementById('employee-photo') as HTMLInputElement;
      if(fileInput) fileInput.value = '';

      setFormMessage({ text: 'Employee added successfully!', type: 'success' });
      setTimeout(() => setFormMessage(null), 4000);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add employee.';
      setFormMessage({ text: errorMessage, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    if (window.confirm(`Are you sure you want to delete ${employee.Name}? This action cannot be undone.`)) {
      try {
        await deleteEmployee(employee);
        setFormMessage({ text: `${employee.Name} has been deleted.`, type: 'success' });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : `Failed to delete ${employee.Name}.`;
        setFormMessage({ text: errorMessage, type: 'error' });
      }
      setTimeout(() => setFormMessage(null), 4000);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setFormMessage(null);
    try {
        await Promise.all([refetchLogs(), refetchEmployees()]);
        setFormMessage({ text: 'Data refreshed successfully.', type: 'success' });
    } catch (err) {
        setFormMessage({ text: 'Failed to refresh data.', type: 'error' });
    } finally {
        setIsRefreshing(false);
        setTimeout(() => setFormMessage(null), 4000);
    }
  };

  const downloadCSV = (logsToDownload: AttendanceLog[], filename: string) => {
    if (logsToDownload.length === 0) {
      alert("No attendance logs to download for this selection.");
      return;
    }
    const headers = ['LogID', 'EmployeeID', 'EmployeeName', 'Date', 'PunchInTime', 'PunchInImageURL', 'PunchOutTime', 'PunchOutImageURL'];
    const csvRows = [headers.join(',')];
    
    logsToDownload.forEach(log => {
        const row = [
            `"${log.LogID}"`,
            `"${log.EmployeeID}"`,
            `"${log.EmployeeName.replace(/"/g, '""')}"`,
            log.Date,
            log.PunchInTime ? `"${new Date(log.PunchInTime).toLocaleString()}"` : '',
            log.PunchInImageURL || '',
            log.PunchOutTime ? `"${new Date(log.PunchOutTime).toLocaleString()}"` : '',
            log.PunchOutImageURL || '',
        ];
        csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredLogs = useMemo(() => {
    const getTodayDateString = () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (attendanceView === 'today') {
      const todayDateString = getTodayDateString();
      return logs.filter(log => String(log.Date).split('T')[0] === todayDateString);
    }
    return logs;
  }, [logs, attendanceView]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-10">
        <div>
          <h2 className="text-4xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage Employees and Track Attendance via Google Sheets</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:focus:ring-offset-gray-950 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isRefreshing ? <Spinner className="h-5 w-5 mr-2" /> : <RefreshIcon className="h-5 w-5 mr-2" />}
              Refresh Data
            </button>
            <div className="relative group">
               <button className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-950 transition-all">
                    <DownloadIcon /> Download CSV
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 origin-top-right transition-all scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 focus-within:scale-100 focus-within:opacity-100 z-10">
                    <div className="py-1">
                        <button 
                          onClick={() => downloadCSV(filteredLogs, `vpf_attendance_today_${new Date().toISOString().split('T')[0]}.csv`)}
                          className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                          Today's Logs
                        </button>
                        <button onClick={() => downloadCSV(logs, `vpf_attendance_all_${new Date().toISOString().split('T')[0]}.csv`)} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                          All Logs
                        </button>
                    </div>
                </div>
            </div>
            <Link to="/" className="text-sky-600 dark:text-sky-400 hover:underline transition-colors">
              &larr; Back to Home
            </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900/70 rounded-xl shadow-lg p-6 ring-1 ring-slate-200 dark:ring-gray-800">
            <h3 className="text-xl font-bold mb-4">Manage Employees</h3>
            
            <form onSubmit={handleAddEmployee} className="space-y-4 mb-6">
               <div>
                <label htmlFor="employee-id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Employee ID</label>
                <input type="text" id="employee-id" value={newEmployeeId} onChange={(e) => setNewEmployeeId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-gray-800 transition"
                  placeholder="e.g. EMP001" required />
              </div>
              <div>
                <label htmlFor="employee-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Employee Name</label>
                <input type="text" id="employee-name" value={newEmployeeName} onChange={(e) => setNewEmployeeName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-gray-800 transition"
                  placeholder="e.g. Jane Doe" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reference Photo</label>
                <label
                  htmlFor="employee-photo"
                  className={`mt-1 flex justify-center items-center flex-col w-full h-32 px-6 pt-5 pb-6 border-2 ${isDragging ? 'border-sky-500 bg-sky-50 dark:bg-gray-800' : 'border-gray-300 dark:border-gray-700'} border-dashed rounded-md cursor-pointer hover:border-sky-400 dark:hover:border-sky-500 transition-colors`}
                  onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
                >
                  <div className="space-y-1 text-center">
                    <UploadIcon />
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <span className="text-sky-600 dark:text-sky-400 font-semibold">Upload a file</span>
                      <input id="employee-photo" name="employee-photo" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" required={!newEmployeeFile} />
                      <p className="pl-1">or drag and drop</p>
                    </div>
                  </div>
                </label>
                {newEmployeeFile && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Selected: {newEmployeeFile.name}</p>}
              </div>
              <button type="submit" disabled={isSubmitting}
                className="w-full bg-sky-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-sky-700 transition-all duration-200 transform hover:scale-105 disabled:bg-sky-400/50 disabled:cursor-not-allowed disabled:scale-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:focus:ring-offset-gray-900">
                {isSubmitting ? 'Adding...' : 'Add Employee'}
              </button>
               {formMessage && <p className={`text-sm text-center font-medium ${formMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formMessage.text}</p>}
               {employeeError && <p className="text-sm text-center text-red-500">{employeeError}</p>}
            </form>
            
            <h4 className="font-semibold mb-2">Existing Employees</h4>
            <div className="max-h-96 overflow-y-auto space-y-2 pr-2 -mr-2">
              {employeesLoading && <div className="flex justify-center p-4"><Spinner /></div>}
              {!employeesLoading && employees.map(emp => (
                <div key={emp.ID} className="group flex items-center justify-between gap-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-md hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img src={emp.ReferenceImageURL} alt={emp.Name} className="w-10 h-10 rounded-full object-cover flex-shrink-0"/>
                    <div>
                      <span className="font-medium text-gray-800 dark:text-gray-200 truncate block">{emp.Name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">ID: {emp.ID}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteEmployee(emp)} title={`Delete ${emp.Name}`} className="p-2 rounded-full text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100">
                    <TrashIcon />
                  </button>
                </div>
              ))}
              {!employeesLoading && employees.length === 0 && <p className="text-sm text-center text-gray-500 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-md">No employees added yet.</p>}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900/70 rounded-xl shadow-lg overflow-hidden ring-1 ring-slate-200 dark:ring-gray-800">
            <div className="flex justify-between items-center p-6 border-b dark:border-gray-800">
                <h3 className="text-xl font-bold">Daily Attendance Logs</h3>
                <div className="flex items-center rounded-lg bg-slate-100 dark:bg-gray-800 p-1">
                    <button onClick={() => setAttendanceView('today')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${attendanceView === 'today' ? 'bg-white dark:bg-gray-700 text-sky-600 dark:text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-700/50'}`}>
                        Today
                    </button>
                    <button onClick={() => setAttendanceView('all')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${attendanceView === 'all' ? 'bg-white dark:bg-gray-700 text-sky-600 dark:text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-700/50'}`}>
                        All Logs
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
              {attendanceLoading ? (
                <div className="flex justify-center items-center h-64"><Spinner /></div>
              ) : filteredLogs.length > 0 ? (
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
                    <tr>
                      <th scope="col" className="px-6 py-4">Employee</th>
                      <th scope="col" className="px-6 py-4">Date</th>
                      <th scope="col" className="px-6 py-4">Punch In</th>
                      <th scope="col" className="px-6 py-4">Punch Out</th>
                      <th scope="col" className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log.LogID} className="bg-white dark:bg-gray-900/70 border-b dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
                        <th scope="row" className="px-6 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                            <div>{log.EmployeeName}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">ID: {log.EmployeeID}</div>
                        </th>
                        <td className="px-6 py-3 whitespace-nowrap">
                          {new Date(log.Date).toLocaleDateString(undefined, { timeZone: 'UTC' })}
                        </td>
                        <td className="px-6 py-3">
                          <TimeDisplay time={log.PunchInTime} imageUrl={log.PunchInImageURL} />
                        </td>
                        <td className="px-6 py-3">
                          <TimeDisplay time={log.PunchOutTime} imageUrl={log.PunchOutImageURL} />
                        </td>
                         <td className="px-6 py-3">
                           {log.PunchInTime && !log.PunchOutTime ? (
                               <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Clocked In
                               </span>
                           ) : log.PunchInTime && log.PunchOutTime ? (
                               <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                                Completed
                               </span>
                           ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                Absent
                               </span>
                           )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center p-16">
                  <NoRecordsIcon />
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mt-4">No Attendance Logs Found</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">
                    {attendanceView === 'today' ? 'No employees have punched in today.' : 'As employees punch in, their logs will appear here.'}
                  </p>
                  <Link to="/employee" className="mt-6 inline-block bg-sky-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-700 transition-colors transform hover:scale-105">
                    Go to Employee Check-in
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;