/* eslint-disable @typescript-eslint/no-unused-vars */
// src/layouts/Layout.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface Props {
  children: React.ReactNode;
}

const Layout: React.FC<Props> = ({ children }) =>
  <div>
    <header style={{ display: `block` }}>
      <Navbar />
    </header>
    <main style={{ display: `block`, height: `100%`, width: `100%` }}>{children}</main>
    <footer style={{ display: `block` }}>
      <Footer />
    </footer>
  </div>;
export default Layout;
