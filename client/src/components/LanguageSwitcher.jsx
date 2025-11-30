import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className="flex items-center gap-2 bg-white/5 rounded-full p-1 border border-white/10">
            <Globe size={14} className="text-slate-400 ml-2" />
            <div className="flex">
                <button
                    onClick={() => changeLanguage('fr')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${i18n.language === 'fr' ? 'bg-primary-500 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    FR
                </button>
                <button
                    onClick={() => changeLanguage('en')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${i18n.language === 'en' ? 'bg-primary-500 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    EN
                </button>
                <button
                    onClick={() => changeLanguage('es')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${i18n.language === 'es' ? 'bg-primary-500 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    ES
                </button>
            </div>
        </div>
    );
};

export default LanguageSwitcher;
