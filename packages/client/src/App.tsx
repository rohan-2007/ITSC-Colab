import './App.css'
function MainScreen() {
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      <h1>Performance Review</h1>
      <button>Login</button>
      <button>Sign Up</button>
      <button>Supervisor Login</button>
      <button>Supervisor Sign Up</button>
    </div>
  );
}
export default MainScreen
