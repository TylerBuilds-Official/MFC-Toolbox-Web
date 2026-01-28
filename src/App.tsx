import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./auth";
import { ProtectedRoute } from "./auth";
import { ToastProvider } from "./components/Toast";
import { ConfirmProvider } from "./components/ConfirmDialog";
import { ThemeProvider, NavbarProvider } from "./hooks";
import Layout from "./layout/layout.tsx";
import Home from "./pages/home.tsx";
import Chat from "./pages/chat.tsx";
import Settings from "./pages/settings.tsx";
import Admin from "./pages/admin.tsx";
import { DataPage } from "./components/data";

// Guide pages
import GuideIndex from "./pages/guide";
import {
    ModelsGuide,
    ChatGuide,
    ToolboxGuide,
    ConversationsGuide,
    ProjectsGuide,
    DataGuide,
    MemoriesGuide,
} from "./pages/guide/guide_pages";


function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ThemeProvider>
                    <NavbarProvider>
                        <ToastProvider>
                            <ConfirmProvider>
                                <Layout>
                                <Routes>
                                    <Route path="/" element={
                                        <ProtectedRoute>
                                            <Home />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/chat" element={
                                        <ProtectedRoute>
                                            <Chat />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/settings" element={
                                        <ProtectedRoute>
                                            <Settings />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/data" element={
                                        <ProtectedRoute>
                                            <DataPage />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/admin" element={
                                        <ProtectedRoute>
                                            <Admin />
                                        </ProtectedRoute>
                                    } />
                                    
                                    {/* Guide routes */}
                                    <Route path="/guide" element={
                                        <ProtectedRoute>
                                            <GuideIndex />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/guide/models" element={
                                        <ProtectedRoute>
                                            <ModelsGuide />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/guide/chat" element={
                                        <ProtectedRoute>
                                            <ChatGuide />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/guide/toolbox" element={
                                        <ProtectedRoute>
                                            <ToolboxGuide />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/guide/conversations" element={
                                        <ProtectedRoute>
                                            <ConversationsGuide />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/guide/projects" element={
                                        <ProtectedRoute>
                                            <ProjectsGuide />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/guide/data" element={
                                        <ProtectedRoute>
                                            <DataGuide />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/guide/memories" element={
                                        <ProtectedRoute>
                                            <MemoriesGuide />
                                        </ProtectedRoute>
                                    } />

                                    {/* Auth callback route - redirects to home after auth */}
                                    <Route path="/auth/callback" element={
                                        <ProtectedRoute>
                                            <Home />
                                        </ProtectedRoute>
                                    } />
                                </Routes>
                                </Layout>
                            </ConfirmProvider>
                        </ToastProvider>
                    </NavbarProvider>
                </ThemeProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App
