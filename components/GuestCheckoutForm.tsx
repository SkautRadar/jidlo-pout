
import React from 'react';
import { UserInfo } from '../types';

interface GuestCheckoutFormProps {
    userInfo: UserInfo;
    onUserInfoChange: (userInfo: UserInfo) => void;
}

export const GuestCheckoutForm: React.FC<GuestCheckoutFormProps> = ({ userInfo, onUserInfoChange }) => {
    const handleChange = (field: keyof UserInfo, value: string) => {
        onUserInfoChange({ ...userInfo, [field]: value });
    };

    return (
        <div className="space-y-5 rounded-[1.75rem] bg-white/85 p-4 sm:bg-transparent sm:p-0">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="ml-3 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Jméno *</label>
                    <input
                        required
                        autoComplete="given-name"
                        className="w-full min-h-[56px] rounded-[1.4rem] border-2 border-slate-200 bg-slate-50 px-4 py-4 font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100"
                        placeholder="Jan"
                        value={userInfo.firstName || ''}
                        onChange={e => handleChange('firstName', e.target.value)}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="ml-3 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Příjmení *</label>
                    <input
                        required
                        autoComplete="family-name"
                        className="w-full min-h-[56px] rounded-[1.4rem] border-2 border-slate-200 bg-slate-50 px-4 py-4 font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100"
                        placeholder="Novák"
                        value={userInfo.lastName || ''}
                        onChange={e => handleChange('lastName', e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                   <label className="ml-3 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Přezdívka (volitelné)</label>
                    <input
                        autoComplete="nickname"
                        className="w-full min-h-[56px] rounded-[1.4rem] border-2 border-slate-200 bg-slate-50 px-4 py-4 font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100"
                        placeholder="Sokol"
                        value={userInfo.nickname || ''}
                        onChange={e => handleChange('nickname', e.target.value)}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="ml-3 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Věk *</label>
                    <input
                        required
                        type="number"
                        inputMode="numeric"
                        min="1"
                        max="120"
                        className="w-full min-h-[56px] rounded-[1.4rem] border-2 border-slate-200 bg-slate-50 px-4 py-4 text-center font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100"
                        placeholder="12"
                        value={userInfo.age || ''}
                        onChange={e => handleChange('age', e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="ml-3 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Email (volitelné - pro historii objednávek)</label>
                <input
                    type="email"
                    autoComplete="email"
                    className="w-full min-h-[56px] rounded-[1.4rem] border-2 border-slate-200 bg-slate-50 px-4 py-4 font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100"
                    placeholder="vas@email.cz"
                    value={userInfo.email || ''}
                    onChange={e => handleChange('email', e.target.value)}
                />
            </div>
            
            <div className="rounded-[1.4rem] border-2 border-dashed border-orange-200 bg-orange-50 px-4 py-4 text-center">
                <p className="text-xs font-bold italic text-orange-700">
                    "Jídlo je pro všechny skauty zdarma, při objednávání myslete na ostatní!"
                </p>
            </div>
        </div>
    );
};
