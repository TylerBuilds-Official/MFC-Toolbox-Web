import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./layout/layout.tsx";
import Home from "./pages/home.tsx";
import Settings from "./pages/settings.tsx";


function App() {
  return (
    <BrowserRouter>
        <Layout>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/settings" element={<Settings />} />
            </Routes>
        </Layout>
    </BrowserRouter>
  );
}

export default App
