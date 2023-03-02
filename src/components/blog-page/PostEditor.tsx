import { useAuth } from "@/providers/AuthProvider";
import RichTextArea from "../admin-page/RichTextArea";
import {
  publishPost,
  unpublishPost,
  saveChanges,
  useSaveBackup,
  useSetDebouncedPostField,
  restoreBackup,
} from "@/utils/postUtils";
import styled from "@emotion/styled";

const inputs = [
  { inputId: "title-input", label: "Title", type: "text", field: "title" },
  {
    inputId: "description-input",
    label: "Description",
    type: "text",
    field: "description",
  },
  { inputId: "image-input", label: "Image", type: "file", field: "image" },
  {
    inputId: "location-input",
    label: "Location",
    type: "text",
    field: "location",
  },
  { inputId: "tags-input", label: "Tags", type: "text", field: "tags" },
];

interface InputProps {
  postId: string;
  inputId: string;
  label: string;
  type: string;
  field: string;
}

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  width: 40%;
`;

const InputsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  display: flex;
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const Input = ({ postId, inputId, label, type, field }: InputProps) => {
  const [value, setValue] = useSetDebouncedPostField(postId, field);
  if (type !== "text") return null;
  return (
    <InputWrapper>
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </InputWrapper>
  );
};

const PostEditor = ({ id }: { id: string }) => {
  const { logOut } = useAuth();
  const [content, setContent] = useSaveBackup(id);
  return (
    <>
      <InputsWrapper>
        {inputs.map((input) => (
          <Input key={input.inputId} {...input} postId={id} />
        ))}
      </InputsWrapper>
      <RichTextArea value={content} setValue={setContent} />
      <button onClick={() => publishPost(id)}>publish post</button>
      <button onClick={() => unpublishPost(id)}>unpublish post</button>
      <button onClick={() => saveChanges(id, content)}>save changes</button>
      <button
        onClick={() =>
          restoreBackup(id, (newContent) => setContent(newContent))
        }
      >
        restore backup
      </button>
    </>
  );
};

export default PostEditor;
