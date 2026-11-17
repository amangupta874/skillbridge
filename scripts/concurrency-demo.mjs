import process from 'node:process';
import { error as logError, log } from 'node:console';

const fetch = globalThis.fetch;
const URL = globalThis.URL;
const { API_URL, DEMO_PASSWORD } = process.env;
const ownerEmail = 'owner@demo.skillbridge.test';
const projectTitle = 'Demo: Last Seat Challenge';

if (!API_URL || !DEMO_PASSWORD) {
  logError('Set API_URL and DEMO_PASSWORD before running this demo.');
  process.exit(1);
}

const apiUrl = (path) => new URL(`/api${path}`, API_URL);

async function apiRequest(path, cookie, options = {}) {
  return fetch(apiUrl(path), {
    ...options,
    headers: { ...(options.body && { 'Content-Type': 'application/json' }), ...(cookie && { Cookie: cookie }), ...options.headers },
  });
}

async function runDemo() {
  const login = await apiRequest('/auth/login', null, {
    method: 'POST',
    body: JSON.stringify({ email: ownerEmail, password: DEMO_PASSWORD }),
  });
  if (!login.ok) throw new Error(`Demo owner login failed with status ${login.status}`);
  const setCookies = login.headers.getSetCookie?.() ?? [login.headers.get('set-cookie')];
  const cookie = setCookies.find((value) => value?.startsWith('sid='))?.split(';', 1)[0];
  if (!cookie) throw new Error('Login response did not include the session cookie');

  const projectsResponse = await apiRequest('/projects?mine=owned&status=OPEN&limit=50', cookie);
  if (!projectsResponse.ok) throw new Error(`Could not load demo projects: ${projectsResponse.status}`);
  const projects = (await projectsResponse.json()).data;
  const project = projects.find(({ title }) => title === projectTitle);
  if (!project || project.maxTeamSize !== 2 || project.seatsTaken !== 1) {
    throw new Error('Seed the demo data first; the last-seat project should have two seats and one seat left');
  }

  const applicationsResponse = await apiRequest(`/projects/${project.id}/applications?status=PENDING&limit=50`, cookie);
  if (!applicationsResponse.ok) throw new Error(`Could not load pending applications: ${applicationsResponse.status}`);
  const applications = (await applicationsResponse.json()).data;
  if (applications.length !== 2) throw new Error('The last-seat project must have exactly two pending applications');

  const responses = await Promise.all(applications.map(({ id }) => apiRequest(`/applications/${id}`, cookie, {
    method: 'PATCH', body: JSON.stringify({ status: 'ACCEPTED' }),
  })));
  const finalProjectResponse = await apiRequest(`/projects/${project.id}`, cookie);
  if (!finalProjectResponse.ok) throw new Error(`Could not load final project state: ${finalProjectResponse.status}`);
  const finalProject = (await finalProjectResponse.json()).data;
  const codes = responses.map(({ status }) => status).sort();
  const expected = codes[0] === 200 && codes[1] === 409 && finalProject.members.length === 1;

  log(`Accept response status codes: ${responses.map(({ status }) => status).join(', ')}`);
  log(`Final member count (excluding owner): ${finalProject.members.length}`);
  log('Expected result: exactly one 200 and one 409, with one member accepted.');
  if (!expected) process.exitCode = 1;
}

runDemo().catch((error) => {
  logError(error.message);
  process.exitCode = 1;
});
