const fileInput = document.getElementById('pdf-inputs');
const extractInput = document.getElementById('extract-input');
const fileListContainer = document.getElementById('file-list');
const mergeBtn = document.getElementById('merge-btn');
const extractBtn = document.getElementById('extract-btn');
const statusMsg = document.getElementById('status-msg');
const outputNameInput = document.getElementById('output-name');
const extractOutputNameInput = document.getElementById('extract-output-name');
const extractOutputLabel = document.getElementById('extract-output-label');
const pageSelectionInput = document.getElementById('page-selection');
const extractFileList = document.getElementById('extract-file-list');
const splitModeInput = document.getElementById('split-mode');
const splitControls = document.getElementById('split-controls');
const addSplitPartButton = document.getElementById('add-split-part');
const removeSplitPartButton = document.getElementById('remove-split-part');
const extractHelp = document.getElementById('extract-help');
const pagePreview = document.getElementById('page-preview');
const selectionCount = document.getElementById('selection-count');
const selectAllPagesButton = document.getElementById('select-all-pages');
const clearPagesButton = document.getElementById('clear-pages');
const mergeTab = document.getElementById('merge-tab');
const extractTab = document.getElementById('extract-tab');
const mergePanel = document.getElementById('merge-panel');
const extractPanel = document.getElementById('extract-panel');
const mergePreviewGrid = document.getElementById('merge-preview-grid');
const mergePreviewMessage = document.getElementById('merge-preview-message');
const mergePreviewCount = document.getElementById('merge-preview-count');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const themeLabel = document.getElementById('theme-label');

let selectedFiles = [];
let mergePreviewGeneration = 0;
let mergeOrderRevision = 0;
let mergePreviewPromise = null;
let mergePreviewPromiseGeneration = -1;
let mergePreviewResult = null;
let mergePreviewResultGeneration = -1;
let mergePreviewLoadingTask = null;
let mergePreviewObserver = null;
let extractFile = null;
let extractPageCount = 0;
let singleExtractPages = new Set();
let splitParts = [];
let activeSplitPartIndex = 0;
let splitMode = false;
let previewDocument = null;
let previewLoadingTask = null;
let previewObserver = null;
let previewLoadId = 0;
let selectedPages = new Set();

function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeIcon.textContent = isDark ? '☀️' : '🌙';
    themeLabel.textContent = isDark ? 'Modo claro' : 'Modo escuro';
    themeToggle.setAttribute('aria-label', isDark ? 'Ativar modo claro' : 'Ativar modo escuro');
}

try {
    applyTheme(localStorage.getItem('juntar-pdf-theme') || 'dark');
} catch (error) {
    console.warn('Não foi possível carregar a preferência de tema salva.', error);
    applyTheme('dark');
}

themeToggle.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(theme);
    try {
        localStorage.setItem('juntar-pdf-theme', theme);
    } catch (error) {
        console.warn('Não foi possível salvar a preferência de tema.', error);
    }
});

if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

function setActiveTab(tab) {
    const showMerge = tab === 'merge';
    mergeTab.setAttribute('aria-selected', String(showMerge));
    extractTab.setAttribute('aria-selected', String(!showMerge));
    mergePanel.hidden = !showMerge;
    extractPanel.hidden = showMerge;
    statusMsg.style.display = 'none';
    statusMsg.innerText = '';
}

mergeTab.addEventListener('click', () => setActiveTab('merge'));
extractTab.addEventListener('click', () => setActiveTab('extract'));

function enableFileDrop(dropzone, input) {
    let dragDepth = 0;

    dropzone.addEventListener('dragenter', (event) => {
        event.preventDefault();
        dragDepth += 1;
        dropzone.classList.add('drag-over');
    });

    dropzone.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    });

    dropzone.addEventListener('dragleave', (event) => {
        event.preventDefault();
        dragDepth = Math.max(0, dragDepth - 1);
        if (dragDepth === 0) dropzone.classList.remove('drag-over');
    });

    dropzone.addEventListener('drop', (event) => {
        event.preventDefault();
        dragDepth = 0;
        dropzone.classList.remove('drag-over');

        const files = event.dataTransfer.files;
        if (!files.length) return;

        const transfer = new DataTransfer();
        Array.from(files).forEach((file) => transfer.items.add(file));
        input.files = transfer.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
    });
}

enableFileDrop(document.querySelector('#merge-panel .dropzone'), fileInput);
enableFileDrop(document.querySelector('#extract-panel .dropzone'), extractInput);

