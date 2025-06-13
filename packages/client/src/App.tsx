// src/App.tsx

import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
// import NotFoundPage from './pages/PastEvaluations';
import Layout from './layouts/Layout';
import PastEvaluations from './pages/PastEvaluations';
import Login from './pages/login';
import Evaluations from './pages/evaluations';
import Profile from './pages/Profile';
import Contact from './pages/Contact';
import Supervisor from './pages/Supervisor';
import RequireRole, { RequireAuth } from './components/RequireRole';
import StudentSelect from './pages/StudentSelect';

const App: React.FC = () =>
  <Layout>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/home"
        element={
          <Home />
        }
      />
      <Route
        path="/past_evaluations"
        element={<RequireAuth>
          <PastEvaluations />
        </RequireAuth>}
      />
      <Route path="/login" element={<Login />} />
      <Route
        path="/profile"
        element={<Profile />}
      />
      <Route
        path="/evaluations"
        element={
          <RequireAuth>
            <Evaluations />
          </RequireAuth>
        }
      />
      <Route path="/contact" element={<Contact />} />
      <Route
        path="/supervisor"
        element={
          <RequireRole allowedRoles={[ `SUPERVISOR` ]}>
            <Supervisor />
          </RequireRole>
        }
      />
      <Route
        path="/student_select"
        element={
          <StudentSelect />
        }
      />
      {/* <Route path="*" element={<NotFoundPage />} /> */}
    </Routes>
  </Layout>;
export default App;
