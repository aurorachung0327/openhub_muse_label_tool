const openFolderBtn = document.querySelector("#openFolderBtn");
const folderInput = document.querySelector("#folderInput");
const selectImagesBtn = document.querySelector("#selectImagesBtn");
const imageInput = document.querySelector("#imageInput");
const chooseOutputBtn = document.querySelector("#chooseOutputBtn");
const saveImagesBtn = document.querySelector("#saveImagesBtn");
const imageList = document.querySelector("#imageList");
const imageCount = document.querySelector("#imageCount");
const boxCount = document.querySelector("#boxCount");
const currentName = document.querySelector("#currentName");
const prevBtn = document.querySelector("#prevBtn");
const nextBtn = document.querySelector("#nextBtn");
const deleteBtn = document.querySelector("#deleteBtn");
const clearBtn = document.querySelector("#clearBtn");
const statusText = document.querySelector("#statusText");
const cursorText = document.querySelector("#cursorText");
const canvasWrap = document.querySelector("#canvasWrap");
const emptyState = document.querySelector("#emptyState");
const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d");

const imageExtensions = /\.(jpe?g|png|gif|webp|bmp)$/i;
const state = {
  images: [],
  currentIndex: -1,
  currentImage: null,
  boxesByImage: {},
  selectedBoxId: null,
  drag: null,
  outputDirHandle: null,
};

openFolderBtn.addEventListener("click", openImageFolder);
folderInput.addEventListener("change", handleFolderSelect);
selectImagesBtn.addEventListener("click", () => imageInput.click());
imageInput.addEventListener("change", handleImageSelect);
chooseOutputBtn.addEventListener("click", chooseOutputFolder);
saveImagesBtn.addEventListener("click", saveAnnotatedImages);
prevBtn.addEventListener("click", () => showImage(state.currentIndex - 1));
nextBtn.addEventListener("click", () => showImage(state.currentIndex + 1));
deleteBtn.addEventListener("click", deleteSelectedBox);
clearBtn.addEventListener("click", clearCurrentBoxes);
canvas.addEventListener("pointerdown", handlePointerDown);
canvas.addEventListener("pointermove", handlePointerMove);
canvas.addEventListener("pointerup", finishDrag);
canvas.addEventListener("pointercancel", finishDrag);
canvasWrap.addEventListener("dragenter", handleDragEnter);
canvasWrap.addEventListener("dragover", handleDragOver);
canvasWrap.addEventListener("dragleave", handleDragLeave);
canvasWrap.addEventListener("drop", handleDrop);
window.addEventListener("dragover", preventFileOpen);
window.addEventListener("drop", preventFileOpen);
window.addEventListener("keydown", handleKeys);
window.addEventListener("resize", draw);

async function openImageFolder() {
  folderInput.click();
}

function handleFolderSelect(event) {
  const files = Array.from(event.target.files)
    .filter((file) => file.type.startsWith("image/") || imageExtensions.test(file.name))
    .sort((a, b) => getPath(a).localeCompare(getPath(b), "en", { numeric: true }));

  loadImageEntries(createBrowserImageEntries(files));

  if (state.images.length) {
    setStatus(`Loaded ${state.images.length} images.`);
  } else {
    setStatus("No supported images were found in that folder.");
  }
  event.target.value = "";
}

function handleImageSelect(event) {
  const files = Array.from(event.target.files).filter(isImageFile);
  loadImageEntries(createBrowserImageEntries(files));

  if (state.images.length) {
    setStatus(`Loaded ${state.images.length} images.`);
  } else {
    setStatus("No supported images were selected.");
  }
  event.target.value = "";
}

function createBrowserImageEntries(files) {
  return files
    .filter(isImageFile)
    .sort((a, b) => getPath(a).localeCompare(getPath(b), "en", { numeric: true }))
    .map((file, index) => ({
      id: getPath(file) || `${index}-${file.name}`,
      file,
      name: file.name,
      path: getPath(file) || file.name,
      url: URL.createObjectURL(file),
    }));
}

