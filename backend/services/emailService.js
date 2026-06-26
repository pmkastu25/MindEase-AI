const nodemailer = require('nodemailer');
const { BrevoClient } = require('@getbrevo/brevo');

let transporter;
let isEthereal = false;
let useBrevo = false;
let brevoClient;

async function initTransporter() {
  if (useBrevo || transporter) return;

  // Prefer Brevo SDK if API key is provided
  const brevoKey = process.env.BREVO_API_KEY || (process.env.SMTP_PASS && process.env.SMTP_PASS.startsWith('xsmtpsib-') ? process.env.SMTP_PASS : null);

  if (brevoKey && brevoKey !== 'your_brevo_api_key_here') {
    brevoClient = new BrevoClient({ apiKey: brevoKey });
    useBrevo = true;
    console.log("Brevo Transactional Emails API initialized (Production Mode).");
  } else {
    // Generate test SMTP service account from ethereal.email (Local testing)
    try {
      let testAccount = await nodemailer.createTestAccount();

      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      isEthereal = true;
      useBrevo = false;
      console.log("Ethereal Email transporter initialized (Test Mode).");
    } catch (err) {
      console.error("Failed to initialize Ethereal test transporter:", err);
    }
  }
}

async function sendMailHelper(mailOptions) {
  await initTransporter();

  if (useBrevo) {
    let senderName = "MindEase";
    let senderEmail = process.env.SENDER_EMAIL || "hello@mindease.app";

    if (mailOptions.from) {
      const fromMatch = mailOptions.from.match(/"?([^"<]*)"?\s*<([^>]+)>/);
      if (fromMatch) {
        senderName = fromMatch[1].trim();
        senderEmail = fromMatch[2].trim();
      } else if (mailOptions.from.includes('@')) {
        senderEmail = mailOptions.from.trim();
      }
    }

    // Force default to process.env.SENDER_EMAIL if set and valid, which matches verified Brevo sender
    if (process.env.SENDER_EMAIL && process.env.SENDER_EMAIL.includes('@')) {
      senderEmail = process.env.SENDER_EMAIL;
    }

    try {
      return await brevoClient.transactionalEmails.sendTransacEmail({
        sender: {
          name: senderName,
          email: senderEmail
        },
        to: [{ email: mailOptions.to }],
        subject: mailOptions.subject,
        textContent: mailOptions.text,
        htmlContent: mailOptions.html
      });
    } catch (err) {
      const errorMsg = err.response && err.response.body ? JSON.stringify(err.response.body) : err.message;
      throw new Error(`Brevo API Error: ${errorMsg}`);
    }
  } else {
    if (!transporter) {
      throw new Error("SMTP transporter not initialized.");
    }
    let info = await transporter.sendMail(mailOptions);
    if (isEthereal) {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
    return info;
  }
}

