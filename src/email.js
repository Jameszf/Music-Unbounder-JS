const nodemailer = require("nodemailer");


async function sendEmail(destEmail, email) {
    let transporter
    // 465 (SSL) secure: true
    // 587 (TLS) secure: false
    if (process.env.PRODUCTION) {
        transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true, 
            auth: {
                user: process.env.NOREPLY_USER, 
                pass: process.env.NOREPLY_PASS, 
            },
        });
    } else {
        // Using ethereal.email email to send mail.
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: process.env.TEST_EMAIL_USER, 
                pass: process.env.TEST_EMAIL_PASS, 
            },
        });
    }

    console.log(`[EMAIL] Sending ${email.subject} to ${email.body}`)
    let info = await transporter.sendMail({
        from: process.env.NOREPLY_USER, // sender address
        to: destEmail, // list of receivers
        subject: email.subject, // Subject line
        text: email.body, // plain text body
        html: email.body, // html body
    });
}


module.exports = {
    sendEmail
}

