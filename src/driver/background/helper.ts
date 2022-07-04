export async function imgSrcToDataUrl(imgSrc: string) {
  const res = await fetch(imgSrc, { credentials: 'include' });

  if (res.ok) {
    const arraybuffer = await res.arrayBuffer();

    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', (result) => {
        resolve(result.target!.result as string);
      });
      reader.addEventListener('error', reject);
      reader.readAsDataURL(new Blob([arraybuffer]));
    });
  }

  return '';
}
