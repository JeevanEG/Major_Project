import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import AppLayout from '../components/AppLayout';
import SkillRow from '../components/SkillRow';
import Badge from '../components/Badge';
import { analyzeSkillGap } from '../utils/claudeApi';
import '../styles/pages.css';
import '../styles/components.css';

const SkillGapPage = () => {
  const { roadmapData, user, setRoadmapData } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!roadmapData) return null;

  const skillGap = roadmapData.skillGap || [];

  const refreshAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await analyzeSkillGap({
        targetRole: roadmapData.targetRole,
        currentSkills: user?.currentSkills || [],
        experienceLevel: user?.experienceLevel || 'Beginner',
      });
      setRoadmapData((prev) => ({
        ...prev,
        skillGap: result.skillGap,
      }));
    } catch (err) {
      setError('Failed to refresh analysis: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Build recommended courses from skillGap if not in roadmapData
  const recommendations = roadmapData.recommendations ||
    skillGap
      .filter((s) => s.gap === 'High')
      .slice(0, 3)
      .map((s) => ({
        title: `${s.skill} Deep Dive`,
        gap: 'High',
        hours: Math.round(10 + Math.random() * 8),
      }));

  return (
    <AppLayout>
      <div className="page-header fade-up">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="page-title">📊 Skill Gap Analysis</div>
            <div className="page-subtitle">
              See where you stand vs. what your target role requires
            </div>
          </div>
          <button
            className="btn-outline"
            onClick={refreshAnalysis}
            disabled={loading}
            style={{ flexShrink: 0 }}
          >
            {loading ? 'Refreshing...' : '🔄 Refresh Analysis'}
          </button>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      {loading ? (
        <div className="loading-overlay">
          <div className="spinner" />
          <div className="loading-text">Re-analyzing your skill gaps with AI...</div>
        </div>
      ) : (
        <>
          {/* Main two-column grid */}
          <div className="skill-gap-grid fade-up">
            {/* Skills table */}
            <div className="skills-table">
              <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 800 }}>
                  Skills Overview
                </div>
              </div>
              <div className="skills-table-header">
                <div className="skills-table-header-cell">Skill</div>
                <div className="skills-table-header-cell">Your Level</div>
                <div className="skills-table-header-cell">Required</div>
                <div className="skills-table-header-cell">Gap</div>
              </div>
              {skillGap.map((skill) => (
                <SkillRow key={skill.skill} skill={skill} />
              ))}
              {skillGap.length === 0 && (
                <div style={{ padding: '24px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  No skill data available.
                </div>
              )}
            </div>

            {/* Comparison chart */}
            <div className="comparison-chart">
              <div className="comparison-chart-title">Current vs Required</div>
              <div className="chart-legend">
                <span className="legend-item">
                  <span className="legend-dot blue" />Your Level
                </span>
                <span className="legend-item">
                  <span className="legend-dot green" />Required
                </span>
              </div>
              {skillGap.map((skill) => (
                <div key={skill.skill} className="comparison-skill-block">
                  <div className="comparison-skill-name">{skill.skill}</div>
                  <div className="comparison-bars">
                    <div className="comparison-bar-row">
                      <div className="comparison-bar-bg">
                        <div
                          className="comparison-bar-fill user"
                          style={{ width: `${(skill.yourLevel / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="comparison-bar-row">
                      <div className="comparison-bar-bg">
                        <div
                          className="comparison-bar-fill required"
                          style={{ width: `${(skill.required / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended courses */}
          <div className="recommended-section fade-up fade-up-2">
            <div className="section-title">🎯 Recommended Courses to Close Gaps</div>
            <div className="recommended-grid">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="rec-card">
                  <Badge type={rec.gap}>{rec.gap} Gap</Badge>
                  <div className="rec-card-title">{rec.title}</div>
                  <div className="rec-card-meta">🕐 {rec.hours} estimated</div>
                </div>
              ))}
              {recommendations.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: '14px', gridColumn: '1/-1' }}>
                  No recommendations available. Great job — your skills are well-matched!
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
};

export default SkillGapPage;
