import nodemailer from "nodemailer";

async function sendMail(req: any, res: any) {
  const transporter = nodemailer.createTransport({
    port: 465,
    host: "smtp.gmail.com",
    auth: {
      user: "francomay3@gmail.com",
      pass: process.env.GMAIL_PASSWORD,
    },
    secure: true,
  });

  const mailData = {
    from: req.body.email,
    to: "francomay3@gmail.com",
    subject: `franco-may.com | You have a message from ${req.body.name}`,
    html: `<p><b>sender name:</b> ${req.body.name}</p>
    <p><b>sender email:</b> ${req.body.email}</p>
    <p><b>message:</b></p>
    <p> ${req.body.message}</p>`,
  };
  try {
    await transporter.sendMail(mailData);
    res.status(200).json({ status: "success" });
  } catch (error) {
    res.status(500).json({ error: error });
  }
}

export default sendMail;
