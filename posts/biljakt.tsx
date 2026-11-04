import { Post } from './types';

const html = `
    <div>
      <h2>Ranking used cars</h2>
      <p>
        I wrote a small tool called Biljakt for looking at used cars on
        Blocket. You give it a Blocket search URL, it walks through every page
        of results, and for each listing it pulls the registration number and
        looks the car up on Biluppgifter, which has the vehicle history.
        Everything ends up in one JSON file, and a small web UI shows the cars
        ranked by a score. The code is on
        <a href="https://github.com/francomay3/Biljakt">GitHub</a>.
      </p>
      <p>
        The scraping is the dull part, and I will only say a little about it.
        The interesting part is the scoring, because that is where you have to
        decide what you actually think a good car is.
      </p>

      <h2>The dull part, briefly</h2>
      <p>
        Pagination works by asking for page 1, 2, 3 and so on, merging the
        listings by URL, and stopping the first time a page adds nothing new.
        All requests go through a small fetcher that runs two at a time with a
        500 ms gap, and writes every response to a cache folder, so rerunning
        the tool does not hit the network again for pages it has already seen.
        Failures are stored in the cache too, with a retry counter. The
        Biluppgifter pages are bot-protected, so those go through Apify instead.
      </p>
      <p>
        From Biluppgifter I take things like the mileage history, a valuation,
        the next inspection date, the number of owners, an imported flag and a
        warning flag. One small decision I like: the price you compare against
        is the average of four numbers, the minimum and maximum of both the
        dealer valuation and the private valuation. It is crude, but it is
        enough to answer "is this car cheap or expensive for what it is".
      </p>

      <h2>Two kinds of rules</h2>
      <p>
        The scoring has exactly two kinds of rules, and every car's score is
        just the sum of what each enabled rule contributes.
      </p>
      <p>
        A <strong>linear rule</strong> takes a number and maps it to points
        using two control points. The default for mileage says 5,000 km is
        worth 30 points and 23,000 km is worth 0. Anything in between is
        interpolated along the straight line connecting them. Owner count goes
        from 20 points at one owner to 0 at ten. Price is first turned into a
        ratio against the market average, where 0.5 is worth 10 points and 1.5
        is worth 0.
      </p>
      <p>
        A <strong>flag rule</strong> asks a yes or no question and adds or
        subtracts a fixed amount. An odometer warning costs 30 points. An
        imported car costs 10. A private seller adds 5. A stable mileage trend
        adds 10, and a negative one takes 10 away.
      </p>
      <p>
        The whole interpolation is five lines:
      </p>
      <pre><code>const t = (x - p1.x) / (p2.x - p1.x);
return p1.score + t * (p2.score - p1.score);</code></pre>
      <p>
        I chose these two shapes because they are the two shapes I can reason
        about. When I look at a score I want to be able to say where each point
        came from. A line through two points has one meaning I can read off
        directly: this value is worth this much, that value is worth that much.
        And a flag is how I think about the things that are not really a scale,
        like a warning on the odometer. You either have one or you do not.
      </p>

      <h2>Why not something smarter</h2>
      <p>
        I could have fitted a model, but I have no labelled data about which
        cars turned out to be good, and I do not want a number I cannot argue
        with. With rules, if a car ranks above another and I disagree, I can
        find the rule responsible and change it. The rules and weights are
        editable in the browser, saved to localStorage, and merged with any new
        default rules the next time the page loads. Each car can also show a
        breakdown, one entry per rule, so a total is never a mystery.
      </p>
      <p>
        There is also one feature that looks like a flag but is really a
        measurement. For every car with at least three mileage readings, I fit
        a least-squares line through mileage against date and take the R squared
        of the fit, scaled to 0 to 100. A car driven at a steady pace gets a
        number near 100. A history that jumps around gets something lower. That
        number then feeds a normal linear rule, running from 20 points at 100
        down to minus 10 at 0. It is a heuristic for odometer tampering, and I
        would not call it more than that.
      </p>

      <h2>Where it is rough</h2>
      <p>
        Reading the code again to write this, I noticed a few things that are
        not as tidy as the description suggests. The mileage rule says in its
        description that extrapolation is clamped at the endpoints, but the
        function I showed above does not clamp. A car far past 23,000 km keeps
        getting more negative, so a very high-mileage car is punished heavily,
        which may or may not be what I want. Similarly, the overdue inspection
        rule is described as firing when the date has passed, yet its threshold
        is 30 days, so it also fires for cars with an inspection coming up
        soon. And the doc comment on the consistency function still talks about
        mean absolute error, while the code returns R squared.
      </p>
      <p>
        None of these are hard to fix. I mention them because they are a good
        example of why I like keeping the scoring small and visible: when
        something is off, there are only a handful of lines to check.
      </p>
    </div>
`;

const thisPost: Post = {
  title: 'Biljakt: Ranking Used Cars with Simple Rules',
  slug: 'biljakt-ranking-used-cars',
  html,
  date: new Date('2026-11-04'),
  lastUpdated: new Date('2026-11-04'),
  excerpt:
    'How Biljakt scrapes Blocket, enriches listings with vehicle history, and ranks cars using just two kinds of rules: linear interpolation and boolean flags.',
  author: 'Franco May',
  tags: ['Programming', 'Scraping', 'TypeScript', 'Side Projects'],
  readingTime: '5 min read',
  featuredImage: 'https://picsum.photos/200',
};

export default thisPost;