document.addEventListener('dragover', (event) => {
    if (event.dataTransfer.types.includes('Files')) event.preventDefault();
});
document.addEventListener('drop', (event) => {
    if (event.dataTransfer.types.includes('Files')) event.preventDefault();
});

fileInput.addEventListener('change', (event) => {
    const files = Array.from(event.target.files);
    fileInput.value = '';
    if (!files.length) return;

    const invalidFile = files.find((file) => !file.name.toLowerCase().endsWith('.pdf'));
    if (invalidFile) {
        showStatus(`"${invalidFile.name}" não é um arquivo PDF. Nenhum arquivo deste grupo foi adicionado.`, '#dc2626');
        return;
    }

    selectedFiles.push(...files);
    renderFiles();
    showStatus(`${files.length} PDF(s) adicionado(s). Total: ${selectedFiles.length}.`, '#16a34a');
});

function showStatus(message, color = 'var(--text-main)') {
    statusMsg.style.display = 'block';
    statusMsg.style.color = color;
    statusMsg.innerText = message;
}

function getSafeOutputName(input) {
    return input.value
        .trim()
        .replace(/\.pdf$/i, '')
        .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
        .replace(/[. ]+$/, '');
}

function downloadPdf(bytes, filename) {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    downloadFile(blob, `${filename}.pdf`);
}

function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function createMergedPdfData(files, onProgress = () => { }) {
    const mergedPdf = await PDFLib.PDFDocument.create();
    const pageSources = [];
    const sourceDocuments = [];
    const pageOrder = [];

    for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        onProgress(index, file);
        const pdf = await PDFLib.PDFDocument.load(await file.arrayBuffer());
        sourceDocuments.push(pdf);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
        pageSources.push(...Array(copiedPages.length).fill(file.name));
        for (let pageIndex = 0; pageIndex < copiedPages.length; pageIndex += 1) {
            pageOrder.push({ fileIndex: index, pageIndex, source: file.name });
        }
    }

    return { bytes: await mergedPdf.save(), pageSources, pageOrder, sourceDocuments };
}

async function createPdfInPageOrder(data) {
    const orderedPdf = await PDFLib.PDFDocument.create();
    for (const page of data.pageOrder) {
        const [copiedPage] = await orderedPdf.copyPages(
            data.sourceDocuments[page.fileIndex],
            [page.pageIndex]
        );
        orderedPdf.addPage(copiedPage);
    }
    return orderedPdf.save();
}

function renderMergedPage(pageNumber, canvas, generation) {
    if (!mergePreviewLoadingTask || generation !== mergePreviewGeneration) return;

    mergePreviewLoadingTask.promise.then((document) => {
        if (generation !== mergePreviewGeneration) return;
        return document.getPage(pageNumber).then((page) => {
            if (generation !== mergePreviewGeneration) return;
            const originalViewport = page.getViewport({ scale: 1 });
            const scale = Math.min(1, 220 / originalViewport.width, 300 / originalViewport.height);
            const viewport = page.getViewport({ scale });
            canvas.width = Math.ceil(viewport.width);
            canvas.height = Math.ceil(viewport.height);
            return page.render({
                canvasContext: canvas.getContext('2d'),
                viewport
            }).promise;
        });
    }).catch((error) => {
        if (generation === mergePreviewGeneration) {
            console.error(error);
            mergePreviewMessage.hidden = false;
            mergePreviewMessage.textContent = 'Não foi possível mostrar a pré-visualização deste PDF.';
        }
    });
}

