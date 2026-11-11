// Sample data shaped strictly according to docs/05_API_SPEC.md DTOs
// Temporary mock data for Day 4 frontend components until live API wiring

export const sampleUsers = [
  {
    id: 1,
    fullName: 'Alice Chen',
    bio: 'Computer Science sophomore passionate about web development, distributed systems, and collaborative student hackathons.',
    weeklyHours: 15,
    college: { id: 1, name: 'SVYASA University' },
    links: [
      { type: 'github', url: 'https://github.com/alice-chen' },
      { type: 'linkedin', url: 'https://linkedin.com/in/alice-chen' },
      { type: 'portfolio', url: 'https://alicechen.dev' },
    ],
    skills: [
      { skill: { id: 1, name: 'React', category: { id: 1, name: 'Frontend' } }, level: 'ADVANCED' },
      { skill: { id: 2, name: 'Node.js', category: { id: 2, name: 'Backend' } }, level: 'INTERMEDIATE' },
      { skill: { id: 3, name: 'Tailwind CSS', category: { id: 1, name: 'Frontend' } }, level: 'ADVANCED' },
      { skill: { id: 4, name: 'PostgreSQL', category: { id: 3, name: 'Database' } }, level: 'BEGINNER' },
    ],
    learningGoals: [
      { id: 5, name: 'Docker' },
      { id: 6, name: 'GraphQL' },
    ],
    interests: [
      { id: 1, name: 'Open Source' },
      { id: 2, name: 'Web Development' },
      { id: 3, name: 'AI & Machine Learning' },
    ],
    createdAt: '2026-10-15T10:00:00.000Z',
  },
  {
    id: 2,
    fullName: 'Bob Smith',
    bio: 'Junior electronics and software student focusing on robotics, embedded C++, and Python backend microservices.',
    weeklyHours: 10,
    college: { id: 1, name: 'SVYASA University' },
    links: [
      { type: 'github', url: 'https://github.com/bobsmith' },
    ],
    skills: [
      { skill: { id: 7, name: 'Python', category: { id: 2, name: 'Backend' } }, level: 'ADVANCED' },
      { skill: { id: 8, name: 'Docker', category: { id: 4, name: 'DevOps' } }, level: 'INTERMEDIATE' },
      { skill: { id: 9, name: 'C++', category: { id: 5, name: 'Systems' } }, level: 'EXPERT' },
    ],
    learningGoals: [
      { id: 1, name: 'React' },
    ],
    interests: [
      { id: 4, name: 'Robotics' },
      { id: 5, name: 'Cloud Computing' },
    ],
    createdAt: '2026-10-18T14:30:00.000Z',
  },
];

export const sampleProjects = [
  {
    id: 101,
    title: 'Campus Food Rescue & Donation Tracker',
    summary: 'A real-time web application to redistribute leftover dining hall food to local community pantries.',
    category: { id: 1, name: 'Web Development' },
    difficulty: 'INTERMEDIATE',
    status: 'OPEN',
    maxTeamSize: 4,
    seatsTaken: 2,
    seatsLeft: 2,
    isFull: false,
    skills: [
      { id: 1, name: 'React', minLevel: 'INTERMEDIATE' },
      { id: 2, name: 'Node.js', minLevel: 'INTERMEDIATE' },
      { id: 4, name: 'PostgreSQL', minLevel: 'BEGINNER' },
    ],
    owner: { id: 1, fullName: 'Alice Chen' },
    createdAt: '2026-10-25T08:00:00.000Z',
  },
  {
    id: 102,
    title: 'Autonomous Quadcopter Sensor Fusion',
    summary: 'Building an obstacle detection and terrain mapping module using LiDAR sensors and ROS2.',
    category: { id: 2, name: 'Hardware & IoT' },
    difficulty: 'ADVANCED',
    status: 'OPEN',
    maxTeamSize: 3,
    seatsTaken: 1,
    seatsLeft: 2,
    isFull: false,
    skills: [
      { id: 9, name: 'C++', minLevel: 'ADVANCED' },
      { id: 7, name: 'Python', minLevel: 'INTERMEDIATE' },
    ],
    owner: { id: 2, fullName: 'Bob Smith' },
    createdAt: '2026-10-27T12:00:00.000Z',
  },
];

