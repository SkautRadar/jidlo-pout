import React, { useState } from 'react';
import { User } from '../types';
import { Button } from './Button';
import { supabase } from '../supabase';
import { useToast } from './ToastProvider';

interface CustomerProfileProps {
    user: User;
    onUpdate: (updatedUser: User) => void;
    onClose: () => void;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({ user, onUpdate, onClose }) => {
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        firstName: user.firstName,
        lastName: user.lastName,
        address: user.address,
        phone: user.phone || '',
        sectionNumber: user.sectionNumber,
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.rpc('update_customer_profile', {
                p_id: user.id,
                p_first_name: formData.firstName,
                p_last_name: formData.lastName,
                p_address: formData.address,
                p_phone: formData.phone,
                p_section_number: formData.sectionNumber
            });

            if (error) throw error;

            onUpdate({
                ...user,
                firstName: formData.firstName,
                lastName: formData.lastName,
                address: formData.address,
                phone: formData.phone,
                sectionNumber: formData.sectionNumber
            });
            showToast('Profil byl úspěšně aktualizován.', 'success');
            onClose();
        } catch (err: any) {
            console.error('Update error:', err);
            showToast('Chyba při aktualizaci: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl w-full max-w-md border-4 border-white shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-slate-900">Můj Profil 👤</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors bg-slate-100 p-2 rounded-full w-8 h-8 flex items-center justify-center font-bold">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Jméno</label>
                            <input required className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold focus:border-orange-500 outline-none" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Příjmení</label>
                            <input required className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold focus:border-orange-500 outline-none" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Adresa</label>
                        <input required className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold focus:border-orange-500 outline-none" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Telefon</label>
                            <input type="tel" className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold focus:border-orange-500 outline-none" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Číslo oddílu</label>
                            <input className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold focus:border-orange-500 outline-none" value={formData.sectionNumber} onChange={e => setFormData({ ...formData, sectionNumber: e.target.value })} />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button variant="secondary" onClick={onClose} type="button" className="flex-1">Zrušit</Button>
                        <Button variant="primary" type="submit" className="flex-[2] shadow-lg shadow-orange-200" disabled={loading}>
                            {loading ? 'Ukládám...' : 'Uložit změny'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
