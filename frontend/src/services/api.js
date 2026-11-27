
// Local/preview requests use Vite's same-origin proxy. Production can provide the API URL at build time.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

async function fetchAPI(endpoint, params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value);
    }
  });

  const qs = query.toString();
  const url = `${API_BASE_URL}${endpoint}${qs ? `?${qs}` : ''}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);

  let response;

  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (error) {
    throw new Error(
      error.name === 'AbortError'
        ? 'The server took too long to respond. Please try again.'
        : 'Cannot reach the backend. Please check your internet connection or try again later.'
    );
  } finally {
    clearTimeout(timer);
  }

  let result = null;

  try {
    result = await response.json();
  } catch {
    throw new Error('The server returned an unexpected response.');
  }

  if (!response.ok || !result.success) {
    throw new Error(result?.message || `API request failed (${response.status})`);
  }

  return result;
}

// Health
export const getHealth = () => fetchAPI('/health');

// Dashboard
export const getDashboardSummary = () => fetchAPI('/dashboard');

// Regional
export const getRegionalEmployment = year =>
  fetchAPI('/regional/employment', { year });

export const getRegionalTrend = () => fetchAPI('/regional/trend');

// Gender
export const getGenderEmployment = year =>
  fetchAPI('/gender/employment', { year });

export const getGenderTrend = () => fetchAPI('/gender/trend');

export const getGenderYears = () => fetchAPI('/gender/years');

// Unemployment
export const getUnemploymentData = year =>
  fetchAPI('/unemployment', { year });

// Industry
export const getIndustryMeta = () => fetchAPI('/industry/meta');

export const getIndustryData = (year, sizeId) =>
  fetchAPI('/industry', { year, sizeId });

export const getIndustryTrend = sizeId =>
  fetchAPI('/industry/trend', { sizeId });

// Tables (read only)
export const getTables = () => fetchAPI('/tables');

export const getTableData = (name, params) =>
  fetchAPI(`/tables/${encodeURIComponent(name)}`, params);
