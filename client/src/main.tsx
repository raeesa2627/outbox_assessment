import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1F2937',
            color: '#F9FAFB',
            fontSize: '13px',
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#00A859',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
      <App />
    </AuthProvider>
  </React.StrictMode>
);
