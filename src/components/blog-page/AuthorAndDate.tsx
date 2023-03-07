import styled from "@emotion/styled";

const Wrapper = styled.p`
  color: ${({ theme }) => theme.colors.grey};
`;

const AuthorAndDate = ({ children, isEditing, onChange, author, date }) => {
  return <Wrapper>{`${author} | ${date}`}</Wrapper>;
};

export default AuthorAndDate;
