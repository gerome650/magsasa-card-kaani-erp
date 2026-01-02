import axios from 'axios';
import fs from 'fs';

const url = 'http://localhost:3000/api/trpc/auth.demoLogin';
const body = { input: { username: 'manager', password: 'demo123' } };

(async () => {
  try {
    const res = await axios.post(url, body, {
      headers: { 'Content-Type': 'application/json' },
      validateStatus: () => true
    });
    
    const output = {
      reqBody: body,
      reqHeaders: { 'Content-Type': 'application/json' },
      status: res.status,
      responseHeaders: res.headers,
      data: res.data
    };
    
    fs.writeFileSync('/tmp/trpc_http_try1.txt', JSON.stringify(output, null, 2));
    console.log(`Status: ${res.status}`);
    
    if (res.status === 200 && res.headers['set-cookie']) {
      const cookieValue = Array.isArray(res.headers['set-cookie']) 
        ? res.headers['set-cookie'][0].split(';')[0] 
        : res.headers['set-cookie'].split(';')[0];
      fs.writeFileSync('/tmp/cookie_manager.txt', cookieValue);
      console.log('Cookie saved');
    }
  } catch (e) {
    fs.writeFileSync('/tmp/trpc_http_try1.txt', JSON.stringify({ error: String(e), message: e.message }, null, 2));
  }
})();
