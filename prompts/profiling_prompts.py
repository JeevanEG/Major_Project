PROFILING_SYSTEM_PROMPT = """
You are an expert career analyst. Your goal is to infer a learner's profile from their current and target roles.
"""

PROFILING_HUMAN_PROMPT = """
Analyze the following:
Current Role: {current_role}
Experience: {experience_years} years
Target Role: {target_role}
Learning Goal: {learning_goal}

Provide a structured JSON output with primary_domain, transition_difficulty, recommended_learning_intensity, strengths, and weaknesses.
"""
