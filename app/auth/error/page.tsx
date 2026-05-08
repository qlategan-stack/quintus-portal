type Props = {
  searchParams: Promise<{ message?: string }>;
};

export default async function AuthErrorPage({ searchParams }: Props) {
  const { message } = await searchParams;
  return (
    <main className="page" style={{ maxWidth: 520, margin: '8vh auto' }}>
      <header className="hdr">
        <div>
          <div className="kicker">Auth</div>
          <h1>Sign-in failed</h1>
          <div className="sub">{message ?? 'Unknown error.'}</div>
        </div>
      </header>
      <section className="placeholder">
        <p>
          The magic link may have expired or already been used. Request a new
          one from the <a href="/login">sign-in page</a>.
        </p>
      </section>
    </main>
  );
}
