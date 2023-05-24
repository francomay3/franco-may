import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import styled from "@emotion/styled";
import { Emphasis } from "@/components/design-system";

const TitlesWraper = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const TabTitle = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) => {
  return (
    <span onClick={onClick} style={{ cursor: "pointer" }}>
      {
        <Emphasis as="h2" onHover={active ? false : true}>
          {children}
        </Emphasis>
      }
    </span>
  );
};

const Tabs = ({
  data,
}: {
  data: { title: string; content: JSX.Element }[];
}) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [height, setHeight] = useState(300);

  useEffect(() => {
    const selectedTabElement = document.getElementById(`tab-${selectedTab}`);
    if (selectedTabElement) {
      setHeight(selectedTabElement.clientHeight);
    }
  }, [selectedTab]);

  return (
    <div style={{ width: "100%" }}>
      <TitlesWraper>
        {data.map(({ title }, index) => (
          <TabTitle
            active={selectedTab === index}
            key={title}
            onClick={() => setSelectedTab(index)}
          >
            {title}
          </TabTitle>
        ))}
      </TitlesWraper>
      <motion.div
        animate={{
          height,
        }}
        style={{
          overflow: "hidden",
          height,
        }}
        transition={{ type: "easeInOut", duration: 0.3 }}
      >
        {data.map(({ title, content }, index) => (
          <motion.div
            animate={{
              x: `${(selectedTab - index) * 100}%`,
            }}
            id={`tab-${index}`}
            key={title}
            style={{
              position: "absolute",
              x: `${(selectedTab - index) * 100}%`,
            }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 15,
              restSpeed: 0.01,
            }}
          >
            {content}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default Tabs;
