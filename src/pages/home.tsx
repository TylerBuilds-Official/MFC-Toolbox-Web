import { useState } from 'react';
import '../styles/home.css';
import '../styles/auth.css';
import ChatWindow from "../components/chatWindow.tsx";
import ToolboxSidebar from "../components/ToolboxSidebar.tsx";
import WrenchIcon from "../assets/svg/toolbox/buttonWrench.tsx";

const Home = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

    const handleToolSelect = (prompt: string) => {
        setPendingPrompt(prompt);
    };

    const handlePromptConsumed = () => {
        setPendingPrompt(null);
    };

    return (
        <div className="home-page">
            <ToolboxSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onToolSelect={handleToolSelect}
            />

            <div className="header-container">
                <button 
                    className="toolbox-sidebar-toggle"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Open Toolbox"
                    title="Open Toolbox">

                    <WrenchIcon />
                </button>

                <div className="welcome-header">
                    <h1>Welcome to the MFC Toolbox</h1>
                    <p>Your AI-powered assistant for fabrication workflows, document processing, and internal operations.</p>
                </div>
            </div>
            <div className="chat-section">
                <ChatWindow 
                    externalPrompt={pendingPrompt}
                    onPromptConsumed={handlePromptConsumed}
                />
            </div>
        </div>
    );
};

export default Home;
