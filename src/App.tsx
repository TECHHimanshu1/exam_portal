
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Pages
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import AddUser from "./pages/admin/AddUser";
import ExamManagement from "./pages/admin/ExamManagement";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";

// Teacher pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import QuestionBank from "./pages/teacher/QuestionBank";
import TeacherExamManagement from "./pages/teacher/ExamManagement";
import CreateExam from "./pages/teacher/CreateExam";
import ResultManagement from "./pages/teacher/ResultManagement";
import Profile from "./pages/teacher/Profile";
import ExamResults from "./pages/teacher/ExamResults";

// Student pages
import StudentDashboard from "./pages/student/StudentDashboard";
import ExamList from "./pages/student/ExamList";
import TakeExam from "./pages/student/TakeExam";
import ResultsList from "./pages/student/ResultsList";
import ExamResultDetails from "./pages/student/ExamResultDetails";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Admin routes */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/users/add" element={<AddUser />} />
            <Route path="/admin/exams" element={<ExamManagement />} />
            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/admin/settings" element={<Settings />} />
            
            {/* Teacher routes */}
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/questions" element={<QuestionBank />} />
            <Route path="/teacher/exams" element={<TeacherExamManagement />} />
            <Route path="/teacher/exams/create" element={<CreateExam />} />
            <Route path="/teacher/results" element={<ResultManagement />} />
            <Route path="/teacher/results/:examId" element={<ExamResults />} />
            <Route path="/teacher/profile" element={<Profile />} />
            
            {/* Student routes */}
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/exams" element={<ExamList />} />
            <Route path="/student/exams/:id" element={<TakeExam />} />
            <Route path="/student/results" element={<ResultsList />} />
            <Route path="/student/results/:resultId" element={<ExamResultDetails />} />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
