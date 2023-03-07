import styled from "@emotion/styled";

const AuthorAndDate = styled.p`
  color: ${({ theme }) => theme.colors.grey};
`;

const Component = ({ children, isEditing, onChange }) => {
  return <AuthorAndDate>{children}</AuthorAndDate>;
};

export default Component;
