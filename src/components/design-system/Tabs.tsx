import { useState, useRef } from "react";
import styled from "@emotion/styled";
import { throttle } from "lodash";
import WrappIf from "./WrappIf";
import { Emphasis, Inline } from "@/components/design-system";
import { useIsMobile } from "@/hooks/useIsMobile";

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
  const isMobile = useIsMobile();
  return (
    <span onClick={onClick} style={{ cursor: "pointer" }}>
      <WrappIf
        Wrapper={Emphasis}
        condition={active || !isMobile}
        elseWrapper={({ children }) => <h2>{children}</h2>}
        wrapperProps={{ as: "h2", onHover: active ? false : true }}
      >
        {children}
      </WrappIf>
    </span>
  );
};

const Tabs = ({
  data,
}: {
  data: { title: string; content: JSX.Element }[];
}) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const throttledOnScroll = useRef(
    throttle((e) => {
      const totalWidth = e.target.scrollWidth;
      const scrollLeft = e.target.scrollLeft;
      const numberOfTabs = data.length;
      const tabWidth = totalWidth / numberOfTabs;
      const selectedTab = Math.round(scrollLeft / tabWidth);
      setSelectedTab(selectedTab);
    }, 100)
  );
  return (
    <div style={{ width: "100%" }}>
      <Inline gap="0.5rem">
        {data.map(({ title }, index) => (
          <TabTitle
            active={selectedTab === index}
            key={title}
            onClick={() => {
              const selectedTabElement = document.getElementById(
                `tab-${index}`
              );
              if (selectedTabElement) {
                const scrollContainer = selectedTabElement.parentElement;
                const xPosition = selectedTabElement.offsetLeft;

                if (scrollContainer) {
                  scrollContainer.scrollTo({
                    left: xPosition,
                    behavior: "smooth",
                  });
                }
              }
            }}
          >
            {title}
          </TabTitle>
        ))}
      </Inline>

      <Texts onScroll={(e) => throttledOnScroll.current(e)}>
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
