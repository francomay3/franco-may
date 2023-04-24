import React from "react";
import { useState } from "react";
import { sendMail } from "@/utils/mailUtils";

const ContactForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [serverStatus, setServerStatus] = useState("notSent");

  const handleSubmit = (e: any) => {
    e.preventDefault();
    const data = {
      name,
      email,
      message,
    };

    sendMail(data)
      .then(() => {
        setServerStatus("sent");
        return true;
      })
      .catch(() => {
        setServerStatus("error");
        return false;
      });
  };

  const form = (
    <div>
      <form>
        <label htmlFor="name">Name</label>
        <input
          name="name"
          onChange={(e) => setName(e.target.value)}
          type="text"
          value={name}
        />
        <label htmlFor="email">Email</label>
        <input
          name="email"
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          value={email}
        />
        <label htmlFor="message">Message</label>
        <input
          name="message"
          onChange={(e) => setMessage(e.target.value)}
          type="text"
          value={message}
        />
        <input onClick={handleSubmit} type="submit" value="Submit" />
      </form>
    </div>
  );

  const success = (
    <div>
      <p>Thanks for your message!</p>
    </div>
  );

  const error = (
    <div>
      <p>There was an error sending your message. Please try again later.</p>
    </div>
  );

  return (
    <>
      {serverStatus === "notSent" && form}
      {serverStatus === "sent" && success}
      {serverStatus === "error" && error}
    </>
  );
};

export default ContactForm;
