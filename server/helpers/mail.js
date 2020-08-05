const nodemailer = require('nodemailer');
const config = require('../../config/config.js');

class MailHandler {
  constructor(SMTPData) {
    this.transporter = nodemailer.createTransport({
      host: SMTPData.host,
      port: SMTPData.port,
      secure: false,
      auth: {
        user: SMTPData.user,
        pass: SMTPData.pass
      }
    });
  }
  // TODO: Order Fulfillment, Reset Password
  sendVerification(userInfo) {
    this.transporter.sendMail({
      from: '"Naylor\'s Farm and Ranch Supply" <postmaster@sandboxe6e4322cf56f419485b531ed51a5a1c8.mailgun.org>', // sender address
      to: userInfo.email, // list of receivers
      subject: "Verify your Email with Naylor's Online", // Subject line
      html:
`<h2>Thank you for making an account with Naylor's Farm and Ranch Supply's Online Service!</h2>\
<br>Please verify that this email is accurate using the link provided below.<br>\
<a href="http://localhost:4040/api/auth/verify/${userInfo.verification}">http://localhost:4040/api/auth/verify/${userInfo.verification}</a>`, // html body
    }).catch(err => new Error(err));
  }
}

module.exports = new MailHandler(config.smtp);
