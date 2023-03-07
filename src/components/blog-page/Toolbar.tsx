import styled from "@emotion/styled";
import Icon from "@/components/Icon";

const Toolbar = styled.div`
  display: flex;
  background-color: ${({ theme }) => theme.colors.lightGrey};
  padding: 4px;
  border-radius: 4px;
`;

const ToolbarButton = styled.button`
  background-color: ${({ theme }) => theme.colors.white};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  aspect-ratio: 4/3;
  border: 1px solid ${({ theme }) => theme.colors.grey};
  &:not(:last-child) {
    border-right: none;
  }
  &:last-child {
    border-start-end-radius: 4px;
    border-end-end-radius: 4px;
  }
  &:first-child {
    border-start-start-radius: 4px;
    border-end-start-radius: 4px;
  }
  &:hover {
    background-color: ${({ theme }) => theme.colors.lightGrey};
  }
`;

const Component = () => {
  return (
    <Toolbar>
      {["bold", "italic", "underline", "strikeThrough"].map((id) => (
        <ToolbarButton
          onClick={() => {
            window.document.execCommand(id);
          }}
        >
          <Icon id={id} />
        </ToolbarButton>
      ))}
    </Toolbar>
  );
};

export default Component;
