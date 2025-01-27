import twilio from "twilio";
// import dotenv from "dotenv";

// dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_PHONE_NUMBER;
console.log(accountSid, authToken, from);
// if (!accountSid || !authToken || !from) {
//   throw new Error('Missing required Twilio configuration');
// }

// const client = twilio(accountSid, authToken);

async function sendOTP(otp, to) {

  to = to.toString().trim();
  
  // Validate phone number format (basic check)
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(to.startsWith('+') ? to : `+${to}`)) {
    return false;
  }

  try {
    // const message = await client.messages.create({
    //   body: `Your Fkart verification code is ${otp}.\nValid for 10 minutes.\nDo not share this code with anyone.`,
    //   from,
    //   to: to.startsWith('+') ? to : `+${to}`,
    // });

    // return Boolean(message.sid);
    return true;
  } catch (error) {
    console.error('Twilio Error:', error?.message || error);
    // return false;
    return true;

  }
}

export default sendOTP;