async function showMergedPreview(data, generation) {
    if (generation !== mergePreviewGeneration) return;

    if (mergePreviewObserver) mergePreviewObserver.disconnect();
    if (mergePreviewLoadingTask) {
        mergePreviewLoadingTask.destroy().catch((error) => {
            console.error('Não foi possível encerrar a pré-visualização anterior do PDF unido.', error);
        });
    }
    mergePreviewLoadingTask = pdfjsLib.getDocument({ data: data.bytes.slice(0) });
    const pdfDocument = await mergePreviewLoadingTask.promise;
    if (generation !== mergePreviewGeneration) return;

    mergePreviewMessage.hidden = true;
    mergePreviewGrid.hidden = false;
    mergePreviewGrid.innerHTML = '';
    mergePreviewCount.textContent = `${pdfDocument.numPages} ${pdfDocument.numPages === 1 ? 'página' : 'páginas'}`;

    if (mergePreviewObserver) mergePreviewObserver.disconnect();
    mergePreviewObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const card = entry.target;
            mergePreviewObserver.unobserve(card);
            renderMergedPage(Number(card.dataset.page), card.querySelector('canvas'), generation);
        });
    }, { root: mergePreviewGrid, rootMargin: '120px' });

    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
        const card = document.createElement('div');
        const canvas = document.createElement('canvas');
        const label = document.createElement('span');
        const source = document.createElement('span');
        const controls = document.createElement('div');
        const moveUpButton = document.createElement('button');
        const moveDownButton = document.createElement('button');
        const page = data.pageOrder[pageNumber - 1];
        card.className = 'merge-preview-page';
        card.dataset.page = String(pageNumber);
        card.draggable = true;
        label.textContent = `Página ${pageNumber}`;
        source.className = 'merge-preview-source';
        source.textContent = page.source;
        source.title = page.source;
        controls.className = 'merge-page-controls';
        moveUpButton.type = 'button';
        moveUpButton.textContent = '↑';
        moveUpButton.setAttribute('aria-label', `Mover página ${pageNumber} para cima`);
        moveUpButton.disabled = pageNumber === 1;
        moveUpButton.addEventListener('click', () => moveMergedPage(pageNumber - 1, pageNumber - 2, generation));
        moveDownButton.type = 'button';
        moveDownButton.textContent = '↓';
        moveDownButton.setAttribute('aria-label', `Mover página ${pageNumber} para baixo`);
        moveDownButton.disabled = pageNumber === pdfDocument.numPages;
        moveDownButton.addEventListener('click', () => moveMergedPage(pageNumber - 1, pageNumber, generation));
        controls.append(moveUpButton, moveDownButton);
        card.append(canvas, label, source, controls);
        card.addEventListener('dragstart', (event) => {
            event.dataTransfer.setData('text/plain', String(pageNumber - 1));
            event.dataTransfer.effectAllowed = 'move';
            card.classList.add('is-dragging');
        });
        card.addEventListener('dragend', () => {
            card.classList.remove('is-dragging');
            mergePreviewGrid.querySelectorAll('.drag-target').forEach((target) => {
                target.classList.remove('drag-target');
            });
        });
        card.addEventListener('dragover', (event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            card.classList.add('drag-target');
        });
        card.addEventListener('dragleave', () => card.classList.remove('drag-target'));
        card.addEventListener('drop', (event) => {
            event.preventDefault();
            card.classList.remove('drag-target');
            const fromIndex = Number(event.dataTransfer.getData('text/plain'));
            moveMergedPage(fromIndex, pageNumber - 1, generation);
        });
        mergePreviewGrid.appendChild(card);
        mergePreviewObserver.observe(card);
    }
}

async function moveMergedPage(fromIndex, toIndex, generation) {
    const data = mergePreviewResult;
    if (!data || generation !== mergePreviewGeneration ||
        fromIndex < 0 || toIndex < 0 || fromIndex >= data.pageOrder.length ||
        toIndex >= data.pageOrder.length || fromIndex === toIndex) {
        return;
    }

    const revision = ++mergeOrderRevision;
    const [movedPage] = data.pageOrder.splice(fromIndex, 1);
    data.pageOrder.splice(toIndex, 0, movedPage);
    mergeBtn.disabled = true;
    mergePreviewGrid.hidden = true;
    mergePreviewMessage.hidden = false;
    mergePreviewMessage.textContent = 'Atualizando a ordem das páginas...';

    try {
        data.bytes = await createPdfInPageOrder(data);
        if (revision !== mergeOrderRevision || generation !== mergePreviewGeneration) return;
        await showMergedPreview(data, generation);
    } catch (error) {
        if (revision !== mergeOrderRevision || generation !== mergePreviewGeneration) return;
        console.error(error);
        const details = error instanceof Error ? error.message : String(error);
        data.pageOrder.splice(toIndex, 1);
        data.pageOrder.splice(fromIndex, 0, movedPage);
        try {
            await showMergedPreview(data, generation);
        } catch (previewError) {
            console.error('Não foi possível restaurar a pré-visualização anterior.', previewError);
        }
        showStatus(`❌ Não foi possível atualizar a ordem das páginas.\nDetalhe: ${details}`, '#dc2626');
    } finally {
        if (revision === mergeOrderRevision && generation === mergePreviewGeneration) {
            mergeBtn.disabled = selectedFiles.length < 2;
        }
    }
}

