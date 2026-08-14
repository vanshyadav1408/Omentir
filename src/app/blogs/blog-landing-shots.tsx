import { LandingShot } from "../seo-content/shared";
import { OMENTIR_SITE_SHOT, SITE_SHOTS } from "../seo-content/site-shots";

export function BlogLandingShots({ ids }: { ids: string[] }) {
  const shots = ids
    .map((id) => (id === "omentir" ? OMENTIR_SITE_SHOT : SITE_SHOTS[id]))
    .filter((shot): shot is NonNullable<typeof shot> => Boolean(shot));

  if (shots.length === 0) return null;

  return (
    <div className={`not-prose my-8 grid gap-4 ${shots.length > 1 ? "lg:grid-cols-2" : ""}`}>
      {shots.map((shot) => (
        <LandingShot
          key={shot.src}
          href={shot.href}
          src={shot.src}
          alt={`${shot.label} homepage`}
          label={shot.label}
        />
      ))}
    </div>
  );
}
