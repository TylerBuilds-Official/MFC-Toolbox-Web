import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PublicClientApplication } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import { msalConfig } from './auth/authConfig'
import { initializeTheme } from './hooks'
import './styles/globals.css'
import App from './App.tsx'

// Initialize theme before React renders to prevent flash
initializeTheme();

const msalInstance = new PublicClientApplication(msalConfig);

// Handle redirect promise on page load
msalInstance.initialize().then(() => {
    msalInstance.handleRedirectPromise().catch(console.error);
    
    createRoot(document.getElementById('root')!).render(
        <StrictMode>
            <MsalProvider instance={msalInstance}>
                <App />
            </MsalProvider>
        </StrictMode>,
    );
});
