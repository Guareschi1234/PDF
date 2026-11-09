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
const mergeCenterUpload = document.getElementById('merge-center-upload');
const extractCenterUpload = document.getElementById('extract-center-upload');
const wordTab = document.getElementById('word-tab');
const wordPanel = document.getElementById('word-panel');
const wordInput = document.getElementById('word-input');
const wordCenterDropzone = document.getElementById('word-center-dropzone');
const wordCenterUpload = document.getElementById('word-center-upload');
const wordConvertButton = document.getElementById('word-convert-btn');
const wordOutputNameInput = document.getElementById('word-output-name');
const wordPreviewMessage = document.getElementById('word-preview-message');
const wordPreviewText = document.getElementById('word-preview-text');
const wordPreviewPages = document.getElementById('word-preview-pages');
const jpgTab = document.getElementById('jpg-tab');
const jpgPanel = document.getElementById('jpg-panel');
const wordPdfTab = document.getElementById('word-pdf-tab');
const wordPdfPanel = document.getElementById('word-pdf-panel');
const wordPdfInput = document.getElementById('word-pdf-input');
const wordPdfDropzone = document.getElementById('word-pdf-dropzone');
const wordPdfUpload = document.getElementById('word-pdf-upload');
const wordPdfMessage = document.getElementById('word-pdf-message');
const wordPdfContent = document.getElementById('word-pdf-content');
const wordPdfOutputNameInput = document.getElementById('word-pdf-output-name');
const wordPdfConvertButton = document.getElementById('word-pdf-convert-btn');
const jpgInput = document.getElementById('jpg-input');
const jpgCenterDropzone = document.getElementById('jpg-center-dropzone');
const jpgCenterUpload = document.getElementById('jpg-center-upload');
const jpgPreviewMessage = document.getElementById('jpg-preview-message');
const jpgPreviewGrid = document.getElementById('jpg-preview-grid');
const jpgPreviewCount = document.getElementById('jpg-preview-count');
const jpgOutputNameInput = document.getElementById('jpg-output-name');
const jpgConvertButton = document.getElementById('jpg-convert-btn');
const imagesPdfTab = document.getElementById('images-pdf-tab');
const imagesPdfPanel = document.getElementById('images-pdf-panel');
const imagesPdfInput = document.getElementById('images-pdf-input');
const imagesPdfDropzone = document.getElementById('images-pdf-dropzone');
const imagesPdfUpload = document.getElementById('images-pdf-upload');
const imagesPdfMessage = document.getElementById('images-pdf-message');
const imagesPdfGrid = document.getElementById('images-pdf-grid');
const imagesPdfCount = document.getElementById('images-pdf-count');
const imagesPdfOutputNameInput = document.getElementById('images-pdf-output-name');
const imagesPdfConvertButton = document.getElementById('images-pdf-convert-btn');
const ocrTab = document.getElementById('ocr-tab');
const ocrPanel = document.getElementById('ocr-panel');
const ocrInput = document.getElementById('ocr-input');
const ocrDropzone = document.getElementById('ocr-dropzone');
const ocrUpload = document.getElementById('ocr-upload');
const ocrPreviewMessage = document.getElementById('ocr-preview-message');
const ocrPreviewGrid = document.getElementById('ocr-preview-grid');
const ocrPreviewCount = document.getElementById('ocr-preview-count');
const ocrLanguageInput = document.getElementById('ocr-language');
const ocrOutputNameInput = document.getElementById('ocr-output-name');
const ocrConvertButton = document.getElementById('ocr-convert-btn');
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const toolTabs = document.getElementById('tool-tabs');

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
let wordExtractedPages = [];
let wordLoadId = 0;
let wordPdfHtml = '';
let wordPdfLoadId = 0;
let jpgPdfDocument = null;
let jpgLoadId = 0;
let imageFiles = [];
let imagePreviewUrls = [];
let ocrPdfDocument = null;
let ocrFile = null;
let ocrLoadId = 0;
let ocrProcessing = false;

function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeIcon.className = `bi ${isDark ? 'bi-sun-fill' : 'bi-moon-fill'}`;
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
    const activeTab = tab === 'merge' ? mergeTab
        : tab === 'extract' ? extractTab
            : tab === 'word' ? wordTab
                : tab === 'word-pdf' ? wordPdfTab
                    : tab === 'jpg' ? jpgTab
                        : tab === 'ocr' ? ocrTab : imagesPdfTab;
    const panels = [
        [mergeTab, mergePanel],
        [extractTab, extractPanel],
        [wordTab, wordPanel],
        [wordPdfTab, wordPdfPanel],
        [jpgTab, jpgPanel],
        [imagesPdfTab, imagesPdfPanel],
        [ocrTab, ocrPanel]
    ];
    panels.forEach(([tabButton, panel]) => {
        const isActive = tabButton === activeTab;
        tabButton.setAttribute('aria-selected', String(isActive));
        panel.hidden = !isActive;
    });
    toolTabs.dataset.open = 'false';
    mobileMenuToggle.setAttribute('aria-expanded', 'false');
    mobileMenuToggle.setAttribute('aria-label', 'Abrir opções de ferramentas');
    statusMsg.style.display = 'none';
    statusMsg.innerText = '';
}

