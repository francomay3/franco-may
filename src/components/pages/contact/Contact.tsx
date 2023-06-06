import styled from "@emotion/styled";
import Links from "./Links";
import ContactForm from "./ContactForm";
import { EditableImage, Section } from "@/components/design-system";

const Wrapper = styled(Section)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  width: 100%;
  margin-block: 2rem;
`;

const Data = styled.div`
  height: min-content;
  display: grid;
  grid-template-columns: 60px 3fr;
  gap: 1rem;
  width: 300px;
  margin-block: auto;
  p {
    margin: 0;
  }
`;

const DataAndForm = styled.div`
  display: grid;
  grid-template-columns: 1fr 1px 3fr;
  gap: 1rem;
  ${({ theme }) => theme.mediaQueries.mobileAndTablet} {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 2rem;
  }
`;

const Separator = styled.div`
  width: 1px;
  height: 100%;
  border-left: 1px solid ${({ theme }) => theme.colors.grey6};
  border-top: 1px solid ${({ theme }) => theme.colors.grey6};
  ${({ theme }) => theme.mediaQueries.mobileAndTablet} {
    width: 100%;
    height: 1px;
  }
`;

const ImageAndData = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Contact = () => {
  return (
    <Wrapper>
      <h1>Let&apos;s get in touch!</h1>
      <DataAndForm>
        <ImageAndData>
          <EditableImage
            name="franco's face"
            src="/images/face.jpeg"
            wrapperStyles={{
              width: "200px",
              aspectRatio: "1 / 1",
              marginInline: "auto",
              borderRadius: "50%",
            }}
          />
          <Data>
            <b>name:</b> <p>Franco May</p>
            <b>email:</b> <p>francomay3@gmail.com</p>
            <b>phone:</b> <p>+64 722 839 861</p>
            <b>location:</b> <p>Gothenburg, Sweden 🇸🇪</p>
          </Data>
        </ImageAndData>
        <Separator />
        <ContactForm />
      </DataAndForm>
      <h2>Or click on one of the lazy-man&apos;s buttons! 😄</h2>
      <Links />
    </Wrapper>
  );
};

export default Contact;
