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
        pathCandidate = pathCandidate.replace(/^\/+/, "");
      }
    } catch {
      pathCandidate = trimmed;
    }
  }

  pathCandidate = pathCandidate.replace(/^\/+/, "").replace(/[?#].*$/, "");

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
