import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import config from './config';

const LoginPage = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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

  useEffect(() => {
    // Check if remember me was previously set
    const remembered = localStorage.getItem(config.auth.rememberKey);
    if (remembered === 'true') {
      setRememberMe(true);
    }
  }, []);

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
      
      // Set remember me preference
      if (rememberMe) {
        localStorage.setItem(config.auth.rememberKey, 'true');
      } else {
        localStorage.removeItem(config.auth.rememberKey);
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen">
      {/* Left Brand/Logo Section - Hidden on mobile */}
      <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600">
        <div className="h-full flex flex-col items-center justify-center p-0">
          <div className="max-w-md text-center">
            {/* Logo/Icon */}
            <div className="mb-8 inline-flex p-4 rounded-full bg-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-r from-pink-400 to-purple-600 shadow-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-4">PBX CRM</h1>
            <p className="text-xl text-white/90 mb-10">Platformă completă de management</p>
            
            {/* Feature cards */}
            <div className="grid grid-cols-1 gap-6 px-6 mb-10">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 text-left border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-lg">Gestiune Completă</h3>
                    <p className="text-white/80 text-sm">Management eficient al documentelor</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 text-left border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-lg">Statistici Avansate</h3>
                    <p className="text-white/80 text-sm">Analize și rapoarte detaliate</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-white/70 text-sm mt-auto font-light">
              © 2025 PBX CRM. Toate drepturile rezervate.
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Section - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <div className="w-full max-w-md px-6 py-12">
          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {/* Logo on mobile only */}
            <div className="lg:hidden flex flex-col items-center mb-8">
              <div className="bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-600 rounded-full p-4 shadow-lg mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">PBX CRM</h1>
              <p className="text-gray-600 text-sm">Platformă de management</p>
            </div>
            
            {/* Form Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Bine ați revenit!</h2>
              <p className="text-gray-600">Vă rugăm să vă autentificați pentru a continua</p>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 border-l-4 border-red-500">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="text"
                    placeholder="nume@email.com"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    className="py-3 pl-10 pr-4 block w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm shadow-sm"
                    required
                  />
                </div>
              </div>
              
              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Parolă
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="py-3 pl-10 pr-10 block w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm shadow-sm"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none"
                      aria-label={showPassword ? "Ascunde parola" : "Arată parola"}
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember"
                    name="remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                    Memorează logarea
                  </label>
                </div>
                <div className="text-sm">
                  <a href="#" className="font-medium text-purple-600 hover:text-purple-500 focus:outline-none focus:underline">
                    Ați uitat parola?
                  </a>
                </div>
              </div>
              
              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300 ${
                    isLoading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Se procesează...
                    </span>
                  ) : (
                    'Autentificare'
                  )}
                </button>
              </div>
              
              {/* Terms notice */}
              <div className="text-center mt-4">
                <p className="text-xs text-gray-500">
                  Accesând această platformă confirmați că sunteți autorizat să utilizați PBX CRM
                </p>
              </div>
            </form>
          </div>
          
          {/* Support section */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Aveți nevoie de asistență? <a href="#" className="font-semibold text-purple-600 hover:text-purple-500">Contactați administratorul</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
