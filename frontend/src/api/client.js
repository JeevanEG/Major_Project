import axios from 'axios';

const client = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Axios interceptor for Authorization header
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async (username, password) => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    
    const response = await client.post('/auth/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },
  
  signup: async (username, password) => {
    const response = await client.post('/auth/signup', { username, password });
    return response.data;
  },

  getMe: async () => {
    const response = await client.get('/api/me');
    return response.data;
  }
};

export const roadmapApi = {
  get: async () => {
    const response = await client.get('/api/roadmap');
    return response.data;
  },
  generate: async (userData) => {
    const response = await client.post('/run', userData);
    return response.data;
  },
};

export const tutorApi = {
  chat: async (state, message) => {
    const response = await client.post('/chat', { state, message });
    return response.data;
  },
  generateQuiz: async (state) => {
    const response = await client.post('/generate-quiz', state);
    return response.data;
  },
  submitAnswer: async (state, answer) => {
    const response = await client.post('/submit-answer', { state, answer });
    return response.data;
  },
  nextTopic: async (state) => {
    const response = await client.post('/next-topic', state);
    return response.data;
  },
  contextualChat: async (message, context, history) => {
    const response = await client.post('/api/chat', { message, context, history });
    return response.data;
  },
  generateLesson: async (skill_name, topic_name) => {
    const response = await client.post('/api/generate-lesson', { skill_name, topic_name });
    return response.data;
  },
  syncTopicProgress: async (skill_name, topic_index) => {
    const response = await client.post('/api/progress/topic', { skill_name, topic_index });
    return response.data;
  },
  generateAssessment: async (skill_name, topics) => {
    const response = await client.post('/api/generate-assessment', { skill_name, topics });
    return response.data;
  },
  submitAssessmentScore: async (module_id, score) => {
    const response = await client.post('/api/assessment/submit', { module_id, score });
    return response.data;
  },
};

export default client;
