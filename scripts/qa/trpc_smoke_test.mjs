import axios from 'axios';
import fs from 'fs';

const PORT = process.argv[2] || 3000;
const BASE_URL = `http://localhost:${PORT}/api/trpc`;

let managerCookies = '';
const logs = [];

function log(entry) {
  logs.push(entry);
  console.log(JSON.stringify(entry));
}

async function tRPCRequest(endpoint, input, cookies = '') {
  try {
    const response = await axios.post(
      `${BASE_URL}/${endpoint}`,
      { input },
      {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies
        },
        maxRedirects: 0,
        validateStatus: () => true
      }
    );

    const setCookie = response.headers['set-cookie'];
    const cookieString = setCookie ? setCookie.map(c => c.split(';')[0]).join('; ') : '';

    return {
      status: response.status,
      data: response.data,
      cookies: cookieString,
      headers: response.headers
    };
  } catch (e) {
    return {
      status: 0,
      error: e.message,
      data: null
    };
  }
}

async function runSmokeTest() {
  const results = {
    flag_on: {
      deliveryId: null,
      transitions: [],
      errors: []
    }
  };

  log({ step: 'flag_on_test_start' });

  // 1. Login as manager
  log({ step: 'manager_login' });
  const loginResult = await tRPCRequest('auth.demoLogin', { username: 'manager', password: 'demo123' });
  log({ step: 'manager_login_result', status: loginResult.status, cookies: loginResult.cookies ? 'received' : 'none' });

  if (loginResult.status !== 200 || loginResult.data.error) {
    results.flag_on.errors.push('Manager login failed');
    return results;
  }

  managerCookies = loginResult.cookies;

  // 2. Get manager user info
  const meResult = await tRPCRequest('auth.me', {}, managerCookies);
  log({ step: 'auth_me', status: meResult.status, data: meResult.data });

  let managerId = 1;
  if (meResult.data && meResult.data.result && meResult.data.result.data) {
    managerId = meResult.data.result.data.id || 1;
  }

  // 3. Create draft
  log({ step: 'createDraft' });
  const draftResult = await tRPCRequest('logistics.createDraft', { notes: 'Smoke test lifecycle' }, managerCookies);
  log({ step: 'createDraft_result', status: draftResult.status, data: draftResult.data });

  if (draftResult.data.error || !draftResult.data.result) {
    results.flag_on.errors.push('createDraft failed: ' + JSON.stringify(draftResult.data.error || draftResult.data));
    return results;
  }

  const deliveryId = draftResult.data.result.data?.id;
  if (!deliveryId) {
    results.flag_on.errors.push('createDraft did not return id');
    return results;
  }

  results.flag_on.deliveryId = deliveryId;
  results.flag_on.transitions.push({ step: 'createDraft', status: 'ok', deliveryId });

  // 4. Queue
  log({ step: 'queue' });
  const queueResult = await tRPCRequest('logistics.queue', { id: deliveryId }, managerCookies);
  log({ step: 'queue_result', status: queueResult.status, data: queueResult.data });

  if (queueResult.data.error) {
    results.flag_on.errors.push('queue failed: ' + JSON.stringify(queueResult.data.error));
  } else {
    results.flag_on.transitions.push({ step: 'queue', status: 'ok' });
  }

  // 5. Get status after queue
  const getAfterQueue = await tRPCRequest('logistics.getById', { id: deliveryId }, managerCookies);
  const statusAfterQueue = getAfterQueue.data.result?.data?.status;
  results.flag_on.transitions.push({ step: 'getById_after_queue', status: statusAfterQueue });

  // 6. Assign
  log({ step: 'assign' });
  const assignResult = await tRPCRequest('logistics.assign', { id: deliveryId, assignedToUserId: managerId }, managerCookies);
  log({ step: 'assign_result', status: assignResult.status, data: assignResult.data });

  if (assignResult.data.error) {
    results.flag_on.errors.push('assign failed: ' + JSON.stringify(assignResult.data.error));
  } else {
    results.flag_on.transitions.push({ step: 'assign', status: 'ok' });
  }

  // 7. Mark in transit
  log({ step: 'markInTransit' });
  const transitResult = await tRPCRequest('logistics.markInTransit', { id: deliveryId }, managerCookies);
  log({ step: 'markInTransit_result', status: transitResult.status, data: transitResult.data });

  if (transitResult.data.error) {
    results.flag_on.errors.push('markInTransit failed: ' + JSON.stringify(transitResult.data.error));
  } else {
    results.flag_on.transitions.push({ step: 'markInTransit', status: 'ok' });
  }

  // 8. Mark delivered
  log({ step: 'markDelivered' });
  const deliveredResult = await tRPCRequest('logistics.markDelivered', { id: deliveryId }, managerCookies);
  log({ step: 'markDelivered_result', status: deliveredResult.status, data: deliveredResult.data });

  if (deliveredResult.data.error) {
    results.flag_on.errors.push('markDelivered failed: ' + JSON.stringify(deliveredResult.data.error));
  } else {
    results.flag_on.transitions.push({ step: 'markDelivered', status: 'ok' });
  }

  // 9. Final status check
  const finalGet = await tRPCRequest('logistics.getById', { id: deliveryId }, managerCookies);
  const finalStatus = finalGet.data.result?.data?.status;
  results.flag_on.transitions.push({ step: 'getById_final', status: finalStatus });

  // Save logs
  fs.writeFileSync('/tmp/trpc_http_logs.txt', JSON.stringify(logs, null, 2));

  return results;
}

runSmokeTest()
  .then(results => {
    console.log('\n=== FINAL RESULTS ===');
    console.log(JSON.stringify(results, null, 2));
    process.exit(results.flag_on.errors.length > 0 ? 1 : 0);
  })
  .catch(e => {
    console.error('Test failed:', e);
    process.exit(1);
  });

