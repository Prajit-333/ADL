import { useState } from 'react';
import './App.css';

function App() {
  const [userType, setUserType] = useState<'driver' | 'people'>('driver');
  const [phoneNumber, setPhoneNumber] = useState('');

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">
          Your destination deserves a<br />
          guaranteed spot.
        </h1>

        <div className="segmented-control">
          <button
            className={`segment ${userType === 'driver' ? 'active' : ''}`}
            onClick={() => setUserType('driver')}
            type="button"
          >
            <span className="icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H8.5a1 1 0 0 0-.8.4L5 11l-5.16.86a1 1 0 0 0-.84.99V16h3M9 16v-2h6v2M6 16.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM23 16.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
              </svg>
            </span>
            DRIVER
          </button>
          <button
            className={`segment ${userType === 'people' ? 'active' : ''}`}
            onClick={() => setUserType('people')}
            type="button"
          >
            <span className="icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            PEOPLE
          </button>
        </div>

        <div className="divider">
          <span>Log in or sign up</span>
        </div>

        <div className="phone-input-group">
          <button className="country-code" type="button">
            <span className="flag">
              <img src="https://flagcdn.com/w40/in.png" alt="India Flag" width="24" height="16" />
            </span>
            <span className="chevron">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </button>
          <div className="input-wrapper">
            <span className="prefix">+91</span>
            <input
              type="tel"
              placeholder="Enter Phone Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
        </div>

        <button className="continue-button" type="button">
          Continue
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>

        <div className="social-login">
          <button className="social-button" aria-label="Sign in with Google" type="button">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          </button>

          <button className="social-button" aria-label="Sign in with Apple" type="button">
            <svg
              width="24"
              height="24"
              viewBox="0 0 170 170"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M126.98 123.63C121.72 136.21 113.88 152.07 100.86 152.37C88.19 152.66 84.14 144.92 69.45 144.92C54.76 144.92 50.11 152.07 38.38 152.66C25.37 153.26 16.03 135.31 10.77 122.73C-0.0599976 96.65 -5.87002 61.16 5.56001 37.15C11.23 25.19 23.08 17.58 35.84 17.29C48.21 17 59.94 25.54 67.48 25.54C75.02 25.54 89.26 15.35 103.88 15.65C122.68 16.1 135.91 25.04 144.3 37.38C127.31 47.79 130.49 71.91 148.65 79.44C143.91 91.68 136.31 107.82 126.98 123.63Z"
                fill="#000000"
              />
              <path
                d="M96.79 0C94.27 15.89 80 28.53 64.63 28.23C62.5 11.23 78.43 -0.630005 96.79 0Z"
                fill="#000000"
              />
            </svg>
          </button>
        </div>

        <div className="footer-terms">
          <p>By continuing, you agree to our</p>
          <div className="links">
            <a href="#">Terms of Service</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Content Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
