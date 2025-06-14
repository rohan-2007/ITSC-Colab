// src/components/RequireRole.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface RequireRoleProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

const RequireRole: React.FC<RequireRoleProps> = ({ allowedRoles, children }) => {
  const [ loading, setLoading ] = useState(true);
  const [ authorized, setAuthorized ] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkRole = async () => {
      try {
        const res = await fetch(`http://localhost:3001/me/`, {
          body: JSON.stringify({ returnData: true }),
          credentials: `include`,
          headers: { 'Content-Type': `application/json` },
          method: `POST`,
        });

        if (!res.ok) {
          throw new Error(`Unauthorized`);
        }

        const data = await res.json();
        if (typeof data.user.role === `string`) {
          if (data?.user && allowedRoles.includes(String(data.user.role))) {
            setAuthorized(true);
          } else {
            await navigate(data?.user ? `/home` : `/login`);
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(e);
        await navigate(`/login`);
      } finally {
        setLoading(false);
      }
    };

    void checkRole();
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
    const checkAuth = async () => {
      try {
        const res = await fetch(`http://localhost:3001/me/`, {
          body: JSON.stringify({ returnData: true }),
          credentials: `include`,
          headers: { 'Content-Type': `application/json` },
          method: `POST`,
        });

        if (!res.ok) {
          throw new Error(`Unauthorized`);
        }

        const data = await res.json();
        if (data?.user) {
          setAuthenticated(true);
        } else {
          await navigate(`/login`);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(e);
        await navigate(`/login`);
      } finally {
        setLoading(false);
      }
    };

    void checkAuth();
  }, [ navigate ]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return authenticated ? children : null;
};
