/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { FormEvent, useState } from 'react';
import '../CSS/login.css';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
const fetchUrl = `http://localhost:${3001}`;
import '../components/buttonAndCard.css';
import '../components/Modals.css';

const Login: React.FC = () => {
  const [ message, setMessage ] = useState(``);
  const [ isLoading, setIsLoading ] = useState(false);
  const [ isOpenSignup, setIsOpenSignup ] = useState(false);
  const [ isOpenLogin, setIsOpenLogin ] = useState(false);
  const [ profileText, setProfileText ] = useState(``);

  const navigate = useNavigate();
  const PORT = 3001;

  useEffect(() => {
    localStorage.clear();
    const checkSession = async () => {
      const response = await fetch(`${fetchUrl}/me/`, {
        body: JSON.stringify({ returnData: true }),
        credentials: `include`,
        headers: { 'Content-Type': `application/json` },
        method: `POST`,
      });

      const jsonData = await response.json();

      if (jsonData.sessionActive) {
        await navigate(`/home`);
      }
    };

    void checkSession();
  }, [ navigate ]);

  const [ formData, setFormData ] = useState({
    email: ``,
    isSupervisor: false,
    name: ``,
    password: ``,
    role: ``,
    supervisorEmail: ``,
    teamName: ``,
  });

  async function handleSignUp() {
    if (!validateSignUp()) {
      return;
    }
    setIsLoading(true);
    setMessage(`Sending signup request...`);

    if (formData.isSupervisor) {
      formData.role = `SUPERVISOR`;
    } else {
      formData.role = `STUDENT`;
    }

    try {
      const response = await fetch(`${fetchUrl}/signup/`, {
        body: JSON.stringify(formData),
        credentials: `include`,
        headers: { 'Content-Type': `application/json` },
        method: `POST`,

      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(responseText || `Signup failed`);
      }

      setMessage(`✅ Signup success: ${responseText}`);
    } catch (error) {
      if (error instanceof Error) {
        setMessage(`❌ Signup error: ${error.message}`);
      } else {
        setMessage(`❌ An unknown error occurred.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    const isValid = validateLogin();
    if (isValid) {
      setIsLoading(true);
      setMessage(`Sending login request...`);

      const loginData = {
        email: formData.email,
        password: formData.password,
      };

      try {
        const response = await fetch(`http://localhost:3001/login/`, {
          body: JSON.stringify(loginData),
          credentials: `include`,
          headers: { 'Content-Type': `application/json` },
          method: `POST`,
        });

        const responseJson = await response.json();
        // console.log(`responseJson`, responseJson);

        if (!response.ok) {
          setMessage(`Invalid credentials`);
          return;
        }
        void navigate(`/home`);
        window.location.reload();
        setProfileText(`Hi, ${responseJson.user.name}`);
      } catch (error) {
        if (error instanceof Error) {
          setMessage(`Login error: ${error.message}`);
        } else {
          setMessage(`An unknown error occurred.`);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const togglePopupSignup = () => {
    setMessage(``);
    setSignupErrors({
      email: ``,
      name: ``,
      password: ``,
      supervisorEmail: ``,
      teamName: ``,
    });
    setIsOpenSignup(!isOpenSignup);
    if (!isOpenSignup) {
      document.getElementById(`signupMainBtn`)!.style.display = `none`;
      document.getElementById(`loginMainBtn`)!.style.display = `none`;
    } else {
      document.getElementById(`signupMainBtn`)!.style.display = `block`;
      document.getElementById(`loginMainBtn`)!.style.display = `block`;
    }
  };

  const togglePopupLogin = () => {
    setMessage(``);
    setLoginErrors({
      email: ``,
      password: ``,
    });
    setIsOpenLogin(!isOpenLogin);
    if (!isOpenLogin) {
      document.getElementById(`loginMainBtn`)!.style.display = `none`;
      document.getElementById(`signupMainBtn`)!.style.display = `none`;
    } else {
      document.getElementById(`loginMainBtn`)!.style.display = `block`;
      document.getElementById(`signupMainBtn`)!.style.display = `block`;
    }
    // setMessage(``);
  };

  const [ signupErrors, setSignupErrors ] = useState({
    email: ``,
    name: ``,
    password: ``,
    supervisorEmail: ``,
    teamName: ``,
  });

  const [ loginErrors, setLoginErrors ] = useState({
    email: ``,
    password: ``,
  });

  const validateSignUp = () => {
    const newErrors = {
      email: formData.email ? `` : `Email is required.`,
      name: formData.name ? `` : `Name is required.`,
      password: formData.password.length >= 8 ? `` : `Password must be at least 8 characters.`,
      supervisorEmail: formData.isSupervisor ? `` : formData.supervisorEmail ? `` : `Supervisor is required.`,
      teamName: formData.teamName ? `` : `Team is required`,
    };
    setSignupErrors(newErrors);
    return Object.values(newErrors).every((e) => e === ``);
  };

  const validateLogin = () => {
    const newErrors = {
      email: formData.email ? `` : `Email is required.`,
      password: formData.password.length >= 8 ? `` : `Password must be at least 8 characters.`,
    };
    setLoginErrors(newErrors);
    return Object.values(newErrors).every((e) => e === ``);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return <div className="centered-page-login">
    {!isOpenSignup && !isOpenLogin &&
      <div>
        <h1>UC Performance Review</h1>
        <div className="button-group">
          <button className="signUpButton" id="signupMainBtn" onClick={togglePopupSignup} disabled={isLoading}>
            {isLoading ? `Signing up...` : `Sign Up`}
          </button>
          <button className="loginButton" id="loginMainBtn" onClick={togglePopupLogin} disabled={isLoading}>
            {isLoading ? `Logging in...` : `Login`}
          </button>
        </div>
      </div>}
    {isOpenSignup &&
      <div className="page">
        <div className="signup-card">
          <h2>Sign Up</h2>
          <form onSubmit={handleSubmit}>
            <span>First/Last Name:</span>
            <input type="text" name="name" value={formData.name} onChange={handleChange} />
            {signupErrors.name && <div className="error">{signupErrors.name}</div>}

            <span>Password:</span>
            <input type="password" name="password" value={formData.password} onChange={handleChange} />
            {signupErrors.password && <div className="error">{signupErrors.password}</div>}

            <span>{formData.isSupervisor ? `Supervisor Email:` : `UC Email:`}</span>
            <input type="email" name="email" value={formData.email} onChange={handleChange} />
            {signupErrors.email && <div className="error">{signupErrors.email}</div>}

            <div className="radio-group">
              <span>Are you a supervisor?</span>
              <span>
                <input
                  type="radio"
                  name="isSupervisor"
                  value="true"
                  checked={formData.isSupervisor}
                  onChange={() => setFormData((prev) => ({ ...prev, isSupervisor: true }))}
                />
                Yes
              </span>
              <span>
                <input
                  type="radio"
                  name="isSupervisor"
                  value="false"
                  checked={!formData.isSupervisor}
                  onChange={() => setFormData((prev) => ({ ...prev, isSupervisor: false }))}
                />
                No
              </span>
            </div>

            {!formData.isSupervisor &&
              <>
                <span>Supervisor Email:</span>
                <input
                  type="text"
                  name="supervisorEmail"
                  value={formData.supervisorEmail}
                  onChange={handleChange}
                />
                {signupErrors.supervisorEmail && <div className="error">{signupErrors.supervisorEmail}</div>}
              </>}

            <span>Team Name:</span>
            <input type="text" name="teamName" value={formData.teamName} onChange={handleChange} />
            {signupErrors.teamName && <div className="error">{signupErrors.teamName}</div>}

            <div className="submit-signup-login-group">
              <button type="submit" onClick={handleSignUp}>Sign Up</button>
              <button onClick={togglePopupSignup}>Close</button>
            </div>
          </form>
        </div>
      </div>}
    {isOpenLogin &&
      <div>
        <div className="page">
          <div className="signup-card">
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
              <span>{formData.isSupervisor ? `Supervisor Email:` : `UC Email:`}</span>
              <input type="email" name="email" value={formData.email} onChange={handleChange} />
              {loginErrors.email && <div className="error">{loginErrors.email}</div>}

              <span>Password:</span>
              <input type="password" name="password" value={formData.password} onChange={handleChange} />
              {loginErrors.password && <div className="error">{loginErrors.password}</div>}

              <div className="submit-signup-login-group">
                <button type="submit" onClick={handleLogin}>Login</button>
                <button onClick={togglePopupLogin}>Close</button>
              </div>
            </form>
          </div>
        </div>
      </div>}
    <div style={{ color: `gray`, marginTop: `1rem` }}>{message}</div>
  </div>;
};

export default Login;
