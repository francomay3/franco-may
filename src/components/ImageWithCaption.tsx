import Image from "next/image";
import styled from "@emotion/styled";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { useState, useEffect } from "react";
import { useTheme } from "@emotion/react";

const getImage = async (imageName: string) => {
  const url = await getDownloadURL(
    ref(ref(getStorage()), `images/${imageName}`)
  );
  return url;
};

const useImage = (imageName?: string) => {
  const [url, setUrl] = useState("/images/waiting.gif");
  useEffect(() => {
    if (!imageName) return;
    getImage(imageName)
      .then((url) => setUrl(url))
      .catch(() => setUrl("/images/lostDuck.gif"));
  }, [imageName]);
  return url;
};

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

const ImageWithCaption = ({
  imageName,
  caption = "Hmm. Can't find that image.",
  url = "/images/lostDuck.gif",
  isEditingEnabled,
  onChange = () => {},
}: {
  imageName: string;
  caption?: string;
  url: string;
  isEditingEnabled?: boolean;
  onChange?: Function;
}) => {
  const theme = useTheme();
  return (
    <Wrapper>
      <ImageWrapper>
        {url ? (
          <Image
            loader={({ src }) => src}
            src={url}
            alt={imageName || "imageName"}
            fill
            objectFit="cover"
            sizes="(max-width: 640px) 100vw, 320px"
          />
        ) : (
          <Image
            src={`/images/${imageName}`}
            alt={imageName || "imageName"}
            fill
            objectFit="cover"
          />
        )}
      </ImageWrapper>
      <h3
        contentEditable={isEditingEnabled}
        onBlur={(e) => onChange(e.target.innerHTML)}
        style={{ flex: "1", color: theme.colors.grey, textAlign: "center" }}
        dangerouslySetInnerHTML={{ __html: caption }}
      />
    </Wrapper>
  );
};

export default ImageWithCaption;
