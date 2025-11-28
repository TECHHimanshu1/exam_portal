
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-morphism shadow-soft py-4 px-6">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-lg">E</span>
          </div>
          <span className="font-bold text-lg text-foreground">ExamPortal</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-1">
          <Link 
            to="/" 
            className="px-4 py-2 rounded-md text-sm font-medium transition-all hover:bg-secondary"
          >
            Home
          </Link>
          {user ? (
            <>
              <Link 
                to={`/${user.role}/dashboard`}
                className="px-4 py-2 rounded-md text-sm font-medium transition-all hover:bg-secondary"
              >
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link 
                to="/about"
                className="px-4 py-2 rounded-md text-sm font-medium transition-all hover:bg-secondary"
              >
                About
              </Link>
              <Link 
                to="/features"
                className="px-4 py-2 rounded-md text-sm font-medium transition-all hover:bg-secondary"
              >
                Features
              </Link>
            </>
          )}
        </nav>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-2">
              <div className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                user.role === 'admin' ? "bg-purple-100 text-purple-700" :
                user.role === 'teacher' ? "bg-blue-100 text-blue-700" : 
                "bg-green-100 text-green-700"
              )}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span>Logout</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <ButtonLink
                to="/login"
                variant="ghost"
                size="sm"
              >
                Login
              </ButtonLink>
              <ButtonLink
                to="/register"
                variant="default"
                size="sm"
              >
                Register
              </ButtonLink>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