function updateMergedPreview() {
    const generation = ++mergePreviewGeneration;
    mergeOrderRevision += 1;
    mergePreviewResult = null;
    mergePreviewResultGeneration = -1;
    mergePreviewGrid.hidden = true;
    mergePreviewGrid.innerHTML = '';
    mergePreviewCount.textContent = '';
    if (mergePreviewObserver) mergePreviewObserver.disconnect();
    if (mergePreviewLoadingTask) {
        mergePreviewLoadingTask.destroy().catch((error) => {
            console.error('Não foi possível encerrar a pré-visualização anterior do PDF unido.', error);
        });
    }
    mergePreviewLoadingTask = null;

    if (selectedFiles.length < 2) {
        mergePreviewMessage.hidden = false;
        mergePreviewMessage.textContent = 'Adicione pelo menos dois PDFs para ver as páginas na ordem final.';
        mergePreviewPromise = null;
        return;
    }

    if (!window.PDFLib || !window.pdfjsLib) {
        mergePreviewMessage.hidden = false;
        mergePreviewMessage.textContent = 'Não foi possível carregar as bibliotecas de PDF. Verifique sua conexão com a internet.';
        mergePreviewPromise = null;
        return;
    }

    const files = [...selectedFiles];
    mergePreviewMessage.hidden = false;
    mergePreviewMessage.textContent = 'Preparando a pré-visualização do PDF unido...';
    mergePreviewPromiseGeneration = generation;
    mergePreviewPromise = createMergedPdfData(files)
        .then(async (data) => {
            if (generation !== mergePreviewGeneration) return null;
            mergePreviewResult = data;
            mergePreviewResultGeneration = generation;
            await showMergedPreview(data, generation);
            return data;
        })
        .catch((error) => {
            if (generation === mergePreviewGeneration) {
                console.error(error);
                const details = error instanceof Error ? error.message : String(error);
                mergePreviewMessage.hidden = false;
                mergePreviewMessage.textContent = `Não foi possível pré-visualizar os PDFs. ${details}`;
            }
            return null;
        });
}

function parsePageSelection(value, pageCount) {
    const pages = [];
    const entries = value.split(',');

    for (const rawEntry of entries) {
        const entry = rawEntry.trim();
        const match = entry.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
        if (!match) {
            throw new Error('Informe páginas no formato indicado, por exemplo: 1, 3-5.');
        }

        const start = Number(match[1]);
        const end = match[2] ? Number(match[2]) : start;
        if (start < 1 || end < start || end > pageCount) {
            throw new Error(`As páginas devem estar entre 1 e ${pageCount}, e os intervalos precisam estar em ordem.`);
        }

        for (let page = start; page <= end; page += 1) {
            if (!pages.includes(page - 1)) pages.push(page - 1);
        }
    }

    return pages;
}

function formatPageSelection(pages) {
    const sortedPages = [...pages].sort((a, b) => a - b);
    if (!sortedPages.length) return '';

    const ranges = [];
    let start = sortedPages[0];
    let end = start;

    for (let index = 1; index <= sortedPages.length; index += 1) {
        const page = sortedPages[index];
        if (page === end + 1) {
            end = page;
            continue;
        }

        ranges.push(start === end ? String(start) : `${start}-${end}`);
        start = page;
        end = page;
    }

    return ranges.join(', ');
}

function updatePageSelection() {
    pageSelectionInput.value = formatPageSelection(selectedPages);
    selectionCount.textContent = selectedPages.size === 1
        ? '1 página selecionada'
        : `${selectedPages.size} páginas selecionadas`;
    if (splitMode && splitParts[activeSplitPartIndex]) {
        splitParts[activeSplitPartIndex].pages = selectedPages;
    } else {
        singleExtractPages = selectedPages;
    }
    updateExtractControls();
    statusMsg.style.display = 'none';
    statusMsg.innerText = '';

    renderSplitParts();
    pagePreview.querySelectorAll('.page-card').forEach((card) => {
        const isSelected = selectedPages.has(Number(card.dataset.page));
        card.setAttribute('aria-pressed', String(isSelected));
    });
}