function updateResponsiveToolMenu() {
    const tabs = Array.from(toolTabs.querySelectorAll('[role="tab"]'));
    const isMobile = window.matchMedia('(max-width: 600px)').matches;
    const isMedium = window.matchMedia('(min-width: 601px) and (max-width: 960px)').matches;
    const hasMediumOverflow = isMedium && tabs.length > 1;

    mobileMenuToggle.hidden = !isMobile && !hasMediumOverflow;
    toolTabs.dataset.mediumOverflow = String(hasMediumOverflow);
    if (!isMobile && !hasMediumOverflow) {
        toolTabs.dataset.open = 'false';
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
        mobileMenuToggle.setAttribute('aria-label', 'Abrir opções de ferramentas');
    }
}

updateResponsiveToolMenu();
window.addEventListener('resize', updateResponsiveToolMenu);

mergeTab.addEventListener('click', () => setActiveTab('merge'));
extractTab.addEventListener('click', () => setActiveTab('extract'));
wordTab.addEventListener('click', () => setActiveTab('word'));
wordPdfTab.addEventListener('click', () => setActiveTab('word-pdf'));
jpgTab.addEventListener('click', () => setActiveTab('jpg'));
imagesPdfTab.addEventListener('click', () => setActiveTab('images-pdf'));
ocrTab.addEventListener('click', () => setActiveTab('ocr'));
mobileMenuToggle.addEventListener('click', () => {
    const isOpen = toolTabs.dataset.open !== 'true';
    toolTabs.dataset.open = String(isOpen);
    mobileMenuToggle.setAttribute('aria-expanded', String(isOpen));
    mobileMenuToggle.setAttribute(
        'aria-label',
        isOpen ? 'Fechar opções de ferramentas' : 'Abrir opções de ferramentas'
    );
});
mergeCenterUpload.addEventListener('click', () => fileInput.click());
extractCenterUpload.addEventListener('click', () => extractInput.click());
wordCenterUpload.addEventListener('click', () => wordInput.click());
wordPdfUpload.addEventListener('click', () => wordPdfInput.click());
jpgCenterUpload.addEventListener('click', () => jpgInput.click());
imagesPdfUpload.addEventListener('click', () => imagesPdfInput.click());
ocrUpload.addEventListener('click', () => ocrInput.click());

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

function setUploadState(dropzone, hasFiles) {
    dropzone.dataset.hasFiles = String(hasFiles);
    dropzone.parentElement.querySelectorAll('.editor-preview-content').forEach((preview) => {
        preview.hidden = !hasFiles;
    });
}

enableFileDrop(document.getElementById('merge-center-dropzone'), fileInput);
enableFileDrop(document.getElementById('extract-center-dropzone'), extractInput);
enableFileDrop(wordCenterDropzone, wordInput);
enableFileDrop(wordPdfDropzone, wordPdfInput);
enableFileDrop(jpgCenterDropzone, jpgInput);
enableFileDrop(imagesPdfDropzone, imagesPdfInput);
enableFileDrop(ocrDropzone, ocrInput);

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
    const paletteStatusColors = {
        '#dc2626': 'var(--accent-color)',
        '#16a34a': 'var(--primary-color)',
        '#b7791f': 'var(--text-muted)'
    };
    statusMsg.style.color = paletteStatusColors[color] || color;
    statusMsg.innerText = message;
}

function getSafeOutputName(input) {
    return input.value
        .trim()
        .replace(/\.pdf$/i, '')
        .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
        .replace(/[. ]+$/, '');
}

function getPdfPageText(textContent) {
    const items = textContent.items
        .filter((item) => typeof item.str === 'string' && item.str.trim())
        .map((item) => {
            const style = textContent.styles[item.fontName] || {};
            const fontSize = Math.hypot(item.transform[0], item.transform[1]) || Math.abs(item.transform[3]) || 12;
            return {
                text: item.str.trim(),
                x: item.transform[4],
                y: item.transform[5],
                width: item.width,
                fontSize,
                fontName: item.fontName,
                fontFamily: style.fontFamily,
                bold: /bold|black|heavy|demi|semibold/i.test(`${item.fontName} ${style.fontFamily || ''}`),
                italics: /italic|oblique/i.test(`${item.fontName} ${style.fontFamily || ''}`)
            };
        })
        .sort((a, b) => b.y - a.y || a.x - b.x);
    const lines = [];

    items.forEach((item) => {
        let line = lines[lines.length - 1];
        const tolerance = Math.max(2, item.fontSize * 0.25);
        if (!line || Math.abs(line.y - item.y) > tolerance) {
            line = { y: item.y, items: [], fontSize: item.fontSize };
            lines.push(line);
        }
        line.items.push(item);
        line.fontSize = Math.max(line.fontSize, item.fontSize);
        line.y = line.items.reduce((sum, lineItem) => sum + lineItem.y, 0) / line.items.length;
    });

    const positionedLines = lines.map((line) => {
        line.items.sort((a, b) => a.x - b.x);
        return {
            ...line,
            text: line.items.map((item) => item.text).join(' ').replace(/[ \t]+/g, ' ').trim(),
            top: Math.max(0, textContent.pageHeight - line.y - line.fontSize)
        };
    }).filter((line) => line.text);

    return {
        lines: positionedLines,
        text: positionedLines.map((line) => line.text).join('\n')
    };
}