function isImageFile(file) {
  return file.type.startsWith("image/") || imageExtensions.test(file.name);
}

function loadImageEntries(images) {
  revokeImageUrls();
  state.images = images;
  state.currentIndex = -1;
  state.currentImage = null;
  state.selectedBoxId = null;
  state.outputDirHandle = null;
  renderImageList();
  updateToolbar();

  if (state.images.length) {
    showImage(0);
  } else {
    resetCanvas();
  }
}

function getPath(file) {
  return file.webkitRelativePath || file.name;
}

function renderImageList() {
  imageList.innerHTML = "";
  const fragment = document.createDocumentFragment();

  state.images.forEach((image, index) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = `image-item${index === state.currentIndex ? " active" : ""}`;
    item.addEventListener("click", () => showImage(index));

    const thumb = document.createElement("img");
    thumb.className = "thumb";
    thumb.src = image.url;
    thumb.alt = "";

    const meta = document.createElement("span");
    meta.className = "image-meta";

    const name = document.createElement("span");
    name.className = "image-name";
    name.textContent = image.name;

    const sub = document.createElement("span");
    sub.className = "image-sub";
    sub.textContent = image.path;

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = getBoxes(image.id).length;

    meta.append(name, sub);
    item.append(thumb, meta, badge);
    fragment.append(item);
  });

  imageList.append(fragment);
}

function showImage(index) {
  if (index < 0 || index >= state.images.length) return;

  state.currentIndex = index;
  state.selectedBoxId = null;
  const imageInfo = state.images[index];
  const image = new Image();

  image.onload = () => {
    state.currentImage = image;
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    canvas.style.display = "block";
    emptyState.style.display = "none";
    currentName.textContent = imageInfo.path;
    draw();
    renderImageList();
    updateToolbar();
  };

  image.onerror = () => {
    setStatus(`Could not load image: ${imageInfo.path}`);
  };

  image.src = imageInfo.url;
}

function resetCanvas() {
  state.currentIndex = -1;
  state.currentImage = null;
  canvas.style.display = "none";
  emptyState.style.display = "grid";
  currentName.textContent = "No images loaded";
  updateToolbar();
}

function getBoxes(imageId = getCurrentImageId()) {
  if (!imageId) return [];
  state.boxesByImage[imageId] ||= [];
  return state.boxesByImage[imageId];
}

function getCurrentImageId() {
  return state.images[state.currentIndex]?.id;
}

function updateToolbar() {
  const hasImages = state.images.length > 0;
  const boxes = getBoxes();

  imageCount.textContent = `${state.images.length} ${state.images.length === 1 ? "image" : "images"}`;
  boxCount.textContent = `${boxes.length} ${boxes.length === 1 ? "box" : "boxes"}`;
  chooseOutputBtn.disabled = !hasImages || !("showDirectoryPicker" in window);
  saveImagesBtn.disabled = !hasImages;
  prevBtn.disabled = !hasImages || state.currentIndex <= 0;
  nextBtn.disabled = !hasImages || state.currentIndex >= state.images.length - 1;
  deleteBtn.disabled = !state.selectedBoxId;
  clearBtn.disabled = !boxes.length;
}

function draw(previewBox = null) {
  if (!state.currentImage) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(state.currentImage, 0, 0);

  for (const box of getBoxes()) {
    drawBox(box, box.id === state.selectedBoxId);
  }

  if (previewBox) {
    drawBox(previewBox, false, true);
  }
}

function drawBox(box, selected, preview = false) {
  drawBoxOn(ctx, box, canvas.width, selected, preview);
}