function updateExtractControls() {
    const hasPages = splitMode
        ? splitParts.some((part) => part.pages.size > 0)
        : singleExtractPages.size > 0;
    extractBtn.disabled = !extractFile || !hasPages;
    splitControls.hidden = !splitMode;
    extractOutputLabel.textContent = splitMode ? 'Nome do arquivo compactado' : 'Nome do novo arquivo PDF';
    extractOutputNameInput.placeholder = splitMode
        ? 'Digite o nome do arquivo ZIP'
        : 'Digite o nome do arquivo PDF';
    extractBtn.textContent = splitMode ? 'Fracionar e Baixar ZIP' : 'Extrair e Baixar PDF';
    extractHelp.textContent = splitMode
        ? 'Crie uma parte para cada PDF e selecione suas páginas. Partes sem páginas não serão incluídas no ZIP.'
        : 'Selecione as páginas que deseja manter; as demais serão excluídas do novo PDF.';
    addSplitPartButton.disabled = !extractFile;
    removeSplitPartButton.disabled = !extractFile || splitParts.length < 2;
    splitModeInput.disabled = !extractFile;
}

function setSelectedPages(pages) {
    selectedPages.clear();
    pages.forEach((page) => selectedPages.add(page + 1));
    updatePageSelection();
}

function togglePage(pageNumber, card) {
    if (selectedPages.has(pageNumber)) {
        selectedPages.delete(pageNumber);
    } else {
        selectedPages.add(pageNumber);
    }
    card.setAttribute('aria-pressed', String(selectedPages.has(pageNumber)));
    updatePageSelection();
}

function renderPageThumbnail(pageNumber, canvas, loadId) {
    if (!previewDocument || loadId !== previewLoadId) return;

    previewDocument.getPage(pageNumber).then((page) => {
        if (loadId !== previewLoadId) return;
        const originalViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(1, 220 / originalViewport.width, 300 / originalViewport.height);
        const viewport = page.getViewport({ scale });
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        return page.render({
            canvasContext: canvas.getContext('2d'),
            viewport
        }).promise;
    }).catch((error) => {
        if (loadId === previewLoadId) {
            console.error(error);
            showStatus(`❌ Não foi possível pré-visualizar a página ${pageNumber}.`, '#dc2626');
        }
    });
}

function renderPageCards(loadId) {
    pagePreview.innerHTML = '';
    if (previewObserver) previewObserver.disconnect();

    previewObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const card = entry.target;
            previewObserver.unobserve(card);
            renderPageThumbnail(
                Number(card.dataset.page),
                card.querySelector('canvas'),
                loadId
            );
        });
    }, { root: pagePreview, rootMargin: '100px' });

    for (let pageNumber = 1; pageNumber <= extractPageCount; pageNumber += 1) {
        const card = document.createElement('button');
        const canvas = document.createElement('canvas');
        const label = document.createElement('span');
        card.type = 'button';
        card.className = 'page-card';
        card.dataset.page = String(pageNumber);
        card.setAttribute('aria-pressed', 'false');
        card.setAttribute('aria-label', `Selecionar página ${pageNumber}`);
        label.textContent = `Página ${pageNumber}`;
        card.append(canvas, label);
        card.addEventListener('click', () => togglePage(pageNumber, card));
        pagePreview.appendChild(card);
        previewObserver.observe(card);
    }
}

function renderSplitParts() {
    extractFileList.innerHTML = '';
    splitParts.forEach((part, index) => {
        const row = document.createElement('div');
        const button = document.createElement('button');
        const nameLabel = document.createElement('label');
        const nameCaption = document.createElement('span');
        const nameField = document.createElement('input');
        button.type = 'button';
        button.className = 'extract-document-button';
        button.setAttribute('aria-pressed', String(index === activeSplitPartIndex));
        const count = part.pages.size;
        button.textContent = `PDF ${index + 1} — ${count} página(s) selecionada(s)`;
        button.addEventListener('click', () => activateSplitPart(index));

        row.className = 'split-part-row';
        nameLabel.className = 'split-part-name-field';
        nameCaption.textContent = 'Nome do arquivo dentro do ZIP';
        nameField.type = 'text';
        nameField.className = 'form-control split-part-name';
        nameField.maxLength = 100;
        nameField.value = part.name;
        nameField.placeholder = `${getSafeOutputName(extractOutputNameInput) || 'arquivo'}_${index + 1}`;
        nameField.setAttribute('aria-label', `Nome do PDF ${index + 1} dentro do ZIP`);
        nameField.addEventListener('input', () => {
            part.name = nameField.value;
        });

        nameLabel.append(nameCaption, nameField);
        row.append(button, nameLabel);
        extractFileList.appendChild(row);
    });
}

