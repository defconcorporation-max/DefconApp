import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || "/dashboard";

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await login(username, password);
        if (result.success) {
            navigate(from, { replace: true });
        } else {
            setError(result.error || 'Invalid credentials');
            setPassword('');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-950 text-slate-900 dark:text-white transition-colors duration-300">
            <div className="w-full max-w-md p-8 bg-white dark:bg-dark-900 rounded-2xl shadow-xl border border-slate-200 dark:border-white/5">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center text-primary-500 mb-4">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-2xl font-bold">Restricted Access</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Please enter your password to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <input
                            type="text"
                            placeholder="Username"
                            className="w-full px-5 py-4 bg-gray-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 focus:ring-primary-500 rounded-xl outline-none focus:ring-2 transition-all dark:text-white mb-4"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoFocus
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            className={`w-full px-5 py-4 bg-gray-50 dark:bg-dark-800 border ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-dark-700 focus:ring-primary-500'} rounded-xl outline-none focus:ring-2 transition-all dark:text-white`}
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(false); }}
                        />
                        {error && (
                            <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                                <AlertCircle size={14} />
                                <span>Invalid password</span>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-primary-500/25"
                    >
                        Access Dashboard
                    </button>

                    <div className="text-center text-xs text-slate-400">
                        <p>Authorized personnel only</p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
