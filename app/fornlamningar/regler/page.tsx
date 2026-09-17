import React from 'react';
import type { Metadata } from 'next';

/**
 * PLAIN HTML AND NO COMPONENT LIBRARY, which is not a style preference.
 *
 * The first version used Mantine and the build failed prerendering it:
 * `List.Item` resolves to undefined in a server component, so the page threw
 * "element type is invalid". The fix that suggests itself is 'use client',
 * and it is the wrong one -- it would ship a component library and a React
 * runtime to render two pages of static text that never change and have no
 * behaviour. These are the two pages most likely to be read on a bad
 * connection by somebody who is annoyed, so they are the last place to spend
 * a bundle on.
 */

/**
 * The rules, and how to tell us about something that breaks them.
 *
 * TWO LEGAL DUTIES IN ONE PAGE, and neither has a micro-enterprise
 * exemption. DSA art. 14 asks that a hosting service say, in plain language,
 * what it does not allow and what it does about it. Art. 16 asks for a way
 * for ANYONE to notify it of illegal content -- not only users, which is why
 * the email address is here in public and not only behind a button in the
 * app.
 *
 * WRITTEN FOR A PERSON AND NOT FOR A LAWYER, which is itself the
 * requirement: art. 14 says "clear, plain, intelligible" language. A page of
 * definitions and capitalised terms would satisfy nobody and comply with
 * less.
 *
 * SWEDISH AND ENGLISH ON ONE PAGE rather than two routes. The app has two
 * languages and this text is short; a translated route pair would be two
 * things to keep in step for the sake of not scrolling past a heading.
 *
 * NOT REVIEWED BY A LAWYER. It is a good-faith reading of what the DSA asks
 * of a service this size, written by somebody who is not one.
 */
export const metadata: Metadata = {
  title: 'Regler för kommentarer — Fornkoll',
  description: 'Vad som inte är tillåtet i Fornkoll, och hur du anmäler något.',
};

/**
 * Where a notice arrives. The site's own contact form, not an address.
 *
 * NOT AN EMAIL IN THE PAGE SOURCE, for two reasons. A public mailto on a
 * page a crawler can read is a spam magnet, and the address this project
 * would otherwise have used is a work address at somebody else's domain,
 * which is not the right place for a personal project's abuse reports to
 * land.
 *
 * The form already exists and already emails the site's owner (see
 * app/api/contact). What art. 16 asks for is a MECHANISM anybody can use,
 * and a form is one; it is not required to be an address. If a dedicated
 * address is wanted later, it goes in an environment variable and this
 * constant reads it -- not in the source.
 */
const NOTICE_URL = '/contact';

/** Small, local, and no library. */
const s = {
  main: { display: 'flex', flexDirection: 'column' as const, gap: '1.1rem' },
  h1: { fontSize: '1.9rem', lineHeight: 1.2, margin: 0 },
  h1Later: { fontSize: '1.9rem', lineHeight: 1.2, margin: '2.5rem 0 0' },
  h2: { fontSize: '1.15rem', lineHeight: 1.3, margin: '0.6rem 0 0' },
  p: { margin: 0, lineHeight: 1.65 },
  ul: { margin: 0, paddingLeft: '1.25rem', lineHeight: 1.65 },
  li: { marginBottom: '0.35rem' },
  a: { textDecoration: 'underline' },
};

export default function RulesPage() {
  return (
    <main style={s.main}>
      <h1 style={s.h1}>Regler för kommentarer</h1>

      <p style={s.p}>
        Fornkoll är en gratis app för att hitta och besöka fornlämningar i
        Sverige. Du kan skriva kommentarer om en plats så att nästa besökare vet
        vad hen ska förvänta sig. Den här sidan säger vad som inte är tillåtet
        och vad som händer då.
      </p>

      <h2 style={s.h2}>Det här är inte tillåtet</h2>
      <ul style={s.ul}>
        <li style={s.li}>
          Olagligt innehåll, inklusive hot och hets mot folkgrupp.
        </li>
        <li style={s.li}>
          Kränkningar, trakasserier eller angrepp på en person.
        </li>
        <li style={s.li}>
          Personuppgifter om någon annan — namn, adress, telefonnummer.
        </li>
        <li style={s.li}>Reklam och skräppost.</li>
        <li style={s.li}>
          Uppmaningar att gräva, plocka med sig föremål eller på annat sätt
          skada en fornlämning. Det är dessutom brottsligt enligt
          kulturmiljölagen.
        </li>
      </ul>

      <h2 style={s.h2}>Vad som händer</h2>
      <p style={s.p}>
        Kommentarer publiceras direkt, utan förhandsgranskning. En kommentar som
        bryter mot reglerna tas bort när vi får veta om den. Den som skrev den
        ser i appen att den har tagits bort. Du kan alltid ta bort din egen
        kommentar själv.
      </p>
      <p style={s.p}>
        Ett konto krävs för att skriva en kommentar, men inte för att använda
        appen eller för att anmäla något.
      </p>

      <h2 style={s.h2}>Anmäl något</h2>
      <p style={s.p}>
        I appen: tryck på <strong>Rapportera</strong> under kommentaren. Det
        krävs inget konto.
      </p>
      <p style={s.p}>
        Eller använd{' '}
        <a href={NOTICE_URL} style={s.a}>
          kontaktformuläret
        </a>
        . Skriv vilken plats det gäller och vad kommentaren säger, så går det
        snabbare att hitta den. Vem som helst kan anmäla — du behöver inte
        använda appen och inget konto krävs.
      </p>

      {/* ---------------------------------------------------------------- */}

      <h1 style={s.h1Later}>Comment rules</h1>

      <p style={s.p}>
        Fornkoll is a free app for finding and visiting Sweden&apos;s
        archaeological sites. You can write comments about a place so the next
        visitor knows what to expect. This page says what is not allowed and
        what happens then.
      </p>

      <h2 style={s.h2}>Not allowed</h2>
      <ul style={s.ul}>
        <li style={s.li}>
          Illegal content, including threats and hate speech.
        </li>
        <li style={s.li}>Abuse, harassment, or attacks on a person.</li>
        <li style={s.li}>
          Somebody else&apos;s personal details — name, address, phone number.
        </li>
        <li style={s.li}>Advertising and spam.</li>
        <li style={s.li}>
          Encouraging anyone to dig, take objects, or otherwise damage a site.
          That is also a criminal offence under the Historic Environment Act.
        </li>
      </ul>

      <h2 style={s.h2}>What happens</h2>
      <p style={s.p}>
        Comments are published immediately, without prior review. A comment that
        breaks these rules is removed once we are told about it. Whoever wrote
        it sees in the app that it was removed. You can always delete your own
        comment yourself.
      </p>
      <p style={s.p}>
        An account is needed to write a comment, but not to use the app and not
        to report anything.
      </p>

      <h2 style={s.h2}>Report something</h2>
      <p style={s.p}>
        In the app: press <strong>Report</strong> under the comment. No account
        needed.
      </p>
      <p style={s.p}>
        Or use the{' '}
        <a href={NOTICE_URL} style={s.a}>
          contact form
        </a>
        . Say which place it is about and what the comment says, so it can be
        found quickly. Anyone can report — you do not have to use the app and no
        account is needed.
      </p>
    </main>
  );
}
