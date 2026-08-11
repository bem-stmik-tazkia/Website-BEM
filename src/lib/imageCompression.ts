import imageCompression from 'browser-image-compression';

/**
 * Mengkompresi file gambar (JPG/PNG) di sisi klien sebelum diunggah.
 * File yang dikembalikan akan memiliki ukuran dan dimensi maksimal sesuai konfigurasi.
 *
 * @param file File asli yang diinput user
 * @param maxSizeMB Ukuran file maksimal dalam MB (default: 1MB)
 * @param maxWidthOrHeight Dimensi maksimal panjang/lebar (default: 1920px)
 * @returns Promise<File> File hasil kompresi (atau file asli jika tidak didukung)
 */
export async function compressImage(
  file: File,
  maxSizeMB: number = 1,
  maxWidthOrHeight: number = 1920
): Promise<File> {
  // Hanya proses jika file adalah gambar (jangan kompres PDF dll)
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // Opsi kompresi
  const options = {
    maxSizeMB: maxSizeMB,
    maxWidthOrHeight: maxWidthOrHeight,
    useWebWorker: true,
    fileType: file.type // pertahankan format asli (misal png/jpeg)
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    // Ubah Blob kembali menjadi tipe File untuk kompatibilitas input HTML
    const compressedFile = new File([compressedBlob], file.name, {
      type: file.type,
      lastModified: Date.now(),
    });
    
    return compressedFile;
  } catch (error) {
    console.error("Gagal mengkompresi gambar, menggunakan file asli:", error);
    return file;
  }
}
