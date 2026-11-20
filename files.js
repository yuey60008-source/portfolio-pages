for (const panel of document.querySelectorAll('details[data-id]')) {
  const base = panel.dataset.id + '/';
  const status = panel.querySelector('output');
  let manifest;
  async function read(url) {
    const response = await fetch(base + url);
    if (!response.ok) throw Error(response.status);
    return response;
  }
  async function download(item) {
    try {
      status.textContent = '正在准备下载…';
      const chunk = 8388608;
      const first = item ? Math.floor(item.start / chunk) : 0;
      const last = item ? Math.floor((item.start + item.size - 1) / chunk) : manifest.parts - 1;
      const buffers = [];
      for (let i = first; i <= last; i++) buffers.push(await (await read('p' + i + '.bin')).blob());
      let blob = new Blob(buffers);
      if (item) blob = blob.slice(item.start - first * chunk, item.start - first * chunk + item.size);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = item ? item.name.split('/').pop() : manifest.name + '.zip';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 60000);
      status.textContent = '';
    } catch { status.textContent = '下载失败，请重试。'; }
  }
  panel.ontoggle = async () => {
    if (!panel.open || manifest) return;
    try {
      manifest = await (await read('files.json')).json();
      for (const item of manifest.items) {
        const btn = document.createElement('button');
        btn.textContent = item.name;
        btn.onclick = () => download(item);
        panel.querySelector('.files').append(btn);
      }
      panel.querySelector('button').onclick = () => download();
    } catch { status.textContent = '目录读取失败，请收起后重试。'; }
  };
}
