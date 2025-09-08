import React from 'react';
import { createPortal } from 'react-dom';

const Drawer = ({ isOpen, onClose, children, title = "Details" }) => {
  if (!isOpen) return null;

  const drawerContent = (
    <div 
      className="fixed inset-0"
      style={{ 
        zIndex: 9999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      />
      
      {/* Drawer */}
      <div 
        className="absolute right-0 top-0 h-full shadow-xl transform transition-transform duration-300 ease-in-out"
        style={{ 
          backgroundColor: 'white',
          width: '28rem',
          maxWidth: '100vw',
          height: '100vh',
          position: 'absolute',
          top: 0,
          right: 0,
          zIndex: 10000,
          transform: 'translateX(0)',
          animation: 'slideInFromRight 0.3s ease-out'
        }}
      >
        <div className="flex flex-col h-full" style={{ backgroundColor: 'white', height: '100%' }}>
          {/* Header */}
          <div 
            className="flex items-center justify-between p-4 border-b border-gray-200"
            style={{ backgroundColor: 'white' }}
          >
            <h2 className="text-lg font-semibold" style={{ color: '#111827' }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div 
            className="flex-1 overflow-y-auto p-4"
            style={{ backgroundColor: 'white', height: 'calc(100% - 80px)' }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  // Render the drawer as a portal to the document body
  return createPortal(drawerContent, document.body);
};

export default Drawer;
