import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Logoimg from './assets/profile.jpg';
import { useAuth } from './contexts/AuthContext';
import config from './config';

const LoginPage = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login: authLogin, isAuthenticated } = useAuth();
  
  // If user is already authenticated, redirect to home or the page they were trying to access
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Reset any previous errors
    setIsLoading(true);

    try {
      // Use the authLogin method from our context
      const result = await authLogin({
        email: login,
        password
      });
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // Redirect will happen automatically via the useEffect watching isAuthenticated
    } catch (err) {
      // Handle different error scenarios based on error message
      if (err.message.includes('Unauthorized') || err.message.includes('401')) {
        setError('Credențiale incorecte. Verificați email-ul și parola.');
      } else if (err.message.includes('Permission') || err.message.includes('403')) {
        setError('Nu aveți permisiuni pentru a accesa această resursă.');
      } else if (err.message.includes('Validation') || err.message.includes('422')) {
        setError('Datele introduse nu sunt valide.');
      } else {
        setError('A apărut o eroare. Încercați din nou mai târziu.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="flex flex-col items-center justify-center mb-8">
        <img
          src={Logoimg}
          alt="Avatar"
          className="rounded-full w-24 h-24 mb-4"
        />
        <h1 className="text-3xl font-semibold mb-2">Logare</h1>
        <p className="text-gray-500">
          Bine ați venit, vă rugăm să vă conectați la contul dvs.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="mb-4">
          <label className="block text-gray-700">Login</label>
          <input
            type="text"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Parola</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <input 
              name='remember' 
              id='remember' 
              type="checkbox" 
              className="mr-2" 
              onChange={(e) => {
                if (e.target.checked) {
                  localStorage.setItem(config.auth.rememberKey, 'true');
                } else {
                  localStorage.removeItem(config.auth.rememberKey);
                }
              }} 
            />
            <label htmlFor='remember' className="text-gray-600 select-none">Memorează logarea</label>
          </div>
          <div>
            <a href="#" className="text-blue-500">Ați uitat parola?</a>
          </div>
        </div>

        <button
          type="submit"
          className={`w-full bg-[#5046E5] text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300 ${
            isLoading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
          disabled={isLoading}
        >
          {isLoading ? 'Se procesează...' : 'Intră în cont'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
