import React from 'react';
import { Link } from 'react-router-dom';

interface CardProps {
  to: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ to, title, description, icon }) => {
  return (
    <Link 
      to={to} 
      className="block group relative p-px rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-2xl transition-shadow duration-300"
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative h-full rounded-[11px] bg-white dark:bg-gray-800/95 p-8 transition-transform duration-300 group-hover:-translate-y-1">
        <div className="absolute top-0 left-0 h-full w-full rounded-[11px] bg-gradient-to-br from-white/20 to-white/0 dark:from-white/10 dark:to-white/0 opacity-50"></div>
        
        <div className="relative">
          <div className="flex items-center justify-center h-16 w-16 bg-slate-100 dark:bg-gray-700 rounded-full mb-6 ring-2 ring-slate-200 dark:ring-gray-600 group-hover:bg-white dark:group-hover:bg-gray-700/50 group-hover:ring-white/50 transition-all duration-300">
            <div className="text-sky-600 dark:text-sky-400 group-hover:text-sky-500 transition-colors duration-300">
              {icon}
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">{title}</h3>
          <p className="text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
    </Link>
  );
};

export default Card;