function activateSplitPart(index) {
    if (!splitParts[index]) return;

    splitParts[activeSplitPartIndex].pages = selectedPages;
    activeSplitPartIndex = index;
    selectedPages = splitParts[index].pages;
    pageSelectionInput.value = formatPageSelection(selectedPages);
    selectionCount.textContent = selectedPages.size === 1
        ? '1 página selecionada'
        : `${selectedPages.size} páginas selecionadas`;
    updateExtractControls();
    renderSplitParts();
    pagePreview.querySelectorAll('.page-card').forEach((card) => {
        card.setAttribute('aria-pressed', String(selectedPages.has(Number(card.dataset.page))));
    });
}

function renderFiles() {
    fileListContainer.innerHTML = '';
    selectedFiles.forEach((file, index) => {
        const item = document.createElement('div');
        const label = document.createElement('span');
        const fileNumber = document.createElement('strong');
        const removeButton = document.createElement('button');
        item.className = 'file-item merge-file-item';
        item.draggable = true;
        item.dataset.index = String(index);
        item.setAttribute('aria-label', `PDF ${index + 1}: ${file.name}. Arraste para mudar a ordem.`);
        fileNumber.textContent = `PDF ${index + 1}:`;
        label.className = 'merge-file-name';
        label.append(fileNumber, ` ${file.name}`);
        removeButton.type = 'button';
        removeButton.className = 'file-item-remove';
        removeButton.textContent = 'Remover';
        removeButton.setAttribute('aria-label', `Remover ${file.name}`);
        removeButton.addEventListener('click', () => {
            selectedFiles.splice(index, 1);
            renderFiles();
        });

        item.addEventListener('dragstart', (event) => {
            event.dataTransfer.setData('text/plain', String(index));
            event.dataTransfer.effectAllowed = 'move';
            item.classList.add('is-dragging');
        });
        item.addEventListener('dragend', () => {
            item.classList.remove('is-dragging');
            fileListContainer.querySelectorAll('.drag-target').forEach((target) => {
                target.classList.remove('drag-target');
            });
        });
        item.addEventListener('dragover', (event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            item.classList.add('drag-target');
        });
        item.addEventListener('dragleave', () => item.classList.remove('drag-target'));
        item.addEventListener('drop', (event) => {
            event.preventDefault();
            item.classList.remove('drag-target');
            const fromIndex = Number(event.dataTransfer.getData('text/plain'));
            const toIndex = index;
            if (!Number.isInteger(fromIndex) || fromIndex === toIndex) return;
            const [movedFile] = selectedFiles.splice(fromIndex, 1);
            selectedFiles.splice(toIndex, 0, movedFile);
            renderFiles();
        });

        item.append(label, removeButton);
        fileListContainer.appendChild(item);
    });

    mergeBtn.disabled = selectedFiles.length < 2;
    updateMergedPreview();
}

mergeBtn.addEventListener('click', async () => {
    if (selectedFiles.length < 2) return;
    const filesToMerge = [...selectedFiles];

    const outputName = getSafeOutputName(outputNameInput);

    if (!outputName) {
        showStatus('Digite um nome válido para o arquivo PDF.', '#dc2626');
        outputNameInput.focus();
        return;
    }

    try {
        mergeBtn.disabled = true;
        showStatus('⏳ Iniciando processamento...');

        if (!window.PDFLib) {
            throw new Error('Não foi possível carregar a biblioteca de PDFs. Verifique sua conexão com a internet e abra esta página novamente.');
        }

        showStatus('⏳ Gerando novo PDF combinado...');
        let mergedData = null;
        if (mergePreviewResultGeneration === mergePreviewGeneration) {
            mergedData = mergePreviewResult;
        } else if (mergePreviewPromiseGeneration === mergePreviewGeneration && mergePreviewPromise) {
            mergedData = await mergePreviewPromise;
        }

        if (!mergedData) {
            mergedData = await createMergedPdfData(filesToMerge, (index, file) => {
                showStatus(`⏳ Lendo o PDF ${index + 1} de ${filesToMerge.length}: ${file.name}`);
            });
        }

        downloadPdf(mergedData.bytes, outputName);
        if (mergePreviewResult === mergedData) {
            mergePreviewResult = null;
            mergePreviewResultGeneration = -1;
        }

        showStatus('✅ Sucesso! O arquivo novo foi baixado.', '#16a34a');
    } catch (error) {
        console.error(error);
        const details = error instanceof Error ? error.message : String(error);
        showStatus(
            '❌ Erro ao processar os PDFs.\nDetalhe: ' + details + '\n\nCertifique-se de que os arquivos não estão protegidos por senha.',
            '#dc2626'
        );
    } finally {
        mergeBtn.disabled = selectedFiles.length < 2;
    }
});

