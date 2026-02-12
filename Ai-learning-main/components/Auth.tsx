import React, { useState } from 'react';
import { loginUser, registerUser } from '../services/storage';

interface AuthProps {
  onLoginSuccess: () => void; // No longer passing User immediately, App listens to state
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await loginUser(email, password);
      } else {
        if (!name.trim()) {
            throw new Error("Name is required");
        }
        await registerUser(name, email, password);
      }
      onLoginSuccess();
    } catch (err: any) {
        console.error(err);
        let msg = "Authentication failed";
        if (err.code === 'auth/invalid-credential') msg = "Invalid email or password";
        else if (err.code === 'auth/email-already-in-use') msg = "Email already in use";
        else if (err.code === 'auth/weak-password') msg = "Password should be at least 6 characters";
        else if (err.message) msg = err.message;
        setError(msg);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 animate-fade-in">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
                Skill<span className="text-primary">Boost</span> AI
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
                {isLogin ? 'Welcome back! Login to continue.' : 'Create an account to start learning.'}
            </p>
        </div>

        {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                    <input 
                        type="text" 
                        required 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                        placeholder="John Doe"
                    />
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder="you@example.com"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder="••••••••"
                />
            </div>

            <button 
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-70 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-primary/20 flex items-center justify-center"
            >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
        </form>

        <div className="mt-6 text-center text-sm">
            <span className="text-slate-500 dark:text-slate-400">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-primary font-bold hover:underline"
            >
                {isLogin ? 'Sign Up' : 'Login'}
            </button>
        </div>
      </div>
    </div>
  );
};