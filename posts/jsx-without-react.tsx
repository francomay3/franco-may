import { Post } from './types';

const html = `
    <div>
      <p>
        A few years ago I wanted to know how much of "React" is actually JSX.
        The two get mentioned in the same breath so often that I had half
        convinced myself they were one thing. They are not, and the quickest
        way I found to check was to build a small app with JSX and no React at
        all. I called it
        <a href="https://github.com/francomay3/not-react">not-react</a>. It is
        a tiny experiment, three commits from September 2023, and I want to
        describe honestly what it does and what it does not.
      </p>

      <h2>JSX is just a function call</h2>
      <p>
        Browsers cannot read JSX, so something has to compile it. In my case
        that is Babel. The important thing is what Babel produces: every tag
        becomes a function call. With the "automatic" runtime, the file gets an
        import added for you, and this:
      </p>
      <pre><code>&lt;Button onClick={onClick}&gt;alert me!&lt;/Button&gt;</code></pre>
      <p>becomes roughly this:</p>
      <pre><code>jsx(Button, { onClick, children: "alert me!" })</code></pre>
      <p>
        Nothing in that output mentions React. Babel imports <code>jsx</code>
        from wherever you tell it to. My whole Babel config is one plugin:
      </p>
      <pre><code>[
  "@babel/plugin-transform-react-jsx",
  { runtime: "automatic", importSource: "./core" },
]</code></pre>
      <p>
        With that, Babel looks for <code>jsx-runtime</code> inside
        <code>./core</code>, and that file is mine. The name of the plugin says
        "react", but it is really a general JSX-to-function-call transform.
      </p>

      <h2>The function I had to write</h2>
      <p>
        The runtime exports <code>jsx</code>, <code>jsxs</code> and
        <code>Fragment</code>. Mine is short enough to describe in full. If the
        tag is a function, like <code>Button</code>, I just call it with its
        props and return the result. If it is a string, like
        <code>"button"</code>, I create a real DOM element:
      </p>
      <pre><code>if (typeof tag === "function") {
  return tag(props);
}
const element = document.createElement(tag);</code></pre>
      <p>
        Then I go through the props. If a prop starts with "on" and its
        lowercase name exists on <code>window</code> (so <code>onClick</code>
        becomes <code>onclick</code>, which exists), it becomes an event
        listener. Anything else goes through <code>setAttribute</code>. The
        children, which may be nested arrays, get appended, with plain strings
        wrapped in text nodes. <code>jsxs</code> is the same function, and
        <code>Fragment</code> does the same appending into a document
        fragment.
      </p>
      <p>
        That is the entire trick. A JSX expression in my app evaluates to an
        actual DOM node, not a description of one. That is why the app file can
        end with <code>rootElement.appendChild(&lt;App /&gt;)</code>, which
        looks strange if you are used to React, where JSX gives you an object
        and something else decides what to do with it.
      </p>

      <h2>The app itself</h2>
      <p>
        The components are about as small as they can be.
        <code>Button</code> is one line,
        <code>const Button = (props) =&gt; &lt;button {...props} /&gt;</code>,
        and <code>App</code> renders a button that shows an alert. The build is
        Babel compiling <code>src</code> into <code>dist</code>, and then
        webpack bundling <code>dist/App.js</code> with an HTML template. There
        is nothing else in the dependencies that would be recognisable as a
        framework.
      </p>

      <h2>What is missing</h2>
      <p>
        Quite a lot, and my README says some of it plainly: debugging is "a bit
        of a pain", and the next step would be some kind of state management.
        Reading the runtime now, I can see why state is the hard part. A
        component is called once and returns a finished DOM node. There is no
        record of what was rendered, so there is nothing to compare against
        later, and no way to say "run this component again and update what
        changed". To get state you need something that remembers components
        between runs and a way to apply the difference. That is most of what a
        UI library is, and it is the part I did not build.
      </p>
      <p>
        There are smaller gaps I can see in the code too. A prop like
        <code>className</code> would be set as an attribute with that literal
        name, which is not what the browser expects, so I would have to handle
        it. I have no cleanup of listeners, and nothing is typed, though the
        README lists TypeScript as something I would like.
      </p>

      <h2>What I took from it</h2>
      <p>
        The experiment worked, in the narrow sense I wanted: JSX does not need
        React. It is a syntax, and the meaning is whatever function you hand it.
        What React adds is everything after the function call, the part about
        keeping a UI in sync with changing data. I knew that in theory before,
        but writing the thirty-odd lines of runtime myself made it concrete.
        If you want to look, the code is at
        <a href="https://github.com/francomay3/not-react">github.com/francomay3/not-react</a>.
      </p>
    </div>
`;

const thisPost: Post = {
  title: 'JSX Without React',
  slug: 'jsx-without-react',
  html,
  date: new Date('2026-11-04'),
  lastUpdated: new Date('2026-11-04'),
  excerpt:
    'A small experiment building a JSX app with a custom jsx-runtime and no React: how JSX really works, and what you give up without state or re-rendering.',
  author: 'Franco May',
  tags: ['JavaScript', 'JSX', 'React', 'Experiments'],
  readingTime: '4 min read',
  featuredImage: 'https://picsum.photos/200',
};

export default thisPost;
