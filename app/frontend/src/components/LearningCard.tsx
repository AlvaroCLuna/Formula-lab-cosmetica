import type { LearningCard as LearningCardType } from "../types";

type Props = {
  card: LearningCardType;
};

export function LearningCard({ card }: Props) {
  return (
    <article className="learning-card" title="Modo aprendizaje con fuente y confianza">
      <strong>{card.name}</strong>
      <span>{card.cosmeticFunction}</span>
      <p>INCI: {card.inci}</p>
      <small>Fuente: {card.source} - Confianza: {card.confidence}</small>
    </article>
  );
}
