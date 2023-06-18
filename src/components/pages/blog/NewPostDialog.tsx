import React, { useState } from "react";
import { useRouter } from "next/router";
import Dialog from "../../design-system/Dialog";
import Button from "../../design-system/Button";
import { createPost } from "@/utils/postUtils";
import { SLUG } from "@/utils/constants";
import { Inline, Stack } from "@/components/design-system";

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
      <Stack gap="0.5rem">
        <h3>
          <strong>Beware:</strong> the slug can not be modified in the future.
        </h3>
        <Inline gap="0.5rem" style={{ alignItems: "center" }}>
          <label htmlFor={SLUG}>Slug:</label>
          <input
            id={SLUG}
            onChange={(e) => setNewPostSlug(getJustLetters(e.target.value))}
            type="text"
            value={newPostSlug}
          />
          <Button
            onClick={async () => {
              const success = await createPost(newPostSlug);
              if (success) {
                Router.push(`/blog/${newPostSlug}`);
              }
            }}
          >
            Create
          </Button>
        </Inline>
      </Stack>
    </Dialog>
  );
};

export default NewPostDialog;
