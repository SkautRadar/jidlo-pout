import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Button } from './Button';

interface AdminLoginProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onCancel }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        if (isRegistering) {
            // Sign Up
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) {
                setError('Chyba registrace: ' + error.message);
                setLoading(false);
            } else {
                setLoading(false);
                setSuccessMsg('Registrace byla úspěšná! Nyní se můžete přihlásit.');
                setIsRegistering(false); // Switch to login
            }
        } else {
            // Sign In
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError('Nesprávný email nebo heslo.');
                console.error('Login error:', error.message);
                setLoading(false);
            } else {
                setLoading(false);
                onSuccess();
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full border-4 border-white">
                <div className="w-16 h-16 bg-slate-900 rounded-2xl mx-auto mb-6 flex items-center justify-center text-3xl shadow-lg">🔐</div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 text-center uppercase">
                    {isRegistering ? 'Admin Registrace' : 'Admin Login'}
                </h2>
                <p className="text-slate-500 mb-8 font-medium text-center text-sm">
                    {isRegistering ? 'Vytvořte si účet pro správu.' : 'Pro správu systému se přihlaste.'}
                </p>

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 bg-slate-100 rounded-xl border-2 border-slate-200 focus:border-orange-500 outline-none transition-colors font-bold"
                            placeholder="admin@example.com"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="relative">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Heslo</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 bg-slate-100 rounded-xl border-2 border-slate-200 focus:border-orange-500 outline-none transition-colors font-bold pr-12"
                            placeholder="••••••••"
                            required
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 bottom-3 text-slate-400 hover:text-orange-500 transition-colors">
                            {showPassword ? "👁️‍🗨️" : "👁️"}
                        </button>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2">
                            ⚠️ {error}
                        </div>
                    )}

                    {successMsg && (
                        <div className="p-3 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-xl border border-emerald-100 flex items-center gap-2">
                            ✅ {successMsg}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1 py-3 font-black text-xs">ZRUŠIT</Button>
                        <Button type="submit" variant="primary" className="flex-[2] py-3 font-black text-xs shadow-lg shadow-orange-200" disabled={loading}>
                            {loading ? 'OVĚŘUJI...' : 'PŘIHLÁSIT'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
