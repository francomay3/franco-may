import { Post } from './types';

const html = `
    <div>
      <p>
        Sweden's heritage board, Riksantikvarieämbetet, keeps a register of
        about 312,000 archaeological remains. Burial mounds, cairns, rock
        carvings, charcoal pits, runestones, hearths. Almost all of it is
        visible above ground and legally protected. It is also, as a list of
        things to go and see, close to useless, because a charcoal pit and
        Tanum's rock carvings sit in the same table with the same weight.
      </p>
      <p>
        I built a <a href="/fornlamningar/map">map</a> from it, and the map
        shows 10,000 pins. This post is about the one decision underneath it:
        which 10,000?
      </p>

      <h2>A place is not a record</h2>
      <p>
        The first step is to stop counting records. A grave field of forty
        stone settings sharing one signpost is one destination, and if I score
        records, that destination gets counted forty times. So before anything
        is ranked, the register is grouped into places, and the 312,000
        records become 251,029 of them.
      </p>
      <p>
        The grouping rule is deliberately plain. Registered numbers like
        "Askim 268:1" and "Askim 268:2" are parts of one site, so they are
        merged, but only within the same parish. The number prefix alone turned
        out to be unsafe: parish names repeat across the country, and one bare
        key spanned two parishes more than a thousand kilometres apart. A
        spatial guard then splits any group whose members are still far apart.
        Records with no usable number stay on their own. I used to cluster
        those by distance as well, and the script's own notes record how that
        went: it made 2,024 clusters averaging 127 m of spread, the worst of
        them 535 sites over six kilometres. I removed it.
      </p>

      <h2>Ranking without a ground truth</h2>
      <p>
        There is no list of "places worth visiting" to learn from. What exists
        are weak labels: Wikipedia articles, and a small hand-labelled set. The
        pipeline fits a regularised logistic regression on those, with
        features taken from the register itself (does it have a folk name, is
        there a polygon, how long is the description, what class is it) and
        from outside it, like distance to the nearest road.
      </p>
      <p>
        The most useful thing I did here was to distrust my own labels. In the
        measurements, 1,185 of the 1,425 "notable" places were runestones,
        because Swedish Wikipedia has an article for nearly every one. Counted
        naively, "has a Wikipedia article" is roughly the same as "is a
        runestone", and the model becomes a runestone detector. With
        runestones left out, the folk name signal goes from 3.15x to 8.54x,
        and the two geometry signals flip from looking harmful to looking
        strong. The confound did not just add noise, it reversed signs.
      </p>
      <p>
        The same problem came back later in a smaller form. Inside the
        runestone class, having an article says almost nothing: 66.0% have
        one, against 1.0% of grave fields. A single global weight handed every
        runestone credit that the feature had earned elsewhere, and runestones
        were 1.13% of the eligible pool but 12.32% of the export. The fix was
        to score documentation relative to the class's own base rate, so a
        grave field with an article stands out and a runestone with one does
        not.
      </p>
      <p>
        Two scores come out. One judges a place only by what it is, and can be
        honestly validated. The other also credits Wikipedia and photographs,
        which is better evidence for ranking but circular to validate. The map
        uses the second, and the code is open about that trade.
      </p>

      <h2>The cut, and the thinning</h2>
      <p>
        Take the best 10,000 by that score and you still have a problem: a
        national top list leaves whole regions empty when you zoom out. So
        every pin gets the lowest zoom level at which it may appear, assigned
        greedily, best first. Each tile is divided into a 24 by 24 grid, and a
        pin becomes visible at the first zoom where no better pin already owns
        its cell. Zooming out thins the map, but what survives is the best
        thing in each area, not a random sample.
      </p>
      <p>
        This runs once per class family, because of a failure I would not have
        guessed. Thinning everything together keeps only the single best place
        of any kind in each patch of ground. Hide that one with a filter and
        the patch goes empty, since there is no runner-up in the tile to
        promote. Per family, every filter combination stays evenly covered.
      </p>
      <p>
        The tiles come out of Tippecanoe, and several of its defaults had to be
        switched off. Its automatic thinning once dropped 9,999 of the 10,000
        features at low zooms, so the map went blank when zoomed out. Its
        point clustering merged neighbours and put the result at their average
        position, which landed one hill fort 595 m from where it is. Now I
        decide visibility myself, and the tiles never invent a position.
      </p>

      <h2>Descriptions that add nothing</h2>
      <p>
        The register is written by surveyors, for surveyors: "Stensättning,
        rund, 7 m diam och 0,3 m h." Often it is a single line. For the pins I
        generate a short visitor description with a local model running under
        Ollama, and the main risk is a model that knows a lot about the
        Bronze Age and wants to tell you about it. The comment at the top of
        the script puts it directly: on a map of 10,000 places a plausible
        invention is worse than a dull fact.
      </p>
      <p>
        So the model gets temperature 0, an output schema, and an instruction
        to use only what is in the source. Afterwards a mechanical check
        compares every number in the output against the input. It flags rather
        than rejects, and it cannot see everything, so there is a separate
        guard for invented periods. Today 7,111 of the 10,000 pins carry a
        generated description. The rest show the register's own text, and the
        README says plainly that this is a long model run away from being
        fixed.
      </p>

      <h2>How the site uses it</h2>
      <p>
        On this site the output is just static files: vector tiles served from
        the public folder, and the map reads them with MapLibre. All the
        judgement happens earlier, in Python. If you want the code, the
        pipeline is at
        <a href="https://github.com/francomay3/fornlamningar">
          github.com/francomay3/fornlamningar</a
        >. It replaced an earlier, simpler version,
        <a href="https://github.com/francomay3/Fornkartan">Fornkartan</a>,
        which downloaded the register, diffed it, fetched details, parsed and
        built tiles, with a handful of hand-set weights (a proper name,
        excavated, field-confirmed) instead of a fitted model.
      </p>

      <h2>What I take from it</h2>
      <p>
        Most of the work was not the model. It was finding where my labels
        were lying, and writing the exceptions down where the next run would
        find them. Choosing 10,000 pins out of 251,029 places is a statement
        about what deserves attention, and it is better made with measurements
        you can read back than with a score you merely trust.
      </p>
    </div>
`;

const thisPost: Post = {
  title: 'From 312,000 Remains to 10,000 Pins',
  slug: 'from-312000-remains-to-10000-pins',
  html,
  date: new Date('2026-10-19'),
  lastUpdated: new Date('2026-10-19'),
  excerpt:
    'How a register of 312,000 Swedish archaeological remains becomes 10,000 map pins: grouping records into places, ranking them with weak labels, and keeping a local model from inventing history.',
  author: 'Franco May',
  tags: ['Data', 'Maps', 'Python', 'Archaeology'],
  readingTime: '5 min read',
  featuredImage: 'https://picsum.photos/200',
};

export default thisPost;
