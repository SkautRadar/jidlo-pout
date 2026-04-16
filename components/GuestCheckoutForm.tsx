
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
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-3">Jméno *</label>
                    <input
                        required
                        className="w-full p-4 bg-slate-50 rounded-2xl text-slate-900 border-2 border-slate-200 focus:border-orange-500 focus:bg-white outline-none font-black transition-all"
                        placeholder="Jan"
                        value={userInfo.firstName || ''}
                        onChange={e => handleChange('firstName', e.target.value)}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-3">Příjmení *</label>
                    <input
                        required
                        className="w-full p-4 bg-slate-50 rounded-2xl text-slate-900 border-2 border-slate-200 focus:border-orange-500 focus:bg-white outline-none font-black transition-all"
                        placeholder="Novák"
                        value={userInfo.lastName || ''}
                        onChange={e => handleChange('lastName', e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                   <label className="text-xs font-bold text-slate-500 uppercase ml-3">Přezdívka (volitelné)</label>
                    <input
                        className="w-full p-4 bg-slate-50 rounded-2xl text-slate-900 border-2 border-slate-200 focus:border-orange-500 focus:bg-white outline-none font-black transition-all"
                        placeholder="Sokol"
                        value={userInfo.nickname || ''}
                        onChange={e => handleChange('nickname', e.target.value)}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-3">Věk *</label>
                    <input
                        required
                        type="number"
                        className="w-full p-4 bg-slate-50 rounded-2xl text-slate-900 text-center border-2 border-slate-200 focus:border-orange-500 focus:bg-white outline-none font-black transition-all"
                        placeholder="12"
                        value={userInfo.age || ''}
                        onChange={e => handleChange('age', e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-3">Email (volitelné - pro historii objednávek)</label>
                <input
                    type="email"
                    className="w-full p-4 bg-slate-50 rounded-2xl text-slate-900 border-2 border-slate-200 focus:border-orange-500 focus:bg-white outline-none font-black transition-all"
                    placeholder="vas@email.cz"
                    value={userInfo.email || ''}
                    onChange={e => handleChange('email', e.target.value)}
                />
            </div>
            
            <div className="p-4 bg-orange-50 border-2 border-dashed border-orange-200 rounded-2xl text-center">
                <p className="text-xs font-bold text-orange-700 italic">
                    "Na pouti si všichni tykáme a jídlo máme pro radost!"
                </p>
            </div>
        </div>
    );
};
