import React from "react";
import { useState } from "react";
import styled from "@emotion/styled";
import { useTheme } from "@emotion/react";
import { sendMail } from "@/utils/mailUtils";
import {
  Button,
  EmailInput,
  Label,
  Textarea,
  TextInput,
} from "@/components/design-system";

const Form = styled.form`
  max-width: 750px;
  display: grid;
  grid-template-columns: auto 2fr;
  grid-gap: 1rem;
  width: 100%;
  align-items: center;
  ${(props) => props.theme.mediaQueries.mobile} {
    grid-template-columns: 1fr;
    label {
      margin-bottom: -0.5rem;
    }
  }
`;

type FormStatus = "notSent" | "sent" | "serverError" | "validating";

const ContactForm = () => {
  const theme = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [formStatus, setFormStatus] = useState<FormStatus>("notSent");

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!name || !email || !message) {
      return setFormStatus("validating");
    }
    const data = {
      name,
      email,
      message,
    };

    sendMail(data)
      .then(() => {
        setFormStatus("sent");
        return true;
      })
      .catch(() => {
        setFormStatus("serverError");
        return false;
      });
  };

  const form = (
    <>
      {formStatus === "validating" && (!name || !email || !message) && (
        <p>
          Please fill the
          <b
            style={{
              color: theme.colors.danger,
            }}
          >
            {!name ? " name " : !email ? " email " : " message "}
          </b>
          field! 🙏
        </p>
      )}
      <Form>
        <Label htmlFor="name">Name:</Label>
        <TextInput
          name="name"
          onChange={(e) => setName(e.target.value)}
          value={name}
        />
        <Label htmlFor="email">Email:</Label>
        <EmailInput
          name="email"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />
        <Label htmlFor="message">Message:</Label>
        <Textarea
          name="message"
          onChange={(e) => setMessage(e.target.value)}
          style={{ height: "10rem" }}
          value={message}
        />
        <Button
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleSubmit(e)}
          type="submit"
          value="Submit"
        />
      </Form>
    </>
  );

  const success = <p>Message delivered! I&apos;ll get back to you ASAP! 😘</p>;

  const error = (
    <p>
      Mmm... That&apos;s weird. 🤔 There seems to be an issue with the contact
      form. Please try one of the alternatives methods. 🙏
    </p>
  );

  return (
    <>
      {(formStatus === "notSent" || formStatus === "validating") && form}
      {formStatus === "sent" && success}
      {formStatus === "serverError" && error}
    </>
  );
};

export default ContactForm;
