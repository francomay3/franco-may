import { Tab as HeadlessTab } from "@headlessui/react";
import styled from "@emotion/styled";

const Tabs = () => {
  return (
    <HeadlessTab.Group>
      <HeadlessTab.List>
        <HeadlessTab>Tab 1</HeadlessTab>
        <HeadlessTab>Tab 2</HeadlessTab>
        <HeadlessTab>Tab 3</HeadlessTab>
      </HeadlessTab.List>
      <HeadlessTab.Panels>
        <HeadlessTab.Panel>Content 1</HeadlessTab.Panel>
        <HeadlessTab.Panel>Content 2</HeadlessTab.Panel>
        <HeadlessTab.Panel>Content 3</HeadlessTab.Panel>
      </HeadlessTab.Panels>
    </HeadlessTab.Group>
  );
};

export default Tabs;
