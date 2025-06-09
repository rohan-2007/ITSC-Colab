// src/layouts/Layout.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

type Props = {
  children: React.ReactNode;
};

const Layout: React.FC<Props> = ({ children }) => {
  return (
    <div>
      <header style={{display:'block'}}>
        <Navbar />
      </header>
      <main style={{display:'block',width:"100%", height:"fit-content"}}>{children}</main>
      <footer style={{display:'block'}}>
        <Footer />
      </footer>
    </div>
  );
};

export default Layout;