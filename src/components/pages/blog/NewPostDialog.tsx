import React, { useState } from "react";
import styled from "@emotion/styled";
import { useRouter } from "next/router";
import Dialog from "../../design-system/Dialog";
import Button from "../../design-system/Button";
import { createPost } from "@/utils/postUtils";
import { SLUG } from "@/utils/constants";

const InputWrapper = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  align-items: center;
`;

const DialogContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const getJustLetters = (str: string) =>
  str
    .replace(/\s/g, "-")
    .replace(/[^a-zA-Z-]/g, "")
    .toLowerCase();

const NewPostDialog = ({
  isDialogOpen,
  setIsDialogOpen,
}: {
  isDialogOpen: boolean;
  setIsDialogOpen: (value: boolean) => void;
}) => {
  const [newPostSlug, setNewPostSlug] = useState("");
  const Router = useRouter();
  return (
    <Dialog
      isDialogOpen={isDialogOpen}
      setIsDialogOpen={setIsDialogOpen}
      title="Add new Post"
    >
      <DialogContent>
        <h3>
          <strong>Beware:</strong> the slug can not be modified in the future.
        </h3>
        <InputWrapper>
          <label htmlFor={SLUG}>Slug:</label>
          <input
            id={SLUG}
            onChange={(e) => setNewPostSlug(getJustLetters(e.target.value))}
            type="text"
            value={newPostSlug}
          />
          <Button
            onClick={async () => {
              await createPost(newPostSlug);
              Router.push(`/blog/${newPostSlug}`);
            }}
          >
            Create
          </Button>
        </InputWrapper>
      </DialogContent>
    </Dialog>
  );
};

export default NewPostDialog;
