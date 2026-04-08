import React, { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Hide navigation on login/register pages
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  const navItems = [
    { path: '/', icon: '🏠', label: '홈' },
    { path: '/collection', icon: '📚', label: '도감' },
    { path: '/profile', icon: '👤', label: '프로필' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pb-16">{children}</main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-around">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 flex flex-col items-center py-3 px-2 transition ${
                location.pathname === item.path
                  ? 'text-green-600'
                  : 'text-gray-500 hover:text-green-500'
              }`}
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
