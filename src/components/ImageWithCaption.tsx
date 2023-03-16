import Image from "next/image";
import styled from "@emotion/styled";
import { useTheme } from "@emotion/react";

const Wrapper = styled.figure`
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

const ImageWithCaption = ({
  imageName,
  caption = "Hmm. Can't find that image.",
  url = "/images/lostDuck.gif",
  isEditingEnabled,
  onChange = () => null,
}: {
  imageName: string;
  caption?: string;
  url: string;
  isEditingEnabled?: boolean;
  // eslint-disable-next-line @typescript-eslint/ban-types
  onChange?: Function;
}) => {
  const theme = useTheme();
  return (
    <Wrapper>
      <ImageWrapper>
        {url ? (
          <Image
            alt={imageName || "imageName"}
            fill
            loader={({ src }) => src}
            objectFit="cover"
            sizes="(max-width: 640px) 100vw, 320px"
            src={url}
          />
        ) : (
          <Image
            alt={imageName || "imageName"}
            fill
            objectFit="cover"
            src={`/images/${imageName}`}
          />
        )}
      </ImageWrapper>
      <figcaption
        style={{ flex: "1", color: theme.colors.grey, textAlign: "center" }}
      >
        <h3
          contentEditable={isEditingEnabled}
          dangerouslySetInnerHTML={{ __html: caption }}
          onBlur={(e) => onChange(e.target.innerHTML)}
        />
      </figcaption>
    </Wrapper>
  );
};

export default ImageWithCaption;
