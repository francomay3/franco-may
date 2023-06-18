import styled from "@emotion/styled";
import { Icon, Inline } from "@/components/design-system";
import { IconId } from "@/utils/types";

const Wrapper = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  padding: 4px;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  position: fixed;
  top: 4rem;
  width: 100vw;
  left: 0;
  z-index: ${({ theme }) => theme.zIndex.sticky};
`;

const ButtonWrapper = styled.button`
  background-color: ${({ theme }) => theme.colors.white};
  display: flex;
  gap: 0.25rem;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.875rem;
  padding-inline: 0.5rem;
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
    background-color: ${({ theme }) => theme.colors.background};
  }
`;

interface ButtonProps {
  iconId: IconId;
  onClick?: () => void;
  onMouseDown?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  text?: string;
}

const Button = ({ iconId, onMouseDown, text, onClick }: ButtonProps) => {
  return (
    <ButtonWrapper onClick={onClick} onMouseDown={onMouseDown}>
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
  onPublish: () => void;
}

const ToolbarButtons = [
  "bold",
  "italic",
  "underline",
  "strikeThrough",
] as const;

const Toolbar = ({
  onPublish,
  hasUnsavedChanges,
  save,
  published,
}: ToolbarProps) => {
  return (
    <Wrapper>
      <Inline gap="0">
        {ToolbarButtons.map((id: IconId) => (
          <Button
            iconId={id}
            key={id}
            onMouseDown={(e) => {
              preventDefault(e);
              window.document.execCommand(id);
            }}
          />
        ))}
      </Inline>
      <Inline gap="0">
        {hasUnsavedChanges && (
          <Button iconId="save" onMouseDown={save} text="Save" />
        )}
        <Button
          iconId={published ? "invisible" : "earth"}
          onClick={onPublish}
          text={published ? "Unpublish" : "Publish"}
        />
      </Inline>
    </Wrapper>
  );
};

export default Toolbar;
