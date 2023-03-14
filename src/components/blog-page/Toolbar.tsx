import styled from "@emotion/styled";
import Icon from "@/components/Icon";
import { IconId } from "@/utils/types";

const Wrapper = styled.div`
  background-color: ${({ theme }) => theme.colors.lightGrey};
  padding: 4px;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 1;
`;

const ButtonGroup = styled.div`
  display: flex;
`;

const ButtonWrapper = styled.button`
  background-color: ${({ theme }) => theme.colors.white};
  display: flex;
  gap: ${({ theme }) => theme.spacing[1]};
  align-items: center;
  justify-content: center;
  min-width: ${({ theme }) => theme.spacing[5]};
  height: 1.875rem;
  padding-inline: ${({ theme }) => theme.spacing[2]};
  border: 1px solid ${({ theme }) => theme.colors.grey};
  &:not(:last-child) {
    border-right: none;
  }
  &:last-of-type {
    border-start-end-radius: 4px;
    border-end-end-radius: 4px;
  }
  &:first-of-type {
    border-start-start-radius: 4px;
    border-end-start-radius: 4px;
  }
  &:hover {
    background-color: ${({ theme }) => theme.colors.lightGrey};
  }
`;

interface ButtonProps {
  iconId: IconId;
  onMouseDown?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  text?: string;
}

const Button = ({ iconId, onMouseDown, text }: ButtonProps) => {
  return (
    <ButtonWrapper onMouseDown={onMouseDown}>
      <Icon id={iconId} />
      {text}
    </ButtonWrapper>
  );
};

const preventDefault = (
  e: React.MouseEvent<HTMLDivElement | HTMLButtonElement, MouseEvent>
) => {
  e.preventDefault();
  e.stopPropagation();
};

interface ToolbarProps {
  hasUnsavedChanges: boolean;
  save: () => void;
  published: boolean;
}

const ToolbarButtons = [
  "bold",
  "italic",
  "underline",
  "strikeThrough",
] as const;

const Toolbar = ({ hasUnsavedChanges, save, published }: ToolbarProps) => {
  return (
    <Wrapper>
      <ButtonGroup>
        {ToolbarButtons.map((id: IconId) => (
          <Button
            key={id}
            onMouseDown={(e) => {
              preventDefault(e);
              window.document.execCommand(id);
            }}
            iconId={id}
          />
        ))}
      </ButtonGroup>
      <ButtonGroup>
        {hasUnsavedChanges && (
          <Button onMouseDown={save} iconId="save" text="Save" />
        )}
        {published ? (
          <Button iconId="invisible" text="Unpublish" />
        ) : (
          <Button iconId="earth" text="Publish" />
        )}
      </ButtonGroup>
    </Wrapper>
  );
};

export default Toolbar;
