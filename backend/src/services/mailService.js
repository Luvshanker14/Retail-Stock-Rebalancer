const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendLowStockAlert(productName, quantity, storeId, store_name, admin_email) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: admin_email,
    subject: `⚠️ Low Stock Alert: ${productName} at ${store_name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ef4444; margin: 0;">⚠️ Low Stock Alert</h1>
          <p style="color: #6b7280; margin: 10px 0;">Retail Stock Rebalancer</p>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.08);">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Attention Required!</h2>
          <p style="color: #b91c1c; font-weight: bold; margin-bottom: 20px;">The following product is running low at your store and needs urgent restocking:</p>
          <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 20px; border-radius: 10px; margin-bottom: 25px; border-left: 4px solid #f59e0b;">
            <ul style="color: #92400e; font-size: 15px; margin: 0; padding-left: 20px;">
              <li><strong>Product:</strong> ${productName}</li>
              <li><strong>Store:</strong> ${store_name} (ID: ${storeId})</li>
              <li><strong>Quantity Left:</strong> <span style="color: #b91c1c; font-weight: bold;">${quantity} units</span></li>
            </ul>
          </div>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="color: #4b5563; margin: 0; font-size: 15px;">
              <strong>Action Required:</strong> Please restock this item as soon as possible to avoid stockouts and lost sales.
            </p>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">Timestamp: ${new Date().toLocaleString()}</p>
        </div>
        <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px;">
          <p>This is an automated email. Please do not reply.</p>
          <p>&copy; 2024 Retail Stock Rebalancer. All rights reserved.</p>
        </div>
      </div>
    `
  });
}

async function sendOTP(email, otp, name) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `🔐 Verify Your Email - Retail Stock Rebalancer`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4f46e5; margin: 0;">🔐 Email Verification</h1>
          <p style="color: #6b7280; margin: 10px 0;">Welcome to Retail Stock Rebalancer</p>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Hello ${name}! 👋</h2>
          
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 25px;">
            Thank you for signing up with Retail Stock Rebalancer. To complete your registration, please verify your email address using the OTP below:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background: linear-gradient(135deg, #4f46e5, #06b6d4); color: white; padding: 20px; border-radius: 10px; display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 5px; min-width: 200px;">
              ${otp}
            </div>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
            <strong>Important:</strong> This OTP will expire in 10 minutes for security reasons.
          </p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="color: #4b5563; margin: 0; font-size: 14px;">
              <strong>Security Tips:</strong>
            </p>
            <ul style="color: #6b7280; font-size: 14px; margin: 10px 0; padding-left: 20px;">
              <li>Never share this OTP with anyone</li>
              <li>Our team will never ask for your OTP</li>
              <li>If you didn't request this, please ignore this email</li>
            </ul>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px;">
          <p>This is an automated email. Please do not reply.</p>
          <p>&copy; 2024 Retail Stock Rebalancer. All rights reserved.</p>
        </div>
      </div>
    `
  });
}

async function sendApprovalEmail(email, name, planName, planPrice, setupLink) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `🎉 Congratulations! Your Supplier Account Has Been Approved - Retail Stock Rebalancer`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #10b981; margin: 0;">🎉 Account Approved!</h1>
          <p style="color: #6b7280; margin: 10px 0;">Welcome to Retail Stock Rebalancer</p>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Hello ${name}! 👋</h2>
          
          <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
            <h3 style="margin: 0; font-size: 18px;">🎯 Your supplier account has been successfully approved!</h3>
          </div>
          
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            We're excited to welcome you to our platform. Your application has been reviewed and approved by our team.
          </p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #1f2937; margin: 0 0 15px 0;">📋 Account Details:</h4>
            <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
              <li><strong>Name:</strong> ${name}</li>
              <li><strong>Plan:</strong> ${planName}</li>
              <li><strong>Price:</strong> ₹${planPrice}</li>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Status:</strong> Active</li>
            </ul>
          </div>
          
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h4 style="color: #1f2937; margin: 0 0 15px 0;">🔐 Secure Password Setup:</h4>
            <p style="color: #4b5563; margin: 0 0 15px 0;">
              To ensure the security of your account, you need to set up your password using the secure link below. This link will expire in 24 hours.
            </p>
            <p style="color: #dc2626; font-size: 14px; margin: 0;"><strong>⚠️ Important:</strong> Please set up your password immediately to access your dashboard.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${setupLink}" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              🔐 Set Up Your Password
            </a>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h4 style="color: #92400e; margin: 0 0 10px 0;">📝 Next Steps:</h4>
            <ol style="color: #92400e; margin: 0; padding-left: 20px;">
              <li>Click the "Set Up Your Password" button above</li>
              <li>Create a secure password for your account</li>
              <li>You'll be redirected to the login page</li>
              <li>Login with your email and new password</li>
              <li>Start managing your store inventory!</li>
            </ol>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="color: #4b5563; margin: 0; font-size: 14px;">
              <strong>Security Note:</strong> This setup link is unique to your account and will expire in 24 hours. If you need a new link, please contact our support team.
            </p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="color: #4b5563; margin: 0; font-size: 14px;">
              <strong>Need Help?</strong> If you have any questions or need assistance, please don't hesitate to contact our support team.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px;">
          <p>This is an automated email. Please do not reply.</p>
          <p>&copy; 2024 Retail Stock Rebalancer. All rights reserved.</p>
        </div>
      </div>
    `
  });
}