export const sampleApplications = [
  {
    id: 201,
    projectId: 101,
    project: { id: 101, title: 'Campus Food Rescue & Donation Tracker' },
    applicant: {
      id: 2,
      fullName: 'Bob Smith',
      college: { id: 1, name: 'SVYASA University' },
      topSkills: [{ skill: { id: 7, name: 'Python' }, level: 'ADVANCED' }],
    },
    message: 'I have experience building async backend services and would love to help design the notification pipeline.',
    status: 'PENDING',
    createdAt: '2026-10-28T16:00:00.000Z',
    decidedAt: null,
    allowedTransitions: ['ACCEPTED', 'REJECTED'],
  },
];

export const sampleExchanges = [
  {
    id: 301,
    sender: { id: 2, fullName: 'Bob Smith' },
    recipient: { id: 1, fullName: 'Alice Chen' },
    offeredSkill: { id: 8, name: 'Docker' },
    requestedSkill: { id: 1, name: 'React' },
    message: 'Hey Alice! I can help you containerize your microservices with Docker if you can guide me on React state management.',
    status: 'PENDING',
    createdAt: '2026-10-29T10:00:00.000Z',
    updatedAt: '2026-10-29T10:00:00.000Z',
    allowedTransitions: ['ACCEPTED', 'REJECTED'],
  },
];

export const sampleNotifications = [
  {
    id: 401,
    type: 'APPLICATION_RECEIVED',
    isRead: false,
    createdAt: '2026-10-29T11:00:00.000Z',
    message: 'Bob Smith submitted an application to join Campus Food Rescue & Donation Tracker.',
    link: '/projects/101/applications',
  },
  {
    id: 402,
    type: 'EXCHANGE_REQUEST_RECEIVED',
    isRead: true,
    createdAt: '2026-10-29T10:00:00.000Z',
    message: 'Bob Smith requested a skill exchange: Docker for React.',
    link: '/exchanges',
  },
];

export const sampleLookups = {
  colleges: [
    { id: 1, name: 'SVYASA University' },
    { id: 2, name: 'MIT World Peace University' },
    { id: 3, name: 'Stanford University' },
    { id: 4, name: 'Other / Not listed' },
  ],
  interests: [
    { id: 1, name: 'Open Source' },
    { id: 2, name: 'Web Development' },
    { id: 3, name: 'AI & Machine Learning' },
    { id: 4, name: 'Robotics' },
    { id: 5, name: 'Cloud Computing' },
    { id: 6, name: 'Cybersecurity' },
    { id: 7, name: 'Data Science' },
    { id: 8, name: 'Mobile Apps' },
    { id: 9, name: 'SaaS' },
    { id: 10, name: 'Startups' },
  ],
  skillCategories: [
    { id: 1, name: 'Frontend' },
    { id: 2, name: 'Backend' },
    { id: 3, name: 'Database' },
    { id: 4, name: 'DevOps' },
    { id: 5, name: 'Systems' },
    { id: 6, name: 'Design' },
  ],
  projectCategories: [
    { id: 1, name: 'Web Development' },
    { id: 2, name: 'Hardware & IoT' },
    { id: 3, name: 'AI & Machine Learning' },
    { id: 4, name: 'Mobile App' },
  ],
};

export const sampleSkills = [
  { id: 1, name: 'React', category: { id: 1, name: 'Frontend' } },
  { id: 2, name: 'Node.js', category: { id: 2, name: 'Backend' } },
  { id: 3, name: 'Tailwind CSS', category: { id: 1, name: 'Frontend' } },
  { id: 4, name: 'PostgreSQL', category: { id: 3, name: 'Database' } },
  { id: 5, name: 'Docker', category: { id: 4, name: 'DevOps' } },
  { id: 6, name: 'GraphQL', category: { id: 2, name: 'Backend' } },
  { id: 7, name: 'Python', category: { id: 2, name: 'Backend' } },
  { id: 8, name: 'C++', category: { id: 5, name: 'Systems' } },
  { id: 9, name: 'TypeScript', category: { id: 1, name: 'Frontend' } },
  { id: 10, name: 'Go', category: { id: 2, name: 'Backend' } },
  { id: 11, name: 'Rust', category: { id: 5, name: 'Systems' } },
  { id: 12, name: 'Figma', category: { id: 6, name: 'Design' } },
  { id: 13, name: 'Next.js', category: { id: 1, name: 'Frontend' } },
  { id: 14, name: 'Vue.js', category: { id: 1, name: 'Frontend' } },
  { id: 15, name: 'Kubernetes', category: { id: 4, name: 'DevOps' } },
];


