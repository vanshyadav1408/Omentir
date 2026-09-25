const STATS = [
  { value: "300+", label: "Customers" },
  { value: "110k+", label: "Conversations started" },
  { value: "7000+", label: "Meetings booked" },
];

/** Headline numbers under the hero demo, on the same green panels as the
 *  feature cards. */
export default function HomeStats() {
  return (
    <section aria-label="Omentir in numbers" className="mt-10 grid gap-3 md:mt-12 md:grid-cols-3">
      {STATS.map((stat) => (
        <div key={stat.label} className="home-green-panel home-stat">
          <p className="home-stat-value">{stat.value}</p>
          <p className="home-stat-label">{stat.label}</p>
        </div>
      ))}
    </section>
  );
}
