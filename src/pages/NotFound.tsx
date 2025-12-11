import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Ghost, Search, Map } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f2f2f2] dark:bg-gray-900 p-4 overflow-hidden relative">
      
      {/* Background Decor - Floating background icons */}
      <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
        <Map className="absolute top-10 left-10 text-quizizz-purple animate-bounce" size={48} style={{ animationDuration: '3s' }} />
        <Search className="absolute bottom-20 right-20 text-quizizz-blue animate-bounce" size={64} style={{ animationDuration: '4s' }} />
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-quizizz-yellow rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-quizizz-red rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-10 shadow-2xl text-center max-w-lg w-full border-b-[8px] border-quizizz-purple relative z-10 animate-in fade-in zoom-in duration-500">
        
        {/* Fun Illustration Area */}
        <div className="relative h-40 mb-6 flex justify-center items-center">
            {/* Flying Ghost */}
            <div className="relative animate-[bounce_3s_infinite]">
                <div className="text-quizizz-purple relative z-10">
                    <Ghost size={120} strokeWidth={1.5} />
                </div>
                {/* Ghost Shadow */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-black/10 rounded-[100%] blur-sm animate-[pulse_3s_infinite]"></div>
                
                {/* Floating Question Marks */}
                <span className="absolute -top-2 -right-4 text-4xl font-black text-quizizz-yellow animate-bounce" style={{ animationDelay: '0.1s' }}>?</span>
                <span className="absolute top-8 -left-6 text-3xl font-black text-quizizz-blue animate-bounce" style={{ animationDelay: '0.5s' }}>?</span>
            </div>
        </div>

        {/* Text Content */}
        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-quizizz-purple to-quizizz-blue mb-2">
          404
        </h1>
        <h2 className="text-xl md:text-3xl font-bold text-gray-700 dark:text-gray-200 mb-4">
          Oops! Are you lost?
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium text-md">
          This page has vanished or this ghost has hidden it away. Let's get you back to safety!
        </p>

        {/* Action Button */}
        <button 
          onClick={() => navigate('/')}
          className="group w-full py-3 bg-quizizz-purple text-white rounded-xl font-bold text-md shadow-[0_6px_0_#6c5ce7] active:shadow-none active:translate-y-[6px] transition-all flex justify-center items-center gap-3 hover:brightness-110"
        >
          <Home size={24} />
          Back to Home
        </button>
      </div>
      
      {/* Fun Footer Text */}
      <p className="mt-6 text-gray-400 text-sm font-bold opacity-60">
        Error Code: 404_GHOST_NOT_FOUND
      </p>
    </div>
  );
};

export default NotFound;