async function sendRejectionEmail(email, name, companyName, notes) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `📋 Application Update - Retail Stock Rebalancer`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #6b7280; margin: 0;">📋 Application Update</h1>
          <p style="color: #6b7280; margin: 10px 0;">Retail Stock Rebalancer</p>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Hello ${name},</h2>
          
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            Thank you for your interest in joining Retail Stock Rebalancer as a supplier. We have carefully reviewed your application for <strong>${companyName}</strong>.
          </p>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <h4 style="color: #991b1b; margin: 0 0 15px 0;">📋 Application Status:</h4>
            <p style="color: #991b1b; margin: 0; font-weight: bold;">Unfortunately, we are unable to approve your application at this time.</p>
          </div>
          
          ${notes ? `
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="color: #1f2937; margin: 0 0 10px 0;">📝 Feedback:</h4>
            <p style="color: #4b5563; margin: 0; font-style: italic;">"${notes}"</p>
          </div>
          ` : ''}
          
          <div style="background-color: #eff6ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="color: #1f2937; margin: 0 0 10px 0;">🔄 What's Next?</h4>
            <p style="color: #4b5563; margin: 0; line-height: 1.6;">
              You are welcome to submit a new application in the future. We encourage you to review the feedback provided and address any concerns before reapplying.
            </p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="color: #4b5563; margin: 0; font-size: 14px;">
              <strong>Questions?</strong> If you have any questions about this decision or would like to discuss your application further, please don't hesitate to contact our support team.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px;">
          <p>This is an automated email. Please do not reply.</p>
          <p>&copy; 2024 Retail Stock Rebalancer. All rights reserved.</p>
        </div>
      </div>
    `
  });
}

async function sendPurchaseConfirmation(customerName, customerEmail, purchaseDetails) {
  const { stockName, storeName, quantity, totalAmount, orderId, purchaseDate } = purchaseDetails;
  
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: customerEmail,
    subject: `🎉 Purchase Confirmed! Thank you for your order - Retail Stock Rebalancer`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #10b981; margin: 0;">🎉 Purchase Confirmed!</h1>
          <p style="color: #6b7280; margin: 10px 0;">Thank you for your order</p>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Hello ${customerName}! 👋</h2>
          
          <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
            <h3 style="margin: 0; font-size: 18px;">✅ Your purchase has been successfully completed!</h3>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #1f2937; margin: 0 0 15px 0;">📋 Order Details:</h4>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #4b5563;"><strong>Order ID:</strong></td>
                <td style="padding: 8px 0; color: #1f2937;">${orderId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #4b5563;"><strong>Product:</strong></td>
                <td style="padding: 8px 0; color: #1f2937;">${stockName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #4b5563;"><strong>Store:</strong></td>
                <td style="padding: 8px 0; color: #1f2937;">${storeName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #4b5563;"><strong>Quantity:</strong></td>
                <td style="padding: 8px 0; color: #1f2937;">${quantity}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #4b5563;"><strong>Total Amount:</strong></td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">₹${totalAmount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #4b5563;"><strong>Purchase Date:</strong></td>
                <td style="padding: 8px 0; color: #1f2937;">${new Date(purchaseDate).toLocaleString()}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #eff6ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h4 style="color: #1f2937; margin: 0 0 10px 0;">📦 What's Next?</h4>
            <p style="color: #4b5563; margin: 0; line-height: 1.6;">
              Your order has been processed successfully. You can now visit the store to collect your items or contact the store for delivery options.
            </p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h4 style="color: #92400e; margin: 0 0 10px 0;">💡 Pro Tip:</h4>
            <p style="color: #92400e; margin: 0; line-height: 1.6;">
              Keep this email for your records. You can also view your purchase history in your account dashboard.
            </p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="color: #4b5563; margin: 0; font-size: 14px;">
              <strong>Need Help?</strong> If you have any questions about your order, please don't hesitate to contact our support team or the store directly.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px;">
          <p>This is an automated email. Please do not reply.</p>
          <p>&copy; 2024 Retail Stock Rebalancer. All rights reserved.</p>
        </div>
      </div>
    `
  });
}

module.exports = { sendLowStockAlert, sendOTP, sendApprovalEmail, sendRejectionEmail, sendPurchaseConfirmation };
