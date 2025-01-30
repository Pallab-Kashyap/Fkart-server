import twilio from "twilio";
import ApiError from "./APIError.js";
// import dotenv from "dotenv";

// dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_PHONE_NUMBER;
if (!accountSid || !authToken || !from) {
  throw new Error(500, 'Missing required Twilio configuration');
}

const client = twilio(accountSid, authToken);

async function sendOTP(otp, to) {

  to = '+' + to;
  console.log(from ,to);
  // Validate phone number format (basic check)
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(to.startsWith('+') ? to : `+${to}`)) {
    throw new ApiError(404, 'invalid number, number should in the format of +(country code)(number) eg: +919285718314')
  }

  try {
    const message = await client.messages.create({
      body: `Your Fkart verification code is ${otp}.\nValid for 10 minutes.\nDo not share this code with anyone.`,
      from,
      to,
    });

    return Boolean(message.sid);
  } catch (error) {
    console.error('Twilio Error:',  error);
    return true
  }
}

export default sendOTP;