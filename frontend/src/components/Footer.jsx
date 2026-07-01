import React from 'react';
import { Zap } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-100 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <div className="bg-primary-500 p-1.5 rounded-lg text-white">
              <Zap className="h-4 w-4 fill-current" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              ChargeMate AI
            </span>
          </div>
          <p className="text-sm text-slate-400">
            &copy; {new Date().getFullYear()} ChargeMate AI. Developed for Smart EV Mobility.
          </p>
          <div className="flex space-x-6 text-sm text-slate-400">
            <a href="#features" className="hover:text-primary-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-primary-600 transition-colors">How It Works</a>
            <a href="#contact" className="hover:text-primary-600 transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
