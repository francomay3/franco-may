import { Post } from './types';

const html = `
    <div>
      <p>
        A while ago I was building an n-body gravity simulation in the browser.
        Once the number of bodies grows, the inner loop is the obvious thing to
        move out of JavaScript, and WebAssembly is the obvious place to move it.
        What I wanted was simple: write a C++ file, import it from TypeScript,
        and call it like any other function. That wish became
        <a href="https://github.com/francomay3/vite-plugin-cpp-loader">vite-plugin-cpp-loader</a>,
        which is now on
        <a href="https://www.npmjs.com/package/vite-plugin-cpp-loader">npm</a>.
      </p>

      <h2>Where it started</h2>
      <p>
        In the gravity grid project there is a small experiment: a C++ counter
        class, wrapped in a handful of <code>extern "C"</code> functions, with the
        compile command pasted as a comment at the bottom of the file. On the
        TypeScript side I fetched the <code>.wasm</code> file, instantiated it,
        and wrote an interface by hand describing what the exports looked like.
      </p>
      <p>
        It worked, but every step was manual. Change a signature in C++ and the
        TypeScript interface silently lies until something breaks at runtime.
        Re-run the command by hand. Keep the output path in sync. None of this
        is hard, it is just friction, and friction decides whether you
        experiment or not.
      </p>

      <h2>What it looks like now</h2>
      <p>
        You install the plugin, add it to the Vite config, and make sure
        <code>em++</code> from Emscripten is on your PATH. Then you write plain
        C++:
      </p>
      <pre><code>// math.cpp
int add(int a, int b) {
    return a + b;
}

// main.ts
import { add } from './math.cpp';

add(2, 3); // 5</code></pre>
      <p>
        That is the whole interface. Top-level functions are exported, and if
        you want one to stay private you mark it <code>static</code>. Passing a
        string to <code>add</code> is a type error in the editor, because the
        types come from the C++ signature.
      </p>

      <h2>How it works</h2>
      <p>
        Vite calls the plugin whenever something imports a <code>.cpp</code>
        file. The plugin reads the source and hashes it. If it has compiled that
        exact content before, it reuses the cached output from
        <code>node_modules/.cpp-wasm</code>. Otherwise it spawns
        <code>em++</code>, with Embind linked in and an ES module output.
      </p>
      <p>
        The part I like most is that you do not write any binding code. If your
        file has no <code>EMSCRIPTEN_BINDINGS</code> block, the plugin finds the
        non-static top-level functions with a regular expression, appends a
        generated bindings block to a temporary copy of your file, and compiles
        that. Your source is never touched. I started out requiring the
        Emscripten boilerplate in the C++ file, and removing that requirement
        was one of the changes that made the 2.0 release feel right.
      </p>
      <p>
        For the types, I ask the compiler first. Emscripten can emit a
        TypeScript definition file for the bindings, and the plugin parses
        function names, parameters and return types out of it. If that file is
        missing or empty, it falls back to a regex pass over the C++ source. The
        result is written as a <code>math.cpp.d.ts</code> file next to the
        source, and the module Vite actually sees is a small generated wrapper
        that awaits the Emscripten module and re-exports each function.
      </p>
      <p>
        In dev, the wasm is served as a separate file. In a production build the
        plugin passes <code>-sSINGLE_FILE</code>, so the wasm is inlined into the
        JavaScript and there is nothing extra to deploy.
      </p>

      <h2>The limits</h2>
      <p>
        The type mapping is deliberately small: numbers, booleans, strings and
        void. Anything else, including STL containers and your own classes,
        falls back to <code>any</code>, and the README says plainly that those
        are not supported as parameters or return types. The regex fallback is
        also exactly that: a regex, not a C++ parser, so unusual signatures can
        confuse it. And because the generated module uses top-level await, your
        build target has to allow it. I would rather document these edges than
        pretend they are not there.
      </p>

      <h2>How it evolved</h2>
      <p>
        The first commits are from May 2025: a stub plugin, then real
        compilation, then declaration files, and a first npm release within a
        couple of days. After that the project sat for months. In April 2026 I
        came back, simplified the structure, dropped the Emscripten boilerplate
        requirement, renamed the package, and added support for the latest Vite.
        That was 2.0.
      </p>
      <p>
        I do not have a benchmark to show you, and this post is not an argument
        that you should rewrite your hot loops in C++. The point of the tool is
        narrower: if you want to try, the cost of trying should be one file and
        one import. What you learn after that is up to you.
      </p>
    </div>
`;

const thisPost: Post = {
  title: 'Importing C++ Straight into TypeScript',
  slug: 'importing-cpp-into-typescript',
  html,
  date: new Date('2026-11-04'),
  lastUpdated: new Date('2026-11-04'),
  excerpt:
    'Why I built vite-plugin-cpp-loader, a Vite plugin that compiles C++ to WebAssembly with Emscripten and gives you typed imports.',
  author: 'Franco May',
  tags: ['WebAssembly', 'C++', 'Vite', 'TypeScript', 'Open Source'],
  readingTime: '4 min read',
  featuredImage: 'https://picsum.photos/200',
};

export default thisPost;
