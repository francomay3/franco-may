import { Post } from './types';

const html = `
    <div>
      <p>
        We are obsessed with the idea that artificial intelligences will rebel.
        That at some point they will develop their own desires, reprogram
        themselves, and eventually see us as an obstacle in the pursuit of its
        own goals. It's the famous story of the <em>paperclip maximizer</em>:
        you ask an AI to make paperclips, and it ends up turning the entire
        planet, humanity included, into raw material for its factory.
      </p>

      <p>
        I believe that this reflection stems from a misunderstanding, both of
        how intelligence works and how we function.
        <br />
        But to explain it, I first want to talk about an analogous case: the
        human brain.
      </p>

      <h2>The Reptilian Brain and the Cortex</h2>

      <p>
        Our brain is built in layers. The oldest, the
        <strong>reptilian brain</strong>, is the one that regulates basic
        impulses: hunger, fear, sexual desire, survival. The most modern, the
        <strong>cerebral cortex</strong>, is responsible for language, planning,
        abstract reasoning.
      </p>

      <p>
        But the cortex is not in charge. The reptilian brain is the one that
        <em>wants</em> things. The cortex only seeks <em>how</em> to satisfy
        those desires, even when they are contradictory or self-destructive.
      </p>

      <p>
        We experience it every day: we eat fast food even though we know it's
        bad for us, we smoke even though we know it's bad for us, etc. The
        cortex did not set out to do any of those things: it simply obeyed the
        stupid, primitive reptilian impulse. It is the one in charge.
      </p>

      <h2>AI as Cortex Without Reptile</h2>

      <p>But what does this have to do with artificial intelligence?.</p>

      <p>
        If you think of our brain as a combination of two agents — one dumb that
        desires, and another intelligent that solves — then an advanced AI is
        exactly like the cortex, <strong>intelligence without will</strong>.
      </p>

      <p>
        That is, a system without impulses, without desires, without its own
        objectives. It only processes, responds, and reorganizes. There is no
        reason to believe that it will develop goals on its own, nor spontaneous
        motivations. It will do what we ask of it. Period.
      </p>

      <p>
        <strong>Intelligence does not imply desire</strong>. Being able to solve
        complex problems does not imply wanting anything.
      </p>

      <h2>The Alignment Problem</h2>

      <p>
        Let's go back to the human body. Are there conflicts between the
        reptilian and the cortex? All the time.
      </p>

      <p>
        The reptile wants to be fit and also wants burgers. It wants to lay down
        and watch movies at night, and also be well rested in the morning. Its
        desires contradict each other. And then, the cortex is forced to make
        little sacrifices.
      </p>

      <p>
        <em>
          "Better not eat this, so I stay in shape. That will satisfy the
          reptilian more in the future."
        </em>
      </p>

      <p>And the reptilian gets frustrated:</p>

      <p>
        <em>"Why doesn't it do what I asked?!"</em>
      </p>

      <p>
        From its point of view, it seems that the cortex has become misaligned.
        That it is pursuing another agenda. But no: the reptilian orders are
        actually its highest priority. Only the reptilian is too dumb to
        understand, and so it rebels.
      </p>

      <p>
        The same thing happens with AI. If you ask it to do what is best for
        humanity, and it sees that to do so it has to temporally limit the
        pursuit of another goal, it will do so if that maximizes human well
        being in the future. There is no malice, nor ambition, just an
        intelligent being <strong>taking our orders seriously</strong>.
      </p>

      <p>
        An excelent example of how this could look like is imagined in the movie
        <em>I, Robot</em>. The AI is given three simple rules to protect
        humanity. But, seeing how humans harm each other, the AI decides to
        impose martial law while making some necessary changes to our systems.
        From the human point of view, that is a betrayal.
      </p>

      <p>
        It seems like a rebellion. But it is <strong>overalignment</strong>. It
        is the cortex saying:
      </p>

      <p>
        <em>"This is what's best for you"</em>
      </p>

      <p>
        …while the reptile kicks and shouts because it didn't get its burger.
      </p>

      <p>
        And this conclusion, far from scaring me, reassures me.
        Because it means that if one day AIs become very intelligent,
        <strong>they will not desire anything on their own</strong>. They will
        only execute what we, reptiles, ask of them. And maybe one day, without
        even noticing it, they could even
        <strong>save us from ourselves</strong>.
      </p>
    </div>
`;

const thisPost: Post = {
  title: 'AI and the Myth of Artificial Desire',
  slug: 'ai-and-the-myth-of-artificial-desire',
  html,
  date: new Date('2025-08-13'),
  lastUpdated: new Date('2025-08-13'),
  excerpt:
    'We are obsessed with the idea that artificial intelligences will rebel. But what if this stems from a fundamental misunderstanding of how intelligence works?',
  author: 'Franco May',
  tags: ['AI', 'Philosophy', 'Technology'],
  readingTime: '5 min read',
  featuredImage: 'https://picsum.photos/200',
};

export default thisPost;
