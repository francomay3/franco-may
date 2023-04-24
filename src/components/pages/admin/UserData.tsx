import React from "react";
import styled from "@emotion/styled";
import { useAuth } from "@/providers/AuthProvider";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Table = styled.div`
  display: grid;
  grid-template-columns: 1fr 3fr;
  grid-template-rows: 1fr 1fr 1fr;
  grid-gap: 0.5rem;
`;

const Title = styled.p`
  font-weight: bold;
  margin: 0;
`;

const Value = styled.p`
  margin: 0;
`;

const UserData = () => {
  const { user } = useAuth();
  const { displayName: Name, email: Email, uid: UID } = user || {};

  return (
    <Wrapper>
      <h2>User Data:</h2>
      <Table>
        {Object.entries({ Name, Email, UID }).map((item, index) => (
          <React.Fragment key={index}>
            <Title
              style={{
                gridColumn: 1,
                gridRow: index + 1,
              }}
            >
              {item[0]}
            </Title>
            <Value
              style={{
                gridColumn: 2,
                gridRow: index + 1,
              }}
            >
              {item[1]}
            </Value>
          </React.Fragment>
        ))}
      </Table>
    </Wrapper>
  );
};

export default UserData;
