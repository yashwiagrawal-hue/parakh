/* eslint-disable @next/next/no-img-element */
export const PREVIEW_NOTE =
  "Catalogue photo. The finished piece may vary slightly. You pay for the actual weight, within the range above.";

/** The one memorable visual element: the design preview with its weight range and disclaimer. */
export default function DesignPreview({
  image,
  name,
  demo,
}: {
  image: string | null;
  name: string;
  demo?: boolean;
}) {
  return (
    <figure className="m-0">
      <div className="flex aspect-square w-full max-w-xs items-center justify-center rounded-2xl border border-line bg-[#fbf6ea] p-6 mx-auto">
        {image ? (
          <img src={image} alt={name} className="h-full w-full object-contain" />
        ) : (
          <span className="text-center text-muted">No catalogue photo for this piece</span>
        )}
      </div>
      <figcaption className="mt-2 space-y-1 text-center text-sm text-muted">
        {demo && <p className="font-medium text-warn">Demo weights</p>}
        <p>{PREVIEW_NOTE}</p>
      </figcaption>
    </figure>
  );
}