async function sendWelcomeEmail(toEmail, userName) {
  await initTransporter();

  const mailOptions = {
    from: '"MindEase" <hello@mindease.app>',
    to: toEmail,
    subject: "Welcome to MindEase, " + userName + "! 🌿",
    text: `Hello ${userName},\n\nWelcome to MindEase! We are thrilled to have you here.\n\nTake a moment today to check in with your emotions and try out a 5-minute morning grounding ritual in our Resources tab.\n\nStay mindful,\nThe MindEase Team`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #7c9e8a;">Welcome to MindEase, ${userName}! 🌿</h2>
        <p>We are thrilled to have you join our community.</p>
        <p>MindEase is designed to help you gently guide your emotions and build long-term resilience.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #7c9e8a; margin: 20px 0;">
          <h3 style="margin-top: 0;">Try This Today:</h3>
          <p>Head over to the <strong>Resources</strong> tab and try out a 5-minute morning grounding ritual. It's a simple, effective way to anchor your day.</p>
        </div>
        
        <p>Take care and stay mindful,</p>
        <p><strong>The MindEase Team</strong></p>
      </div>
    `
  };

  try {
    await sendMailHelper(mailOptions);
    console.log("Welcome Email sent to %s", toEmail);
  } catch (err) {
    console.error("Error sending welcome email:", err);
  }
}

async function sendDailyEngagementEmail(toEmail, userName) {
  await initTransporter();

  const dailyTips = [
    {
      title: "How are you feeling today? 🌅",
      body: "Checking in with your emotions daily can significantly improve emotional regulation. Don't forget to log your mood today!"
    },
    {
      title: "Take a Deep Breath 🫁",
      body: "Try the 4-7-8 breathing technique today to activate your calm switch. You can find guided instructions in our app's Resource library."
    },
    {
      title: "A Moment of Gratitude ✨",
      body: "What is one small thing you are grateful for today? Write it down in your MindEase journal to build a reservoir of positive energy."
    }
  ];

  // Pick a random tip
  const tip = dailyTips[Math.floor(Math.random() * dailyTips.length)];

  const mailOptions = {
    from: '"MindEase" <hello@mindease.app>',
    to: toEmail,
    subject: `MindEase Daily: ${tip.title}`,
    text: `Hello ${userName},\n\n${tip.body}\n\nStay mindful,\nThe MindEase Team`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #8ab4c8;">${tip.title}</h2>
        <p>Hello ${userName},</p>
        <p style="font-size: 16px; line-height: 1.5;">${tip.body}</p>
        
        <div style="margin-top: 30px;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="background-color: #7c9e8a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Open MindEase</a>
        </div>
        
        <p style="margin-top: 40px; font-size: 12px; color: #999;">You are receiving this email because you are registered with MindEase.</p>
      </div>
    `
  };

  try {
    await sendMailHelper(mailOptions);
    console.log("Daily Engagement Email sent to %s", toEmail);
  } catch (err) {
    console.error("Error sending daily engagement email:", err);
  }
}

