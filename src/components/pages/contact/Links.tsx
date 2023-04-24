import React from "react";
import Image from "next/image";
import styled from "@emotion/styled";
import Link from "@/components/design-system/Link";

const data = [
  {
    href: "mailto: francomay3@gmail.com",
    logo: "email",
    filter:
      "invert(60%) sepia(24%) saturate(5106%) hue-rotate(322deg) brightness(100%) contrast(91%)",
  },
  {
    href: "https://api.whatsapp.com/send?phone=46722839861&text=Hello%20there!",
    logo: "whatsapp",
  },
  {
    href: "https://www.linkedin.com/in/francomay/",
    logo: "linkedin",
  },
  {
    href: "tel: +46722839861",
    logo: "phone",
    filter:
      "invert(37%) sepia(29%) saturate(2706%) hue-rotate(257deg) brightness(89%) contrast(91%)",
  },
];

const Wrapper = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 400px;
  padding-inline: 1rem;
  flex-wrap: wrap;
`;

const Links = () => {
  return (
    <Wrapper>
      {data.map(({ href, logo, filter }) => (
        <Link href={href} key={logo} target={"_blank"}>
          <Image
            alt={`${logo}-logo`}
            height="50"
            src={`/logos-pictograms/${logo}.png`}
            style={{
              filter,
            }}
            width="50"
          />
        </Link>
      ))}
    </Wrapper>
  );
};

export default Links;
