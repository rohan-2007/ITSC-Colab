// src/App.tsx

import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import NotFoundPage from './pages/PastEvaluations';
import Layout from './layouts/Layout';
import PastEvaluations from './pages/PastEvaluations';
import Login from './pages/login';
import Evaluations from './pages/evaluations';

const App: React.FC = () =>
  <Layout>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/home" element={<Home />} />
      <Route path="/contact" element={<PastEvaluations />} />
      <Route path="/login" element={<Login />} />
      <Route path="/evaluations" element={<Evaluations />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </Layout>;
export default App;
