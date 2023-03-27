import styled from "@emotion/styled";
import { useTheme } from "@emotion/react";
import EditableImage from "./EditableImage";
import { ImageData } from "@/utils/types";

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
  isEditingEnabled,
  onCaptionChange = () => null,
  onSelect = () => null,
}: {
  imageName: string;
  caption?: string;
  url: string;
  isEditingEnabled?: boolean;
  onCaptionChange?: (value: string) => void;
  onSelect?: (image: ImageData) => void;
}) => {
  const theme = useTheme();
  return (
    <Wrapper>
      <EditableImage
        isEditingEnabled={isEditingEnabled}
        name={imageName}
        onSelect={onSelect}
        src={url}
      />
      <figcaption
        style={{ flex: "1", color: theme.colors.grey, textAlign: "center" }}
      >
        <h3
          contentEditable={isEditingEnabled}
          dangerouslySetInnerHTML={{ __html: caption }}
          onBlur={(e) => onCaptionChange(e.target.innerHTML)}
          suppressContentEditableWarning={true}
        />
      </figcaption>
    </Wrapper>
  );
};

export default ImageWithCaption;