wordInput.addEventListener('change', async () => {
    const file = wordInput.files[0];
    wordInput.value = '';
    if (!file) return;

    const loadId = ++wordLoadId;
    wordExtractedPages = [];
    wordConvertButton.disabled = true;
    setUploadState(wordCenterDropzone, true);
    wordCenterUpload.querySelector('span').textContent = `PDF selecionado: ${file.name}. Arraste outro para substituir`;
    wordPreviewText.hidden = true;
    wordPreviewText.textContent = '';
    wordPreviewPages.textContent = '';
    wordPreviewMessage.hidden = false;
    wordPreviewMessage.textContent = 'Extraindo texto do PDF...';

    if (!file.name.toLowerCase().endsWith('.pdf')) {
        setUploadState(wordCenterDropzone, false);
        wordCenterUpload.querySelector('span').textContent = 'Anexe ou arraste um PDF para converter';
        wordPreviewMessage.textContent = 'Selecione um arquivo PDF para continuar.';
        showStatus('Selecione um arquivo no formato PDF.', '#dc2626');
        return;
    }

    wordOutputNameInput.value = `${file.name.replace(/\.pdf$/i, '')}_convertido`;
    let pdfDocument = null;
    try {
        if (!window.pdfjsLib) {
            throw new Error('Não foi possível carregar a biblioteca de leitura de PDF. Verifique sua conexão com a internet.');
        }
        const loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(await file.arrayBuffer())
        });
        pdfDocument = await loadingTask.promise;
        if (loadId !== wordLoadId) return;

        for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
            const page = await pdfDocument.getPage(pageNumber);
            const content = await page.getTextContent();
            const viewport = page.getViewport({ scale: 1 });
            const pageLayout = getPdfPageText({ ...content, pageHeight: viewport.height });
            wordExtractedPages.push({
                ...pageLayout,
                width: viewport.width,
                height: viewport.height
            });
            if (loadId !== wordLoadId) return;
        }

        const extractedText = wordExtractedPages
            .filter((page) => page.text)
            .map((page) => page.text)
            .join('\n\n');
        wordPreviewPages.textContent = `${pdfDocument.numPages} ${pdfDocument.numPages === 1 ? 'página' : 'páginas'}`;
        if (!extractedText) {
            wordPreviewMessage.textContent = 'Não foi encontrado texto selecionável neste PDF. Arquivos digitalizados como imagem precisam de OCR, que não está disponível nesta conversão.';
            showStatus('O PDF não contém texto selecionável para converter.', '#b7791f');
            return;
        }

        wordPreviewMessage.hidden = true;
        wordPreviewText.textContent = extractedText.length > 12000
            ? `${extractedText.slice(0, 12000)}\n\n... Pré-visualização limitada. O documento Word conterá o texto completo.`
            : extractedText;
        wordPreviewText.hidden = false;
        wordConvertButton.disabled = false;
        showStatus(`Texto extraído de ${file.name}. Pronto para converter para Word.`, '#16a34a');
    } catch (error) {
        if (loadId !== wordLoadId) return;
        console.error(error);
        const details = error instanceof Error ? error.message : String(error);
        setUploadState(wordCenterDropzone, false);
        wordCenterUpload.querySelector('span').textContent = 'Anexe ou arraste um PDF para converter';
        wordPreviewMessage.textContent = 'Não foi possível ler o texto deste PDF.';
        wordExtractedPages = [];
        showStatus(`❌ Não foi possível abrir o PDF.\nDetalhe: ${details}`, '#dc2626');
    } finally {
        if (pdfDocument) {
            pdfDocument.destroy().catch((error) => {
                console.error('Não foi possível encerrar a leitura do PDF para conversão.', error);
            });
        }
    }
});

wordConvertButton.addEventListener('click', async () => {
    const outputName = getSafeOutputName(wordOutputNameInput);
    if (!outputName) {
        showStatus('Digite um nome válido para o arquivo Word.', '#dc2626');
        wordOutputNameInput.focus();
        return;
    }

    if (!window.docxGenerator || !wordExtractedPages.some((page) => page.text)) {
        showStatus('❌ Não foi possível carregar a biblioteca do Word ou não há texto pronto para converter. Verifique sua conexão e tente novamente.', '#dc2626');
        return;
    }

    try {
        wordConvertButton.disabled = true;
        showStatus('⏳ Recriando as páginas e posicionando o texto editável...');
        const maxPageWidth = 31680;
        const maxPageHeight = 31680;
        const sections = wordExtractedPages.map((pageLayout) => {
            const scale = Math.min(1, maxPageWidth / (pageLayout.width * 20), maxPageHeight / (pageLayout.height * 20));
            const pageWidth = Math.round(pageLayout.width * 20 * scale);
            const pageHeight = Math.round(pageLayout.height * 20 * scale);
            const isLandscape = pageWidth > pageHeight;
            let previousTop = 0;
            const children = pageLayout.lines.map((line) => {
                const topSpacing = Math.max(0, (line.top - previousTop) * 20 * scale);
                previousTop = line.top + line.fontSize;
                const runs = [];
                line.items.forEach((item, index) => {
                    if (index > 0) runs.push(new window.docxGenerator.TextRun(' '));
                    const runOptions = {
                        text: item.text,
                        size: Math.max(8, Math.min(144, Math.round(item.fontSize * scale * 2))),
                        bold: item.bold,
                        italics: item.italics
                    };
                    if (item.fontFamily && /^[\w -]+$/.test(item.fontFamily)) {
                        runOptions.font = { name: item.fontFamily };
                    }
                    runs.push(new window.docxGenerator.TextRun(runOptions));
                });
                return new window.docxGenerator.Paragraph({
                    children: runs,
                    indent: { left: Math.max(0, Math.round(line.items[0].x * 20 * scale)) },
                    spacing: {
                        before: Math.round(topSpacing),
                        after: 0,
                        line: Math.max(1, Math.round(line.fontSize * 20 * scale)),
                        lineRule: 'exact'
                    }
                });
            });

            return {
                properties: {
                    page: {
                        size: {
                            width: isLandscape ? pageHeight : pageWidth,
                            height: isLandscape ? pageWidth : pageHeight,
                            orientation: isLandscape
                                ? window.docxGenerator.PageOrientation.LANDSCAPE
                                : window.docxGenerator.PageOrientation.PORTRAIT
                        },
                        margin: { top: 0, right: 0, bottom: 0, left: 0 }
                    }
                },
                children
            };
        });
        const document = new window.docxGenerator.Document({
            sections
        });
        const blob = await window.docxGenerator.Packer.toBlob(document);
        downloadFile(blob, `${outputName}.docx`);
        showStatus(`✅ Sucesso! O arquivo ${outputName}.docx foi baixado.`, '#16a34a');
    } catch (error) {
        console.error(error);
        const details = error instanceof Error ? error.message : String(error);
        showStatus(`❌ Não foi possível gerar o documento Word.\nDetalhe: ${details}`, '#dc2626');
    } finally {
        wordConvertButton.disabled = !wordExtractedPages.some((page) => page.text);
    }
});

