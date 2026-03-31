type DownloadMode = 'folder' | 'zip' | 'cancelled';

type DownloadableImageItem = {
  imageUrl: string;
  companyName?: string;
  productName?: string;
  fallbackName?: string;
};

type OrganizedImageDownloadResult = {
  mode: DownloadMode;
  count: number;
  containerName?: string;
};

type PreparedDownloadItem = {
  companyFolderName: string;
  fileName: string;
  relativePath: string;
  bytes: Uint8Array;
  mimeType: string;
};

type DirectoryPickerWindow = Window & {
  showDirectoryPicker?: (options?: {
    id?: string;
    mode?: 'read' | 'readwrite';
    startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
  }) => Promise<any>;
};

const renderableImageUrlCache = new Map<string, string>();

const sanitizeDownloadName = (value: string) => {
  const sanitized = value.replace(/[\\/:*?"<>|]+/g, '_').trim();
  return sanitized || 'صورة';
};

const getDownloadTimestamp = () => {
  const now = new Date();
  const datePart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const timePart = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
  return `${datePart}_${timePart}`;
};

const getDownloadExtension = (imageUrl: string, mimeType?: string) => {
  if (mimeType?.startsWith('image/')) {
    const mimeExt = mimeType.split('/')[1]?.toLowerCase();
    if (mimeExt) {
      return mimeExt === 'svg+xml' ? 'svg' : mimeExt;
    }
  }

  if (imageUrl.startsWith('data:image/')) {
    const dataMatch = imageUrl.match(/^data:image\/([^;]+)/i);
    const dataExt = dataMatch?.[1]?.toLowerCase();
    return dataExt === 'svg+xml' ? 'svg' : dataExt || 'jpg';
  }

  try {
    const resolvedUrl = new URL(imageUrl, window.location.origin);
    const fileName = resolvedUrl.pathname.split('/').pop() || '';
    const fileExt = fileName.split('.').pop()?.toLowerCase();
    return fileExt || 'jpg';
  } catch {
    return 'jpg';
  }
};

const isAbortError = (error: unknown) => {
  return error instanceof DOMException && error.name === 'AbortError';
};

const isSecurityError = (error: unknown) => {
  return error instanceof DOMException && error.name === 'SecurityError';
};

const dataUrlToBytes = (dataUrl: string) => {
  const match = dataUrl.match(/^data:([^;,]+)?(?:;charset=[^;,]+)?(;base64)?,(.*)$/i);
  if (!match) {
    throw new Error('Invalid data URL');
  }

  const mimeType = match[1] || 'application/octet-stream';
  const isBase64 = Boolean(match[2]);
  const payload = match[3] || '';

  if (isBase64) {
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return { bytes, mimeType };
  }

  const decoded = decodeURIComponent(payload);
  return {
    bytes: new TextEncoder().encode(decoded),
    mimeType,
  };
};

export const resolveRenderableImageUrl = async (imageUrl: string) => {
  if (!imageUrl) {
    return imageUrl;
  }

  if (!imageUrl.startsWith('data:')) {
    return imageUrl;
  }

  const cachedUrl = renderableImageUrlCache.get(imageUrl);
  if (cachedUrl) {
    return cachedUrl;
  }

  const { bytes, mimeType } = dataUrlToBytes(imageUrl);
  const objectUrl = URL.createObjectURL(new Blob([bytes], { type: mimeType || 'application/octet-stream' }));
  renderableImageUrlCache.set(imageUrl, objectUrl);
  return objectUrl;
};

const loadImageBytes = async (imageUrl: string) => {
  if (imageUrl.startsWith('data:')) {
    return dataUrlToBytes(imageUrl);
  }

  const response = await fetch(imageUrl, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Image fetch failed with status ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    bytes: new Uint8Array(arrayBuffer),
    mimeType: response.headers.get('content-type') || 'application/octet-stream',
  };
};

const isMobileDownloadContext = () => {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const userAgentData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData;
  if (typeof userAgentData?.mobile === 'boolean') {
    return userAgentData.mobile;
  }

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent || '');
};

const prepareDownloadItems = async (items: DownloadableImageItem[], timestamp: string) => {
  const preparedItems: PreparedDownloadItem[] = [];
  const addedPaths = new Set<string>();
  const productFileCounters = new Map<string, number>();

  for (const item of items) {
    const imageUrl = item.imageUrl;
    if (!imageUrl) {
      continue;
    }

    try {
      const { bytes, mimeType } = await loadImageBytes(imageUrl);
      if (!bytes.length) {
        continue;
      }

      const companyFolderName = sanitizeDownloadName(item.companyName || 'شركة_غير_محددة');
      const productName = sanitizeDownloadName(item.productName || item.fallbackName || 'منتج');
      const productCounterKey = `${companyFolderName}/${productName}`;
      const nextCounter = (productFileCounters.get(productCounterKey) || 0) + 1;
      productFileCounters.set(productCounterKey, nextCounter);

      const extension = getDownloadExtension(imageUrl, mimeType);
      const fileName = `${productName}_${timestamp}_${nextCounter}.${extension}`;
      const relativePath = `${companyFolderName}/${fileName}`;

      if (addedPaths.has(relativePath)) {
        continue;
      }

      preparedItems.push({
        companyFolderName,
        fileName,
        relativePath,
        bytes,
        mimeType,
      });
      addedPaths.add(relativePath);
    } catch (error) {
      console.warn('تعذر تجهيز صورة للتنزيل المنظم:', error);
    }
  }

  return preparedItems;
};

const writeFolderDownloads = async (parentDirectoryHandle: any, rootFolderName: string, preparedItems: PreparedDownloadItem[]) => {
  const rootDirectoryHandle = await parentDirectoryHandle.getDirectoryHandle(rootFolderName, { create: true });

  for (const item of preparedItems) {
    const companyDirectoryHandle = await rootDirectoryHandle.getDirectoryHandle(item.companyFolderName, { create: true });
    const fileHandle = await companyDirectoryHandle.getFileHandle(item.fileName, { create: true });
    const writable = await fileHandle.createWritable();
    const blob = new Blob([item.bytes], { type: item.mimeType || 'application/octet-stream' });

    try {
      await writable.write(blob);
    } finally {
      await writable.close();
    }
  }
};

const downloadZipFallback = async (rootFolderName: string, preparedItems: PreparedDownloadItem[]) => {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  for (const item of preparedItems) {
    zip.file(`${rootFolderName}/${item.relativePath}`, item.bytes, {
      binary: true,
      compression: 'STORE',
    });
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'STORE',
  });

  const zipFileName = `${rootFolderName}.zip`;
  const zipUrl = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');

  link.href = zipUrl;
  link.download = zipFileName;
  link.rel = 'noopener';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(zipUrl), 30000);

  return zipFileName;
};