function drawBoxOn(targetCtx, box, canvasWidth, selected = false, preview = false) {
  const color = selected ? "#f0b429" : "#0b7f83";
  targetCtx.save();
  targetCtx.lineWidth = Math.max(2, canvasWidth / 800);
  targetCtx.strokeStyle = color;
  targetCtx.fillStyle = preview ? "rgba(11, 127, 131, 0.12)" : "rgba(11, 127, 131, 0.05)";
  targetCtx.strokeRect(box.x, box.y, box.width, box.height);
  targetCtx.fillRect(box.x, box.y, box.width, box.height);
  targetCtx.restore();
}

function handlePointerDown(event) {
  if (!state.currentImage) return;
  const point = getCanvasPoint(event);
  const hit = findBoxAt(point.x, point.y);

  if (hit) {
    state.selectedBoxId = hit.id;
    state.drag = { type: "move", id: hit.id, start: point, original: { ...hit } };
  } else {
    state.selectedBoxId = null;
    state.drag = { type: "draw", start: point, current: point };
  }

  canvas.setPointerCapture(event.pointerId);
  updateToolbar();
  draw();
}

function handlePointerMove(event) {
  if (!state.currentImage) return;
  const point = getCanvasPoint(event);
  cursorText.textContent = `x ${Math.round(point.x)}, y ${Math.round(point.y)}`;

  if (!state.drag) return;

  if (state.drag.type === "draw") {
    state.drag.current = point;
    draw(normalizeBox(state.drag.start, point));
    return;
  }

  const box = getBoxes().find((item) => item.id === state.drag.id);
  if (!box) return;
  const dx = point.x - state.drag.start.x;
  const dy = point.y - state.drag.start.y;
  box.x = clamp(state.drag.original.x + dx, 0, canvas.width - box.width);
  box.y = clamp(state.drag.original.y + dy, 0, canvas.height - box.height);
  draw();
}