extractInput.addEventListener('change', async () => {
    const files = Array.from(extractInput.files);
    extractInput.value = '';
    if (!files.length) return;

    if (files.length > 1 || !files[0].name.toLowerCase().endsWith('.pdf')) {
        showStatus('Selecione somente um arquivo no formato PDF.', '#dc2626');
        return;
    }

    const file = files[0];
    const loadId = ++previewLoadId;
    if (previewObserver) previewObserver.disconnect();
    if (previewLoadingTask) {
        previewLoadingTask.destroy().catch((error) => {
            console.error('Não foi possível encerrar a pré-visualização anterior do PDF.', error);
        });
    }
    previewDocument = null;
    previewLoadingTask = null;
    extractFile = file;
    extractPageCount = 0;
    singleExtractPages = new Set();
    splitParts = [{ pages: new Set(), name: '' }];
    activeSplitPartIndex = 0;
    selectedPages = singleExtractPages;
    extractBtn.disabled = true;
    selectAllPagesButton.disabled = true;
    clearPagesButton.disabled = true;
    pagePreview.innerHTML = '';
    pageSelectionInput.value = '';
    selectionCount.textContent = 'Nenhuma página selecionada';
    updateExtractControls();
    renderSplitParts();

    try {
        if (!window.PDFLib || !window.pdfjsLib) {
            throw new Error('Não foi possível carregar as bibliotecas de PDF. Verifique sua conexão com a internet e abra esta página novamente.');
        }
        previewLoadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(await file.arrayBuffer())
        });
        const pdf = await previewLoadingTask.promise;
        if (loadId !== previewLoadId) {
            pdf.destroy().catch((error) => {
                console.error('Não foi possível encerrar a pré-visualização do PDF.', error);
            });
            return;
        }
        previewDocument = pdf;
        extractPageCount = pdf.numPages;
        selectAllPagesButton.disabled = false;
        clearPagesButton.disabled = false;
        renderPageCards(loadId);
        showStatus(`PDF carregado: ${file.name} (${extractPageCount} página(s)).`, '#16a34a');
    } catch (error) {
        if (loadId !== previewLoadId) return;
        console.error(error);
        const details = error instanceof Error ? error.message : String(error);
        extractFile = null;
        updateExtractControls();
        showStatus(`❌ Não foi possível abrir ou pré-visualizar o PDF.\nDetalhe: ${details}`, '#dc2626');
    }
});

selectAllPagesButton.addEventListener('click', () => {
    if (extractPageCount) {
        setSelectedPages(Array.from({ length: extractPageCount }, (_, index) => index));
    }
});

clearPagesButton.addEventListener('click', () => setSelectedPages([]));

pageSelectionInput.addEventListener('change', () => {
    if (!extractFile || !extractPageCount) return;

    if (!pageSelectionInput.value.trim()) {
        setSelectedPages([]);
        return;
    }

    try {
        setSelectedPages(parsePageSelection(pageSelectionInput.value, extractPageCount));
    } catch {
        showStatus('Confira a numeração das páginas. Você também pode selecionar as páginas clicando nas pré-visualizações.', '#dc2626');
    }
});

splitModeInput.addEventListener('change', () => {
    if (!extractFile) {
        splitModeInput.checked = false;
        return;
    }

    splitMode = splitModeInput.checked;
    if (splitMode) {
        splitParts = [{ pages: new Set(singleExtractPages), name: '' }];
        activeSplitPartIndex = 0;
        selectedPages = splitParts[0].pages;
    } else {
        selectedPages = singleExtractPages;
    }
    updateExtractControls();
    renderSplitParts();
    updatePageSelection();
});

addSplitPartButton.addEventListener('click', () => {
    if (!extractFile) return;
    splitParts[activeSplitPartIndex].pages = selectedPages;
    splitParts.push({ pages: new Set(), name: '' });
    activateSplitPart(splitParts.length - 1);
});

