import React from 'react';

const Prefooter = () => {
  const prefooterStyle = {
    textAlign: 'center',
    backgroundColor: '#000000',
    color:'#ffffff',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
    marginTop: '40px',
  };

  const headingStyle = {
    fontSize: '3rem',
    marginBottom: '40px',
    marginTop:'3rem',
    fontWeight: 'bold',
  };

  const textStyle = {
    fontSize: '1.3rem',
    marginBottom: '50px',
  };

  const buttonContainerStyle = {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: '20px',
    
  };

  const buttonStyle = {
    padding: '10px 20px',
    fontSize: '1rem',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '5px',
    width:'200px',
    transition: 'background-color 0.3s ease',
    borderRadius:'10px'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#232846',
    color: 'white',
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#eff1fa',
    color: '#5864ae',
  };

  const handleSignUp = () => {
    alert('Sign Up button clicked!');
    // Logic for sign-up
  };

  const handleLearnMore = () => {
    alert('Learn More button clicked!');
    // Logic for learn more
  };

  return (
    <div style={prefooterStyle}>
      <h1 style={headingStyle}>Start scaling with Vmonie.</h1>
      <p style={textStyle}>
      Join over 1,000+ business owners who already streamline their
      daily business operations with Vmonie software.
      </p>
      <div style={buttonContainerStyle}>
        <button style={primaryButtonStyle} onClick={handleSignUp}>
          Get started
        </button>
        <button style={secondaryButtonStyle} onClick={handleLearnMore}>
          contact sales
        </button>
      </div>
    </div>
  );
};

export default Prefooter;
