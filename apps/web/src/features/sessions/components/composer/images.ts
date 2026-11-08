import type { PilotImageDto } from '@bosco/domain';

/** Formats acceptés par l'agent pour une image jointe. */
export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
export const MAX_IMAGES = 5;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export interface ImageReading {
  /** Premier refus rencontré, à afficher sous la zone ; null si tout est passé */
  error: null | string;
  images: PilotImageDto[];
}

/** Contenu du fichier en base64, sans le préfixe `data:…;base64,`. */
function readBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const { result } = reader;
      if (typeof result === 'string') resolve(result.slice(result.indexOf(',') + 1));
      else reject(new Error(`Unreadable image: ${file.name}`));
    });
    reader.addEventListener('error', () => reject(reader.error ?? new Error(`Unreadable image: ${file.name}`)));
    reader.readAsDataURL(file);
  });
}

function refusalOf(file: File): null | string {
  if (!IMAGE_TYPES.includes(file.type)) return `« ${file.name} » n’est pas une image PNG, JPEG, GIF ou WebP.`;
  if (file.size > MAX_IMAGE_BYTES) return `« ${file.name} » dépasse 5 Mo.`;
  return null;
}

/** Lit les fichiers choisis, collés ou glissés : garde ceux qui passent, dans la limite des places restantes. */
export async function readImages(files: File[], alreadyAttached: number): Promise<ImageReading> {
  let error: null | string = null;
  const accepted: File[] = [];
  for (const file of files) {
    const refusal = refusalOf(file);
    if (refusal) error ??= refusal;
    else if (alreadyAttached + accepted.length >= MAX_IMAGES) error ??= `${MAX_IMAGES} images au plus par message.`;
    else accepted.push(file);
  }
  const read = await Promise.all(
    accepted.map((file) =>
      readBase64(file).then(
        (data): PilotImageDto => ({ name: file.name, mediaType: file.type, data }),
        () => null,
      ),
    ),
  );
  const images = read.filter((image) => image !== null);
  if (images.length < accepted.length) error ??= 'Une image n’a pas pu être lue.';
  return { error, images };
}