function finishDrag(event) {
  if (!state.drag) return;

  if (state.drag.type === "draw") {
    const box = normalizeBox(state.drag.start, state.drag.current);
    if (box.width >= 5 && box.height >= 5) {
      box.id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
      getBoxes().push(box);
      state.selectedBoxId = box.id;
    }
  }

  state.drag = null;
  if (event.pointerId !== undefined && canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
  draw();
  renderImageList();
  updateToolbar();
}

function normalizeBox(start, end) {
  const x1 = clamp(Math.min(start.x, end.x), 0, canvas.width);
  const y1 = clamp(Math.min(start.y, end.y), 0, canvas.height);
  const x2 = clamp(Math.max(start.x, end.x), 0, canvas.width);
  const y2 = clamp(Math.max(start.y, end.y), 0, canvas.height);

  return {
    id: "preview",
    x: Math.round(x1),
    y: Math.round(y1),
    width: Math.round(x2 - x1),
    height: Math.round(y2 - y1),
  };
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function findBoxAt(x, y) {
  return [...getBoxes()].reverse().find((box) => {
    return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
  });
}

function deleteSelectedBox() {
  const imageId = getCurrentImageId();
  if (!imageId || !state.selectedBoxId) return;

  state.boxesByImage[imageId] = getBoxes().filter((box) => box.id !== state.selectedBoxId);
  state.selectedBoxId = null;
  draw();
  renderImageList();
  updateToolbar();
}

function clearCurrentBoxes() {
  const imageId = getCurrentImageId();
  if (!imageId) return;

  state.boxesByImage[imageId] = [];
  state.selectedBoxId = null;
  draw();
  renderImageList();
  updateToolbar();
}

function handleDragEnter(event) {
  preventFileOpen(event);
  if (hasDraggedImages(event)) {
    canvasWrap.classList.add("drag-over");
    setStatus("Drop images here to load them.");
  }
}

function handleDragOver(event) {
  preventFileOpen(event);
  if (hasDraggedImages(event)) {
    event.dataTransfer.dropEffect = "copy";
    canvasWrap.classList.add("drag-over");
  }
}

function handleDragLeave(event) {
  preventFileOpen(event);
  if (!canvasWrap.contains(event.relatedTarget)) {
    canvasWrap.classList.remove("drag-over");
  }
}

function handleDrop(event) {
  preventFileOpen(event);
  canvasWrap.classList.remove("drag-over");

  const files = Array.from(event.dataTransfer.files).filter(isImageFile);
  loadImageEntries(createBrowserImageEntries(files));

  if (state.images.length) {
    setStatus(`Loaded ${state.images.length} dropped images.`);
  } else {
    setStatus("No supported image files were dropped.");
  }
}

function preventFileOpen(event) {
  if (!event.dataTransfer) return;
  event.preventDefault();
  event.stopPropagation();
}

function hasDraggedImages(event) {
  const items = Array.from(event.dataTransfer?.items || []);
  if (!items.length) return true;
  return items.some((item) => item.kind === "file" && item.type.startsWith("image/"));
}

function handleKeys(event) {
  if (event.target instanceof HTMLInputElement) return;

  if (event.key === "ArrowLeft") showImage(state.currentIndex - 1);
  if (event.key === "ArrowRight") showImage(state.currentIndex + 1);
  if (event.key === "Delete" || event.key === "Backspace") deleteSelectedBox();
  if (event.key === "Escape") {
    state.selectedBoxId = null;
    state.drag = null;
    draw();
    updateToolbar();
  }
}

async function chooseOutputFolder() {
  if (!("showDirectoryPicker" in window)) {
    setStatus("This browser cannot choose an output folder. Use Chrome or Edge.");
    return;
  }

  try {
    state.outputDirHandle = await window.showDirectoryPicker({ mode: "readwrite" });
    saveImagesBtn.disabled = !state.images.length;
    setStatus("Output folder selected.");
  } catch (error) {
    if (error.name !== "AbortError") {
      setStatus("Could not choose an output folder.");
    }
  }
}

async function saveAnnotatedImages() {
  if (!state.images.length) return;

  if ("showDirectoryPicker" in window && !state.outputDirHandle) {
    await chooseOutputFolder();
    if (!state.outputDirHandle) return;
  }

  saveImagesBtn.disabled = true;
  setStatus("Saving images...");

  try {
    let saved = 0;
    for (const image of state.images) {
      const blob = await renderAnnotatedImage(image);
      const fileName = getExportImageName(image);

      if (state.outputDirHandle) {
        await writeBlobToDirectory(state.outputDirHandle, fileName, blob);
      } else {
        downloadBlob(blob, fileName);
      }
      saved += 1;
    }

    setStatus(
      state.outputDirHandle
        ? `Saved ${saved} images to the output folder.`
        : `Downloaded ${saved} images.`
    );
  } catch {
    setStatus("Could not save images.");
  } finally {
    saveImagesBtn.disabled = false;
  }
}

function renderAnnotatedImage(imageInfo) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const outputCanvas = document.createElement("canvas");
      outputCanvas.width = image.naturalWidth;
      outputCanvas.height = image.naturalHeight;
      const outputCtx = outputCanvas.getContext("2d");
      outputCtx.drawImage(image, 0, 0);

      for (const box of getBoxes(imageInfo.id)) {
        drawBoxOn(outputCtx, box, outputCanvas.width, false, false);
      }

      outputCanvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not create output image"));
      }, "image/png");
    };
    image.onerror = reject;
    image.src = imageInfo.url;
  });
}

async function writeBlobToDirectory(directoryHandle, fileName, blob) {
  const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function getExportImageName(image) {
  const baseName = image.path
    .replace(imageExtensions, "")
    .replace(/[\\/]+/g, "__")
    .replace(/[^\w.-]+/g, "_");
  return `${baseName}_boxed.png`;
}

function setStatus(message) {
  statusText.textContent = message;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function revokeImageUrls() {
  for (const image of state.images) {
    if (image.url?.startsWith("blob:")) {
      URL.revokeObjectURL(image.url);
    }
  }
}
