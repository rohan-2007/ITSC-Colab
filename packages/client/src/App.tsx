// src/App.tsx

import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import NotFoundPage from './pages/Contact';
import Layout from './layouts/Layout';
import Contact from './pages/Contact';
import Login from './pages/login';
import Evaluations from './pages/evaluations';

const App: React.FC = () =>
  <Layout>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/home" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/evaluations" element={<Evaluations />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </Layout>;
export default App;
