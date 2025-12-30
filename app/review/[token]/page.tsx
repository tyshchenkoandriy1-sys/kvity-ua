import ReviewForm from "./review-form";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-semibold">Залишити відгук</h1>
      <p className="mt-2 text-sm text-gray-600">
        Постав оцінку магазину та (за бажанням) напиши короткий коментар.
      </p>

      <div className="mt-6 rounded-2xl border bg-white p-5">
        <ReviewForm token={token} />
      </div>
    </div>
  );
}
