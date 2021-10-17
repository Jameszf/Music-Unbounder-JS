
const nodemailer = require("nodemailer");


function formatInfoEmail(data) {
    /*
      data is combination of student and registered info 
      of the same person. 
      
      same property names as the firestore docs.
      + is_student 
    */
    const regKeys = [
        "Name",
        "Guardian",
        "Instrument",
        "Email",
        "Platform",
        "Phone",
        "Statement",
        "Delivery",
        "Joined_On",        
    ]

    const studKeys = [
        "Begin_Date",
        "End_Date",
        "Notes",
    ]

    const teacherKeys = [
        "Teacher_Name",
    ]

    const mapping = {
        "Begin_Date": "Begin Date",
        "End_Date": "End Date",
        "Joined_On": "Joined On",
    }

    let str = "<b>Personal Information</b><br>"
    for (let key of regKeys) {
        const value = data[key] ? data[key] : "N/A"
        str += `${key}: ${value}<br>`
    }

    if (data["is_student"]) {
        str += "<br><b>Lessons Info</b><br>"
        for (let key of studKeys) {
            const value = data[key] ? data[key] : "N/A"
            str += `${key}: ${value}<br>`
        }

        str += "<br><b>Teacher Info</b><br>"
        for (let key of teacherKeys) {
            const value = data[key] ? data[key] : "N/A"
            str += `${key}: ${value}<br>`
        }
    }
        
    return str
}


async function sendEmail(destEmail, email) {
    // 465 (SSL) secure: true
    // 587 (TLS) secure: false
    let config
    if (process.env.PRODUCTION == "true") {
        config = {
            host: "smtp.gmail.com",
            port: 465,
            secure: true, 
            auth: {
                user: process.env.NOREPLY_USER, 
                pass: process.env.NOREPLY_PASS, 
            },
        }
    } else {
        // Using ethereal.email email to send mail.
        config = {
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: process.env.TEST_EMAIL_USER, 
                pass: process.env.TEST_EMAIL_PASS, 
            },
        }
    }

    transporter = nodemailer.createTransport(config);
    console.log(`[EMAIL] Sending ${email.subject} to ${email.body}`)
    let info = await transporter.sendMail({
        from: process.env.NOREPLY_USER, // sender address
        to: destEmail, // list of receivers
        subject: email.subject, // Subject line
        text: email.body, // plain text body
        html: email.body, // html body
    });

    if (process.env.PRODUCTION == "false") {
        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
}


module.exports = {
    sendEmail,
    formatInfoEmail,
}

