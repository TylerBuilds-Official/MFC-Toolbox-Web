import {type PropsWithChildren} from 'react';
import Navbar from './navbar';
import Footer from './footer';
import '../styles/layout.css';

function Layout({ children }: PropsWithChildren) {
    return (
        <div className="app-root">
            <Navbar />
            <main className="container" role="main">
                {children}
            </main>
            <Footer />
        </div>
    );
}

export default Layout;