wordPdfInput.addEventListener('change', async () => {
    const file = wordPdfInput.files[0];
    wordPdfInput.value = '';
    if (!file) return;

    const loadId = ++wordPdfLoadId;
    wordPdfHtml = '';
    wordPdfConvertButton.disabled = true;
    setUploadState(wordPdfDropzone, true);
    wordPdfUpload.querySelector('span').textContent = `Arquivo selecionado: ${file.name}. Arraste outro para substituir`;
    wordPdfContent.hidden = true;
    wordPdfContent.replaceChildren();
    wordPdfMessage.hidden = false;
    wordPdfMessage.textContent = 'Lendo o documento Word...';

    if (!file.name.toLowerCase().endsWith('.docx')) {
        setUploadState(wordPdfDropzone, false);
        wordPdfUpload.querySelector('span').textContent = 'Anexe ou arraste um arquivo Word (.docx)';
        wordPdfMessage.textContent = 'Selecione um arquivo .docx. O formato antigo .doc não é compatível.';
        showStatus('Selecione um arquivo Word no formato .docx.', '#dc2626');
        return;
    }

    wordPdfOutputNameInput.value = `${file.name.replace(/\.docx$/i, '')}_convertido`;
    try {
        if (!window.docx || typeof window.docx.renderAsync !== 'function') {
            throw new Error('Não foi possível carregar a biblioteca para renderizar arquivos Word. Verifique sua conexão com a internet.');
        }

        const arrayBuffer = await file.arrayBuffer();
        if (loadId !== wordPdfLoadId) return;
        await window.docx.renderAsync(
            arrayBuffer,
            wordPdfContent,
            wordPdfContent,
            {
                className: 'docx',
                inWrapper: true,
                useBase64URL: true
            }
        );
        if (loadId !== wordPdfLoadId) {
            wordPdfContent.replaceChildren();
            return;
        }
        if (!wordPdfContent.querySelector('.docx-wrapper')) {
            throw new Error('O documento não contém conteúdo que possa ser convertido.');
        }

        wordPdfHtml = wordPdfContent.innerHTML;
        wordPdfContent.hidden = false;
        wordPdfMessage.hidden = true;
        wordPdfConvertButton.disabled = false;
        showStatus(`Documento ${file.name} carregado e pronto para converter.`, '#16a34a');
    } catch (error) {
        if (loadId !== wordPdfLoadId) return;
        console.error(error);
        const details = error instanceof Error ? error.message : String(error);
        setUploadState(wordPdfDropzone, false);
        wordPdfUpload.querySelector('span').textContent = 'Anexe ou arraste um arquivo Word (.docx)';
        wordPdfContent.replaceChildren();
        wordPdfContent.hidden = true;
        wordPdfMessage.hidden = false;
        wordPdfMessage.textContent = 'Não foi possível abrir este documento Word.';
        showStatus(`❌ Não foi possível ler o arquivo Word.\nDetalhe: ${details}`, '#dc2626');
    }
});

