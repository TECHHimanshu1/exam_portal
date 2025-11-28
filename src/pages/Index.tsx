
import React from 'react';
import { ButtonLink } from '@/components/ui/button-link';
import { Header } from '@/components/layout/Header';
import { 
  ArrowRight, 
  BookOpen, 
  Clock, 
  Award, 
  CheckCircle, 
  Sparkles, 
  Shield, 
  LineChart, 
  Users,
  GraduationCap
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 relative">
        {/* Background Shapes */}
        <div className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute top-40 -left-20 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-indigo-300/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto flex flex-col lg:flex-row items-center relative z-10">
          <div className="flex-1 lg:pr-12 space-y-8">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
              <Sparkles className="h-4 w-4 mr-2" />
              <span>Next Generation Exam Solution</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                Modern Online Examination
              </span> Platform
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
              A secure, user-friendly system for creating, managing, and taking exams with instant results and detailed analytics.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <ButtonLink
                to="/register"
                size="lg"
                className="shadow-lg shadow-primary/20 group bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 transition-all duration-300"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </ButtonLink>
              <ButtonLink
                to="/login"
                variant="outline"
                size="lg"
                className="shadow-sm hover:shadow-md transition-all duration-300"
              >
                Login
              </ButtonLink>
            </div>
            
            <div className="flex flex-wrap gap-x-8 gap-y-4 pt-4">
              {[
                { icon: <Shield className="h-5 w-5 text-primary" />, text: "Secure Testing" },
                { icon: <Clock className="h-5 w-5 text-primary" />, text: "Instant Results" },
                { icon: <LineChart className="h-5 w-5 text-primary" />, text: "Detailed Analytics" }
              ].map((item, i) => (
                <div key={i} className="flex items-center">
                  {item.icon}
                  <span className="ml-2 text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex-1 mt-12 lg:mt-0">
            <div className="relative">
              <div className="absolute -top-6 -left-6 w-full h-full bg-primary/5 rounded-2xl rotate-3"></div>
              <div className="glass-card rounded-2xl overflow-hidden shadow-xl relative z-10 rotate-0 hover:rotate-1 transition-all duration-500">
                <img 
                  src="https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                  alt="Online examination" 
                  className="w-full h-auto rounded-2xl hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-2xl"></div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 glass-card p-4 rounded-xl shadow-xl animate-float z-20">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Instant Results</p>
                    <p className="text-xs text-muted-foreground">Get feedback immediately</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute -top-2 -right-2 glass-card p-4 rounded-xl shadow-xl animate-float animation-delay-700 z-20">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Fair Assessment</p>
                    <p className="text-xs text-muted-foreground">Eliminate cheating</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 px-4 bg-white dark:bg-gray-800 relative">
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800"></div>
        
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-primary rounded-full px-4 py-1 mb-4">
              <Sparkles className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Key Features</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              A Complete Examination Solution
            </h2>
            <p className="text-muted-foreground text-lg">
              Our platform offers a comprehensive set of tools designed specifically for schools to manage their examination process efficiently and effectively.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Users className="h-8 w-8 text-blue-600" />,
                title: "Admin Portal",
                description: "Manage teachers, students, subjects, and exams with an intuitive admin dashboard.",
                features: ["User Management", "Class Assignment", "Exam Scheduling", "Performance Analytics"]
              },
              {
                icon: <GraduationCap className="h-8 w-8 text-indigo-600" />,
                title: "Teacher Portal",
                description: "Create and manage question banks, exams, and results with our teacher-friendly tools.",
                features: ["Question Bank", "Exam Creation", "Auto-grading", "Student Tracking"]
              },
              {
                icon: <BookOpen className="h-8 w-8 text-green-600" />,
                title: "Student Portal",
                description: "Take exams, view results, and track progress in a distraction-free environment.",
                features: ["Timed Exams", "Instant Results", "Progress Tracking", "Past Records"]
              }
            ].map((item, i) => (
              <Card key={i} className="bg-gradient-to-b from-white to-blue-50 dark:from-gray-800 dark:to-gray-750 hover:shadow-xl transition-all duration-300 border-none overflow-hidden group">
                <CardContent className="p-8">
                  <div className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/20 dark:to-blue-800/10 p-3 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <h3 className="text-2xl font-semibold mb-3 group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-muted-foreground mb-6">
                    {item.description}
                  </p>
                  <ul className="space-y-3">
                    {item.features.map((feature, j) => (
                      <li key={j} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Benefits Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-blue-50 to-white dark:from-gray-850 dark:to-gray-800">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full px-4 py-1">
                <Sparkles className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Benefits</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">
                Transform Your School's Examination Process
              </h2>
              <p className="text-lg text-muted-foreground">
                Our platform helps schools save time, reduce administrative burden, and improve the overall examination experience for teachers and students.
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                {[
                  { icon: <Clock className="h-8 w-8 text-primary" />, title: "Save Time", description: "Automate grading and result generation" },
                  { icon: <Shield className="h-8 w-8 text-primary" />, title: "Enhance Security", description: "Prevent cheating with secure testing" },
                  { icon: <LineChart className="h-8 w-8 text-primary" />, title: "Track Progress", description: "Monitor student performance over time" },
                  { icon: <Award className="h-8 w-8 text-primary" />, title: "Fair Assessment", description: "Standardized evaluation for all students" },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all">
                    <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg w-fit mb-3">
                      {item.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
              
              <ButtonLink
                to="/register"
                className="shadow-lg mt-6 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 transition-all duration-300"
              >
                Get Started Today
                <ArrowRight className="ml-2 h-4 w-4" />
              </ButtonLink>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-indigo-200 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-3xl rotate-3 blur-xl opacity-70"></div>
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80"
                  alt="Students using tablet" 
                  className="rounded-3xl shadow-2xl hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 px-4 mb-8">
        <div className="container mx-auto">
          <div className="rounded-3xl bg-gradient-to-r from-primary to-blue-600 shadow-xl overflow-hidden">
            <div className="p-8 md:p-12 lg:p-16 relative z-10">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Ready to Modernize Your School's Examination System?
                </h2>
                <p className="text-blue-100 text-lg mb-8">
                  Join thousands of schools already using our platform to create a better examination experience for teachers and students.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <ButtonLink
                    to="/register"
                    size="lg"
                    className="bg-white text-primary hover:bg-blue-50 shadow-lg"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </ButtonLink>
                  <ButtonLink
                    to="/contact"
                    variant="outline"
                    size="lg"
                    className="text-white border-white hover:bg-white/10"
                  >
                    Contact Sales
                  </ButtonLink>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 -right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 py-12 px-4 border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="font-bold text-lg">ExamPortal</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-4 md:mb-0">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Features</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Pricing</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">About</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Support</a>
            </div>
            
            <div className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} ExamPortal. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
