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
 * What the app collects, why, and how to get rid of it.
 *
 * GDPR art. 13: the information has to be given at the point data is
 * collected, in concise, intelligible, plain language. A page of
 * capitalised defined terms is the opposite of compliant.
 *
 * EVERY CLAIM HERE WAS CHECKED AGAINST THE CODE, and two of them are more
 * favourable than a boilerplate notice would have dared assume:
 *
 *   - NO COORDINATES ARE EVER SENT. A visit event carries which registered
 *     site, how many metres away, the GPS accuracy and the local day --
 *     never a position. See recordVisit in the app's contributions.ts.
 *   - NO EMAIL OR NAME IS STORED. The link route inserts only (uid,
 *     provider) into fl_accounts; the Firebase token carries an email and it
 *     is read and discarded.
 *
 * The IP claim is likewise exact: ipHash salts with a value generated inside
 * the database and truncates, and the raw address is never written.
 *
 * NOT REVIEWED BY A LAWYER. A good-faith description of what the code does.
 */
export const metadata: Metadata = {
  title: 'Integritet — Fornkoll',
  description:
    'Vilka uppgifter Fornkoll samlar in, varför, och hur du tar bort dem.',
};

const CONTACT_URL = '/contact';

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

export default function PrivacyPage() {
  return (
    <main style={s.main}>
      <h1 style={s.h1}>Integritet</h1>

      <p style={s.p}>
        Fornkoll är en gratis app utan annonser. Den mesta informationen stannar
        i telefonen: du behöver inget konto för att använda kartan, läsa
        beskrivningar, sätta betyg, markera besök eller svara på frågor.
      </p>

      <h2 style={s.h2}>Det som stannar i telefonen</h2>
      <p style={s.p}>
        Din GPS-position används för att visa var du är och för att känna igen
        att du har varit på en plats.{' '}
        <strong>Den lämnar aldrig telefonen.</strong> Dina betyg, besök, svar
        och favoriter sparas lokalt först och visas för dig även utan konto och
        utan täckning.
      </p>

      <h2 style={s.h2}>Det som skickas när du publicerar</h2>
      <p style={s.p}>
        När du loggar in publiceras det du har bidragit med, så att nästa
        besökare ser det. Då skickas:
      </p>
      <ul style={s.ul}>
        <li style={s.li}>
          ett slumpmässigt id för din telefon — inte ditt namn, inte din e-post
        </li>
        <li style={s.li}>vilken fornlämning det gäller</li>
        <li style={s.li}>
          ditt betyg, ditt svar eller din kommentar, och vilken dag det var
        </li>
        <li style={s.li}>
          för ett besök: avståndet i meter och GPS-noggrannheten —{' '}
          <strong>aldrig koordinater</strong>
        </li>
      </ul>
      <p style={s.p}>
        Andra användare ser ett saltat, oåterkalleligt smeknamn i stället för
        telefonens id.
      </p>

      <h2 style={s.h2}>Konto</h2>
      <p style={s.p}>
        Inloggning sker med Google via Firebase. Vi sparar bara ett konto-id och
        vilken leverantör det kom från. Din e-postadress och ditt namn läses för
        att verifiera inloggningen och sparas inte. Google hanterar själva
        kontot.
      </p>

      <h2 style={s.h2}>IP-adress</h2>
      <p style={s.p}>
        Din IP-adress sparas aldrig. Den räknas om till ett saltat, förkortat
        hashvärde som bara används för att begränsa hur många bidrag som kan
        skickas per timme.
      </p>

      <h2 style={s.h2}>Kartan</h2>
      <p style={s.p}>
        Bakgrundskartan hämtas från OpenFreeMap. De ser därmed vilka kartrutor
        din telefon ber om, vilket grovt visar var du tittar. Fornlämningarna
        och beskrivningarna följer med appen och kräver inget nätverk.
      </p>

      <h2 style={s.h2}>Var det lagras</h2>
      <p style={s.p}>
        Hos Vercel (webbtjänsten) och Neon (databasen, EU). Riksantikvarie-
        ämbetets uppgifter om fornlämningarna är öppna data och innehåller inget
        om dig.
      </p>

      <h2 style={s.h2}>Ta bort allt</h2>
      <p style={s.p}>
        I appens meny finns <strong>Glöm mig</strong>. Den tar bort allt du har
        publicerat från servern, tar bort telefonens id och publicerar en notis
        som gör att andra telefoner också raderar dina bidrag. Appen raderar sig
        själv lokalt bara om servern lyckades, så knappen ljuger inte.
      </p>
      <p style={s.p}>
        Du kan också{' '}
        <a href={CONTACT_URL} style={s.a}>
          skriva via kontaktformuläret
        </a>{' '}
        om du vill veta vad som finns lagrat eller få något rättat.
      </p>

      {/* ---------------------------------------------------------------- */}

      <h1 style={s.h1Later}>Privacy</h1>

      <p style={s.p}>
        Fornkoll is a free app with no ads. Most of what it knows stays on the
        phone: you need no account to use the map, read descriptions, rate a
        place, mark a visit or answer questions.
      </p>

      <h2 style={s.h2}>What stays on the phone</h2>
      <p style={s.p}>
        Your GPS position is used to show where you are and to recognise that
        you have been to a place. <strong>It never leaves the phone.</strong>{' '}
        Your ratings, visits, answers and favourites are saved locally first and
        shown back to you with no account and no signal.
      </p>

      <h2 style={s.h2}>What is sent when you publish</h2>
      <p style={s.p}>
        When you sign in, what you have contributed is published so the next
        visitor can see it. What is sent:
      </p>
      <ul style={s.ul}>
        <li style={s.li}>
          a random id for your phone — not your name, not your email
        </li>
        <li style={s.li}>which archaeological site it is about</li>
        <li style={s.li}>
          your rating, your answer or your comment, and which day it was
        </li>
        <li style={s.li}>
          for a visit: the distance in metres and the GPS accuracy —{' '}
          <strong>never coordinates</strong>
        </li>
      </ul>
      <p style={s.p}>
        Other users see a salted, irreversible pseudonym rather than your
        phone&apos;s id.
      </p>

      <h2 style={s.h2}>Account</h2>
      <p style={s.p}>
        Signing in uses Google through Firebase. We store only an account id and
        which provider it came from. Your email address and name are read to
        verify the sign-in and are not stored. Google holds the account itself.
      </p>

      <h2 style={s.h2}>IP address</h2>
      <p style={s.p}>
        Your IP address is never stored. It is turned into a salted, truncated
        hash used only to limit how many contributions can be sent per hour.
      </p>

      <h2 style={s.h2}>The map</h2>
      <p style={s.p}>
        The background map comes from OpenFreeMap, so they see which map tiles
        your phone asks for, which roughly shows where you are looking. The
        sites and their descriptions ship inside the app and need no network.
      </p>

      <h2 style={s.h2}>Where it is stored</h2>
      <p style={s.p}>
        With Vercel (the web service) and Neon (the database, EU). The Swedish
        National Heritage Board&apos;s data about the sites is open data and
        contains nothing about you.
      </p>

      <h2 style={s.h2}>Delete everything</h2>
      <p style={s.p}>
        The app&apos;s menu has <strong>Forget me</strong>. It deletes
        everything you have published from the server, discards the phone&apos;s
        id, and publishes a notice that makes other phones delete your
        contributions too. The app only wipes itself locally if the server
        succeeded, so the button does not lie.
      </p>
      <p style={s.p}>
        You can also{' '}
        <a href={CONTACT_URL} style={s.a}>
          use the contact form
        </a>{' '}
        to ask what is stored or to have something corrected.
      </p>
    </main>
  );
}