wordPdfConvertButton.addEventListener('click', async () => {
    const outputName = getSafeOutputName(wordPdfOutputNameInput);
    if (!outputName) {
        showStatus('Digite um nome válido para o arquivo PDF.', '#dc2626');
        wordPdfOutputNameInput.focus();
        return;
    }
    if (!window.html2pdf || !wordPdfHtml) {
        showStatus('❌ Não foi possível carregar a biblioteca de conversão ou o documento ainda não está pronto. Verifique sua conexão e tente novamente.', '#dc2626');
        return;
    }

    try {
        wordPdfConvertButton.disabled = true;
        wordPdfContent.classList.add('is-exporting');
        showStatus('⏳ Gerando o arquivo PDF...');
        await html2pdf()
            .set({
                margin: [12, 12, 12, 12],
                filename: `${outputName}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, backgroundColor: '#ffffff' },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['css', 'legacy'] }
            })
            .from(wordPdfContent)
            .save();
        showStatus(`✅ Sucesso! O arquivo ${outputName}.pdf foi baixado.`, '#16a34a');
    } catch (error) {
        console.error(error);
        const details = error instanceof Error ? error.message : String(error);
        showStatus(`❌ Não foi possível converter o Word para PDF.\nDetalhe: ${details}`, '#dc2626');
    } finally {
        wordPdfContent.classList.remove('is-exporting');
        wordPdfConvertButton.disabled = !wordPdfHtml;
    }
});

function addWhiteBackground(canvas) {
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    return context;
}

function canvasToJpegBlob(canvas, quality = 1) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('O navegador não conseguiu gerar uma imagem JPG para uma das páginas.'));
                return;
            }
            resolve(blob);
        }, 'image/jpeg', quality);
    });
}

jpgInput.addEventListener('change', async () => {
    const file = jpgInput.files[0];
    jpgInput.value = '';
    if (!file) return;

    const loadId = ++jpgLoadId;
    const previousDocument = jpgPdfDocument;
    jpgPdfDocument = null;
    if (previousDocument) {
        try {
            await previousDocument.destroy();
        } catch (error) {
            console.error('Não foi possível encerrar a pré-visualização anterior do PDF para JPG.', error);
        }
    }

    jpgConvertButton.disabled = true;
    jpgPreviewGrid.hidden = true;
    jpgPreviewGrid.replaceChildren();
    jpgPreviewCount.textContent = '';
    setUploadState(jpgCenterDropzone, true);
    jpgCenterUpload.querySelector('span').textContent = `PDF selecionado: ${file.name}. Arraste outro para substituir`;
    jpgPreviewMessage.hidden = false;
    jpgPreviewMessage.textContent = 'Carregando páginas do PDF...';

    if (!file.name.toLowerCase().endsWith('.pdf')) {
        setUploadState(jpgCenterDropzone, false);
        jpgCenterUpload.querySelector('span').textContent = 'Anexe ou arraste um PDF para converter';
        jpgPreviewMessage.textContent = 'Selecione um arquivo PDF para continuar.';
        showStatus('Selecione um arquivo no formato PDF.', '#dc2626');
        return;
    }

    jpgOutputNameInput.value = `${file.name.replace(/\.pdf$/i, '')}_jpg`;
    let pdfDocument = null;
    try {
        if (!window.pdfjsLib) {
            throw new Error('Não foi possível carregar a biblioteca de leitura de PDF. Verifique sua conexão com a internet.');
        }

        const loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(await file.arrayBuffer())
        });
        pdfDocument = await loadingTask.promise;
        if (loadId !== jpgLoadId) {
            await pdfDocument.destroy();
            return;
        }
        jpgPdfDocument = pdfDocument;

        jpgPreviewGrid.hidden = false;
        jpgPreviewMessage.hidden = true;
        jpgPreviewCount.textContent = `${pdfDocument.numPages} ${pdfDocument.numPages === 1 ? 'página' : 'páginas'}`;

        for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
            if (loadId !== jpgLoadId) return;
            const page = await pdfDocument.getPage(pageNumber);
            const viewport = page.getViewport({ scale: 0.55 });
            const canvas = document.createElement('canvas');
            canvas.width = Math.ceil(viewport.width);
            canvas.height = Math.ceil(viewport.height);
            const context = addWhiteBackground(canvas);
            await page.render({ canvasContext: context, viewport, background: '#ffffff' }).promise;

            const card = document.createElement('div');
            const label = document.createElement('span');
            card.className = 'jpg-preview-card';
            label.textContent = `Página ${pageNumber}`;
            card.append(canvas, label);
            jpgPreviewGrid.appendChild(card);
        }

        if (loadId === jpgLoadId) {
            jpgConvertButton.disabled = false;
            showStatus(`PDF carregado: ${file.name}. ${pdfDocument.numPages} página(s) pronta(s) para converter.`, '#16a34a');
        }
    } catch (error) {
        if (loadId !== jpgLoadId) return;
        console.error(error);
        const details = error instanceof Error ? error.message : String(error);
        jpgPreviewGrid.hidden = true;
        jpgPreviewMessage.hidden = false;
        jpgPreviewMessage.textContent = 'Não foi possível abrir ou pré-visualizar este PDF.';
        jpgPreviewCount.textContent = '';
        setUploadState(jpgCenterDropzone, false);
        jpgCenterUpload.querySelector('span').textContent = 'Anexe ou arraste um PDF para converter';
        if (jpgPdfDocument === pdfDocument) jpgPdfDocument = null;
        showStatus(`❌ Não foi possível abrir o PDF.\nDetalhe: ${details}`, '#dc2626');
        if (pdfDocument) {
            await pdfDocument.destroy().catch((destroyError) => {
                console.error('Não foi possível encerrar o PDF após falha na pré-visualização JPG.', destroyError);
            });
        }
    }
});

jpgConvertButton.addEventListener('click', async () => {
    if (!jpgPdfDocument) return;
    const outputName = getSafeOutputName(jpgOutputNameInput).replace(/\.zip$/i, '');
    if (!outputName) {
        showStatus('Digite um nome válido para o arquivo ZIP.', '#dc2626');
        jpgOutputNameInput.focus();
        return;
    }
    if (!window.JSZip) {
        showStatus('❌ Não foi possível carregar a biblioteca ZIP. Verifique sua conexão com a internet e abra esta página novamente.', '#dc2626');
        return;
    }

    const sourceDocument = jpgPdfDocument;
    const zip = new JSZip();

    try {
        jpgConvertButton.disabled = true;
        for (let pageNumber = 1; pageNumber <= sourceDocument.numPages; pageNumber += 1) {
            showStatus(`⏳ Convertendo página ${pageNumber} de ${sourceDocument.numPages}...`);
            const page = await sourceDocument.getPage(pageNumber);
            const viewport = page.getViewport({ scale: 2 });
            const canvas = document.createElement('canvas');
            canvas.width = Math.ceil(viewport.width);
            canvas.height = Math.ceil(viewport.height);
            const context = addWhiteBackground(canvas);
            await page.render({ canvasContext: context, viewport, background: '#ffffff' }).promise;
            const blob = await canvasToJpegBlob(canvas);
            const pageName = `pagina_${String(pageNumber).padStart(3, '0')}.jpg`;
            zip.file(pageName, blob);
            canvas.width = 0;
            canvas.height = 0;
        }

        showStatus('⏳ Compactando imagens...');
        const zipBlob = await zip.generateAsync({ type: 'blob' }, (progress) => {
            showStatus(`⏳ Compactando imagens: ${Math.round(progress.percent)}%`);
        });
        downloadFile(zipBlob, `${outputName}.zip`);
        showStatus(`✅ Sucesso! ${sourceDocument.numPages} imagem(ns) JPG foram baixadas em ${outputName}.zip.`, '#16a34a');
    } catch (error) {
        console.error(error);
        const details = error instanceof Error ? error.message : String(error);
        showStatus(`❌ Não foi possível converter o PDF para JPG.\nDetalhe: ${details}`, '#dc2626');
    } finally {
        jpgConvertButton.disabled = !jpgPdfDocument;
    }
});

ocrInput.addEventListener('change', async () => {
    const file = ocrInput.files[0];
    ocrInput.value = '';
    if (!file || ocrProcessing) return;

    const loadId = ++ocrLoadId;
    const previousDocument = ocrPdfDocument;
    ocrPdfDocument = null;
    ocrFile = null;
    ocrConvertButton.disabled = true;
    ocrPreviewGrid.hidden = true;
    ocrPreviewGrid.replaceChildren();
    ocrPreviewCount.textContent = '';
    setUploadState(ocrDropzone, true);
    ocrUpload.querySelector('span').textContent = `PDF selecionado: ${file.name}. Arraste outro para substituir`;
    ocrPreviewMessage.hidden = false;
    ocrPreviewMessage.textContent = 'Carregando páginas do PDF...';

    if (previousDocument) {
        try {
            await previousDocument.destroy();
        } catch (error) {
            console.error('Não foi possível encerrar a pré-visualização OCR anterior.', error);
        }
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
        setUploadState(ocrDropzone, false);
        ocrUpload.querySelector('span').textContent = 'Anexe ou arraste um PDF para aplicar OCR';
        ocrPreviewMessage.textContent = 'Selecione um arquivo PDF para continuar.';
        showStatus('Selecione um arquivo no formato PDF.', '#dc2626');
        return;
    }

    ocrOutputNameInput.value = `${file.name.replace(/\.pdf$/i, '')}_ocr`;
    let pdfDocument = null;
    try {
        if (!window.pdfjsLib) {
            throw new Error('Não foi possível carregar a biblioteca de leitura de PDF. Verifique sua conexão com a internet.');
        }

        const loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(await file.arrayBuffer())
        });
        pdfDocument = await loadingTask.promise;
        if (loadId !== ocrLoadId) {
            await pdfDocument.destroy();
            return;
        }
        ocrPdfDocument = pdfDocument;
        ocrFile = file;
        ocrPreviewGrid.hidden = false;
        ocrPreviewMessage.hidden = true;
        ocrPreviewCount.textContent = `${pdfDocument.numPages} ${pdfDocument.numPages === 1 ? 'página' : 'páginas'}`;

        for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
            if (loadId !== ocrLoadId) return;
            const page = await pdfDocument.getPage(pageNumber);
            const viewport = page.getViewport({ scale: 0.5 });
            const canvas = document.createElement('canvas');
            canvas.width = Math.ceil(viewport.width);
            canvas.height = Math.ceil(viewport.height);
            const context = addWhiteBackground(canvas);
            await page.render({ canvasContext: context, viewport, background: '#ffffff' }).promise;

            const card = document.createElement('div');
            const label = document.createElement('span');
            card.className = 'jpg-preview-card';
            label.textContent = `Página ${pageNumber}`;
            card.append(canvas, label);
            ocrPreviewGrid.appendChild(card);
        }

        if (loadId === ocrLoadId) {
            ocrConvertButton.disabled = false;
            showStatus(`PDF carregado: ${file.name}. Pronto para aplicar OCR.`, '#16a34a');
        }
    } catch (error) {
        if (loadId !== ocrLoadId) return;
        console.error(error);
        const details = error instanceof Error ? error.message : String(error);
        ocrPreviewGrid.hidden = true;
        ocrPreviewMessage.hidden = false;
        ocrPreviewMessage.textContent = 'Não foi possível abrir ou pré-visualizar este PDF.';
        ocrPreviewCount.textContent = '';
        setUploadState(ocrDropzone, false);
        ocrUpload.querySelector('span').textContent = 'Anexe ou arraste um PDF para aplicar OCR';
        ocrFile = null;
        ocrPdfDocument = null;
        showStatus(`❌ Não foi possível abrir o PDF.\nDetalhe: ${details}`, '#dc2626');
        if (pdfDocument) {
            await pdfDocument.destroy().catch((destroyError) => {
                console.error('Não foi possível encerrar o PDF após falha na pré-visualização OCR.', destroyError);
            });
        }
    }
});

ocrConvertButton.addEventListener('click', async () => {
    if (!ocrPdfDocument || !ocrFile) return;

    const outputName = getSafeOutputName(ocrOutputNameInput);
    if (!outputName) {
        showStatus('Digite um nome válido para o arquivo PDF.', '#dc2626');
        ocrOutputNameInput.focus();
        return;
    }
    if (!window.PDFLib || !window.Tesseract) {
        showStatus('❌ Não foi possível carregar as bibliotecas para gerar o PDF ou aplicar OCR. Verifique sua conexão com a internet e abra esta página novamente.', '#dc2626');
        return;
    }

    const sourceDocument = ocrPdfDocument;
    const language = ocrLanguageInput.value;
    let worker = null;
    let pagesWithoutText = 0;

    try {
        ocrProcessing = true;
        ocrConvertButton.disabled = true;
        ocrInput.disabled = true;
        ocrUpload.disabled = true;
        ocrLanguageInput.disabled = true;
        ocrOutputNameInput.disabled = true;
        showStatus('⏳ Preparando o mecanismo de OCR. Na primeira utilização, os dados do idioma podem levar alguns instantes para baixar...');
        worker = await Tesseract.createWorker(language, 1, {
            logger: (progress) => {
                if (progress.status && progress.status !== 'recognizing text') {
                    showStatus(`⏳ OCR: ${progress.status}${Number.isFinite(progress.progress) ? ` (${Math.round(progress.progress * 100)}%)` : ''}`);
                }
            }
        });

        const searchablePdf = await PDFLib.PDFDocument.create();
        const font = await searchablePdf.embedFont(PDFLib.StandardFonts.Helvetica);

        for (let pageNumber = 1; pageNumber <= sourceDocument.numPages; pageNumber += 1) {
            showStatus(`⏳ Aplicando OCR na página ${pageNumber} de ${sourceDocument.numPages}...`);
            const page = await sourceDocument.getPage(pageNumber);
            const originalViewport = page.getViewport({ scale: 1 });
            const renderScale = Math.min(2.5, 3000 / Math.max(originalViewport.width, originalViewport.height));
            const viewport = page.getViewport({ scale: renderScale });
            const canvas = document.createElement('canvas');
            canvas.width = Math.ceil(viewport.width);
            canvas.height = Math.ceil(viewport.height);
            const context = addWhiteBackground(canvas);
            await page.render({ canvasContext: context, viewport, background: '#ffffff' }).promise;

            const { data } = await worker.recognize(canvas);
            const words = (data.words || []).filter((word) => word.text && word.text.trim() && word.bbox);
            if (!words.length) pagesWithoutText += 1;

            const imageBlob = await canvasToJpegBlob(canvas, 0.96);
            const image = await searchablePdf.embedJpg(new Uint8Array(await imageBlob.arrayBuffer()));
            const outputPage = searchablePdf.addPage([originalViewport.width, originalViewport.height]);
            outputPage.drawImage(image, {
                x: 0,
                y: 0,
                width: originalViewport.width,
                height: originalViewport.height
            });

            const scaleX = originalViewport.width / canvas.width;
            const scaleY = originalViewport.height / canvas.height;
            words.forEach((word) => {
                const boxHeight = (word.bbox.y1 - word.bbox.y0) * scaleY;
                if (boxHeight <= 0) return;
                const fontSize = Math.min(72, Math.max(1, boxHeight * 0.82));
                outputPage.drawText(word.text.trim(), {
                    x: Math.max(0, word.bbox.x0 * scaleX),
                    y: Math.max(0, originalViewport.height - word.bbox.y1 * scaleY + fontSize * 0.08),
                    size: fontSize,
                    font,
                    color: PDFLib.rgb(0, 0, 0),
                    opacity: 0
                });
            });

            canvas.width = 0;
            canvas.height = 0;
        }

        showStatus('⏳ Finalizando o PDF pesquisável...');
        const pdfBytes = await searchablePdf.save();
        downloadPdf(pdfBytes, outputName);
        const warning = pagesWithoutText
            ? ` ${pagesWithoutText} página(s) não tiveram texto reconhecido.`
            : '';
        showStatus(`✅ OCR concluído. O arquivo ${outputName}.pdf está pronto para pesquisa.${warning}`, pagesWithoutText ? '#b7791f' : '#16a34a');
    } catch (error) {
        console.error(error);
        const details = error instanceof Error ? error.message : String(error);
        showStatus(`❌ Não foi possível aplicar OCR ao PDF.\nDetalhe: ${details}`, '#dc2626');
    } finally {
        if (worker) {
            try {
                await worker.terminate();
            } catch (error) {
                console.error('Não foi possível encerrar o mecanismo de OCR.', error);
            }
        }
        ocrProcessing = false;
        ocrInput.disabled = false;
        ocrUpload.disabled = false;
        ocrLanguageInput.disabled = false;
        ocrOutputNameInput.disabled = false;
        ocrConvertButton.disabled = !ocrPdfDocument;
    }
});

function renderImageFiles() {
    imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    imagePreviewUrls = [];
    imagesPdfGrid.replaceChildren();

    imageFiles.forEach((file, index) => {
        const card = document.createElement('article');
        const image = document.createElement('img');
        const caption = document.createElement('div');
        const label = document.createElement('span');
        const removeButton = document.createElement('button');
        const previewUrl = URL.createObjectURL(file);

        imagePreviewUrls.push(previewUrl);
        card.className = 'images-pdf-card';
        card.draggable = true;
        card.dataset.index = String(index);
        image.src = previewUrl;
        image.alt = `Pré-visualização de ${file.name}`;
        label.textContent = `${index + 1}. ${file.name}`;
        label.title = file.name;
        removeButton.type = 'button';
        removeButton.className = 'file-item-remove';
        removeButton.textContent = 'Remover';
        removeButton.setAttribute('aria-label', `Remover ${file.name}`);
        removeButton.addEventListener('click', () => {
            imageFiles.splice(index, 1);
            renderImageFiles();
        });

        card.addEventListener('dragstart', (event) => {
            event.dataTransfer.setData('text/plain', String(index));
            event.dataTransfer.effectAllowed = 'move';
            card.classList.add('is-dragging');
        });
        card.addEventListener('dragend', () => {
            card.classList.remove('is-dragging');
            imagesPdfGrid.querySelectorAll('.drag-target').forEach((target) => {
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
            if (!Number.isInteger(fromIndex) || fromIndex < 0 ||
                fromIndex >= imageFiles.length || fromIndex === index) return;
            const [movedFile] = imageFiles.splice(fromIndex, 1);
            imageFiles.splice(index, 0, movedFile);
            renderImageFiles();
        });

        caption.className = 'images-pdf-caption';
        caption.append(label, removeButton);
        card.append(image, caption);
        imagesPdfGrid.appendChild(card);
    });

    const hasImages = imageFiles.length > 0;
    setUploadState(imagesPdfDropzone, hasImages);
    imagesPdfUpload.querySelector('span').textContent = hasImages
        ? 'Arraste mais JPGs para adicionar'
        : 'Anexe ou arraste imagens JPG';
    imagesPdfCount.textContent = hasImages
        ? `${imageFiles.length} ${imageFiles.length === 1 ? 'imagem' : 'imagens'}`
        : '';
    imagesPdfGrid.hidden = !hasImages;
    imagesPdfMessage.hidden = hasImages;
    imagesPdfMessage.textContent = hasImages
        ? ''
        : 'Adicione uma ou mais imagens JPG. Arraste as miniaturas para definir a ordem das páginas.';
    imagesPdfConvertButton.disabled = !hasImages;
}

imagesPdfInput.addEventListener('change', () => {
    const files = Array.from(imagesPdfInput.files);
    imagesPdfInput.value = '';
    if (!files.length) return;

    const validFiles = files.filter((file) =>
        file.type === 'image/jpeg' || /\.(jpe?g)$/i.test(file.name)
    );
    const invalidFiles = files.filter((file) => !validFiles.includes(file));

    if (validFiles.length) {
        imageFiles.push(...validFiles);
        renderImageFiles();
    }

    if (invalidFiles.length) {
        const names = invalidFiles.map((file) => file.name).join(', ');
        showStatus(`Estes arquivos não são JPG e foram ignorados: ${names}`, '#dc2626');
    } else if (validFiles.length) {
        showStatus(`${validFiles.length} imagem(ns) JPG adicionada(s). Total: ${imageFiles.length}.`, '#16a34a');
    }
});

imagesPdfConvertButton.addEventListener('click', async () => {
    if (!imageFiles.length) return;
    const outputName = getSafeOutputName(imagesPdfOutputNameInput);
    if (!outputName) {
        showStatus('Digite um nome válido para o arquivo PDF.', '#dc2626');
        imagesPdfOutputNameInput.focus();
        return;
    }
    if (!window.PDFLib) {
        showStatus('❌ Não foi possível carregar a biblioteca de PDF. Verifique sua conexão com a internet e abra esta página novamente.', '#dc2626');
        return;
    }

    const filesToConvert = [...imageFiles];
    try {
        imagesPdfConvertButton.disabled = true;
        const pdfDocument = await PDFLib.PDFDocument.create();

        for (let index = 0; index < filesToConvert.length; index += 1) {
            const file = filesToConvert[index];
            showStatus(`⏳ Adicionando imagem ${index + 1} de ${filesToConvert.length}: ${file.name}`);
            const image = await pdfDocument.embedJpg(await file.arrayBuffer());
            const scale = Math.min(0.75, 14400 / image.width, 14400 / image.height);
            const width = image.width * scale;
            const height = image.height * scale;
            const page = pdfDocument.addPage([width, height]);
            page.drawImage(image, { x: 0, y: 0, width, height });
        }

        const pdfBytes = await pdfDocument.save();
        downloadPdf(pdfBytes, outputName);
        showStatus(`✅ Sucesso! ${filesToConvert.length} imagem(ns) foram convertidas para ${outputName}.pdf.`, '#16a34a');
    } catch (error) {
        console.error(error);
        const details = error instanceof Error ? error.message : String(error);
        showStatus(`❌ Não foi possível converter as imagens para PDF.\nDetalhe: ${details}`, '#dc2626');
    } finally {
        imagesPdfConvertButton.disabled = imageFiles.length === 0;
    }
});

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
    const mergeCenterDropzone = document.getElementById('merge-center-dropzone');
    setUploadState(mergeCenterDropzone, selectedFiles.length > 0);
    mergeCenterUpload.querySelector('span').textContent = selectedFiles.length
        ? 'Arraste mais PDFs para adicionar à pré-visualização'
        : 'Arraste arquivos PDF para cá ou clique para anexar';
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
    setUploadState(document.getElementById('extract-center-dropzone'), true);
    extractCenterUpload.querySelector('span').textContent = 'Arraste outro PDF para substituir o documento';
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
        setUploadState(document.getElementById('extract-center-dropzone'), false);
        extractCenterUpload.querySelector('span').textContent = 'Arraste um PDF para cá ou clique para anexar';
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