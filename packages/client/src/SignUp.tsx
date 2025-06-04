/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState } from 'react';
import './App.css';

const SignUp = () => {
  const [ formData, setFormData ] = useState({
    email: ``,
    isSupervisor: ``, // "yes" or "no"
    name: ``,
    password: ``,
    supervisor: ``,
    team: ``,
  });

  const [ errors, setErrors ] = useState({
    email: ``,
    isSupervisor: ``,
    name: ``,
    password: ``,
    supervisor: ``,
    team: ``,
  });

  const validate = () => {
    const newErrors = {
      email: formData.email ? `` : `${formData.isSupervisor === `yes` ? `Supervisor` : `UC`} Email is required.`,
      isSupervisor: formData.isSupervisor ? `` : `Please select an option.`,
      name: formData.name ? `` : `Name is required.`,
      password: formData.password.length >= 8 ? `` : `Password must be at least 8 characters.`,
      supervisor:
       formData.isSupervisor === `yes` ? `` : formData.supervisor ? `` : `Supervisor is required.`,
      team: formData.team ? `` : `Team is required.`,
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((e) => e === ``);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      alert(`Signed Up`);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...name === `isSupervisor` && value === `yes` ? { supervisor: `` } : {},
    }));
  };

  return <div className="page">
    <div className="signup-card">
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <label>First/Last Name:</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} />
        {errors.name && <div className="error">{errors.name}</div>}

        <label>Password:</label>
        <input type="password" name="password" value={formData.password} onChange={handleChange} />
        {errors.password && <div className="error">{errors.password}</div>}

        <label>{formData.isSupervisor === `yes` ? `Supervisor Email:` : `UC Email:`}</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} />
        {errors.email && <div className="error">{errors.email}</div>}

        <label>Are you a supervisor?</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="isSupervisor"
              value="yes"
              checked={formData.isSupervisor === `yes`}
              onChange={handleChange}
            />
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="isSupervisor"
              value="no"
              checked={formData.isSupervisor === `no`}
              onChange={handleChange}
            />
            No
          </label>
        </div>
        {errors.isSupervisor && <div className="error">{errors.isSupervisor}</div>}

        {formData.isSupervisor !== `yes` &&
          <>
            <label>Supervisor:</label>
            <input
              type="text"
              name="supervisor"
              value={formData.supervisor}
              onChange={handleChange}
            />
            {errors.supervisor && <div className="error">{errors.supervisor}</div>}
          </>}

        <label>Team:</label>
        <input type="text" name="team" value={formData.team} onChange={handleChange} />
        {errors.team && <div className="error">{errors.team}</div>}

        <button type="submit">Sign Up</button>
      </form>
    </div>
  </div>;
};

export default SignUp;
