/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { FormEvent, useState } from 'react';
import './login.css';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
const fetchUrl = `http://localhost:${3001}`;

const Login: React.FC = () => {
  const [ message, setMessage ] = useState(``);
  const [ isLoading, setIsLoading ] = useState(false);
  const [ isOpenSignup, setIsOpenSignup ] = useState(false);
  const [ isOpenLogin, setIsOpenLogin ] = useState(false);
  const [ profileText, setProfileText ] = useState(``);

  const navigate = useNavigate();
  const PORT = 3001;

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(`${fetchUrl}/me/`, {
          body: JSON.stringify({ requestData: true }),
          credentials: `include`,
          headers: { 'Content-Type': `application/json` },
          method: `POST`,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const jsonData = await response.json();

        if (jsonData.sessionActive) {
          await navigate(`/home`);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Session check failed:`, error);
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
    teamId: ``,
  });

  async function handleSignUp() {
    validateSignUp();
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
    // e.preventDefault();
    const isValid = validateLogin();
    if (isValid) {
      setIsLoading(true);
      setMessage(`Sending login request...`);

      const loginData = {
        email: formData.email,
        password: formData.password,
      };

      try {
        const response = await fetch(`${fetchUrl}/login/`, {
          body: JSON.stringify(loginData),
          credentials: `include`,
          headers: { 'Content-Type': `application/json` },
          method: `POST`,
        });

        const responseJson = await response.json();

        alert(`Login success: ${responseJson.message}`);
        void navigate(`/home`);
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
    setIsOpenLogin(!isOpenLogin);
    if (!isOpenLogin) {
      document.getElementById(`loginMainBtn`)!.style.display = `none`;
      document.getElementById(`signupMainBtn`)!.style.display = `none`;
    } else {
      document.getElementById(`loginMainBtn`)!.style.display = `block`;
      document.getElementById(`signupMainBtn`)!.style.display = `block`;
    }
  };

  const [ signupErrors, setSignupErrors ] = useState({
    email: ``,
    name: ``,
    password: ``,
    supervisorEmail: ``,
    teamId: ``,
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
      supervisorEmail:
        formData.supervisorEmail ? `` : formData.supervisorEmail ? `` : `Supervisor is required.`,
      teamId: formData.teamId ? `` : `Team is required.`,
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

  return <div className="centered-page">
    {!isOpenSignup && !isOpenLogin &&
      <div>
        <h1>UC Performance Review</h1>
        <div className="button-group">
          <button id="signupMainBtn" onClick={togglePopupSignup} disabled={isLoading}>
            {isLoading ? `Signing up...` : `Sign Up`}
          </button>
          <button id="loginMainBtn" onClick={togglePopupLogin} disabled={isLoading}>
            {isLoading ? `Logging in...` : `Login`}
          </button>
        </div>
      </div>}
    {isOpenSignup &&
    // <div>
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
                  onChange={handleChange}
                />
                Yes
              </span>
              <span>
                <input
                  type="radio"
                  name="isSupervisor"
                  value="false"
                  checked={!formData.isSupervisor}
                  onChange={handleChange}
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
            <input type="text" name="teamId" value={formData.teamId} onChange={handleChange} />
            {signupErrors.teamId && <div className="error">{signupErrors.teamId}</div>}

            <div className="submit-signup-login-group">
              <button type="submit" onClick={handleSignUp}>Sign Up</button>
              <button onClick={togglePopupSignup}>Close</button>
            </div>
          </form>
        </div>
        {/* </div> */}
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
