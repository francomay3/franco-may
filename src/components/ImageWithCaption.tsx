import Image from "next/image";
import styled from "@emotion/styled";
import { useTheme } from "@emotion/react";
import { EditButton } from "./blog-page/ActionButtons";
import { useState } from "react";

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

const ImageWrapper = styled.div<{ isEditingEnabled?: boolean }>`
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
  cursor: ${({ isEditingEnabled }) =>
    isEditingEnabled ? "pointer" : "default"};
`;

const ImageWithCaption = ({
  imageName,
  caption = "Hmm. Can't find that image.",
  url = "/images/lostDuck.gif",
  isEditingEnabled,
  onChange = () => null,
  onImageClick,
}: {
  imageName: string;
  caption?: string;
  url: string;
  isEditingEnabled?: boolean;
  onChange?: (value: string) => any;
  onImageClick?: () => any;
}) => {
  const theme = useTheme();
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  return (
    <Wrapper>
      <ImageWrapper isEditingEnabled={isEditingEnabled}>
        <Image
          onMouseEnter={() => {
            setIsHoveringImage(true);
          }}
          onMouseLeave={() => setIsHoveringImage(false)}
          alt={imageName}
          draggable={!isEditingEnabled}
          fill
          loader={({ src }) => src}
          objectFit="cover"
          onClick={isEditingEnabled ? onImageClick : undefined}
          sizes="(max-width: 640px) 100vw, 320px"
          src={url || `/images/${imageName}`}
        />
        {isHoveringImage && (
          <EditButton
            style={{
              position: "absolute",
              top: "0.8rem",
              right: "0.8rem",
            }}
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
