import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import FacSched from './FacSched';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <div>
    <FacSched />
    <p>Convert your saved cccsched file into an Outlook Calendar file: <a href="https://ics-schedule-creator.vercel.app" target="_blank">Schedule Processor</a>.</p>
    </div>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
