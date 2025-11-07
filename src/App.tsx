import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppRoutes } from './app/AppRoutes';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { useAuth } from './hooks/useAuth';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <AppRoutes />;
  }

  return (
    // <div  className="app-container">
    <div className="h-screen flex overflow-hidden bg-gray-100">
      <Sidebar />
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Topbar />
        <AppRoutes />
      </div>
    </div>
    // </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;



// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// // import Authpage from './pages/Authpage';
// import Login from './pages/login';
// import Signup from './pages/signup';
// import Dashboard from './pages/dashboard';
// import Project from './pages/project';
// import Task from './pages/task';
// import DashboardLayout from './components/DashboardLayout';

// const isLoggedIn = true; // replace with real auth

// function App() {

//   return (
//     <Router>
//       <Routes>
//         <Route path="/login" element={<Login />} />
//         <Route path="/signup" element={<Signup />} />
//         <Route
//           path="/"
//           element={isLoggedIn ? <DashboardLayout /> : <Navigate to="/login" />}
//         >
//           <Route index element={<Dashboard />} /> {/* default page */}
//           <Route path="dashboard" element={<Dashboard />} />
//           <Route path="project" element={<Project />} />
//           <Route path="task" element={<Task />} />
//         </Route>
//         <Route path="*" element={<h1>404 - Not Found</h1>} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;
