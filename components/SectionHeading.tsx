import Reveal from "./Reveal";

export default function SectionHeading({
  eyebrow,
  title,
  desc,
  align = "left",
}: {
  eyebrow: string;
  title: string[];
  desc?: string;
  align?: "left" | "center";
}) {
  return (
    <Reveal>
      <div className={align === "center" ? "mx-auto max-w-2xl text-center" : ""}>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-5 h-display text-3xl sm:text-4xl lg:text-[2.75rem]">
          {title.map((t) => (
            <span key={t} className="block">
              {t}
            </span>
          ))}
        </h2>
        {desc && (
          <p
            className={`mt-5 text-[16px] leading-relaxed text-muted ${
              align === "center" ? "mx-auto max-w-[60ch]" : "max-w-[60ch]"
            }`}
          >
            {desc}
          </p>
        )}
      </div>
    </Reveal>
  );
}
