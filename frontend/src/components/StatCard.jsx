export default function StatCard({ title, value, hint }) {
  return (
    <article className="stat-card">
      <p>{title}</p>
      <h3>{value}</h3>
      <small>{hint}</small>
    </article>
  );
}
