
import React, { useState } from 'react';
import { Button } from './Button';

interface RegistrationFormProps {
    onSubmit: (data: RegistrationData) => void;
    onCancel: () => void;
    onSwitchToLogin: () => void;
}

export interface RegistrationData {
    firstName: string;
    lastName: string;
    nickname: string;
    age: string;
    email: string;
    password: string;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSubmit, onCancel, onSwitchToLogin }) => {
    const [formData, setFormData] = useState<RegistrationData>({
        firstName: '',
        lastName: '',
        nickname: '',
        age: '',
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);

    const [passwordStrength, setPasswordStrength] = useState<{ valid: boolean; message: string; color: string }>({
        valid: false,
        message: '',
        color: ''
    });

    const validatePassword = (pwd: string): { valid: boolean; message: string; color: string } => {
        if (pwd.length === 0) return { valid: false, message: '', color: '' };
        if (pwd.length < 8) return { valid: false, message: '❌ Minimálně 8 znaků', color: 'text-red-600' };
        return { valid: true, message: '✅ Heslo je v pořádku', color: 'text-emerald-600' };
    };

    const handlePasswordChange = (pwd: string) => {
        setFormData({ ...formData, password: pwd });
        setPasswordStrength(validatePassword(pwd));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate password
        const pwdValidation = validatePassword(formData.password);
        if (!pwdValidation.valid) {
            alert(pwdValidation.message);
            return;
        }

        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl">
                <h2 className="text-3xl font-black mb-6 text-slate-900 border-b-4 border-orange-500 pb-2 inline-block">Registrace</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-2">Jméno *</label>
                            <input
                                required
                                className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold focus:border-orange-500 outline-none transition-all"
                                placeholder="Jan"
                                value={formData.firstName}
                                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-2">Příjmení *</label>
                            <input
                                required
                                className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold focus:border-orange-500 outline-none transition-all"
                                placeholder="Novák"
                                value={formData.lastName}
                                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-2">Přezdívka</label>
                            <input
                                className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold focus:border-orange-500 outline-none transition-all"
                                placeholder="Sokol"
                                value={formData.nickname}
                                onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-2">Věk *</label>
                            <input
                                required
                                type="number"
                                className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold focus:border-orange-500 outline-none transition-all text-center"
                                placeholder="15"
                                value={formData.age}
                                onChange={e => setFormData({ ...formData, age: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-2">Email *</label>
                        <input
                            required
                            type="email"
                            className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold focus:border-orange-500 outline-none transition-all"
                            placeholder="email@seznam.cz"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1 relative">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-2">Heslo *</label>
                        <input
                            required
                            type={showPassword ? "text" : "password"}
                            minLength={8}
                            className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold focus:border-orange-500 outline-none transition-all pr-12"
                            placeholder="******"
                            value={formData.password}
                            onChange={e => handlePasswordChange(e.target.value)}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 bottom-4 text-slate-400 hover:text-orange-500 transition-colors">
                            {showPassword ? "👁️‍🗨️" : "👁️"}
                        </button>
                    </div>
                        {passwordStrength.message && (
                            <p className={`text-xs font-bold mt-1 px-3 ${passwordStrength.color}`}>
                                {passwordStrength.message}
                            </p>
                        )}

                    <div className="flex gap-3 mt-6 pt-6 border-t-2">
                        <Button variant="secondary" onClick={onCancel} type="button" className="flex-1 rounded-2xl font-black">
                            ZRUŠIT
                        </Button>
                        <Button variant="primary" type="submit" className="flex-1 rounded-2xl font-black">
                            REGISTROVAT
                        </Button>
                    </div>

                    <p className="text-center text-xs mt-4">
                        Již máte účet?{' '}
                        <button
                            type="button"
                            onClick={onSwitchToLogin}
                            className="font-bold text-orange-600 underline"
                        >
                            Přihlásit se
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
};
