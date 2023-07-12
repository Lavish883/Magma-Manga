require('dotenv').config();

const nodeMailer = require('nodemailer');
const transporter = nodeMailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

function sendMail(emailTo, subject, text, attachmentsGiven = []) {
    let mailOptions = {
        from: process.env.EMAIL,
        to: emailTo,
        subject: subject,
        text: text,
        attachments: attachmentsGiven
    };
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                resolve(false);
            } else {
                console.log('Email sent: ' + info.response);
                resolve(true);
            }
        });
    })
}

module.exports = {
    sendMail
}
