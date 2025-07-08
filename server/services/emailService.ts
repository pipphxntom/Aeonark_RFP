import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey || resendApiKey === 're_your_resend_api_key_here') {
  console.warn('RESEND_API_KEY not configured, email functionality will be disabled');
  console.warn('📧 To enable emails: Replace RESEND_API_KEY in .env with your actual Resend API key');
}

// Only initialize Resend if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY || !resend) {
      console.warn("Cannot send email: RESEND_API_KEY not configured");
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(params.to)) {
      console.error('Invalid email format:', params.to);
      return false;
    }

    // For unverified emails, try different from addresses that might work
    const fromAddresses = [
      'AeonRFP <onboarding@resend.dev>',
      'AeonRFP <no-reply@resend.dev>',
      'AeonRFP <verification@resend.dev>',
      'AeonRFP <auth@resend.dev>'
    ];

    let lastError = null;

    for (const fromAddress of fromAddresses) {
      try {
        const { data, error } = await resend.emails.send({
          from: params.from || fromAddress,
          to: [params.to],
          subject: params.subject,
          html: params.html,
        });

        if (error) {
          console.warn(`Resend email error with ${fromAddress}:`, error);
          lastError = error;
          continue;
        }

        console.log('Email sent successfully:', data?.id, 'using:', fromAddress);
        return true;
      } catch (err) {
        console.warn(`Failed to send with ${fromAddress}:`, err);
        lastError = err;
        continue;
      }
    }

    // If all attempts failed, log the last error
    console.error('All email send attempts failed. Last error:', lastError);
    return false;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export function generateOtpEmail(otp: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your AeonRFP Login Code</title>
      <style>
        body {
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #0B0B0B 0%, #1A1A1A 100%);
          color: #ffffff;
          margin: 0;
          padding: 0;
          line-height: 1.6;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
        }
        .logo {
          font-size: 32px;
          font-weight: 700;
          background: linear-gradient(135deg, #00FFA3 0%, #00B8FF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #8B8B8B;
          font-size: 16px;
        }
        .main-content {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 40px;
          text-align: center;
        }
        .otp-code {
          font-size: 48px;
          font-weight: 700;
          color: #00FFA3;
          letter-spacing: 8px;
          margin: 30px 0;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
        }
        .message {
          font-size: 18px;
          color: #E0E0E0;
          margin-bottom: 30px;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          color: #8B8B8B;
          font-size: 14px;
        }
        .security-note {
          background: rgba(255, 165, 0, 0.1);
          border: 1px solid rgba(255, 165, 0, 0.3);
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          color: #FFB366;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">AeonRFP</div>
          <div class="subtitle">AI-Powered Proposal Generation</div>
        </div>

        <div class="main-content">
          <h1 style="color: #ffffff; margin-bottom: 20px;">Your Login Code</h1>
          <p class="message">
            Use this 6-digit code to complete your login to AeonRFP:
          </p>

          <div class="otp-code">${otp}</div>

          <div class="security-note">
            <strong>Security Note:</strong> This code expires in 10 minutes. Never share this code with anyone.
          </div>
        </div>

        <div class="footer">
          <p>This code was requested from your AeonRFP account.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}