import React, { useState } from 'react';
import './App.css';

const App: React.FC = () => {
  const [ message, setMessage ] = useState(``);
  const [ isLoading, setIsLoading ] = useState(false);
  const [ isOpenSignup, setIsOpenSignup ] = useState(false);
  const [ isOpenLogin, setIsOpenLogin ] = useState(false);

  const PORT = 3001;

  const [ formData, setFormData ] = useState({
    email: ``,
    isSupervisor: false,
    name: ``,
    password: ``,
    role: ``,
    supervisorId: ``,
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
      const response = await fetch(`http://localhost:${PORT}/signup/`, {
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
    validateLogin();
    setIsLoading(true);
    setMessage(`Sending login request...`);

    const loginData = {
      email: formData.email,
      password: formData.password,
    };

    try {
      const response = await fetch(`http://localhost:${PORT}/login/`, {
        body: JSON.stringify(loginData),
        credentials: `include`,
        headers: { 'Content-Type': `application/json` },
        method: `POST`,
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(responseText || `Login failed`);
      }

      setMessage(`Login success: ${responseText}`);
    } catch (error) {
      if (error instanceof Error) {
        setMessage(`Login error: ${error.message}`);
      } else {
        setMessage(`An unknown error occurred.`);
      }
    } finally {
      setIsLoading(false);
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
    supervisorId: ``,
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
      supervisorId:
        formData.supervisorId ? `` : formData.supervisorId ? `` : `Supervisor is required.`,
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
    <h1>UC Performance Review</h1>
    <div className="button-group">
      <button id="signupMainBtn" onClick={togglePopupSignup} disabled={isLoading}>
        {isLoading ? `Signing up...` : `Sign Up`}
      </button>
      <button id="loginMainBtn" onClick={togglePopupLogin} disabled={isLoading}>
        {isLoading ? `Logging in...` : `Login`}
      </button>
      {isOpenSignup &&
        <div>
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

                <span>Are you a supervisor?</span>
                <div className="radio-group">
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
                    <span>Supervisor ID:</span>
                    <input
                      type="text"
                      name="supervisorId"
                      value={formData.supervisorId}
                      onChange={handleChange}
                    />
                    {signupErrors.supervisorId && <div className="error">{signupErrors.supervisorId}</div>}
                  </>}

                <span>Team Name:</span>
                <input type="text" name="teamId" value={formData.teamId} onChange={handleChange} />
                {signupErrors.teamId && <div className="error">{signupErrors.teamId}</div>}

                <button type="submit" onClick={handleSignUp}>Sign Up</button>
                <button onClick={togglePopupSignup}>Close</button>
              </form>
            </div>
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

                <button type="submit" onClick={handleLogin}>Login</button>
                <button onClick={togglePopupLogin}>Close</button>
              </form>
            </div>
          </div>
        </div>}
    </div>
    <div style={{ color: `gray`, marginTop: `1rem` }}>{message}</div>
  </div>;
};

export default App;
