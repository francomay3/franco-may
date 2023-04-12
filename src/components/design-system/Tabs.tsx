import styled from "@emotion/styled";
import { useTheme } from "@emotion/react";
import { Fragment, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Emphasis } from "@/components/design-system";
import { Tab } from "@headlessui/react";

const TabTitle = ({ active, children }: { active: boolean; children: any }) => {
  const style = {
    cursor: "pointer",
  };
  return (
    <Tab as={Fragment}>
      {active ? (
        <Emphasis as="h2">{children}</Emphasis>
      ) : (
        <h2 style={style}>{children}</h2>
      )}
    </Tab>
  );
};

const Tabs = ({
  data,
}: {
  data: { title: string; Content: () => JSX.Element }[];
}) => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);
  const [motionHeight, setMotionHeight] = useState(0);
  const motionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (motionRef.current) {
      const selected: HTMLDivElement | null = motionRef.current.querySelector(
        "[data-headlessui-state='selected']"
      );
      if (selected) {
        setMotionHeight(selected.offsetHeight);
      }
    }
  }, [selectedTab]);

  return (
    <Tab.Group onChange={(index) => setSelectedTab(index)}>
      <Tab.List
        style={{
          display: "flex",
          gap: theme.spacing[3],
        }}
      >
        {data.map(({ title }, index) => (
          <TabTitle active={selectedTab === index}>{title}</TabTitle>
        ))}
      </Tab.List>
      <Tab.Panels>
        <motion.div
          animate={{
            height: motionHeight,
          }}
          ref={motionRef}
          style={{
            overflow: "hidden",
          }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        >
          {data.map(({ Content }) => (
            <Tab.Panel>
              <Content />
            </Tab.Panel>
          ))}
        </motion.div>
      </Tab.Panels>
    </Tab.Group>
  );
};

export default Tabs;
