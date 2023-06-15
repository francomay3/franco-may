import { useState, useRef } from "react";
import styled from "@emotion/styled";
import { throttle } from "lodash";
import { Emphasis } from "@/components/design-system";

const TitlesWraper = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const Texts = styled.div`
  display: flex;
  flex-direction: row;
  overflow-x: scroll;
  gap: 2rem;
  scroll-snap-type: x mandatory;
`;

const ContentItem = styled.div`
  min-width: 100%;
  max-width: 100%;
  scroll-snap-align: center;
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
  const debouncedScroll = useRef(
    throttle((e) => {
      const totalWidth = e.target.scrollWidth;
      const scrollLeft = e.target.scrollLeft;
      const numberOfTabs = data.length;
      const tabWidth = totalWidth / numberOfTabs;
      const selectedTab = Math.round(scrollLeft / tabWidth);
      setSelectedTab(selectedTab);
    }, 200)
  );
  return (
    <div style={{ width: "100%" }}>
      <TitlesWraper>
        {data.map(({ title }, index) => (
          <TabTitle
            active={selectedTab === index}
            key={title}
            onClick={() => {
              const selectedTabElement = document.getElementById(
                `tab-${index}`
              );
              if (selectedTabElement) {
                selectedTabElement.scrollIntoView({
                  behavior: "smooth",
                });
              }
            }}
          >
            {title}
          </TabTitle>
        ))}
      </TitlesWraper>

      <Texts onScroll={(e) => debouncedScroll.current(e)}>
        {data.map(({ title, content }, index) => (
          <ContentItem id={`tab-${index}`} key={title}>
            {content}
          </ContentItem>
        ))}
      </Texts>
    </div>
  );
};

export default Tabs;
