import Image from "next/image";
import styled from "@emotion/styled";

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-block: ${({ theme }) => theme.spacing[4]};
  ${({ theme }) => theme.mobile} {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing[4]};
  }
`;

const ImageWrapper = styled.div`
  width: 320px;
  aspect-ratio: 1.6/1;
  position: relative;
  border-radius: ${({ theme }) => theme.borderRadius[4]};
  overflow: hidden;
  ${({ theme }) => theme.mobile} {
    width: 100%;
  }
  ${({ theme }) => theme.tablet} {
    width: 50%;
  }
`;

const Caption = styled.h3`
  flex: 1;
  color: ${({ theme }) => theme.colors.grey};
  text-align: center;
`;

const ImageWithCaption = ({
  imageName,
  caption,
}: {
  imageName: string;
  caption: string;
}) => {
  return (
    <Wrapper>
      <ImageWrapper>
        <Image
          src={`/images/${imageName}`}
          alt="imageName"
          fill
          objectFit="cover"
        />
      </ImageWrapper>
      <Caption>{caption}</Caption>
    </Wrapper>
  );
};

export default ImageWithCaption;
