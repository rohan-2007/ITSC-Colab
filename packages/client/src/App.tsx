import { useNavigate, Routes, Route } from 'react-router-dom';
import './App.css'

function HomeScreen() {
  const navigate = useNavigate();

  
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        paddingTop: '90px',
        alignItems: 'center',
        gap: '15px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>Performance Review</h1>

      <button style={buttonStyle} onClick={() => navigate('/login')}>Login</button>
      <button style={buttonStyle} onClick={() => navigate('/signup')}>Sign Up</button>
      <button style={buttonStyle} onClick={() => navigate('/supervisor-login')}>Supervisor Login</button>
      <button style={buttonStyle} onClick={() => navigate('/supervisor-signup')}>Supervisor Sign Up</button>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: '10px 20px',
  fontSize: '16px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: '#007bff',
  color: 'white',
  cursor: 'pointer',
  width: '200px',
  transition: 'background-color 0.3s',
};


function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/signup" element={<div>Sign Up </div>} />
      <Route path="/login" element={<div>Login Page</div>} />
      <Route path="/supervisor-login" element={<div>Supervisor Login Page</div>} />
      <Route path="/supervisor-signup" element={<div>Supervisor Sign Up Page</div>} />
    </Routes>
  );
}

export default App;
