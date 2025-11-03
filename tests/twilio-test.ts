// test-twilio.ts (create at project root, temporary)
import { twilioClient, TWILIO_PHONE } from './lib/twilio';

async function testTwilio() {
  try {
    const account = await twilioClient.api.accounts(
      process.env.TWILIO_ACCOUNT_SID!
    ).fetch();
    
    console.log('✅ Twilio connected successfully!');
    console.log('Account SID:', account.sid);
    console.log('Status:', account.status);
    console.log('Type:', account.type);
    
    // Test phone numbers
    const phoneNumbers = await twilioClient.incomingPhoneNumbers.list();
    console.log('Phone Numbers:', phoneNumbers.length);
    phoneNumbers.forEach((num: { phoneNumber: unknown; }) => {
      console.log('  -', num.phoneNumber);
    });
  } catch (error) {
    console.error('❌ Twilio connection failed:', error);
  }
}

testTwilio();
