import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEmployees } from '../hooks/useEmployees';
import { useAttendance } from '../hooks/useAttendance';
import Spinner from '../components/Spinner';
import { Employee, AttendanceLog } from '../types';

// Icons
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008v-.008z" /></svg>;
const FaceOutline = () => <svg viewBox="0 0 400 560" className="absolute inset-0 w-full h-full text-white/40 pointer-events-none" preserveAspectRatio="xMidYMid meet" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M110 280C110 230.294 150.294 190 200 190C249.706 190 290 230.294 290 280V370C290 419.706 249.706 460 200 460C150.294 460 110 419.706 110 370V280Z" stroke="currentColor" strokeWidth="4" strokeDasharray="12 12" opacity="0.5" /><path d="M200 190V100" stroke="currentColor" strokeWidth="4" /><path d="M110 280H20" stroke="currentColor" strokeWidth="4" /><path d="M290 280H380" stroke="currentColor" strokeWidth="4" /><path d="M200 460V550" stroke="currentColor" strokeWidth="4" /></svg>;

type PunchStatus = 'NOT_PUNCHED_IN' | 'PUNCHED_IN' | 'COMPLETED_FOR_DAY';

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL as string;

// CRITICAL FIX: Correctly get today's date string in the user's local timezone.
// Using toISOString().split('T')[0] is a common bug as it returns the UTC date,
// which can be different from the user's local date. This new function ensures
// that the date comparison is accurate and reliable.
const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const EmployeePage: React.FC = () => {
  const { employees, loading: employeesLoading } = useEmployees();
  const { logs, loading: attendanceLoading, updateSingleLog } = useAttendance();
  const navigate = useNavigate();

  const [employeeIdInput, setEmployeeIdInput] = useState('');
  const [verifiedEmployee, setVerifiedEmployee] = useState<Employee | null>(null);
  const [employeeStatus, setEmployeeStatus] = useState<PunchStatus | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);


  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    setError(null);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720, facingMode: 'user' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraOn(true);
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access the camera. Please check permissions and try again.");
        setIsCameraOn(false);
      }
    } else {
      setError("Your browser does not support camera access.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraOn(false);
    }
  }, []);
  
  // Cleanup camera on component unmount
  useEffect(() => stopCamera, [stopCamera]);

  const handleFindEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setVerifiedEmployee(null);
    setEmployeeStatus(null);
    setIsVerifying(true);

    const found = employees.find(emp => emp.ID.toString() === employeeIdInput);
    if (!found) {
      setError(`Employee with ID "${employeeIdInput}" not found.`);
      setIsVerifying(false);
      return;
    }
    setVerifiedEmployee(found);
    
    try {
      const todayDateString = getTodayDateString();
      const employeeLogForToday = logs.find(log => log.EmployeeID.toString() === found.ID.toString() && log.Date === todayDateString);

      if (!employeeLogForToday) {
        setEmployeeStatus('NOT_PUNCHED_IN');
      } else if (employeeLogForToday.PunchInTime && !employeeLogForToday.PunchOutTime) {
        setEmployeeStatus('PUNCHED_IN');
      } else {
        setEmployeeStatus('COMPLETED_FOR_DAY');
      }
      
      startCamera();
    } catch (err) {
        console.error("Error determining employee status:", err);
        setError("Could not determine employee status. Please try again.");
    } finally {
        setIsVerifying(false);
    }
  };

  const handlePunch = async (punchType: 'in' | 'out') => {
    if (!videoRef.current || !canvasRef.current || !verifiedEmployee) {
        setError("System is not ready. Please wait a moment.");
        return;
    }
    
    setIsProcessing(true);
    setError(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
        setError("Failed to capture image.");
        setIsProcessing(false);
        return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL('image/jpeg');
    
    stopCamera();

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: 'logAttendance',
                employeeId: verifiedEmployee.ID,
                name: verifiedEmployee.Name,
                imageDataUrl: imageDataUrl,
                punchType: punchType,
            }),
        });

        const result = await response.json();

        if (result.success && result.log) {
            updateSingleLog(result.log);
            navigate('/success', { state: { message: `You have successfully punched ${punchType === 'in' ? 'in' : 'out'}.` } });
        } else {
            setError(result.message || `An unknown error occurred during punch-${punchType.toLowerCase()}.`);
            startCamera();
        }
    } catch (err) {
        console.error("Punch Error:", err);
        setError("Failed to connect to the server. Please check your connection and try again.");
        startCamera();
    } finally {
        setIsProcessing(false);
    }
  };

  const resetState = () => {
    stopCamera();
    setVerifiedEmployee(null);
    setEmployeeStatus(null);
    setEmployeeIdInput('');
    setError(null);
  };

  const getStatusText = () => {
    if (employeeStatus === 'PUNCHED_IN') return "Currently Punched In";
    if (employeeStatus === 'COMPLETED_FOR_DAY') return "Punched Out for the Day";
    return "Not Punched In Today";
  }

  // Combine loading states for clearer UI feedback.
  const dataLoading = employeesLoading || attendanceLoading;

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 md:p-8 ring-1 ring-slate-200 dark:ring-gray-800">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Employee Punch In/Out</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Enter your Employee ID to begin.</p>
      </div>
      
      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-4" role="alert"><p className="font-bold">Error</p><p>{error}</p></div>}

      {!verifiedEmployee ? (
        <form onSubmit={handleFindEmployee} className="space-y-4">
          <div>
            <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Employee ID</label>
            <input
              type="text"
              id="employeeId"
              value={employeeIdInput}
              onChange={(e) => setEmployeeIdInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-gray-800 transition"
              placeholder="Enter your ID"
              required
              disabled={isVerifying || dataLoading}
            />
          </div>
          <button 
            type="submit" 
            disabled={isVerifying || dataLoading || !employeeIdInput}
            className="w-full flex items-center justify-center bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:focus:ring-offset-gray-900 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isVerifying ? <Spinner /> : dataLoading ? 'Loading Data...' : 'Find Employee'}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-gray-800 rounded-lg">
                <img src={verifiedEmployee.ReferenceImageURL} alt={verifiedEmployee.Name} className="w-16 h-16 rounded-full object-cover"/>
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">{verifiedEmployee.Name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">ID: {verifiedEmployee.ID}</p>
                    <p className="text-sm font-semibold text-sky-600 dark:text-sky-400">{getStatusText()}</p>
                </div>
            </div>

            <div className="w-full aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center relative transition-all">
                <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover ${!isCameraOn && 'hidden'}`}></video>
                <FaceOutline />
                {!isCameraOn && !isProcessing && <div className="flex flex-col items-center"><Spinner /><p className="text-gray-400 mt-2">Starting camera...</p></div>}
                
                {isProcessing && (
                    <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center backdrop-blur-sm transition-opacity">
                        <Spinner className="text-white" />
                        <p className="text-white mt-4 font-semibold">Processing, please wait...</p>
                    </div>
                )}
            </div>
            <canvas ref={canvasRef} className="hidden"></canvas>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={() => handlePunch('in')} 
                disabled={!isCameraOn || isProcessing || employeeStatus !== 'NOT_PUNCHED_IN'} 
                className="w-full flex items-center justify-center bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                <CameraIcon />
                Punch In
              </button>
               <button 
                type="button"
                onClick={() => handlePunch('out')} 
                disabled={!isCameraOn || isProcessing || employeeStatus !== 'PUNCHED_IN'} 
                className="w-full flex items-center justify-center bg-yellow-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 dark:focus:ring-offset-gray-900 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                <CameraIcon />
                Punch Out
              </button>
            </div>
            <button onClick={resetState} className="w-full text-center text-sm text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 transition">Wrong ID? Start Over</button>
        </div>
      )}

      <div className="text-center mt-6">
        <Link to="/" className="text-sky-600 dark:text-sky-400 hover:underline">
          &larr; Back to Home
        </Link>
      </div>
    </div>
  );
};

export default EmployeePage;