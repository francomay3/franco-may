import styled from "@emotion/styled";
import { Tab } from "@headlessui/react";
import { useTheme } from "@emotion/react";
import { Fragment, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Emphasis } from "@/components/design-system";

const Wrapper = styled.div`
  h1 {
    margin: 2rem;
  }
  h2 {
    margin-block: 1rem;
  }
`;

const WhyContent = () => (
  <p>
    It was a cold February night in Kungsbacka. I was sitting facing the
    fireplace while reading Epictetus, really immersed in the reading. I was
    leaving behind page after page with the margins full of little notes.
    <br />
    I stopped. For whom was I writing these notes? I was probably not going to
    read them again. And there won&apos;t be another future reader of the book
    either (it&apos;s a small book printed and bound by my dad, so I take great
    care of it).
    <br />
    After some thought I came to the conclusion that these notes were intended
    to explain to myself what I had just read. You see, I get lost in thought
    very easily (that was actually what was happening to me at that moment). I
    can read a long time before I realize that I am thinking about something
    else and I do not remember a word of the last 5 pages. That&apos;s why I
    leave my books full notes and marks. I continually force myself to explain
    what I read to prove that I was paying attention.
    <br />
    It&apos;s a strategy that pays off for me, even if I end up reading slower
    than most people.
    <br />
    But What to do with all those notes?
    <br />
    Reflecting on this with Natasha (my wife), it occurred to me to start
    writing a blog in which I can dump the thoughts that pop to my mind not only
    when I read, but pretty much every day.
    <br />
    So that is the reason. I&apos;m going to write about the things I read, of
    course, but I also want to write about anything else that I think about the
    passing of the days.
  </p>
);

const HowContent = () => (
  <p>
    I am glad you asked! You see, I could have started blogging right away using
    WordPress or some other CMS. But as it is the case with procrastinators like
    myself, I decided to postpone the act of writing and instead build a
    blogging platform from scratch using web technologies. I built this website
    using NextJs, headless components, Firebase, Firestore, Firebase
    Authentication. <br />
    So, let me tell you a bit more about it because I am really excited.
    <br />
    I can log into my website as an admin. When I do, I can create, delete and
    edit blog posts directly from the post page. This is possible because all
    blogs are stored in a firebase database. That way I can also run queries in
    case I want to add a search bar in the future.
    <br />
    All images are stored in a special database as well, so images in blogs are
    also editable. I can select images from a gallery of previously uploaded
    images or upload a new one.
    <br />
    All pages are rendered on the server, so the website is very SEO friendly.
    <br />
    Finally, my github repository is connected to a vercel deployment pipeline,
    so every time I push to master, the website is automatically tested, built
    and deployed.
    <br />
    Everything was made from scratch. This is my baby.
    <br />I will write a longer post in the future to go into the details of my
    choices and the obstacles I faced.
  </p>
);

const WhoContent = () => (
  <p>
    My name is <strong>Franco May</strong>. I work in Gothenburg, Sweden as a
    web developer specialized in Frontend.
    <br />I moved from <strong>Argentina</strong> to Sweden x days ago, Men min
    svenska är fortfarande inte så bra.
    <br />
    I have a lot of hobbies, but I usually pay a lot of attention to one for
    some months before skipping to the next one. <br />
    Programming started like this. First I learned <strong>python</strong> and
    started creating little scripts to do anything that came to my mind. I built
    a web scraper and learned that you can get your IP blocked to enter a
    website for making so many requests. That was <strong>cool</strong>.
    <br />
    Then I created a plugin for Sketchup using Ruby to subdivide and smooth
    geometries. That was <strong>mind bending</strong>.
    <br />
    Finally I got interested in web programming. I learned <strong>
      PHP
    </strong>, <strong>SQL</strong>, <strong>HTML</strong>,<strong>CSS</strong>{" "}
    and my beloved <strong>JavaScript</strong>, which I now use for almost
    everything.
    <br />
  </p>
);

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

const Home = () => {
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
    <Wrapper>
      <h1>
        <Emphasis>Hallå!</Emphasis>
        <br />
        Welcome to my website.
      </h1>
      <Tab.Group onChange={(index) => setSelectedTab(index)}>
        <Tab.List
          style={{
            display: "flex",
            gap: theme.spacing[3],
          }}
        >
          <TabTitle active={selectedTab === 0}>Why?</TabTitle>
          <TabTitle active={selectedTab === 1}>How?</TabTitle>
          <TabTitle active={selectedTab === 2}>Who?</TabTitle>
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
            <Tab.Panel>
              <WhyContent />
            </Tab.Panel>
            <Tab.Panel>
              <HowContent />
            </Tab.Panel>
            <Tab.Panel>
              <WhoContent />
            </Tab.Panel>
          </motion.div>
        </Tab.Panels>
      </Tab.Group>
    </Wrapper>
  );
};

export default Home;
