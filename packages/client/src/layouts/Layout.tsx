// src/layouts/Layout.tsx
import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './Layout.css';

interface Props {
  children: React.ReactNode;
}

const Layout: React.FC<Props> = ({ children }) =>
  <div>
    <header>
      <Navbar />
    </header>
    <main className="main-content-area">{children}</main>
    <footer>
      <Footer />
    </footer>
  </div>;

export default Layout;
