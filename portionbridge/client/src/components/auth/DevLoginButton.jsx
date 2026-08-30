import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Code, Terminal } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Always show in development, can be controlled via env var
const isDevelopment = import.meta.env.DEV || import.meta.env.VITE_DEV_MODE === 'true';

export function DevLoginButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Comment out the check for now to test
  // if (!isDevelopment) return null;
  
  if (!isDevelopment) {
    console.log('DevLoginButton: Not in development mode, hiding button');
    return null;
  }

  const handleDevLogin = async (role) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/dev-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      const data = await response.json();

      if (data.success) {
        // Store the dev bypass token and user info
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        // Navigate based on role
        switch (role) {
          case 'donor': navigate('/donor/dashboard'); break;
          case 'volunteer': navigate('/volunteer/dashboard'); break;
          case 'admin': navigate('/admin/dashboard'); break;
          default: navigate('/');
        }
      } else {
        console.error('Dev login failed:', data.message);
      }
    } catch (error) {
      console.error('Dev login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-gray-900 text-white rounded-lg shadow-xl p-4 mb-2 min-w-[200px]">
          <div className="flex items-center gap-2 mb-3">
            <Terminal size={16} />
            <span className="text-sm font-semibold">Dev Login</span>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleDevLogin('donor')}
              disabled={loading}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-xs font-medium transition disabled:opacity-50"
            >
              Login as Donor
            </button>
            <button
              onClick={() => handleDevLogin('volunteer')}
              disabled={loading}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition disabled:opacity-50"
            >
              Login as Volunteer
            </button>
            <button
              onClick={() => handleDevLogin('admin')}
              disabled={loading}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-xs font-medium transition disabled:opacity-50"
            >
              Login as Admin
            </button>
          </div>
        </div>
      ) : null}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-900 hover:bg-gray-800 text-white p-3 rounded-full shadow-lg transition"
        title="Development Login"
      >
        <Code size={20} />
      </button>
    </div>
  );
}
