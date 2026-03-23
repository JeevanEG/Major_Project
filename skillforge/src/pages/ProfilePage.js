import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import AppLayout from '../components/AppLayout';
import '../styles/pages.css';
import '../styles/components.css';

const EXP_LEVELS = [
  'Beginner (0-1 years)',
  'Intermediate (1-3 years)',
  'Experienced (3-5 years)',
  'Senior (5+ years)',
];

const ProfilePage = () => {
  const { user, roadmapData, updateProfile } = useApp();

  const [displayName, setDisplayName]     = useState(user?.name || 'Learner');
  const [targetRole, setTargetRole]       = useState(roadmapData?.targetRole || '');
  const [experienceLevel, setExpLevel]    = useState(user?.experienceLevel || 'Beginner (0-1 years)');
  const [skills, setSkills]               = useState(user?.currentSkills || []);
  const [skillInput, setSkillInput]       = useState('');
  const [saved, setSaved]                 = useState(false);

  useEffect(() => {
    setDisplayName(user?.name || 'Learner');
    setTargetRole(roadmapData?.targetRole || '');
    setExpLevel(user?.experienceLevel || 'Beginner (0-1 years)');
    setSkills(user?.currentSkills || []);
  }, [user, roadmapData]);

  const addSkill = (e) => {
    if ((e.key === 'Enter' || e.type === 'click') && skillInput.trim()) {
      const skill = skillInput.trim();
      if (!skills.includes(skill)) setSkills([...skills, skill]);
      setSkillInput('');
    }
  };

  const removeSkill = (s) => setSkills(skills.filter((x) => x !== s));

  const handleSave = () => {
    updateProfile({
      name: displayName,
      experienceLevel,
      currentSkills: skills,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const joinedDate = 'Feb 2025';
  const initial = displayName ? displayName[0].toUpperCase() : 'L';

  return (
    <AppLayout>
      <div className="page-header fade-up">
        <div className="page-title">👤 Profile</div>
        <div className="page-subtitle">Manage your learning profile and current skills</div>
      </div>

      <div className="profile-grid fade-up">
        {/* Left: profile card */}
        <div className="profile-card">
          <div className="profile-card-avatar">
            <div className="avatar-circle large">{initial}</div>
          </div>
          <div className="profile-card-name">{displayName}</div>
          <div className="profile-card-role">{targetRole || 'No role set'}</div>
          <div className="profile-card-meta">
            <div>📅 Joined {joinedDate}</div>
            <div>{experienceLevel.split(' ')[0]} Level</div>
          </div>
        </div>

        {/* Right: edit form */}
        <div className="profile-edit-card">
          <div className="profile-edit-title">Edit Profile</div>

          {saved && (
            <div className="success-toast">
              ✅ Profile updated successfully!
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Display Name</label>
            <input
              className="form-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Target Role</label>
            <input
              className="form-input"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Full Stack Developer"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Experience Level</label>
            <select
              className="form-select"
              value={experienceLevel}
              onChange={(e) => setExpLevel(e.target.value)}
            >
              {EXP_LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Current Skills</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input
                className="form-input"
                placeholder="Add a skill and press Enter..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={addSkill}
                style={{ flex: 1 }}
              />
              <button
                className="btn-outline"
                onClick={addSkill}
                style={{ whiteSpace: 'nowrap', padding: '10px 16px' }}
              >
                + Add
              </button>
            </div>
            {skills.length > 0 ? (
              <div className="skills-edit-list">
                {skills.map((s) => (
                  <span key={s} className="skill-tag-item">
                    {s}
                    <span className="skill-tag-remove" onClick={() => removeSkill(s)}>×</span>
                  </span>
                ))}
              </div>
            ) : (
              <div className="no-skills-hint">No skills added yet</div>
            )}
          </div>

          <button className="btn-primary" onClick={handleSave} style={{ marginTop: '8px' }}>
            Update Profile
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;
