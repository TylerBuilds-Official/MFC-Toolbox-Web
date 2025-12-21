import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./auth";
import { ProtectedRoute } from "./auth";
import Layout from "./layout/layout.tsx";
import Home from "./pages/home.tsx";
import Settings from "./pages/settings.tsx";


function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Layout>
                    <Routes>
                        <Route path="/" element={
                            <ProtectedRoute>
                                <Home />
                            </ProtectedRoute>
                        } />
                        <Route path="/settings" element={
                            <ProtectedRoute>
                                <Settings />
                            </ProtectedRoute>
                        } />
                        {/* Auth callback route - just redirects to home after auth */}
                        <Route path="/auth/callback" element={
                            <ProtectedRoute>
                                <Home />
                            </ProtectedRoute>
                        } />
                    </Routes>
                </Layout>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App
