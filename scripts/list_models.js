require('dotenv').config();

// This script calls the Generative Language API `listModels` endpoint using
// an OAuth2 access token obtained from a service account. Set `GOOGLE_APPLICATION_CREDENTIALS`
// to the path of a service account JSON key that has access to the Generative AI API.

const fs = require('fs');
const path = require('path');
const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models';

// Validate GOOGLE_APPLICATION_CREDENTIALS early and provide actionable errors
const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!saPath) {
  console.error('Environment variable GOOGLE_APPLICATION_CREDENTIALS is not set.');
  console.error('Create a service account JSON key for your Google Cloud project and set this environment variable to its full path.');
  console.error('PowerShell (current session) example:');
  console.error("$env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\\Users\\you\\service-account.json'");
  console.error('Then run: npm run ai:list-models');
  process.exit(1);
}

try {
  const resolved = path.resolve(saPath);
  const stat = fs.statSync(resolved);
  if (!stat.isFile()) throw new Error('not a file');
} catch (e) {
  console.error(`The file at ${saPath} does not exist, or it is not a file.`);
  console.error('Ensure `GOOGLE_APPLICATION_CREDENTIALS` points to the downloaded JSON key for a service account.');
  console.error('PowerShell (current session) example:');
  console.error("$env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\\path\\to\\service-account.json'");
  console.error('Then run: npm run ai:list-models');
  console.error();
  console.error('If you do not have a service account, you can create one in the Google Cloud Console, enable the Generative AI API for the project, and download a key.');
  process.exit(1);
}

(async () => {
  try {
    const { GoogleAuth } = await import('google-auth-library');
    const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    const token = accessToken?.token;
    if (!token) {
      console.error('Failed to obtain access token from service account. Ensure GOOGLE_APPLICATION_CREDENTIALS is set to a valid service account JSON file.');
      process.exit(1);
    }

    console.log('Calling ListModels via REST:', endpoint);
    const res = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('ListModels returned', res.status, res.statusText, text);
      process.exit(1);
    }

    const json = await res.json();
    const models = json.models || json;
    if (Array.isArray(models)) {
      console.log(`Found ${models.length} models:`);
      for (const m of models) {
        console.log('---');
        console.log('name:', m.name || m.model || m.id);
        if (m.supportedMethods) console.log('supportedMethods:', m.supportedMethods.join(', '));
        console.log('raw:', JSON.stringify(m));
      }
    } else {
      console.log('ListModels response:', JSON.stringify(json, null, 2));
    }
  } catch (err) {
    console.error('Error calling ListModels:', err);
    process.exit(1);
  }
})();
