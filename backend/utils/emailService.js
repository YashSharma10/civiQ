const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    },
    connectionTimeout: 10000, // 10 seconds timeout so it doesn't hang forever
    greetingTimeout: 10000,
    socketTimeout: 10000
  });
};

const sendStatusUpdateEmail = async (recipientEmail, issueTitle, newStatus) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('Email credentials not found. Skipping status update email.');
    return;
  }

  const transporter = createTransporter();
  
  const statusColors = {
    'Pending': '#f59e0b',
    'Assigned': '#3b82f6',
    'Inspect': '#8b5cf6',
    'In Progress': '#10b981',
    'Resolved': '#22c55e'
  };

  const color = statusColors[newStatus] || '#4f46e5';

  const mailOptions = {
    from: `"CiviQ Support" <${process.env.GMAIL_USER}>`,
    to: recipientEmail,
    subject: `Update on your reported issue: ${issueTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background-color: ${color}; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Status Update 📣</h1>
          </div>
          <div style="padding: 40px 30px; color: #374151;">
            <p style="font-size: 16px; line-height: 1.6;">Hello,</p>
            <p style="font-size: 16px; line-height: 1.6;">The status of the civic issue you reported, <strong>"${issueTitle}"</strong>, has been updated.</p>
            <div style="margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">New Status</p>
              <p style="margin: 5px 0 0 0; font-weight: bold; font-size: 20px; color: ${color};">${newStatus}</p>
            </div>
            <p style="font-size: 16px; line-height: 1.6;">Our team is working hard to resolve community issues. You can check the CiviQ app for detailed tracking and updates.</p>
            <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">Thank you for contributing to your community,<br><strong>The CiviQ Team</strong></p>
          </div>
        </div>
      </div>
    `
  };

  console.log(`[Nodemailer] Configuring transporter with user: ${process.env.GMAIL_USER}`);

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Nodemailer] SUCCESS! Status update email sent to ${recipientEmail} for status ${newStatus}`);
    console.log(`[Nodemailer] Message ID: ${info.messageId}`);
  } catch (error) {
    console.error('[Nodemailer] FAILED to send status update email:', error);
  }
};

module.exports = {
  sendStatusUpdateEmail
};