async function sendCrisisAlertEmail(parentalContacts, otherContacts, userName, triggeringMessage, userGender) {
  await initTransporter();

  const targets = [];
  const seenEmails = new Set();

  (parentalContacts || []).forEach(c => {
    if (c.email) {
      const emailNorm = c.email.toLowerCase().trim();
      if (!seenEmails.has(emailNorm)) {
        seenEmails.add(emailNorm);
        targets.push({
          email: c.email,
          name: "Parent / Guardian",
          relation: "Parent/Guardian"
        });
      }
    }
  });
  (otherContacts || []).forEach(c => {
    if (c.email) {
      const emailNorm = c.email.toLowerCase().trim();
      if (!seenEmails.has(emailNorm)) {
        seenEmails.add(emailNorm);
        targets.push({
          email: c.email,
          name: c.name || "Family Member / Friend",
          relation: c.relation || "Support Contact"
        });
      }
    }
  });

  if (targets.length === 0) {
    console.log("Crisis alert: no contacts to notify.");
    return false;
  }

  let sentCount = 0;
  for (const target of targets) {
    const { email, name, relation } = target;
    const relationLower = relation.toLowerCase();

    // Determine the user's relationship relative to the recipient
    let relationshipToUser = relationLower;
    const isParentRelation = ["parent/guardian", "parent", "guardian", "father", "mother"].includes(relationLower);
    if (isParentRelation) {
      if (userGender === "Male") {
        relationshipToUser = "son";
      } else if (userGender === "Female") {
        relationshipToUser = "daughter";
      } else {
        relationshipToUser = "child";
      }
    }

    const mailOptions = {
      from: '"MindEase Crisis Support" <hello@mindease.app>',
      to: email,
      subject: `⚠️ Urgent: Please talk with ${userName} (${relation} Alert)`,
      text: `Dear ${relation},\n\nThis is an automated crisis support message from MindEase AI.\n\nYour ${relationshipToUser}, ${userName}, is currently showing signs of severe emotional distress during their session.${triggeringMessage ? `\n\nRecent message entry that triggered this alert:\n"${triggeringMessage}"` : ''}\n\nAs their ${relation}, please reach out to them immediately to help handle this crisis and talk with them.\n\nHelplines:\n• iCall: 9152987821\n• Vandrevala Foundation: 1860-2662-345\n\nWith care,\nThe MindEase Team`,
      html: `
        <div style="font-family: sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; color: #333; border-radius: 12px; border: 2px solid #e85060;">
          <div style="background: linear-gradient(135deg,#e85060,#c04080); border-radius: 10px 10px 0 0; padding: 20px 24px; text-align: center; margin: -24px -24px 24px;">
            <h2 style="color:#fff; margin:0; font-size:20px;">⚠️ MindEase Support Alert</h2>
            <p style="color:rgba(255,255,255,0.85); margin:6px 0 0; font-size:14px;">Please talk with ${userName} right now</p>
          </div>

          <p style="font-size:15px; line-height:1.6;">Dear ${relation},</p>
          <p style="font-size:15px; line-height:1.6;">
            This is an urgent automated alert from <strong>MindEase AI</strong>.<br><br>
            Your <strong>${relationshipToUser}</strong>, <strong>${userName}</strong>, is currently experiencing significant emotional distress and has shown signs of a mental health crisis during their MindEase session.
          </p>

          ${triggeringMessage ? `
          <div style="background:#f7f9fa; border:1px solid #e1e8ed; border-radius:8px; padding:14px 18px; margin:15px 0; font-style:italic; color:#555; text-align:left;">
            <strong>Recent entry that triggered this alert:</strong><br>
            "${triggeringMessage}"
          </div>
          ` : ''}

          <div style="background:#fff5f5; border-left:4px solid #e85060; border-radius:6px; padding:16px 20px; margin:20px 0;">
            <h3 style="margin:0 0 8px; color:#c04080; font-size:15px;">💙 How you can help handle this crisis</h3>
            <ul style="margin:0; padding-left:18px; line-height:1.8; font-size:14px;">
              <li><strong>Talk with ${userName} immediately</strong> — call, text, or visit to let them know they are not alone.</li>
              <li>Listen with open empathy and without judgment.</li>
              <li>Encourage them to connect with support resources or a professional.</li>
              <li>If they appear to be in immediate danger, contact local emergency services.</li>
            </ul>
          </div>

          <div style="background:#f0f8f5; border-radius:8px; padding:16px 20px; margin:20px 0;">
            <h3 style="margin:0 0 10px; color:#2d7a5a; font-size:14px;">🆘 Crisis Helplines (India)</h3>
            <p style="margin:0; font-size:14px; line-height:1.8;">
              <strong>iCall:</strong> <a href="tel:9152987821" style="color:#e85060;">9152987821</a><br>
              <strong>Vandrevala Foundation:</strong> <a href="tel:18602662345" style="color:#e85060;">1860-2662-345</a> (24×7)<br>
              <strong>Website:</strong> <a href="https://www.vandrevalafoundation.com/" style="color:#7c9e8a;">vandrevalafoundation.com</a>
            </p>
          </div>

          <p style="font-size:13px; color:#888; margin-top:30px;">
            You are receiving this automated safety alert because ${userName} listed you as their <strong>${relation}</strong> in MindEase.<br>
            Please do not reply directly to this automated email.
          </p>
          <p style="margin-top:10px;"><strong>With care,<br>The MindEase Team 🌿</strong></p>
        </div>
      `
    };

    try {
      await sendMailHelper(mailOptions);
      console.log(`🚨 Crisis alert email sent to ${email} (Relation: ${relation})`);
      sentCount++;
    } catch (err) {
      console.error(`Error sending crisis email to ${email}:`, err);
    }
  }
  return sentCount > 0;
}

module.exports = {
  sendWelcomeEmail,
  sendDailyEngagementEmail,
  sendCrisisAlertEmail,
};
