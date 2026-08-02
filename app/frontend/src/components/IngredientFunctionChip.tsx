type Props = {
  name: string;
  functionName: string;
  inci?: string | null;
};

export function IngredientFunctionChip({ name, functionName, inci }: Props) {
  return (
    <span className="ingredient-chip" title={inci ? `${name} - INCI: ${inci}` : `${name} - INCI no disponible`}>
      <strong>{name}</strong>
      <small>{functionName}</small>
    </span>
  );
}
