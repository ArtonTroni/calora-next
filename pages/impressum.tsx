import Head from 'next/head';

export default function Impressum() {
  return (
    <>
      <Head>
        <title>Impressum - Calora</title>
      </Head>

      <div className="left-panel" style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <h1>Impressum</h1>
        <p>Angaben gemäß § 5 TMG</p>
        <br />
        <p>
          <strong>Betreiber:</strong><br />
          Max Mustermann<br />
          Musterstraße 123<br />
          12345 Musterstadt
        </p>

        <p>
          <strong>Kontakt:</strong><br />
          Telefon: +49 (0) 123 456789<br />
          E-Mail: info@calora-app.de
        </p>
      </div>
    </>
  );
}
