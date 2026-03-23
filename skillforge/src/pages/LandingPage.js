import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateRoadmap } from '../utils/claudeApi';
import '../styles/landing.css';
import '../styles/components.css';

const QUICK_PICKS = [
  'Full Stack Developer',
  'Data Scientist',
  'DevOps Engineer',
  'ML Engineer',
  'Backend Developer',
  'Cloud Architect',
];

const EXP_LEVELS = [
  { value: 'Beginner (0-1 years)',       label: 'Beginner (0–1 years)',       dot: '#10b981' },
  { value: 'Intermediate (1-3 years)',   label: 'Intermediate (1–3 years)',   dot: '#f59e0b' },
  { value: 'Experienced (3-5 years)',    label: 'Experienced (3–5 years)',    dot: '#6c63ff' },
  { value: 'Senior (5+ years)',          label: 'Senior (5+ years)',          dot: '#ef4444' },
];

const LandingPage = () => {
  const { login } = useApp();

  const [mode, setMode] = useState('role'); // 'role' | 'jd'
  const [jobRole, setJobRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Beginner (0-1 years)');
  const [currentSkills, setCurrentSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('Learner');

  const addSkill = (e) => {
    if ((e.key === 'Enter' || e.type === 'click') && skillInput.trim()) {
      const skill = skillInput.trim();
      if (!currentSkills.includes(skill)) {
        setCurrentSkills([...currentSkills, skill]);
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => {
    setCurrentSkills(currentSkills.filter((s) => s !== skill));
  };

  const selectQuickPick = (pick) => {
    setJobRole(pick);
    setMode('role');
  };

  const handleGenerate = async () => {
    const roleOrJD = mode === 'role' ? jobRole : jobDescription;
    if (!roleOrJD.trim()) {
      setError('Please enter a job role or paste a job description.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const roadmap = await generateRoadmap({
        jobRole: mode === 'role' ? jobRole : '',
        jobDescription: mode === 'jd' ? jobDescription : '',
        experienceLevel,
        currentSkills,
      });
      login({ name: userName, experienceLevel, currentSkills }, roadmap);
    } catch (err) {
      setError(`Failed to generate roadmap: ${err.message}. Check your API key or network.`);
    } finally {
      setLoading(false);
    }
  };

  const selectedDot = EXP_LEVELS.find(e => e.value === experienceLevel)?.dot || '#10b981';

  return (
    <div className="landing-page">
      {/* Logo */}
      <div className="landing-header">
        <div className="landing-logo-icon">🔨</div>
        <span className="landing-logo-text">SkillForge AI</span>
      </div>

      {/* Hero text */}
      <h1 className="landing-hero-title">
        Get Trained for Your <span>Dream Job Role</span>
      </h1>
      <p className="landing-hero-subtitle">
        Enter a job role or paste a Job Description — our AI agents will build your personalized learning roadmap.
      </p>

      {/* Main card */}
      <div className="landing-card">

        {/* Name input */}
        <div style={{ marginBottom: '18px' }}>
          <div className="section-label" style={{ marginTop: 0 }}>Your Name</div>
          <input
            className="form-input"
            placeholder="e.g. Alex, Sarah..."
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </div>

        {/* Mode tabs */}
        <div className="input-mode-tabs">
          <div
            className={`input-mode-tab ${mode === 'role' ? 'active' : ''}`}
            onClick={() => setMode('role')}
          >
            🎯 Enter Job Role
          </div>
          <div
            className={`input-mode-tab ${mode === 'jd' ? 'active' : ''}`}
            onClick={() => setMode('jd')}
          >
            📋 Paste Job Description
          </div>
        </div>

        {/* Input area */}
        {mode === 'role' ? (
          <>
            <input
              className="form-input"
              style={{ marginBottom: '14px' }}
              placeholder="e.g. Full Stack Developer, Data Scientist..."
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <div className="quick-picks-label">
              Quick picks: <span></span>
            </div>
            <div className="quick-picks">
              {QUICK_PICKS.map((pick) => (
                <button
                  key={pick}
                  className={`quick-pick-btn ${jobRole === pick ? 'selected' : ''}`}
                  onClick={() => selectQuickPick(pick)}
                >
                  {pick}
                </button>
              ))}
            </div>
          </>
        ) : (
          <textarea
            className="form-input"
            style={{ minHeight: '120px', resize: 'vertical', marginBottom: '14px' }}
            placeholder="Paste the full job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        )}

        {/* Experience level */}
        <div className="section-label">Experience Level</div>
        <div style={{ position: 'relative', marginBottom: '2px' }}>
          <span
            className="exp-dot"
            style={{
              background: selectedDot,
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1,
            }}
          />
          <select
            className="form-select"
            style={{ paddingLeft: '32px' }}
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
          >
            {EXP_LEVELS.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>

        {/* Current skills */}
        <div className="section-label">Anything else you want to mention </div>
        <div className="skills-input-wrap">
          {currentSkills.map((skill) => (
            <span key={skill} className="skill-tag-item">
              {skill}
              <span className="skill-tag-remove" onClick={() => removeSkill(skill)}>×</span>
            </span>
          ))}
          <input
            className="skills-input-field"
            placeholder={currentSkills.length === 0 ? 'Type here and press Enter...' : ''}
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={addSkill}
          />
        </div>

        {/* Error */}
        {error && <div className="error-box" style={{ marginTop: '16px' }}>{error}</div>}

        {/* CTA */}
        <button
          className="btn-primary block"
          style={{ marginTop: '22px', padding: '14px', fontSize: '15px', borderRadius: '10px' }}
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
              Building Your Roadmap...
            </>
          ) : (
            'Generate My Roadmap →'
          )}
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
