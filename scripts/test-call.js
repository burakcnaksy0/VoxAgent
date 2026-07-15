/**
 * VoxAgent — VAPI Call Diagnostic Script
 * Run: node scripts/test-call.js
 * 
 * Tests the VAPI → Twilio pipeline in isolation to diagnose call failures.
 */

const VAPI_KEY = process.env.VAPI_PRIVATE_KEY || '421d75ef-ddc9-441e-a2e1-9ac5bee5845d';
const PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID || 'fff44c9d-9193-4503-8d8c-0973961b476a';
const ASSISTANT_ID = 'dbac7b38-2902-480b-b2a1-65d25c8d6be9';
const TEST_NUMBER = '+905350482874';

async function vapiGet(path) {
  const res = await fetch(`https://api.vapi.ai${path}`, {
    headers: { 'Authorization': `Bearer ${VAPI_KEY}` }
  });
  return res.json();
}

async function vapiPost(path, body) {
  const res = await fetch(`https://api.vapi.ai${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VAPI_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║     VoxAgent — VAPI Call Diagnostic Tool       ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  // Step 1: Check phone number
  console.log('🔍 Step 1: Checking VAPI phone number...');
  const phone = await vapiGet(`/phone-number/${PHONE_NUMBER_ID}`);
  if (phone.error) {
    console.error('❌ Phone number not found:', phone);
    return;
  }
  console.log(`  ✓ Number: ${phone.number}`);
  console.log(`  ✓ Provider: ${phone.provider}`);
  console.log(`  ✓ Status: ${phone.status}`);
  console.log(`  ✓ Twilio SID: ${phone.twilioAccountSid}`);
  console.log(`  ✓ Auth Token: ${phone.twilioAuthToken ? 'SET' : '⚠️  NOT SET'}`);
  console.log();

  // Step 2: Check assistant
  console.log('🔍 Step 2: Checking VAPI assistant...');
  const assistant = await vapiGet(`/assistant/${ASSISTANT_ID}`);
  if (assistant.error) {
    console.error('❌ Assistant not found:', assistant);
    return;
  }
  console.log(`  ✓ Name: ${assistant.name}`);
  console.log(`  ✓ Server URL: ${assistant.serverUrl || '⚠️  NOT SET'}`);
  console.log();

  // Step 3: Make test call
  console.log(`📞 Step 3: Dispatching test call to ${TEST_NUMBER}...`);
  const call = await vapiPost('/call/phone', {
    assistantId: ASSISTANT_ID,
    phoneNumberId: PHONE_NUMBER_ID,
    customer: { number: TEST_NUMBER, name: 'Diagnostic Test' }
  });

  if (call.error || call.message) {
    console.error('❌ Call dispatch failed:', call);
    return;
  }

  console.log(`  ✓ Call ID: ${call.id}`);
  console.log(`  ✓ Initial Status: ${call.status}`);
  console.log();

  // Step 4: Check status after delays
  for (const delay of [3, 5, 10]) {
    console.log(`⏳ Waiting ${delay}s...`);
    await new Promise(r => setTimeout(r, delay * 1000));

    const check = await vapiGet(`/call/${call.id}`);
    console.log(`  Status at ${delay}s: ${check.status}`);
    if (check.endedReason) {
      console.log(`  Ended Reason: ${check.endedReason}`);
    }

    if (check.status === 'ended') {
      console.log();
      if (check.endedReason === 'call.start.error-get-transport') {
        console.log('═══════════════════════════════════════════════');
        console.log('🚨 DIAGNOSIS: error-get-transport');
        console.log('═══════════════════════════════════════════════');
        console.log('Root cause: VAPI cannot establish a phone connection.');
        console.log('');
        console.log('Possible fixes:');
        console.log('  1. VAPI Billing: Add a payment method at dashboard.vapi.ai');
        console.log('     → PSTN calling requires an active billing account');
        console.log('  2. Twilio Auth Token: Re-import phone number in VAPI dashboard');
        console.log('     → Make sure both Account SID and Auth Token are entered');
        console.log('  3. Twilio Trial: Verify the destination number at');
        console.log('     → console.twilio.com → Verified Caller IDs');
        console.log('     → Current format may be wrong (+9005... instead of +905...)');
        console.log('  4. Contact VAPI Support with your Org ID:');
        console.log(`     → Org ID: ${check.orgId || 'N/A'}`);
      } else if (check.endedReason?.includes('no-answer')) {
        console.log('📱 Phone rang but was not answered.');
      } else if (check.endedReason === 'customer-ended-call') {
        console.log('✅ SUCCESS! Phone rang, call was answered and ended by customer.');
      } else {
        console.log(`⚠️  Call ended with reason: ${check.endedReason}`);
      }
      return;
    }

    if (check.status === 'in-progress') {
      console.log('✅ Call is IN PROGRESS — phone should be ringing!');
    }
  }

  console.log('\n✅ Call is still active after 18s — appears to be working!');
}

main().catch(console.error);
