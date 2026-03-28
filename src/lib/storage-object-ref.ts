export interface StorageObjectRef {
  folder: string;
  fileName: string;
  objectPath: string;
}

/**
 * Parse storage object location from a URL or path.
 */
export function parseStorageObjectRef(
  input: string,
  defaultFolder: string = "tracks",
  bucketName: string = "bizmusic-assets"
): StorageObjectRef {
  const trimmed = input.trim();
  let pathCandidate = trimmed;

  const stripSupabaseStoragePrefix = (value: string) => {
    const normalized = value.replace(/^\/+/, "");
    const bucketSpecific = new RegExp(
      `^storage/v1/object/(?:public|sign|authenticated)/${bucketName}/(.+)$`,
      "i"
    );
    const anyBucket = /^storage\/v1\/object\/(?:public|sign|authenticated)\/[^/]+\/(.+)$/i;

    const bucketSpecificMatch = normalized.match(bucketSpecific);
    if (bucketSpecificMatch?.[1]) {
      return bucketSpecificMatch[1];
    }

    const anyBucketMatch = normalized.match(anyBucket);
    if (anyBucketMatch?.[1]) {
      return anyBucketMatch[1];
    }

    return value;
  };

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      pathCandidate = decodeURIComponent(url.pathname);

      const markers = [
        `/storage/v1/object/public/${bucketName}/`,
        `/storage/v1/object/sign/${bucketName}/`,
        `/storage/v1/object/authenticated/${bucketName}/`,
      ];

      const matchedMarker = markers.find((marker) => pathCandidate.includes(marker));
      if (matchedMarker) {
        pathCandidate = pathCandidate.slice(pathCandidate.indexOf(matchedMarker) + matchedMarker.length);
      } else {
        pathCandidate = stripSupabaseStoragePrefix(pathCandidate);
      }
    } catch {
      pathCandidate = trimmed;
    }
  }

  pathCandidate = stripSupabaseStoragePrefix(pathCandidate)
    .replace(/^\/+/, "")
    .replace(/[?#].*$/, "");

  const objectPath = pathCandidate.includes("/")
    ? pathCandidate
    : `${defaultFolder}/${pathCandidate}`;

  const segments = objectPath.split("/").filter(Boolean);
  const fileName = segments[segments.length - 1] || pathCandidate;
  const folder = segments.length > 1
    ? segments.slice(0, -1).join("/")
    : defaultFolder;

  return {
    folder,
    fileName,
    objectPath,
  };
}
