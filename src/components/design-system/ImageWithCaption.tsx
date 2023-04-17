import styled from "@emotion/styled";
import { useTheme } from "@emotion/react";
import { EditableImage } from "@/components/design-system";
import { ImageData } from "@/utils/types";
import { useAuth } from "@/providers/AuthProvider";

const Wrapper = styled.figure`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-block: ${({ theme }) => theme.spacing[4]};
  ${({ theme }) => theme.mediaQueries.mobile} {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing[4]};
  }
`;

const ImageWithCaption = ({
  imageName,
  caption = "Hmm. Can't find that image.",
  url = "/images/lostDuck.gif",
  onCaptionChange = () => null,
  onSelect = () => null,
}: {
  imageName: string;
  caption?: string;
  url: string;
  onCaptionChange?: (value: string) => void;
  onSelect?: (image: ImageData) => void;
}) => {
  const theme = useTheme();
  const { isEditing } = useAuth();
  return (
    <Wrapper>
      <EditableImage
        name={imageName}
        onSelect={onSelect}
        src={url}
        wrapperStyles={{
          flex: "1",
        }}
      />
      <figcaption
        style={{ flex: "1", color: theme.colors.grey, textAlign: "center" }}
      >
        <h3
          contentEditable={isEditing}
          dangerouslySetInnerHTML={{ __html: caption }}
          onBlur={(e) => onCaptionChange(e.target.innerHTML)}
          suppressContentEditableWarning={true}
        />
      </figcaption>
    </Wrapper>
  );
};

export default ImageWithCaption;
