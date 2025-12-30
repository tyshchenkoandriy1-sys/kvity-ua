export function SellerRatingBadge({
  avg,
  count,
}: {
  avg?: number | null;
  count?: number | null;
}) {
  if (!avg || !count) {
    return <span className="text-xs text-gray-500">Рейтинг магазину: немає</span>;
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-700">
      <span className="text-gray-500">Рейтинг магазину:</span>
      <span aria-hidden>⭐</span>
      <span className="font-medium">{avg.toFixed(1)}</span>
      <span className="text-gray-500">({count})</span>
    </span>
  );
}