removeSplitPartButton.addEventListener('click', () => {
    if (splitParts.length < 2) return;
    splitParts[activeSplitPartIndex].pages = selectedPages;
    splitParts.splice(activeSplitPartIndex, 1);
    activeSplitPartIndex = Math.min(activeSplitPartIndex, splitParts.length - 1);
    selectedPages = splitParts[activeSplitPartIndex].pages;
    pageSelectionInput.value = formatPageSelection(selectedPages);
    selectionCount.textContent = selectedPages.size === 1
        ? '1 página selecionada'
        : `${selectedPages.size} páginas selecionadas`;
    updateExtractControls();
    renderSplitParts();
    pagePreview.querySelectorAll('.page-card').forEach((card) => {
        card.setAttribute('aria-pressed', String(selectedPages.has(Number(card.dataset.page))));
    });
});

extractBtn.addEventListener('click', async () => {
    if (!extractFile || !extractPageCount) return;

    const outputName = getSafeOutputName(extractOutputNameInput);
    if (!outputName) {
        showStatus(`Digite um nome válido para o arquivo ${splitMode ? 'ZIP' : 'PDF'}.`, '#dc2626');
        extractOutputNameInput.focus();
        return;
    }

    try {
        setSelectedPages(pageSelectionInput.value.trim()
            ? parsePageSelection(pageSelectionInput.value, extractPageCount)
            : []);
    } catch (error) {
        showStatus(`❌ ${error.message}`, '#dc2626');
        pageSelectionInput.focus();
        return;
    }

    const pagesToExtract = splitMode
        ? splitParts.map((part) => part.pages).filter((pages) => pages.size > 0)
        : [singleExtractPages];
    if (!pagesToExtract.some((pages) => pages.size > 0)) {
        showStatus('Selecione pelo menos uma página para extrair.', '#dc2626');
        return;
    }

    if (!window.PDFLib || (splitMode && !window.JSZip)) {
        showStatus('❌ Não foi possível carregar as bibliotecas necessárias. Verifique sua conexão com a internet e abra esta página novamente.', '#dc2626');
        return;
    }

    try {
        extractBtn.disabled = true;
        const sourcePdf = await PDFLib.PDFDocument.load(await extractFile.arrayBuffer());
        if (splitMode) {
            const zip = new JSZip();
            let partNumber = 0;

            for (let index = 0; index < splitParts.length; index += 1) {
                const partPages = splitParts[index].pages;
                if (!partPages.size) continue;

                partNumber += 1;
                showStatus(`⏳ Criando PDF ${partNumber}...`);
                const extractedPdf = await PDFLib.PDFDocument.create();
                const pages = Array.from(partPages, (page) => page - 1).sort((a, b) => a - b);
                const copiedPages = await extractedPdf.copyPages(sourcePdf, pages);
                copiedPages.forEach((page) => extractedPdf.addPage(page));
                const requestedName = getSafeOutputName({
                    value: splitParts[index].name || `${outputName}_${partNumber}`
                }) || `${outputName}_${partNumber}`;
                let filename = `${requestedName}.pdf`;
                let suffix = 2;
                while (zip.file(filename)) {
                    filename = `${requestedName}_${suffix}.pdf`;
                    suffix += 1;
                }
                zip.file(filename, await extractedPdf.save());
            }

            showStatus('⏳ Compactando os PDFs fracionados...');
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            downloadFile(zipBlob, `${outputName}.zip`);
            showStatus(`✅ Sucesso! ${partNumber} PDF(s) baixado(s) no arquivo ${outputName}.zip.`, '#16a34a');
        } else {
            const extractedPdf = await PDFLib.PDFDocument.create();
            const pages = Array.from(singleExtractPages, (page) => page - 1).sort((a, b) => a - b);
            const copiedPages = await extractedPdf.copyPages(sourcePdf, pages);
            copiedPages.forEach((page) => extractedPdf.addPage(page));
            downloadPdf(await extractedPdf.save(), outputName);
            showStatus(`✅ Sucesso! O arquivo ${outputName}.pdf foi baixado.`, '#16a34a');
        }
    } catch (error) {
        console.error(error);
        const details = error instanceof Error ? error.message : String(error);
        showStatus(
            `❌ Erro ao extrair as páginas.\nDetalhe: ${details}\n\nCertifique-se de que o arquivo não está protegido por senha.`,
            '#dc2626'
        );
    } finally {
        updateExtractControls();
    }
});