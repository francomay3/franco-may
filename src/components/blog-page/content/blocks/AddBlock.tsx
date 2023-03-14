import styled from "@emotion/styled";
import { PlusButton } from "../../ActionButtons";

const Wrapper = styled.div`
  height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

function AddBlock({ onClick }: { onClick: () => void }) {
  return (
    <Wrapper>
      <PlusButton onClick={onClick} />
    </Wrapper>
  );
}

export default AddBlock;