export const downloadOrganizedImages = async (items: DownloadableImageItem[]): Promise<OrganizedImageDownloadResult> => {
  const validItems = items.filter((item) => !!item.imageUrl);
  if (validItems.length === 0) {
    return { mode: 'folder', count: 0 };
  }

  const timestamp = getDownloadTimestamp();
  const rootFolderName = `صور_الشركات_${timestamp}`;
  const directoryPicker = (window as DirectoryPickerWindow).showDirectoryPicker;
  const isMobileDevice = isMobileDownloadContext();
  let parentDirectoryHandle: any = null;
  let shouldUseFolderDownload = false;

  if (!isMobileDevice && typeof directoryPicker === 'function' && window.isSecureContext) {
    try {
      parentDirectoryHandle = await directoryPicker({
        id: 'topup-purchased-images',
        mode: 'readwrite',
        startIn: 'downloads',
      });
      shouldUseFolderDownload = true;
    } catch (error) {
      if (isAbortError(error)) {
        return { mode: 'cancelled', count: 0, containerName: rootFolderName };
      }

      if (!isSecurityError(error)) {
        throw error;
      }

      console.warn('تعذر تفعيل اختيار المجلد المباشر، سيتم استخدام تنزيل ZIP المنظم بدلاً من ذلك:', error);
    }
  }

  const preparedItems = await prepareDownloadItems(validItems, timestamp);

  if (preparedItems.length === 0) {
    return {
      mode: shouldUseFolderDownload ? 'folder' : 'zip',
      count: 0,
      containerName: rootFolderName,
    };
  }

  if (shouldUseFolderDownload && parentDirectoryHandle) {
    try {
      await writeFolderDownloads(parentDirectoryHandle, rootFolderName, preparedItems);
      return {
        mode: 'folder',
        count: preparedItems.length,
        containerName: rootFolderName,
      };
    } catch (error) {
      console.warn('تعذر حفظ الصور داخل المجلد المحدد، سيتم استخدام تنزيل ZIP منظم بدلاً من ذلك:', error);
    }
  }

  const zipFileName = await downloadZipFallback(rootFolderName, preparedItems);
  return {
    mode: 'zip',
    count: preparedItems.length,
    containerName: zipFileName,
  };
};

export type { DownloadableImageItem, OrganizedImageDownloadResult };