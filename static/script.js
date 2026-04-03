document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('roadmap-form');
    const submitBtn = document.getElementById('submit-btn');
    const loading = document.getElementById('loading');
    const resultsContainer = document.getElementById('results-container');
    const resultsDiv = document.getElementById('roadmap-results');
    const errorMessage = document.getElementById('error-message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Gather Input
        const formData = {
            current_role: document.getElementById('current_role').value,
            experience_years: parseFloat(document.getElementById('experience_years').value),
            target_role: document.getElementById('target_role').value,
            learning_goal: document.getElementById('learning_goal').value || null
        };

        // 2. UI Reset
        errorMessage.classList.add('hidden');
        resultsDiv.innerHTML = '';
        resultsContainer.classList.remove('hidden');
        loading.classList.remove('hidden');
        submitBtn.disabled = true;

        try {
            // 3. API Call
            const response = await fetch('/run', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail?.[0]?.msg || errorData.detail || 'Failed to generate roadmap');
            }

            const data = await response.json();

            // 4. Render Results
            renderRoadmap(data);

        } catch (err) {
            errorMessage.textContent = `Error: ${err.message}`;
            errorMessage.classList.remove('hidden');
        } finally {
            loading.classList.add('hidden');
            submitBtn.disabled = false;
        }
    });

    function renderRoadmap(data) {
        if (data.enterprise_skill_map && data.enterprise_skill_map.error) {
            errorMessage.textContent = data.enterprise_skill_map.error;
            errorMessage.classList.remove('hidden');
            return;
        }

        const plan = data.curriculum_plan;
        if (!plan || !plan.learning_stages) {
            resultsDiv.innerHTML = '<div class="card"><p>No learning stages generated. Try a different role.</p></div>';
            return;
        }

        let html = `
            <div class="card">
                <h2>Your Personalized Learning Path</h2>
                <div class="summary-stats">
                    <p><strong>Total Estimated Duration:</strong> ${plan.total_estimated_duration_weeks} weeks</p>
                </div>
        `;

        plan.learning_stages.forEach(stage => {
            html += `
                <div class="roadmap-stage">
                    <div class="stage-header">
                        <h3>Stage ${stage.stage}: Focus on ${stage.focus_priority} Priority Skills</h3>
                        <span class="badge badge-${stage.focus_priority}">${stage.focus_priority}</span>
                    </div>
            `;

            stage.skills.forEach(skill => {
                html += `
                    <div class="skill-item">
                        <h4>${skill.skill} <small>(${skill.estimated_weeks} weeks)</small></h4>
                        <div class="skill-details">
                            <p><strong>Topics:</strong></p>
                            <ul>
                                ${skill.topics.map(t => `<li>${t}</li>`).join('')}
                            </ul>
                            <p><strong>Learning Outcomes:</strong></p>
                            <ul>
                                ${skill.learning_outcomes.map(o => `<li>${o}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
        });

        html += `</div>`;
        resultsDiv.innerHTML = html;
        
        // Scroll to results
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }
});
