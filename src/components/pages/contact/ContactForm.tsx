import React from "react";
import { useState } from "react";
import { sendMail } from "@/utils/mailUtils";
import { Form } from "@/components/design-system";

type FormStatus = "notSent" | "sent" | "serverError" | "validating";

const ContactForm = () => {
  const [formStatus, setFormStatus] = useState<FormStatus>("notSent");

  const handleSubmit = (formData: {
    email: string;
    message: string;
    name: string;
  }) => {
    sendMail(formData)
      .then(() => {
        setFormStatus("sent");
        return true;
      })
      .catch(() => {
        setFormStatus("serverError");
        return false;
      });
  };

  const emailRegexValidation =
    // eslint-disable-next-line no-control-regex
    /(?:[a-z0-9+!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/i;

  return (
    <>
      {(formStatus === "notSent" || formStatus === "validating") && (
        <Form
          fields={[
            {
              label: "Your Name",
              name: "name",
              placeholder: "John Doe",
              required: true,
            },
            {
              label: "E-Mail",
              name: "email",
              placeholder: "johndoe@gmail.com",
              required: true,
              ruleExplanation: "Please enter a valid email address",
              validationRule: emailRegexValidation,
            },
            {
              label: "Message",
              name: "message",
              placeholder: "Your message",
              required: true,
              type: "textarea",
            },
          ]}
          onSubmit={handleSubmit}
        />
      )}
      {formStatus === "sent" && (
        <p>Message delivered! I&apos;ll get back to you ASAP! 😘</p>
      )}
      {formStatus === "serverError" && (
        <p>
          Mmm... That&apos;s weird. 🤔 There seems to be an issue with the
          contact form. Please try one of the alternatives methods. 🙏
        </p>
      )}
    </>
  );
};

export default ContactForm;
