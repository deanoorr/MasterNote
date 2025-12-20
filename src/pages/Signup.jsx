
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { signUp } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMsg('');
        setLoading(true);
        const { data, error } = await signUp({ email, password });
        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setMsg('Signup successful! Please check your email for confirmation.');
            setLoading(false);
            // Optionally navigate to login or wait
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black text-zinc-900 dark:text-white relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/5 dark:bg-purple-500/10 blur-[100px]" />
            </div>

            <div className="w-full max-w-md p-8 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 shadow-xl relative z-10">
                <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">Create Account</h2>
                {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">{error}</div>}
                {msg && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg text-sm">{msg}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 ml-1 text-zinc-600 dark:text-zinc-400">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 rounded-xl bg-white/50 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 ml-1 text-zinc-600 dark:text-zinc-400">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 rounded-xl bg-white/50 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/20 transition-all transform active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? 'Signing up...' : 'Sign Up'}
                    </button>
                </form>
                <div className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
                    Already have an account? <Link to="/login" className="text-indigo-500 hover:text-indigo-400 font-medium">Log In</Link>
                </div>
            </div>
        </div>
    );
}
