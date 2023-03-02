import Image from "next/image";
import styled from "@emotion/styled";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { useState, useEffect } from "react";

const getImage = async (imageName: string) => {
  const url = await getDownloadURL(
    ref(ref(getStorage()), `images/${imageName}`)
  );
  return url;
};

const useImage = (imageName: string) => {
  const [url, setUrl] = useState("/images/musk.webp");
  useEffect(() => {
    getImage(imageName).then((url) => setUrl(url));
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

const Caption = styled.h3`
  flex: 1;
  color: ${({ theme }) => theme.colors.grey};
  text-align: center;
`;

const ImageWithCaption = ({
  imageName,
  caption,
  cloudStorage = false,
}: {
  imageName: string;
  caption: string;
  cloudStorage: boolean;
}) => {
  const url = useImage(imageName);
  return (
    <Wrapper>
      <ImageWrapper>
        {cloudStorage ? (
          <Image
            loader={({ src }) => src}
            src={url}
            alt="imageName"
            fill
            objectFit="cover"
          />
        ) : (
          <Image
            src={`/images/${imageName}`}
            alt="imageName"
            fill
            objectFit="cover"
          />
        )}
      </ImageWrapper>
      <Caption>{caption}</Caption>
    </Wrapper>
  );
};

export default ImageWithCaption;
