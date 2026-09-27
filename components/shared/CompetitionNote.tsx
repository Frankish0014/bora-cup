import { buttonClasses, buttonSm } from "@/components/ui/button";
import { COMPETITION_EMAIL, OFFICIAL_SITE } from "@/lib/content/competition";

export function CompetitionNote() {
  return (
    <section className="mt-4" aria-labelledby="about-competition">
      <h2 id="about-competition" className="px-1 text-sm font-semibold text-ink">
        About the competition
      </h2>
      <div className="card mt-3 p-5 sm:p-6">
        <p className="text-[15px] leading-7 text-ink">
          Best of Rwanda is Rwanda’s national coffee competition and auction. It began in 2024, organized by the National Agricultural Export Development Board (NAEB) and supported by the Coffee
          Exporters and Processors Association in Rwanda (CEPAR).
        </p>
        <p className="mt-3 text-[15px] leading-7 text-ink-soft">
          The aim is to support smallholder farmers, encourage sustainable production, and introduce award-winning Rwandan coffees to buyers around the world. The 2026 auction is on 21 October 2026.
        </p>
        <p className="mt-3 text-[15px] leading-7 text-ink-soft">
          In 2026 the competition adds an inaugural Mibirizi category. Mibirizi is Rwanda’s heritage variety, first planted in 1904 in the southwest of the country. Sherri Johns is head judge for 2026.
          She is a former Cup of Excellence head judge and an Authorized SCA Specialty Coffee Trainer.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <a href={OFFICIAL_SITE} target="_blank" rel="noreferrer" className={buttonClasses("secondary", buttonSm)}>
            Official website
          </a>
          <a href={`mailto:${COMPETITION_EMAIL}`} className={buttonClasses("ghost", buttonSm)}>
            {COMPETITION_EMAIL}
          </a>
        </div>
      </div>
    </section>
  );
}
