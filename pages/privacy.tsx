import Head from 'next/head';

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Datenschutz - Calora</title>
      </Head>

      <div className="left-panel" style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <h1>Datenschutzerklärung</h1>

        <h2>1. Datenschutz auf einen Blick</h2>
        <p>
          Diese Datenschutzerklärung klärt Sie über die Art, den Umfang und Zweck der Verarbeitung von personenbezogenen Daten auf.
        </p>

        <h2>2. Datenerfassung auf dieser Website</h2>
        <p>
          Die Calora-App speichert eingegebene Lebensmitteldaten temporär zur Kalorienzählung.
        </p>

        <h2>3. Ihre Rechte</h2>
        <p>
          Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung Ihrer Daten.
        </p>
      </div>
    </>
  );
}
