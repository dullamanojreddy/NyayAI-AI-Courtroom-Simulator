import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FeatureCard from '../components/FeatureCard';

function Landing() {
  const navigate = useNavigate();
  const [xmlPreview, setXmlPreview] = useState('Loading XML...');

  const marks = [74, 66, 80, 91];
  const average = useMemo(() => marks.reduce((a, b) => a + b, 0) / marks.length, [marks]);
  const status = average >= 75 ? 'Good' : 'Needs Improvement';

  useEffect(() => {
    async function loadXmlPreview() {
      try {
        const response = await fetch('/legal-case.xml');
        const xml = await response.text();
        setXmlPreview(xml.slice(0, 120) + '...');
      } catch {
        setXmlPreview('Unable to load XML preview.');
      }
    }
    loadXmlPreview();
  }, []);

  return (
    <div className="d-flex align-items-center" style={{ minHeight: '100vh' }}>
      <div className="nyay-container text-center">
        <div className="mb-3 gavel-spin" style={{ fontSize: 40, letterSpacing: '4px' }}>COURT</div>
        <h1 className="heading display-3" style={{ color: '#C9A84C' }}>NyayAI</h1>
        <p style={{ color: '#A89060' }}>The People's Courtroom — Know Your Rights, Fight Your Case</p>

        <div className="row g-3 my-4">
          <div className="col-md-4"><FeatureCard title="Simulate Courtroom" description="Experience AI-powered legal roleplay." /></div>
          <div className="col-md-4"><FeatureCard title="Learn Law" description="Understand sections in simple language." /></div>
          <div className="col-md-4"><FeatureCard title="Government Aid" description="Find matching legal aid schemes." /></div>
        </div>

        <div className="d-flex justify-content-center gap-3 flex-wrap">
          <button className="btn nyay-btn px-4" onClick={() => navigate('/auth')}>Enter Courtroom</button>
          <button className="btn nyay-btn px-4" onClick={() => alert('Demo coming soon')}>Watch Demo</button>
        </div>

        <div className="nyay-card p-4 mt-4 text-start">
          <h5 className="heading mb-3">UNIT-I / UNIT-II Syllabus Demo</h5>
          <p className="mb-2">Array values: {marks.join(', ')}</p>
          <p className="mb-2">Average using function + operators: {average.toFixed(2)}</p>
          <p className="mb-3">Status (if/else): {status}</p>

          <div className="row g-3">
            <div className="col-md-6">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Gavel_icon.svg/240px-Gavel_icon.svg.png"
                alt="Gavel"
                className="img-fluid rounded border"
              />
            </div>
            <div className="col-md-6">
              <table className="table table-dark table-striped">
                <thead>
                  <tr><th>Concept</th><th>Example</th></tr>
                </thead>
                <tbody>
                  <tr><td>URL</td><td>http://localhost:3000</td></tr>
                  <tr><td>HTTP</td><td>GET/POST methods</td></tr>
                  <tr><td>TCP Port</td><td>3000 / 5000 / 27017</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3 d-flex gap-3 flex-wrap">
            <a className="btn nyay-btn" href="/legal-case.xml" target="_blank" rel="noreferrer">Open XML</a>
            <a className="btn nyay-btn" href="/legal-case.dtd" target="_blank" rel="noreferrer">Open DTD</a>
          </div>

          <div className="mt-3">
            <small className="text-secondary">Async fetch() preview:</small>
            <pre className="p-2 mt-1" style={{ background: '#130d06', border: '1px solid #3D2E0E', borderRadius: 6, whiteSpace: 'pre-wrap' }}>
              {xmlPreview}
            </pre>
          </div>

          <div className="mt-3">
            <iframe
              title="NyayAI XML Frame"
              src="/legal-case.xml"
              style={{ width: '100%', minHeight: 180, border: '1px solid #3D2E0E', borderRadius: 6 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Landing;
