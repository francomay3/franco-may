import styled from "@emotion/styled";
import Links from "./Links";
import ContactForm from "./ContactForm";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  width: 100%;
  margin-block: 2rem;
`;

const Contact = () => {
  return (
    <Wrapper>
      <h1>Contact Me!</h1>
      <ContactForm />
      <h2>Or try any of the below methods:</h2>
      <Links />
    </Wrapper>
  );
};

export default Contact;
