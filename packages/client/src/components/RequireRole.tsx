import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifyAfterReload } from './Notification';
interface RequireRoleProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

const RequireRole: React.FC<RequireRoleProps> = ({ allowedRoles, children }) => {
  const [ loading, setLoading ] = useState(true);
  const [ authorized, setAuthorized ] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem(`userMeta`);

    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user?.role && allowedRoles.includes(String(user.role))) {
          setAuthorized(true);
        } else {
          void navigate(`/home`); // User logged in, but role not allowed
        }
      } catch {
        notifyAfterReload(`Invalid user data in localStorage`);
        void navigate(`/login`);
      }
    } else {
      void navigate(`/login`); // Not logged in
    }

    setLoading(false);
  }, [ allowedRoles, navigate ]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return authorized ? children : null;
};

export default RequireRole;

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ loading, setLoading ] = useState(true);
  const [ authenticated, setAuthenticated ] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem(`userMeta`);

    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user?.role) {
          setAuthenticated(true);
        } else {
          void navigate(`/login`);
        }
      } catch {
        notifyAfterReload(`Invalid user data in localStorage`);
        void navigate(`/login`);
      }
    } else {
      void navigate(`/login`);
    }

    setLoading(false);
  }, [ navigate ]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return authenticated ? children : null;
};
