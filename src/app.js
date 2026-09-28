import { basicSetup } from 'codemirror';
import { EditorView, Decoration, WidgetType, gutter, GutterMarker } from '@codemirror/view';
import { EditorState, StateEffect, StateField, RangeSet } from '@codemirror/state';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import * as math from 'mathjs';
import katex from 'katex';
import functionPlot from 'function-plot';
import nerdamer from 'nerdamer/all.min';
import 'katex/dist/katex.min.css';
// ================================================================
// LANGUAGE SYSTEM
// ================================================================

const LANG_KEY = 'mathnotebook_lang';
let currentLang = localStorage.getItem(LANG_KEY) || 'en';

const translations = {
  en: {
    // Top bar
    newFileBtn: 'New file',
    examplesBtn: 'Examples',
    examplesTitle: 'Load examples into a new notebook',
    examplesFileName: 'examples.math',
    searchBtn: 'Search',
    searchTitle: 'Search notebooks',
    searchShortcutTitle: 'Search notebooks (Ctrl/Cmd+K)',
    searchPlaceholder: 'Search all notebooks...',
    searchEmpty: 'Type to search across all notebooks.',
    searchNoResults: 'No results found.',
    searchLine: 'line',
    searchResults: 'results',
    renameNotebook: 'Rename',
    duplicateNotebook: 'Duplicate',
    renamePrompt: 'Notebook name',
    copySuffix: 'copy',
    notebookClosed: 'Notebook closed.',
    undo: 'Undo',
    
    // Modal
    modalTitle: 'Create New File',
    modalPlaceholder: 'File name (e.g., calc.math)',
    modalCancel: 'Cancel',
    modalConfirm: 'Create',
    
    // Status bar
    line: 'line',
    functions: 'functions',
    variables: 'variables',
    equations: 'equations',
    zoomIn: 'Zoom in (Ctrl++)',
    zoomOut: 'Zoom out (Ctrl+-)',
    online: 'Online',
    offline: 'Offline',
    onlineTitle: 'Network connection available',
    offlineTitle: 'Offline — MathNote continues from local cache',
    
    // Alerts
    atLeastOneFile: 'At least one file must remain open.',
    confirmDelete: 'Delete',
    
    // Sidebar
    noLineInfo: 'No line info',
    linesSelected: 'lines selected:',
    saveAsNewFile: 'Save as New File',
    
    // Line types
    emptyLine: 'Empty Line',
    emptyLineDesc: 'No operation.',
    comment: 'Comment',
    plot: 'Plot',
    vectorAssignment: 'Vector Assignment',
    matrixAssignment: 'Matrix Assignment',
    variableAssignment: 'Variable Assignment',
    error: 'Error',
    errorMessage: 'Error Message',
    expression: 'Expression',
    equation: 'Equation',
    inequality: 'Inequality',
    
    // Analysis panel
    funcAnalysis: 'Function Analysis',
    derivative: 'Derivative',
    integral: 'Integral',
    limit: 'Limit',
    simplification: 'Simplification',
    rootFinding: 'Root Finding',
    criticalExtremum: 'Critical & Extremum',
    symmetry: 'Symmetry',
    tangentNormal: 'Tangent & Normal',
    inflectionPoints: 'Inflection Points',
    gradient: 'Gradient ∇f',
    hessian: 'Hessian',
    surface3D: '3D Surface',
    dragToRotate: 'Drag to rotate',
    
    // Analysis values
    none: 'None',
    notCalculated: 'Could not calculate',
    notFound: 'Not found',
    noSolution: 'No solution',
    noRealSolution: 'No real solution in [-30, 30]',
    undefined: 'Undefined at x₀',
    
    simple: 'Simple',
    factor: 'Factor',
    horner: 'Horner',
    same: 'Same',
    
    min: 'Min',
    max: 'Max',
    saddle: 'Saddle',
    
    even: 'Even — f(−x) = f(x)',
    odd: 'Odd — f(−x) = −f(x)',
    neither: 'Neither even nor odd',
    zeroFunc: 'Zero function',
    unknown: 'Unknown',
    
    tangent: 'Tangent:',
    normal: 'Normal:',
    noDerivative: 'No derivative',
    
    // Equation panel
    altForm: 'Alternative Form',
    solution: 'Solution',
    numeric: 'Numeric (bisection)',
    geometricFigure: 'Geometric Figure',
    implicitSolution: 'Solutions (y)',
    implicitDerivative: 'Implicit Derivatives',
    integerSolutions: 'Integer Solutions',
    circle: 'Circle', ellipse: 'Ellipse', hyperbola: 'Hyperbola',
    parabola: 'Parabola', straightLine: 'Line', pointFigure: 'Point',
    center: 'Center', radius: 'Radius', implicitEquation: 'Implicit Equation',
    
    // Inequality panel
    result: 'Result',
    true: 'True ✓',
    false: 'False ✗',
    invalidValue: 'Invalid value',
    inflectionPrefix: 'I',
    
    // Matrix/Vector
    elements: 'elements',
    definition: 'Definition',
    vector: 'Vector',
    matrix: 'Matrix',
    valueSubstitution: 'Value Substitution',
    calculation: 'Calculation',
    resultLabel: 'Result',
    
    // Plot controls
    reset: 'reset',
    resize: 'Drag to resize',
    plotError: 'Plot error:',
    
    // Units
    unitSystem: 'Unit System',
    
    // Export
    exportBtn: '↑ Export',
    exportTitle: 'Export',
    exportCancel: 'Cancel',
    exportConfirm: 'Export',
    exportPdfHint: '(browser print)',

    // Backup / restore
    backupBtn: 'Backup',
    backupTitle: 'Backup & Restore',
    backupDesc: 'Back up or restore all notebooks in one JSON file.',
    backupExportTitle: 'Download backup',
    backupExportDesc: 'Save all notebooks and basic preferences as JSON.',
    backupImportTitle: 'Restore backup',
    backupImportDesc: 'Replace current notebooks from a MathNote JSON backup.',
    backupClose: 'Close',
    backupFileName: 'mathnote-backup',
    backupInvalid: 'This file is not a valid MathNote backup.',
    backupReadError: 'The backup file could not be read.',
    backupConfirmRestore: 'Restore this backup? Current notebooks will be replaced.',
    backupRestored: 'Backup restored successfully.',

    // Info modal
    infoBtn: 'Info',
    infoTitle: 'About MathNote',
    infoClose: 'Close',
    infoLibsTitle: 'Libraries Used',
    infoAiTitle: 'AI Models & Architecture',
    infoCmDesc: 'Modern, modular, high-performance editor core powering live math documents.',
    infoKatexDesc: 'Fast mathematical typesetting engine for TeX / LaTeX formula rendering.',
    infoNerdamerDesc: 'Symbolic math solver for algebraic expressions, derivatives, integrals, and equation solving.',
    infoMathjsDesc: 'Comprehensive math engine for numeric evaluations, matrix operations, and unit conversions.',
    infoFuncPlotDesc: 'Interactive 2D plotting library for real-time function canvas/SVG rendering.',
    infoAiBoxTitle: 'Hybrid Symbolic Reasoning & LLM Assistant Integration',
    infoAiBoxDesc: 'MathNote combines a local deterministic symbolic AI solver with LLM architecture:',
    infoAiFeat1: 'Symbolic Engine: Real-time AST parsing, automatic root detection, extremum analysis, and derivative computation.',
    infoAiFeat2: 'LLM Ready: Structured for seamless integration with Gemini (1.5 / 2.0 Flash & Pro), Claude, and GPT-4o for natural language problem breakdown and automatic LaTeX generation.',
    infoAiFeat3: 'Context Pipeline: Every document line is continuously evaluated against scope dependencies to update graph plots and analysis panels dynamically.',

    // Insert modal
    insertTitle: 'Insert',
    insertFunc: 'Function',
    insertEq: 'Equation',
    insertIneq: 'Inequality',
    insertMat: 'Matrix',
    insertExpr: 'Expression',
    insertCancel: 'Cancel',
    insertConfirm: 'Insert',
    insFuncName: 'Function name',
    insFuncVar: 'Variable',
    insFuncDef: 'Definition',
    insLhs: 'Left side',
    insRhs: 'Right side',
    insMatVar: 'Variable (optional)',
    insMatRows: 'Rows:',
    insMatCols: 'Cols:',
    insExprLabel: 'Expression',

    // Default content comment
    defaultComment1: '# Basic Operations',
    defaultComment2: '# Variables',
    defaultComment3: '# Functions',
    defaultComment4: '# Derivative',
    defaultComment5: '# Plot',
  },
  tr: {
    // Top bar
    newFileBtn: 'Yeni dosya',
    examplesBtn: 'Örnekler',
    examplesTitle: 'Örnekleri yeni bir not defterine yükle',
    examplesFileName: 'ornekler.math',
    searchBtn: 'Ara',
    searchTitle: 'Not defterlerinde ara',
    searchShortcutTitle: 'Not defterlerinde ara (Ctrl/Cmd+K)',
    searchPlaceholder: 'Tüm not defterlerinde ara...',
    searchEmpty: 'Tüm not defterlerinde aramak için yazın.',
    searchNoResults: 'Sonuç bulunamadı.',
    searchLine: 'satır',
    searchResults: 'sonuç',
    renameNotebook: 'Yeniden adlandır',
    duplicateNotebook: 'Kopyala',
    renamePrompt: 'Not defteri adı',
    copySuffix: 'kopya',
    notebookClosed: 'Not defteri kapatıldı.',
    undo: 'Geri Al',
    
    // Modal
    modalTitle: 'Yeni Dosya Oluştur',
    modalPlaceholder: 'Dosya adı (örn: hesap.math)',
    modalCancel: 'İptal',
    modalConfirm: 'Oluştur',
    
    // Status bar
    line: 'satır',
    functions: 'fonksiyon',
    variables: 'değişken',
    equations: 'denklem',
    zoomIn: 'Büyüt (Ctrl++)',
    zoomOut: 'Küçült (Ctrl+-)',
    online: 'Çevrimiçi',
    offline: 'Çevrimdışı',
    onlineTitle: 'Ağ bağlantısı kullanılabilir',
    offlineTitle: 'Çevrimdışı — MathNote yerel önbellekten çalışmaya devam eder',
    
    // Alerts
    atLeastOneFile: 'En az bir dosya açık kalmalı.',
    confirmDelete: 'silinsin mi?',
    
    // Sidebar
    noLineInfo: 'Satır bilgisi yok',
    linesSelected: 'satır seçildi:',
    saveAsNewFile: 'Yeni Dosya Olarak Kaydet',
    
    // Line types
    emptyLine: 'Boş Satır',
    emptyLineDesc: 'İşlem yapılmıyor.',
    comment: 'Yorum',
    plot: 'Grafik (Plot)',
    vectorAssignment: 'Vektör Ataması',
    matrixAssignment: 'Matris Ataması',
    variableAssignment: 'Değişken Ataması',
    error: 'Hata',
    errorMessage: 'Hata Mesajı',
    expression: 'İfade',
    equation: 'Denklem',
    inequality: 'Eşitsizlik',
    
    // Analysis panel
    funcAnalysis: 'Fonksiyon Analizi',
    derivative: 'Türev',
    integral: 'İntegral',
    limit: 'Limit',
    simplification: 'Sadeleştirme',
    rootFinding: 'Kök Bulma',
    criticalExtremum: 'Kritik & Extremum',
    symmetry: 'Simetri',
    tangentNormal: 'Teğet & Normal',
    inflectionPoints: 'Büküm Noktaları',
    gradient: 'Gradyan ∇f',
    hessian: 'Hessian',
    surface3D: '3B Yüzey',
    dragToRotate: 'Sürükle: döndür',
    
    // Analysis values
    none: 'Yok',
    notCalculated: 'Hesaplanamadı',
    notFound: 'Bulunamadı',
    noSolution: 'Çözüm yok',
    noRealSolution: '[-30, 30]\'da gerçel çözüm bulunamadı',
    undefined: 'x₀ noktasında tanımsız',
    
    simple: 'Basit',
    factor: 'Çarpan',
    horner: 'Horner',
    same: 'Aynı',
    
    min: 'Min ▼',
    max: 'Maks ▲',
    saddle: 'Eğer',
    
    even: 'Çift — f(−x) = f(x)',
    odd: 'Tek — f(−x) = −f(x)',
    neither: 'Ne tek ne çift',
    zeroFunc: 'Sıfır fonksiyon',
    unknown: 'Bilinmiyor',
    
    tangent: 'Teğet:',
    normal: 'Normal:',
    noDerivative: 'Türev yok',
    
    // Equation panel
    altForm: 'Alternatif Form',
    solution: 'Çözüm',
    numeric: 'Nümerik (bisection)',
    geometricFigure: 'Geometrik Şekil',
    implicitSolution: 'Çözümler (y)',
    implicitDerivative: 'Örtük Türevler',
    integerSolutions: 'Tam Sayı Çözümler',
    circle: 'Çember', ellipse: 'Elips', hyperbola: 'Hiperbol',
    parabola: 'Parabol', straightLine: 'Doğru', pointFigure: 'Nokta',
    center: 'Merkez', radius: 'Yarıçap', implicitEquation: 'Örtük Denklem',
    
    // Inequality panel
    result: 'Sonuç',
    true: 'Doğru ✓',
    false: 'Yanlış ✗',
    invalidValue: 'Geçersiz değer',
    inflectionPrefix: 'B',
    
    // Matrix/Vector
    elements: 'eleman',
    definition: 'Tanım',
    vector: 'Vektör',
    matrix: 'Matris',
    valueSubstitution: 'Değer Değişimi',
    calculation: 'Hesaplama',
    resultLabel: 'Sonuç',
    
    // Plot controls
    reset: 'sıfırla',
    resize: 'Sürükleyerek yeniden boyutlandır',
    plotError: 'Plot hatası:',
    
    // Units
    unitSystem: 'Birim Sistemi',
    
    // Export
    exportBtn: '↑ Dışa Aktar',
    exportTitle: 'Dışa Aktar',
    exportCancel: 'İptal',
    exportConfirm: 'Dışa Aktar',
    exportPdfHint: '(tarayıcı yazdır)',

    // Yedek / geri yükleme
    backupBtn: 'Yedek',
    backupTitle: 'Yedekle & Geri Yükle',
    backupDesc: 'Tüm not defterlerini tek bir JSON dosyasıyla yedekleyin veya geri yükleyin.',
    backupExportTitle: 'Yedeği indir',
    backupExportDesc: 'Tüm not defterlerini ve temel tercihleri JSON olarak kaydedin.',
    backupImportTitle: 'Yedeği geri yükle',
    backupImportDesc: 'Mevcut not defterlerini bir MathNote JSON yedeğiyle değiştirin.',
    backupClose: 'Kapat',
    backupFileName: 'mathnote-yedek',
    backupInvalid: 'Bu dosya geçerli bir MathNote yedeği değil.',
    backupReadError: 'Yedek dosyası okunamadı.',
    backupConfirmRestore: 'Bu yedek geri yüklensin mi? Mevcut not defterleri değiştirilecek.',
    backupRestored: 'Yedek başarıyla geri yüklendi.',

    // Info modal
    infoBtn: 'Bilgi',
    infoTitle: 'MathNote Hakkında',
    infoClose: 'Kapat',
    infoLibsTitle: 'Kullanılan Kütüphaneler',
    infoAiTitle: 'AI Modelleri ve Hesaplama Mimarisi',
    infoCmDesc: 'Canlı matematik dokümanlarını yöneten modern, modüler ve yüksek performanslı editör çekirdeği.',
    infoKatexDesc: 'Hızlı ve yüksek çözünürlüklü TeX / LaTeX matematik formül işleme kütüphanesi.',
    infoNerdamerDesc: 'Sembolik cebirsel ifadeler, türev, integral, denklem çözümü ve matris işlemleri sunan sembolik çözücü.',
    infoMathjsDesc: 'Nümerik hesaplamalar, matris işlemleri, birim dönüşümleri ve fonksiyon değerlendirmeleri için matematik motoru.',
    infoFuncPlotDesc: 'Fonksiyon grafikleri için gerçek zamanlı etkileşimli canvas/SVG 2D çizim kütüphanesi.',
    infoAiBoxTitle: 'Hibrit Sembolik Mantık ve LLM Asistan Entegrasyonu',
    infoAiBoxDesc: 'MathNote yerel sembolik AI çözücü ile gelişmiş LLM yapay zeka mimarisini birleştirir:',
    infoAiFeat1: 'Sembolik Motor: Gerçek zamanlı AST ayrıştırması, otomatik kök bulma, ekstremum analizi ve türev hesaplama.',
    infoAiFeat2: 'LLM Desteği: Gemini (1.5 / 2.0 Flash & Pro), Claude ve GPT-4o gibi büyük dil modelleri ile doğal dilde matematik problemi çözümü ve otomatik LaTeX üretimi altyapısı.',
    infoAiFeat3: 'Bağlam Boru Hattı (Pipeline): Editördeki her satır bağımsız değişken kapsamı ile değerlendirilerek grafikler ve analiz panelleri anlık güncellenir.',

    // Insert modal
    insertTitle: 'Ekle',
    insertFunc: 'Fonksiyon',
    insertEq: 'Eşitlik',
    insertIneq: 'Eşitsizlik',
    insertMat: 'Matris',
    insertExpr: 'İfade',
    insertCancel: 'İptal',
    insertConfirm: 'Ekle',
    insFuncName: 'Fonksiyon adı',
    insFuncVar: 'Değişken',
    insFuncDef: 'Tanım',
    insLhs: 'Sol taraf',
    insRhs: 'Sağ taraf',
    insMatVar: 'Değişken (opsiyonel)',
    insMatRows: 'Satır:',
    insMatCols: 'Sütun:',
    insExprLabel: 'İfade',

    // Default content comment
    defaultComment1: '# Temel İşlemler',
    defaultComment2: '# Değişkenler',
    defaultComment3: '# Fonksiyonlar',
    defaultComment4: '# Türev',
    defaultComment5: '# Grafik',
  }
};

function t(key) {
  return translations[currentLang]?.[key] || translations.en[key] || key;
}

function setLanguage(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang;
  
  // Update lang buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  
  // Update UI elements
  updateUILanguage();
}

function updateUILanguage() {
  // Update tooltips
  document.getElementById('new-tab-btn').title = t('newFileBtn');
  const searchBtn = document.getElementById('search-btn');
  if (searchBtn) {
    searchBtn.textContent = t('searchBtn');
    searchBtn.title = t('searchShortcutTitle');
  }
  const examplesBtn = document.getElementById('examples-btn');
  if (examplesBtn) {
    examplesBtn.textContent = t('examplesBtn');
    examplesBtn.title = t('examplesTitle');
  }
  document.getElementById('zoom-in').title = t('zoomIn');
  document.getElementById('zoom-out').title = t('zoomOut');
  
  // Update modals
  document.querySelector('#new-file-modal .modal-title').textContent = t('modalTitle');
  document.getElementById('new-file-input').placeholder = t('modalPlaceholder');
  document.getElementById('modal-cancel').textContent = t('modalCancel');
  document.getElementById('modal-confirm').textContent = t('modalConfirm');
  document.getElementById('export-btn').textContent = t('exportBtn');
  document.getElementById('export-modal-title').textContent = t('exportTitle');
  document.getElementById('export-cancel').textContent = t('exportCancel');
  document.getElementById('export-confirm').textContent = t('exportConfirm');
  document.getElementById('export-pdf-label').innerHTML = `PDF <small>${t('exportPdfHint')}</small>`;

  const searchTitle = document.getElementById('search-modal-title');
  const searchInput = document.getElementById('notebook-search-input');
  const renameAction = document.getElementById('tab-menu-rename');
  const duplicateAction = document.getElementById('tab-menu-duplicate');
  const undoCloseBtn = document.getElementById('undo-close-btn');
  if (searchTitle) searchTitle.textContent = t('searchTitle');
  if (searchInput) searchInput.placeholder = t('searchPlaceholder');
  if (renameAction) renameAction.textContent = t('renameNotebook');
  if (duplicateAction) duplicateAction.textContent = t('duplicateNotebook');
  if (undoCloseBtn) undoCloseBtn.textContent = t('undo');
  if (document.getElementById('search-modal')?.classList.contains('active')) {
    renderNotebookSearchResults(searchInput?.value || '');
  }

  // Update backup / restore UI. These controls are optional so an older cached
  // HTML shell can still run safely while a newer JS bundle is being activated.
  const backupBtn = document.getElementById('backup-btn');
  if (backupBtn) {
    backupBtn.textContent = t('backupBtn');
    backupBtn.title = t('backupTitle');
  }
  const backupText = {
    'backup-modal-title': t('backupTitle'),
    'backup-modal-desc': t('backupDesc'),
    'backup-export-title': t('backupExportTitle'),
    'backup-export-desc': t('backupExportDesc'),
    'backup-import-title': t('backupImportTitle'),
    'backup-import-desc': t('backupImportDesc'),
    'backup-close': t('backupClose')
  };
  for (const [id, value] of Object.entries(backupText)) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }
  updateConnectivityStatus();

  // Update insert modal
  document.getElementById('insert-modal-title').textContent = t('insertTitle');
  document.getElementById('insert-fab').title = t('insertTitle');
  const INSERT_TAB_KEYS = { func:'insertFunc', eq:'insertEq', ineq:'insertIneq', mat:'insertMat', expr:'insertExpr' };
  document.querySelectorAll('.insert-tab').forEach(b => {
    if (b.dataset.type) b.textContent = t(INSERT_TAB_KEYS[b.dataset.type]);
  });
  document.getElementById('insert-cancel').textContent = t('insertCancel');
  document.getElementById('insert-confirm').textContent = t('insertConfirm');
  renderInsertForm();

  // Update info modal
  document.getElementById('info-btn').textContent = t('infoBtn');
  document.getElementById('info-modal-title').textContent = t('infoTitle');
  document.getElementById('info-cancel').textContent = t('infoClose');
  document.getElementById('info-libs-title').textContent = t('infoLibsTitle');
  document.getElementById('info-ai-title').textContent = t('infoAiTitle');
  document.getElementById('info-cm-desc').textContent = t('infoCmDesc');
  document.getElementById('info-katex-desc').textContent = t('infoKatexDesc');
  document.getElementById('info-nerdamer-desc').textContent = t('infoNerdamerDesc');
  document.getElementById('info-mathjs-desc').textContent = t('infoMathjsDesc');
  document.getElementById('info-funcplot-desc').textContent = t('infoFuncPlotDesc');
  document.getElementById('info-ai-box-title').textContent = t('infoAiBoxTitle');
  document.getElementById('info-ai-box-desc').textContent = t('infoAiBoxDesc');
  document.getElementById('info-ai-f1').innerHTML = `<b>${currentLang === 'tr' ? 'Sembolik Motor:' : 'Symbolic Engine:'}</b> ${t('infoAiFeat1')}`;
  document.getElementById('info-ai-f2').innerHTML = `<b>${currentLang === 'tr' ? 'LLM Desteği:' : 'LLM Ready:'}</b> ${t('infoAiFeat2')}`;
  document.getElementById('info-ai-f3').innerHTML = `<b>${currentLang === 'tr' ? 'Bağlam Boru Hattı:' : 'Context Pipeline:'}</b> ${t('infoAiFeat3')}`;

  // Update status bar
  if (view) updateStatusBar(view.state);
  
  // Clear panel cache to force re-render
  const panel = document.getElementById('s-lineinfo');
  if (panel) {
    panel.dataset.funcKey = '';
    panel.dataset.eqKey = '';
    panel.dataset.ineqKey = '';
  }
  
  // Re-render current line info
  if (view) updateLineInfo(view.state);
}

// Initialize language switcher
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
  });
  setLanguage(currentLang);
});

// ================================================================
// FILE MANAGEMENT
// ================================================================

const STORAGE_KEY = 'mathnotebook_v1';

function getDefaultContent() {
  const c = currentLang === 'tr' ? {
    c1: '# Temel İşlemler',
    c2: '# Değişkenler',
    c3: '# Fonksiyonlar',
    c4: '# Türev',
    c5: '# Birim Sistemi',
    c6: '# Grafik'
  } : {
    c1: '# Basic Operations',
    c2: '# Variables',
    c3: '# Functions',
    c4: '# Derivative',
    c5: '# Unit System',
    c6: '# Plot'
  };
  
  return `${c.c1}
2 + 3
10 * 5 - 3
sqrt(16)
2 ^ 10

${c.c2}
r = 5
alan = pi * r^2
hacim = (4/3) * pi * r^3

${c.c3}
f(x) = x^2 + 2*x + 1
f(3)
f(0)

hyp(a, b) = sqrt(a^2 + b^2)
hyp(3, 4)

${c.c4}
derivative("x^3 + 2*x^2 - x", "x")

${c.c5}
9.8 m/s^2 * 70 kg
force = 9.8 m/s^2 * 70 kg
5 kg + 3 kg
(50 km/hour) to m/s
100 celsius to fahrenheit
5 inch to cm

${c.c6}
plot(sin(x), cos(x))
plot(x^2 - 4, -(x^2) + 4)`;
}

const DEFAULT_CONTENT = getDefaultContent();

function loadFiles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0 &&
          parsed.every(f => f && typeof f.name === 'string' && typeof f.content === 'string'))
        return parsed;
    }
  } catch {}
  return [{ name: 'notebook.math', content: DEFAULT_CONTENT }];
}

let files = loadFiles();
let activeIdx = 0;
let view = null;

const SAVE_DEBOUNCE_MS = 300;
let saveTimer = null;

function saveNow() {
  if (saveTimer !== null) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
}

function scheduleSave() {
  if (saveTimer !== null) clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    saveTimer = null;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  }, SAVE_DEBOUNCE_MS);
}

function flushPendingSave() {
  if (saveTimer !== null) saveNow();
}

window.addEventListener('pagehide', flushPendingSave);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flushPendingSave();
});

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ---- Tabs ----

let contextTabIndex = -1;
let draggingTabIndex = -1;

function syncActiveFileContent() {
  if (view && files[activeIdx]) {
    files[activeIdx].content = view.state.doc.toString();
  }
}

function uniqueCopyName(originalName) {
  const dot = originalName.lastIndexOf('.');
  const hasExt = dot > 0;
  const base = hasExt ? originalName.slice(0, dot) : originalName;
  const ext = hasExt ? originalName.slice(dot) : '';
  const suffix = t('copySuffix');

  let candidate = base + ' ' + suffix + ext;
  let counter = 2;
  const names = new Set(files.map(file => file.name));

  while (names.has(candidate)) {
    candidate = base + ' ' + suffix + ' ' + counter + ext;
    counter++;
  }
  return candidate;
}

function renameNotebook(idx) {
  const file = files[idx];
  if (!file) return;
  syncActiveFileContent();
  const nextName = prompt(t('renamePrompt'), file.name);
  if (nextName === null) return;

  const cleanName = nextName.trim().slice(0, 255);
  if (!cleanName || cleanName === file.name) return;

  file.name = cleanName;
  saveNow();
  renderTabs();
}

function duplicateNotebook(idx) {
  const file = files[idx];
  if (!file) return;
  syncActiveFileContent();

  const copy = {
    name: uniqueCopyName(file.name),
    content: file.content
  };

  files.splice(idx + 1, 0, copy);
  activeIdx = idx + 1;
  saveNow();
  renderTabs();
  replaceEditorContent(copy.content);
}

function reorderNotebooks(from, to) {
  if (from === to || from < 0 || to < 0 || from >= files.length || to >= files.length) return;
  syncActiveFileContent();

  const activeFile = files[activeIdx];
  const moved = files.splice(from, 1)[0];
  files.splice(to, 0, moved);
  activeIdx = files.indexOf(activeFile);

  saveNow();
  renderTabs();
}

function hideTabContextMenu() {
  const menu = document.getElementById('tab-context-menu');
  if (!menu) return;
  menu.classList.remove('active');
  menu.setAttribute('aria-hidden', 'true');
  contextTabIndex = -1;
}

function showTabContextMenu(idx, x, y) {
  const menu = document.getElementById('tab-context-menu');
  if (!menu) return;

  contextTabIndex = idx;
  menu.classList.add('active');
  menu.setAttribute('aria-hidden', 'false');
  menu.style.left = '0px';
  menu.style.top = '0px';

  requestAnimationFrame(() => {
    const rect = menu.getBoundingClientRect();
    const left = Math.max(8, Math.min(x, window.innerWidth - rect.width - 8));
    const top = Math.max(8, Math.min(y, window.innerHeight - rect.height - 8));
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
  });
}

function renderTabs() {
  const container = document.getElementById('file-tabs');
  container.innerHTML = '';

  files.forEach((f, i) => {
    const tab = document.createElement('div');
    tab.className = 'file-tab' + (i === activeIdx ? ' active' : '');
    tab.draggable = true;
    tab.dataset.index = String(i);

    const nameEl = document.createElement('span');
    nameEl.className = 'name';
    nameEl.textContent = f.name;
    nameEl.title = f.name;

    const closeEl = document.createElement('span');
    closeEl.className = 'tab-close';
    closeEl.textContent = '×';
    closeEl.title = currentLang === 'tr' ? 'Kapat' : 'Close';

    tab.appendChild(nameEl);
    tab.appendChild(closeEl);

    tab.addEventListener('click', () => switchTo(i));
    nameEl.addEventListener('dblclick', event => {
      event.stopPropagation();
      renameNotebook(i);
    });
    closeEl.addEventListener('click', event => {
      event.stopPropagation();
      closeFile(i);
    });

    tab.addEventListener('contextmenu', event => {
      event.preventDefault();
      event.stopPropagation();
      showTabContextMenu(i, event.clientX, event.clientY);
    });

    tab.addEventListener('dragstart', event => {
      draggingTabIndex = i;
      tab.classList.add('dragging');
      hideTabContextMenu();
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(i));
      }
    });
    tab.addEventListener('dragover', event => {
      if (draggingTabIndex < 0 || draggingTabIndex === i) return;
      event.preventDefault();
      tab.classList.add('drag-over');
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    });
    tab.addEventListener('dragleave', () => tab.classList.remove('drag-over'));
    tab.addEventListener('drop', event => {
      event.preventDefault();
      tab.classList.remove('drag-over');
      if (draggingTabIndex >= 0) reorderNotebooks(draggingTabIndex, i);
      draggingTabIndex = -1;
    });
    tab.addEventListener('dragend', () => {
      draggingTabIndex = -1;
      document.querySelectorAll('.file-tab').forEach(el => {
        el.classList.remove('dragging', 'drag-over');
      });
    });

    container.appendChild(tab);
  });
}

function switchTo(idx) {
  if (!files[idx]) return;
  if (view) {
    syncActiveFileContent();
    saveNow();
  }
  activeIdx = idx;
  renderTabs();
  replaceEditorContent(files[activeIdx].content);
}

document.getElementById('tab-context-menu')?.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button || contextTabIndex < 0) return;

  const idx = contextTabIndex;
  const action = button.dataset.action;
  hideTabContextMenu();

  if (action === 'rename') renameNotebook(idx);
  if (action === 'duplicate') duplicateNotebook(idx);
});

document.addEventListener('click', event => {
  if (!event.target.closest('#tab-context-menu')) hideTabContextMenu();
});
window.addEventListener('resize', hideTabContextMenu);
window.addEventListener('scroll', hideTabContextMenu, true);

let pendingNewFileContent = '';

function newFile(initialContent) {
  pendingNewFileContent = typeof initialContent === 'string' ? initialContent : '';
  const modal = document.getElementById('new-file-modal');
  const input = document.getElementById('new-file-input');
  input.value = `notebook${files.length + 1}.math`;
  modal.classList.add('active');
  input.focus();
  input.select();
}

function openExamplesNotebook() {
  newFile(getDefaultContent());
  const input = document.getElementById('new-file-input');
  input.value = t('examplesFileName');
  input.select();
}

document.getElementById('examples-btn')?.addEventListener('click', openExamplesNotebook);

function confirmNewFile() {
  const input = document.getElementById('new-file-input');
  const name = input.value.trim();
  if (name) {
    files.push({ name, content: pendingNewFileContent });
    pendingNewFileContent = '';
    saveNow();
    switchTo(files.length - 1);
  }
  document.getElementById('new-file-modal').classList.remove('active');
}

document.getElementById('modal-cancel').addEventListener('click', () => {
  document.getElementById('new-file-modal').classList.remove('active');
});
document.getElementById('modal-confirm').addEventListener('click', confirmNewFile);
document.getElementById('new-file-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') confirmNewFile();
  if (e.key === 'Escape') document.getElementById('new-file-modal').classList.remove('active');
});

// ── Notebook search ────────────────────────────────────────────────────────────
const SEARCH_RESULT_LIMIT = 100;

function collectNotebookSearchResults(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  syncActiveFileContent();
  const results = [];

  files.forEach((file, fileIndex) => {
    if (results.length >= SEARCH_RESULT_LIMIT) return;

    if (file.name.toLowerCase().includes(q)) {
      const firstLine = file.content.split('\n').find(line => line.trim()) || file.name;
      results.push({
        fileIndex,
        lineNumber: 1,
        snippet: firstLine.trim() || file.name,
        fileName: file.name
      });
    }

    const lines = file.content.split('\n');
    for (let i = 0; i < lines.length && results.length < SEARCH_RESULT_LIMIT; i++) {
      if (!lines[i].toLowerCase().includes(q)) continue;
      results.push({
        fileIndex,
        lineNumber: i + 1,
        snippet: lines[i].trim() || ' ',
        fileName: file.name
      });
    }
  });

  return results;
}

function closeNotebookSearch() {
  document.getElementById('search-modal')?.classList.remove('active');
}

function jumpToSearchResult(fileIndex, lineNumber, query) {
  closeNotebookSearch();
  switchTo(fileIndex);
  if (!view) return;

  const safeLine = Math.max(1, Math.min(lineNumber, view.state.doc.lines));
  const line = view.state.doc.line(safeLine);
  const q = query.trim().toLowerCase();
  const offset = q ? line.text.toLowerCase().indexOf(q) : -1;
  const from = offset >= 0 ? line.from + offset : line.from;
  const to = offset >= 0 ? from + q.length : from;

  view.dispatch({
    selection: { anchor: from, head: to },
    effects: EditorView.scrollIntoView(from, { y: 'center' })
  });
  view.focus();
}

function renderNotebookSearchResults(query) {
  const container = document.getElementById('notebook-search-results');
  const countEl = document.getElementById('search-result-count');
  if (!container || !countEl) return;

  container.innerHTML = '';
  const cleanQuery = query.trim();

  if (!cleanQuery) {
    const empty = document.createElement('div');
    empty.className = 'search-empty';
    empty.textContent = t('searchEmpty');
    container.appendChild(empty);
    countEl.textContent = '';
    return;
  }

  const results = collectNotebookSearchResults(cleanQuery);
  countEl.textContent = results.length + ' ' + t('searchResults');

  if (!results.length) {
    const empty = document.createElement('div');
    empty.className = 'search-empty';
    empty.textContent = t('searchNoResults');
    container.appendChild(empty);
    return;
  }

  results.forEach(result => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'search-result';

    const meta = document.createElement('div');
    meta.className = 'search-result-meta';
    meta.textContent = result.fileName + ' · ' + t('searchLine') + ' ' + result.lineNumber;

    const snippet = document.createElement('div');
    snippet.className = 'search-result-snippet';
    snippet.textContent = result.snippet;

    button.appendChild(meta);
    button.appendChild(snippet);
    button.addEventListener('click', () => {
      jumpToSearchResult(result.fileIndex, result.lineNumber, cleanQuery);
    });

    container.appendChild(button);
  });
}

function openNotebookSearch() {
  syncActiveFileContent();
  const modal = document.getElementById('search-modal');
  const input = document.getElementById('notebook-search-input');
  if (!modal || !input) return;

  hideTabContextMenu();
  modal.classList.add('active');
  input.value = '';
  renderNotebookSearchResults('');
  requestAnimationFrame(() => input.focus());
}

document.getElementById('search-btn')?.addEventListener('click', openNotebookSearch);
document.getElementById('notebook-search-input')?.addEventListener('input', event => {
  renderNotebookSearchResults(event.target.value);
});
document.getElementById('notebook-search-input')?.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeNotebookSearch();
  } else if (event.key === 'Enter') {
    const first = document.querySelector('#notebook-search-results .search-result');
    if (first) {
      event.preventDefault();
      first.click();
    }
  }
});
document.getElementById('search-modal')?.addEventListener('click', event => {
  if (event.target === document.getElementById('search-modal')) closeNotebookSearch();
});

document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    openNotebookSearch();
    return;
  }
  if (event.key === 'Escape') {
    hideTabContextMenu();
    closeNotebookSearch();
  }
});

// ── Export ────────────────────────────────────────────────────────────────────
document.getElementById('export-btn').addEventListener('click', () => {
  document.getElementById('export-modal').classList.add('active');
});
document.getElementById('export-cancel').addEventListener('click', () => {
  document.getElementById('export-modal').classList.remove('active');
});
document.getElementById('export-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('export-modal'))
    document.getElementById('export-modal').classList.remove('active');
});

// ── Info Modal ──────────────────────────────────────────────────────────────────
document.getElementById('info-btn').addEventListener('click', () => {
  document.getElementById('info-modal').classList.add('active');
});
document.getElementById('info-cancel').addEventListener('click', () => {
  document.getElementById('info-modal').classList.remove('active');
});
document.getElementById('info-close-top').addEventListener('click', () => {
  document.getElementById('info-modal').classList.remove('active');
});
document.getElementById('info-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('info-modal'))
    document.getElementById('info-modal').classList.remove('active');
});

function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob), download: filename
  });
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

// ── Connectivity status ────────────────────────────────────────────────────────
function updateConnectivityStatus() {
  const status = document.getElementById('connection-status');
  const label = document.getElementById('connection-status-text');
  if (!status || !label) return;

  const online = navigator.onLine;
  status.classList.toggle('offline', !online);
  status.title = t(online ? 'onlineTitle' : 'offlineTitle');
  label.textContent = t(online ? 'online' : 'offline');
}

window.addEventListener('online', updateConnectivityStatus);
window.addEventListener('offline', updateConnectivityStatus);
updateConnectivityStatus();

// ── Full backup / restore ─────────────────────────────────────────────────────
const BACKUP_FORMAT = 'mathnote-backup';
const BACKUP_VERSION = 1;

function createBackupPayload() {
  if (view && files[activeIdx]) {
    files[activeIdx].content = view.state.doc.toString();
  }
  saveNow();

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    files: files.map(file => ({ name: file.name, content: file.content })),
    activeIndex: activeIdx,
    preferences: {
      language: currentLang,
      zoom: localStorage.getItem('mathnotebook_zoom'),
      sidebarWidth: localStorage.getItem('mathnotebook_sidebar_width')
    }
  };
}

function exportFullBackup() {
  const payload = createBackupPayload();
  const date = payload.exportedAt.slice(0, 10);
  const filename = `${t('backupFileName')}-${date}.json`;
  downloadBlob(JSON.stringify(payload, null, 2), filename, 'application/json;charset=utf-8');
  document.getElementById('backup-modal')?.classList.remove('active');
}

function normalizeBackup(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  if (raw.format !== BACKUP_FORMAT || raw.version !== BACKUP_VERSION) return null;
  if (!Array.isArray(raw.files) || raw.files.length === 0) return null;

  const restoredFiles = [];
  for (const file of raw.files) {
    if (!file || typeof file !== 'object') return null;
    if (typeof file.name !== 'string' || typeof file.content !== 'string') return null;
    const name = file.name.trim();
    if (!name || name.length > 255) return null;
    restoredFiles.push({ name, content: file.content });
  }

  const requestedIndex = Number.isInteger(raw.activeIndex) ? raw.activeIndex : 0;
  return {
    files: restoredFiles,
    activeIndex: Math.max(0, Math.min(requestedIndex, restoredFiles.length - 1)),
    preferences: raw.preferences && typeof raw.preferences === 'object' ? raw.preferences : {}
  };
}

function applyBackup(backup) {
  files = backup.files;
  activeIdx = backup.activeIndex;

  const prefs = backup.preferences;
  if (prefs.language && translations[prefs.language]) {
    currentLang = prefs.language;
  }

  saveNow();
  renderTabs();
  replaceEditorContent(files[activeIdx].content);
  setLanguage(currentLang);

  if (typeof prefs.zoom === 'string' && /^\d+$/.test(prefs.zoom)) {
    const restoredZoom = parseInt(prefs.zoom, 10);
    if (Number.isFinite(restoredZoom)) {
      zoomLevel = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, restoredZoom));
      applyZoom();
    }
  }

  if (typeof prefs.sidebarWidth === 'string' && /^\d+(?:\.\d+)?$/.test(prefs.sidebarWidth)) {
    const restoredWidth = parseFloat(prefs.sidebarWidth);
    const maxWidth = Math.floor(document.body.clientWidth / 2);
    if (Number.isFinite(restoredWidth) && maxWidth > 150) {
      const width = Math.max(151, Math.min(restoredWidth, maxWidth - 1));
      sidebar.style.width = width + 'px';
      localStorage.setItem(SIDEBAR_WIDTH_KEY, String(width));
    }
  }

  document.getElementById('backup-modal')?.classList.remove('active');
  alert(t('backupRestored'));
}

function importFullBackup(file) {
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    try {
      const parsed = JSON.parse(String(reader.result || ''));
      const backup = normalizeBackup(parsed);
      if (!backup) {
        alert(t('backupInvalid'));
        return;
      }
      if (!confirm(t('backupConfirmRestore'))) return;
      applyBackup(backup);
    } catch {
      alert(t('backupInvalid'));
    } finally {
      document.getElementById('backup-file-input').value = '';
    }
  });
  reader.addEventListener('error', () => {
    alert(t('backupReadError'));
    document.getElementById('backup-file-input').value = '';
  });
  reader.readAsText(file);
}

document.getElementById('backup-btn')?.addEventListener('click', () => {
  document.getElementById('backup-modal')?.classList.add('active');
});
document.getElementById('backup-close')?.addEventListener('click', () => {
  document.getElementById('backup-modal')?.classList.remove('active');
});
document.getElementById('backup-modal')?.addEventListener('click', event => {
  if (event.target === document.getElementById('backup-modal')) {
    document.getElementById('backup-modal')?.classList.remove('active');
  }
});
document.getElementById('backup-export-btn')?.addEventListener('click', exportFullBackup);
document.getElementById('backup-import-btn')?.addEventListener('click', () => {
  document.getElementById('backup-file-input')?.click();
});
document.getElementById('backup-file-input')?.addEventListener('change', event => {
  const [file] = event.target.files || [];
  if (file) importFullBackup(file);
});

function editorContentToMarkdown(raw) {
  const lines = raw.split('\n');
  const out = [];
  let inCodeBlock = false;

  const closeBlock = () => {
    if (inCodeBlock) { out.push('```'); inCodeBlock = false; }
  };

  for (const line of lines) {
    const tr = line.trim();
    if (!tr) {
      closeBlock();
      out.push('');
    } else if (tr.startsWith('#')) {
      closeBlock();
      out.push(`## ${tr.slice(1).trim()}`);
    } else {
      if (!inCodeBlock) { out.push('```'); inCodeBlock = true; }
      out.push(line);
    }
  }
  closeBlock();
  return out.join('\n');
}

function editorContentToLatex(raw, docName) {
  const lines = raw.split('\n');
  let body = '';
  for (const line of lines) {
    const tr = line.trim();
    if (!tr) { body += '\n'; continue; }
    if (tr.startsWith('#')) {
      body += `\\section*{${tr.slice(1).trim()}}\n`;
    } else if (/(?<![=!<>])=(?!=)/.test(tr)) {
      body += `\\[ ${tr} \\]\n`;
    } else {
      body += `\\[ ${tr} \\]\n`;
    }
  }
  return [
    '\\documentclass{article}',
    '\\usepackage{amsmath}',
    `\\title{${docName}}`,
    '\\date{}',
    '\\begin{document}',
    '\\maketitle',
    body,
    '\\end{document}'
  ].join('\n');
}

function exportAsPDF(raw, docName) {
  const lines = raw.split('\n');
  let htmlBody = '';
  for (const line of lines) {
    const tr = line.trim();
    if (!tr) { htmlBody += '<br>'; continue; }
    if (tr.startsWith('#')) {
      htmlBody += `<h2>${tr.slice(1).trim()}</h2>`;
    } else {
      htmlBody += `<div class="expr">${tr.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</div>`;
    }
  }
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head>
<meta charset="utf-8"><title>${docName}</title>
<style>
  body { font-family: 'Georgia', serif; max-width: 700px; margin: 40px auto; color: #222; }
  h2 { font-size: 1.2em; color: #1971c2; border-bottom: 1px solid #dee2e6; padding-bottom: 4px; margin-top: 24px; }
  .expr { font-family: monospace; font-size: 1em; margin: 6px 0; padding: 4px 8px; background: #f8f9fa; border-radius: 4px; }
  @media print { body { margin: 20px; } }
</style></head><body>
<h1 style="font-size:1.4em;margin-bottom:8px;">${docName}</h1>
${htmlBody}
<script>window.onload=()=>window.print();<\/script>
</body></html>`);
  win.document.close();
}

document.getElementById('export-confirm').addEventListener('click', () => {
  const fmt = document.querySelector('input[name="export-fmt"]:checked')?.value ?? 'text';
  const raw = view ? view.state.doc.toString() : (files[activeIdx]?.content || '');
  const baseName = (files[activeIdx]?.name || 'mathnote').replace(/\.math$/, '');
  document.getElementById('export-modal').classList.remove('active');

  if (fmt === 'text') {
    downloadBlob(raw, baseName + '.txt', 'text/plain;charset=utf-8');
  } else if (fmt === 'markdown') {
    downloadBlob(editorContentToMarkdown(raw), baseName + '.md', 'text/markdown;charset=utf-8');
  } else if (fmt === 'latex') {
    downloadBlob(editorContentToLatex(raw, baseName), baseName + '.tex', 'text/plain;charset=utf-8');
  } else if (fmt === 'pdf') {
    exportAsPDF(raw, baseName);
  }
});

let closedNotebook = null;
let undoCloseTimer = null;

function hideUndoCloseToast() {
  const toast = document.getElementById('undo-toast');
  if (!toast) return;
  toast.classList.remove('active');
  toast.setAttribute('aria-hidden', 'true');
  if (undoCloseTimer !== null) {
    clearTimeout(undoCloseTimer);
    undoCloseTimer = null;
  }
}

function showUndoCloseToast(file, index) {
  closedNotebook = { file, index };
  const toast = document.getElementById('undo-toast');
  const text = document.getElementById('undo-toast-text');
  if (!toast || !text) return;

  text.textContent = file.name + ' — ' + t('notebookClosed');
  toast.classList.add('active');
  toast.setAttribute('aria-hidden', 'false');

  if (undoCloseTimer !== null) clearTimeout(undoCloseTimer);
  undoCloseTimer = window.setTimeout(() => {
    closedNotebook = null;
    hideUndoCloseToast();
  }, 8000);
}

function undoCloseNotebook() {
  if (!closedNotebook) return;
  syncActiveFileContent();

  const insertAt = Math.max(0, Math.min(closedNotebook.index, files.length));
  files.splice(insertAt, 0, closedNotebook.file);
  activeIdx = insertAt;
  closedNotebook = null;

  saveNow();
  renderTabs();
  replaceEditorContent(files[activeIdx].content);
  hideUndoCloseToast();
}

function closeFile(idx) {
  if (files.length === 1) {
    alert(t('atLeastOneFile'));
    return;
  }

  syncActiveFileContent();
  const oldActiveIdx = activeIdx;
  const removed = files.splice(idx, 1)[0];
  if (!removed) return;

  if (idx < oldActiveIdx) {
    activeIdx = oldActiveIdx - 1;
  } else if (idx === oldActiveIdx) {
    activeIdx = Math.min(idx, files.length - 1);
  }

  saveNow();
  renderTabs();
  if (idx === oldActiveIdx) replaceEditorContent(files[activeIdx].content);
  showUndoCloseToast(removed, idx);
}

document.getElementById('undo-close-btn')?.addEventListener('click', undoCloseNotebook);

document.getElementById('new-tab-btn').addEventListener('click', newFile);

// ================================================================
// MATH EVALUATION
// ================================================================

// Find the index of the first "real" = (not ==, <=, >=, !=)
function findEqIndex(str) {
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '=') {
      const prev = i > 0 ? str[i - 1] : '';
      const next = i < str.length - 1 ? str[i + 1] : '';
      if (prev !== '<' && prev !== '>' && prev !== '!' && prev !== '=' && next !== '=')
        return i;
    }
  }
  return -1;
}

// Find inequality operator (>=, <=, >, <) — returns { op, idx } or null
function findIneqOp(str) {
  for (let i = 0; i < str.length - 1; i++) {
    if ((str[i] === '>' || str[i] === '<') && str[i + 1] === '=') {
      return { op: str.slice(i, i + 2), idx: i };
    }
  }
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '>' || str[i] === '<') {
      return { op: str[i], idx: i };
    }
  }
  return null;
}

function classifyLine(line) {
  const t = line.trim();
  if (!t) return 'empty';
  if (t.startsWith('#')) return 'comment';
  if (/^plot\s*\(/.test(t)) return 'plot';
  if (/^[a-zA-Z_]\w*\s*\([^)]*\)\s*=/.test(t)) return 'funcdef';
  if (/^[a-zA-Z_$][\w$]*\s*=/.test(t)) return 'assign';
  // Equation: has an = sign but LHS is not a valid assignment target
  const eqIdx = findEqIndex(t);
  if (eqIdx > 0 && t.slice(0, eqIdx).trim() && t.slice(eqIdx + 1).trim()) return 'equation';
  // Inequality: has >, <, >=, <=
  const ineq = findIneqOp(t);
  if (ineq && ineq.idx > 0 && t.slice(0, ineq.idx).trim() && t.slice(ineq.idx + ineq.op.length).trim()) return 'inequality';
  return 'expr';
}

// Solve an equation line and return structured result
function solveEquation(lineText, scope) {
  const t = lineText.trim();
  const eqIdx = findEqIndex(t);
  const lhs = t.slice(0, eqIdx).trim();
  const rhs = t.slice(eqIdx + 1).trim();
  const nd = typeof nerdamer !== 'undefined' ? nerdamer : null;

  // Collect ALL free variables in priority order
  const varRe = v => new RegExp(`(?<![a-zA-Z])${v}(?![a-zA-Z])`);
  const priorityVars = ['x', 'y', 't', 'n', 'k', 'z', 'a', 'b'];
  const freeVars = priorityVars.filter(v => varRe(v).test(t) && typeof scope[v] !== 'number');

  // Fallback: single-letter not in priority list
  if (freeVars.length === 0) {
    for (const v of (t.match(/(?<![a-zA-Z])[a-zA-Z](?![a-zA-Z])/g) || [])) {
      if (!['e', 'i'].includes(v) && typeof scope[v] !== 'number') {
        freeVars.push(v); break;
      }
    }
  }
  const eqVar = freeVars[0] || null;

  // Alternative form: lhs - rhs = 0
  let altForm = null;
  try {
    const diff = nd ? nd(`(${lhs})-(${rhs})`).expand().toString() : `(${lhs})-(${rhs})`;
    const cleaned = deNerdamify(diff, eqVar || 'x')
      .replace(/\*/g, '').replace(/\+\s*-/g, ' - ').replace(/^\s*-/, '-');
    altForm = cleaned + ' = 0';
  } catch { altForm = `(${lhs}) − (${rhs}) = 0`; }

  // ── Implicit equation: 2+ free variables ───────────────────────
  if (freeVars.length >= 2) {
    const [varX, varY] = freeVars;

    // Detect geometric figure first (used as fallback for branches below)
    const geoFig = detectGeometricFigure(lhs, rhs, varX, varY);

    // Solve for varY symbolically — expand first to help Nerdamer (e.g. 1^2 literals)
    let yBranches = null;
    if (nd) {
      try {
        let F = `(${lhs})-(${rhs})`;
        try { F = nd(F).expand().toString(); } catch {}
        const sol = nd.solve(F, varY);
        const s = sol.toString().trim();
        if (s.startsWith('[')) {
          const inner = s.slice(1, -1).trim();
          yBranches = inner ? splitTopLevelComma(inner).map(b => deNerdamify(b, varX)) : [];
        } else if (s && s !== '[]') {
          yBranches = [deNerdamify(s, varX)];
        } else {
          yBranches = [];
        }
      } catch {}
    }

    // Fallback: use polynomial coefficients (A,B,C,D,E,Fc) from geoFig to
    // construct y-branches via the quadratic formula when Nerdamer fails.
    if ((!yBranches || yBranches.length === 0) && geoFig && geoFig.coefs) {
      const { A, B, C, D, E, Fc } = geoFig.coefs;
      const eps2 = 1e-7;
      // Build clean polynomial string: coefs as decimals, drop near-zero terms
      const fmtC = n => {
        const r = Math.round(n * 1e6) / 1e6;
        return Number.isInteger(r) ? String(r) : r.toString();
      };
      // inner(x) = -(A*x^2 + D*x + Fc) / C  [when B≈0, E≈0]
      // General discriminant: E^2 - 4C*(A*x^2 + D*x + Fc)
      const polyTermStr = (coef, varPow) => {
        if (Math.abs(coef) < eps2) return null;
        const absC = Math.abs(coef), sign = coef < 0 ? '-' : '+';
        const cStr = Math.abs(absC - 1) < eps2 ? '' : fmtC(absC);
        return { sign, str: cStr + varPow };
      };
      const buildPoly = (k2, k1, k0) => {
        const parts = [
          polyTermStr(k2, `${varX}^2`),
          polyTermStr(k1, varX),
          polyTermStr(k0, '')
        ].filter(Boolean);
        if (!parts.length) return '0';
        let s = (parts[0].sign === '-' ? '-' : '') + parts[0].str;
        for (let i = 1; i < parts.length; i++) s += parts[i].sign + parts[i].str;
        return s;
      };

      if (Math.abs(C) > eps2) {
        if (Math.abs(B) < eps2 && Math.abs(E) < eps2) {
          // Simple case: C*y^2 + A*x^2 + D*x + Fc = 0  →  y = ±sqrt(inner)
          const inner = buildPoly(-A/C, -D/C, -Fc/C);
          if (inner !== '0') {
            yBranches = [`sqrt(${inner})`, `-sqrt(${inner})`];
          }
        } else {
          // General: quadratic formula y = (-E ± sqrt(disc)) / (2C)
          // disc = E^2 - 4C*(A*x^2 + D*x + Fc)
          const discK2 = -4*A*C + B*B;
          const discK1 = -4*C*D + 2*B*E;
          const discK0 = E*E - 4*C*Fc;
          const discStr = buildPoly(discK2, discK1, discK0);
          const denom = fmtC(2*C);
          const numBase = Math.abs(E) < eps2 ? '' : buildPoly(0, -B, -E);
          const mk = (sign) => {
            const num = numBase
              ? `(${numBase}${sign}sqrt(${discStr}))`
              : (sign === '+' ? `sqrt(${discStr})` : `-sqrt(${discStr})`);
            return `(${num})/(${denom})`;
          };
          yBranches = [mk('+'), mk('-')];
        }
      }
    }

    // Implicit derivatives: dy/dx and dx/dy
    let implicitDeriv = null, implicitDerivX = null;
    if (nd) {
      try {
        const F = `(${lhs})-(${rhs})`;
        const dFdxClean = deNerdamify(nd.diff(F, varX).toString(), varX);
        const dFdyClean = deNerdamify(nd.diff(F, varY).toString(), varY);
        let dydx = `-(${dFdxClean})/(${dFdyClean})`;
        let dxdy = `-(${dFdyClean})/(${dFdxClean})`;
        try { const s = nd.simplify(dydx).toString(); if (s) dydx = s; } catch {}
        try { const s = nd.simplify(dxdy).toString(); if (s) dxdy = s; } catch {}
        implicitDeriv  = dydx || null;
        implicitDerivX = dxdy || null;
      } catch {}
    }

    // Integer solutions: scan integer (x,y) pairs where F(x,y) ≈ 0
    const integerSolutions = [];
    try {
      const F = `(${lhs})-(${rhs})`;
      const range = 12;
      for (let xi = -range; xi <= range; xi++) {
        for (let yi = -range; yi <= range; yi++) {
          try {
            const val = +math.evaluate(F, { [varX]: xi, [varY]: yi });
            if (isFinite(val) && Math.abs(val) < 1e-6) {
              integerSolutions.push({ x: xi, y: yi });
            }
          } catch {}
        }
      }
    } catch {}

    return { lhs, rhs, eqVar: varX, altForm, solutions: null, solutionsNumeric: false,
             isImplicit: true, implicitVars: [varX, varY], yBranches,
             implicitDeriv, implicitDerivX, integerSolutions, geoFig };
  }

  // ── Single-variable equation ────────────────────────────────────
  let solutions = null, solutionsNumeric = false;
  if (eqVar) {
    if (nd) {
      try {
        const sol = nd.solve(`(${lhs})-(${rhs})`, eqVar);
        const s = sol.toString().trim();
        if (s.startsWith('[')) {
          const inner = s.slice(1, -1).trim();
          solutions = inner ? splitTopLevelComma(inner) : [];
        } else if (s && s !== '[]') {
          solutions = [s];
        } else {
          solutions = [];
        }
      } catch {}
    }
    if (!solutions || solutions.length === 0) {
      const numRs = findRootsNumerically(`(${lhs})-(${rhs})`, eqVar);
      solutions = numRs.map(r => {
        const rnd = Math.round(r);
        return Math.abs(r - rnd) < 1e-6 ? String(rnd) : r.toPrecision(6).replace(/\.?0+$/, '');
      });
      solutionsNumeric = solutions.length > 0;
    }
  }

  return { lhs, rhs, eqVar, solutions, solutionsNumeric, altForm };
}

function detectGeometricFigure(lhs, rhs, varX, varY) {
  try {
    const F = `(${lhs})-(${rhs})`;
    const ev = (x, y) => {
      try { return +math.evaluate(F, { [varX]: x, [varY]: y }); }
      catch { return NaN; }
    };
    const F00 = ev(0, 0);
    if (isNaN(F00)) return null;

    // Extract degree-≤2 polynomial coefficients via finite differences
    const Fc = F00;
    const D  = (ev(1,0)  - ev(-1,0))  / 2;
    const E  = (ev(0,1)  - ev(0,-1))  / 2;
    const A  = (ev(1,0)  + ev(-1,0))  / 2 - Fc;
    const C  = (ev(0,1)  + ev(0,-1))  / 2 - Fc;
    const B  = ev(1,1) - A - C - D - E - Fc;

    // Verify degree ≤ 2
    if (Math.abs(ev(2,0) - (4*A + 2*D + Fc)) > 0.02) return null;
    if (Math.abs(ev(0,2) - (4*C + 2*E + Fc)) > 0.02) return null;

    const eps = 1e-5;
    const z = n => Math.abs(n) < eps;

    const coefs = { A, B, C, D, E, Fc };

    if (z(A) && z(B) && z(C) && (!z(D) || !z(E)))
      return { type: 'line', coefs };

    if (!z(A) && Math.abs(A - C) < eps && z(B)) {
      const cx = -D / (2*A), cy = -E / (2*A);
      const r2 = cx*cx + cy*cy - Fc/A;
      if (r2 > eps) return { type: 'circle', cx, cy, r: Math.sqrt(r2), coefs };
      if (z(r2))   return { type: 'point', cx, cy, coefs };
    }

    if (!z(A) || !z(C)) {
      const disc = B*B - 4*A*C;
      if (disc < -eps) return { type: 'ellipse', coefs };
      if (z(disc))    return { type: 'parabola', coefs };
      return { type: 'hyperbola', coefs };
    }
    return null;
  } catch { return null; }
}

// Format inequality solution intervals as a human-readable string
function formatInequalitySolution(v, intervals, strict) {
  const noSol = currentLang === 'tr' ? 'Çözüm yok' : 'No solution';
  if (intervals.length === 0) return noSol;

  const fmtBound = n => {
    const r = Math.round(n * 1e8) / 1e8;
    if (Number.isInteger(r)) return String(r);
    return parseFloat(r.toPrecision(5)).toString();
  };

  const allReals = currentLang === 'tr' ? 'tüm gerçel sayılar' : 'all real numbers';
  const orWord = currentLang === 'tr' ? 'veya' : 'or';

  const parts = intervals.map(({ lo, hi, loIncl, hiIncl }) => {
    const loInf = !isFinite(lo), hiInf = !isFinite(hi);
    if (loInf && hiInf) return allReals;
    if (loInf) return `${v} ${hiIncl ? '≤' : '<'} ${fmtBound(hi)}`;
    if (hiInf) return `${v} ${loIncl ? '≥' : '>'} ${fmtBound(lo)}`;
    return `${fmtBound(lo)} ${loIncl ? '≤' : '<'} ${v} ${hiIncl ? '≤' : '<'} ${fmtBound(hi)}`;
  });

  return parts.join(`  ${orWord}  `);
}

// Solve an inequality line (lhs op rhs) and return structured result
function solveInequality(lineText, scope) {
  const t = lineText.trim();
  const ineq = findIneqOp(t);
  const ineqOpNotFound = currentLang === 'tr' ? 'Eşitsizlik operatörü bulunamadı' : 'Inequality operator not found';
  const cannotEval = currentLang === 'tr' ? 'Değerlendirilemedi' : 'Cannot evaluate';
  
  if (!ineq) return { error: ineqOpNotFound };

  const { op, idx } = ineq;
  const lhs = t.slice(0, idx).trim();
  const rhs = t.slice(idx + op.length).trim();

  // Detect variable — same approach as solveEquation
  let eqVar = null;
  const varRe = v => new RegExp(`(?<![a-zA-Z])${v}(?![a-zA-Z])`);
  for (const v of ['x', 'y', 't', 'n', 'k', 'z', 'a', 'b']) {
    if (varRe(v).test(t) && typeof scope[v] !== 'number') { eqVar = v; break; }
  }
  if (!eqVar) {
    for (const v of (t.match(/(?<![a-zA-Z])[a-zA-Z](?![a-zA-Z])/g) || [])) {
      if (!['e', 'i'].includes(v) && typeof scope[v] !== 'number') { eqVar = v; break; }
    }
  }

  // No variable → evaluate as boolean
  if (!eqVar) {
    try {
      const lv = math.evaluate(lhs, scope), rv = math.evaluate(rhs, scope);
      const boolResult = op === '>' ? lv > rv : op === '<' ? lv < rv
        : op === '>=' ? lv >= rv : lv <= rv;
      return { lhs, rhs, op, eqVar: null, boolResult };
    } catch {}
    return { lhs, rhs, op, eqVar: null, error: cannotEval };
  }

  const v = eqVar;
  const strict = op === '>' || op === '<';

  // Find boundary points: roots of f(x) = lhs - rhs
  const boundary = findRootsNumerically(`(${lhs})-(${rhs})`, v)
    .map(r => Math.round(r * 1e8) / 1e8)
    .sort((a, b) => a - b);

  // Test points: one in each interval between consecutive roots
  const testPoints = [];
  if (boundary.length === 0) {
    testPoints.push(0);
  } else {
    testPoints.push(boundary[0] - 1);
    for (let i = 0; i < boundary.length - 1; i++) {
      testPoints.push((boundary[i] + boundary[i + 1]) / 2);
    }
    testPoints.push(boundary[boundary.length - 1] + 1);
  }

  const satisfies = x => {
    try {
      const lv = math.evaluate(lhs, mkScope(v, x));
      const rv = math.evaluate(rhs, mkScope(v, x));
      return op === '>' ? lv > rv : op === '<' ? lv < rv
        : op === '>=' ? lv >= rv : lv <= rv;
    } catch { return false; }
  };

  const intervals = [];
  for (let i = 0; i < testPoints.length; i++) {
    if (satisfies(testPoints[i])) {
      const lo = i === 0 ? -Infinity : boundary[i - 1];
      const hi = i === testPoints.length - 1 ? Infinity : boundary[i];
      intervals.push({
        lo, hi,
        loIncl: !strict && isFinite(lo),
        hiIncl: !strict && isFinite(hi),
      });
    }
  }

  const solutionStr = formatInequalitySolution(v, intervals, strict);
  return { lhs, rhs, op, eqVar: v, boundary, intervals, solutionStr };
}

function parsePlotArgs(line) {
  const m = line.trim().match(/^plot\s*\(([\s\S]*)\)\s*$/);
  if (!m) return [];
  const str = m[1];
  const parts = [];
  let depth = 0, start = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (c === ',' && depth === 0) {
      parts.push(str.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(str.slice(start).trim());
  return parts.filter(Boolean);
}

function fmtVal(v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'function') return '(fonksiyon)';
  try {
    // Check if it's a math.js unit
    if (v && typeof v === 'object' && v.isUnit) {
      return v.format({ precision: 8 });
    }
    if (v && typeof v === 'object' && v.isNode) return v.toString();
    const s = math.format(v, { precision: 8 });
    return s;
  } catch {
    return String(v);
  }
}

function isUnit(v) {
  return v && typeof v === 'object' && v.isUnit;
}

function fmtValHTML(v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'function') return '(fonksiyon)';
  try {
    // Check if it's a math.js unit - highlight units in orange
    if (v && typeof v === 'object' && v.isUnit) {
      const formatted = v.format({ precision: 8 });
      // Try to separate value and unit for styling
      const match = formatted.match(/^([\d\.\-\+e]+)\s*(.+)$/);
      if (match) {
        const [, value, unit] = match;
        return `<span style="font-weight:700">${esc(value)}</span> <span style="color:#d9480f; font-weight:600">${esc(unit)}</span>`;
      }
      return `<span style="color:#d9480f; font-weight:600">${esc(formatted)}</span>`;
    }
    if (v && typeof v === 'object' && v.isNode) return esc(v.toString());
    const s = math.format(v, { precision: 8 });
    return esc(s);
  } catch {
    return esc(String(v));
  }
}

/**
 * Pre-process a line before sending to math.js.
 * Handles complex function definitions like f(x+2)=x^(-2)+1
 * by transforming them into standard form: f(t)=(t-2)^(-2)+1
 */
function preProcessLine(line) {
  // Match: name(complex_arg) = rhs  where complex_arg contains operators
  const m = line.match(/^([a-zA-Z_]\w*)\s*\(([^)]+)\)\s*=\s*(.+)$/);
  if (!m) return line;

  const [, fname, argExpr, rhs] = m;

  // Check if the argument is already a simple variable (e.g. "x", "t")
  if (/^[a-zA-Z_]\w*$/.test(argExpr.trim())) return line;

  // Find which variable is used in the argument expression
  // Extract all variable names from the argument
  const argVars = argExpr.match(/[a-zA-Z_]\w*/g);
  if (!argVars || argVars.length === 0) return line;

  // Use the first variable found as the "inner" variable
  const innerVar = argVars[0];

  // Pick a fresh parameter name that doesn't collide
  let paramName = '_t';
  const allText = argExpr + rhs;
  while (allText.includes(paramName)) paramName = '_' + paramName;

  // Solve: paramName = argExpr  →  innerVar = ?
  // We need to express innerVar in terms of paramName.
  // Use math.js to solve: argExpr - paramName = 0 for innerVar
  try {
    // Build the inverse: if argExpr = "x+2", then x = paramName - 2
    // We use nerdamer if available for symbolic solve, otherwise simple linear solve
    let inverseExpr = null;

    const nd = (typeof nerdamer !== 'undefined') ? nerdamer : null;
    if (nd) {
      try {
        const eq = nd(`${argExpr} - ${paramName}`);
        const sol = nd.solve(eq, innerVar);
        const solStr = sol.toString().trim();
        if (solStr.startsWith('[') && solStr.endsWith(']')) {
          const inner = solStr.slice(1, -1).trim();
          if (inner) inverseExpr = inner.split(',')[0].trim();
        } else if (solStr) {
          inverseExpr = solStr;
        }
      } catch {}
    }

    // Fallback: try simple linear patterns manually
    if (!inverseExpr) {
      // Pattern: x + c  →  _t - c
      const addMatch = argExpr.trim().match(/^([a-zA-Z_]\w*)\s*\+\s*(.+)$/);
      if (addMatch && addMatch[1] === innerVar) {
        inverseExpr = `${paramName}-(${addMatch[2]})`;
      }
      // Pattern: x - c  →  _t + c
      const subMatch = argExpr.trim().match(/^([a-zA-Z_]\w*)\s*-\s*(.+)$/);
      if (!inverseExpr && subMatch && subMatch[1] === innerVar) {
        inverseExpr = `${paramName}+(${subMatch[2]})`;
      }
      // Pattern: c * x  →  _t / c
      const mulMatch = argExpr.trim().match(/^(.+)\s*\*\s*([a-zA-Z_]\w*)$/);
      if (!inverseExpr && mulMatch && mulMatch[2] === innerVar) {
        inverseExpr = `${paramName}/(${mulMatch[1]})`;
      }
      // Pattern: x * c  →  _t / c
      const mulMatch2 = argExpr.trim().match(/^([a-zA-Z_]\w*)\s*\*\s*(.+)$/);
      if (!inverseExpr && mulMatch2 && mulMatch2[1] === innerVar) {
        inverseExpr = `${paramName}/(${mulMatch2[2]})`;
      }
    }

    if (!inverseExpr) return line; // Can't solve → pass as-is

    // Now substitute innerVar with inverseExpr in the RHS
    const reg = new RegExp('\\b' + innerVar + '\\b', 'g');
    const newRhs = rhs.replace(reg, `(${inverseExpr})`);

    return `${fname}(${paramName}) = ${newRhs}`;
  } catch {
    return line;
  }
}

function evalAll(content) {
  const lines = content.split('\n');
  const scope = {};
  const lineResults = [];
  const varLines = {};
  const plots = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ln = i + 1;
    const type = classifyLine(line);

    if (type === 'empty' || type === 'comment') {
      lineResults.push({ type });
      continue;
    }
    if (type === 'plot') {
      const exprs = parsePlotArgs(line);
      lineResults.push({ type: 'plot', exprs });
      plots.push({ exprs, line: ln });
      continue;
    }

    if (type === 'equation') {
      lineResults.push({ type: 'equation', ...solveEquation(line, scope) });
      continue;
    }

    if (type === 'inequality') {
      lineResults.push({ type: 'inequality', ...solveInequality(line, scope) });
      continue;
    }

    try {
      const processed = preProcessLine(line.trim());
      const val = math.evaluate(processed, scope);
      
      let name = null;
      if (type === 'assign' || type === 'funcdef') {
        const m = line.trim().match(/^([a-zA-Z_$][\w$]*)\s*(?:\([^)]*\))?\s*=/);
        if (m) {
          name = m[1];
          varLines[name] = { ln, text: line.trim() };
        }
      }
      lineResults.push({ type, val, name });
    } catch (err) {
      lineResults.push({ type: 'error', val: err.message });
    }
  }

  const vars = {}, funcs = {};
  for (const [k, v] of Object.entries(scope)) {
    const info = varLines[k] || { ln: 0, text: '' };
    if (typeof v === 'function') funcs[k] = { val: v, line: info.ln, text: info.text };
    else vars[k] = { val: v, line: info.ln, text: info.text };
  }

  return { lineResults, vars, funcs, plots };
}

// ================================================================
// SIDEBAR
// ================================================================


function renderSidebar(vars, funcs, plots) {
  // Bileşenler sekmesi kaldırıldı.
}

// ================================================================
// RESIZER
// ================================================================

const resizer = document.getElementById('resizer');
const sidebar = document.getElementById('sidebar');

const SIDEBAR_WIDTH_KEY = 'mathnotebook_sidebar_width';
let savedWidth = localStorage.getItem(SIDEBAR_WIDTH_KEY);
if (savedWidth) {
  sidebar.style.width = savedWidth + 'px';
} else {
  sidebar.style.width = Math.floor(window.innerWidth / 2) + 'px';
}

let isResizing = false;

resizer.addEventListener('mousedown', (e) => {
  isResizing = true;
  resizer.classList.add('resizing');
  document.body.style.cursor = 'col-resize';
  e.preventDefault(); // prevent text selection
});

document.addEventListener('mousemove', (e) => {
  if (!isResizing) return;
  const newWidth = document.body.clientWidth - e.clientX;
  const maxW = Math.floor(document.body.clientWidth / 2);
  if (newWidth > 150 && newWidth < maxW) {
    sidebar.style.width = newWidth + 'px';
  }
});

document.addEventListener('mouseup', () => {
  if (isResizing) {
    isResizing = false;
    resizer.classList.remove('resizing');
    document.body.style.cursor = '';
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebar.style.width.replace('px', ''));
  }
});

window.gotoLine = function(ln) {
  if (!view) return;
  const line = view.state.doc.line(ln);
  view.dispatch({
    selection: { anchor: line.from },
    effects: EditorView.scrollIntoView(line.from, { y: 'center' })
  });
  view.focus();
};

// ================================================================
// CODEMIRROR DECORATIONS
// ================================================================

const evalEffect = StateEffect.define();

const evalField = StateField.define({
  create: () => ({ lineResults: [], vars: {}, funcs: {} }),
  update(val, tr) {
    for (const e of tr.effects) {
      if (e.is(evalEffect)) return e.value;
    }
    return val;
  }
});

// Result widget (inline, end of line)
class ResultWidget extends WidgetType {
  constructor(text, cls, isUnit = false) { 
    super(); 
    this.text = text; 
    this.cls = cls;
    this.isUnit = isUnit;
  }

  toDOM() {
    const el = document.createElement('span');
    el.className = `cm-result cm-r-${this.cls}`;
    
    if (this.isUnit) {
      // Split text to highlight only the unit part
      // Pattern: optional "var = " then "value unit"
      const parts = this.text.split('=');
      if (parts.length > 1) {
        const lhs = parts[0];
        const rhs = parts.slice(1).join('=');
        const rhsMatch = rhs.match(/^(\s*[\d\.\-\+e]+)\s*(.+)$/);
        if (rhsMatch) {
          el.innerHTML = `${esc(lhs)}=${esc(rhsMatch[1])} <span class="cm-unit">${esc(rhsMatch[2])}</span>`;
        } else {
          el.innerHTML = `${esc(lhs)}=<span class="cm-unit">${esc(rhs)}</span>`;
        }
      } else {
        const match = this.text.match(/^(\s*[\d\.\-\+e]+)\s*(.+)$/);
        if (match) {
          el.innerHTML = `${esc(match[1])} <span class="cm-unit">${esc(match[2])}</span>`;
        } else {
          el.innerHTML = `<span class="cm-unit">${esc(this.text)}</span>`;
        }
      }
    } else {
      el.textContent = this.text;
    }
    return el;
  }

  eq(o) { return o.text === this.text && o.cls === this.cls && o.isUnit === this.isUnit; }
}

const PLOT_W = 430, PLOT_H = 260;

// Plot widget (block, below line)
class PlotWidget extends WidgetType {
  constructor(exprs) {
    super();
    this.exprs = exprs;
    this.key = exprs.join('||');
  }

  toDOM() {
    const wrap = document.createElement('div');
    wrap.className = 'plot-widget';

    const inner = document.createElement('div');
    inner.style.width = PLOT_W + 'px';
    inner.style.height = PLOT_H + 'px';
    wrap.appendChild(inner);

    const handle = document.createElement('div');
    handle.className = 'plot-resize-handle';
    handle.title = currentLang === 'tr' ? 'Sürükleyerek yeniden boyutlandır' : 'Drag to resize';
    handle.innerHTML = '<span></span>';
    wrap.appendChild(handle);

    const exprs = this.exprs;
    let curW = PLOT_W, curH = PLOT_H;
    let plotInst = null;

    const renderPlot = (w, h, xDomain, yDomain) => {
      inner.innerHTML = '';
      inner.style.width = w + 'px';
      inner.style.height = h + 'px';
      try {
        plotInst = functionPlot({
          target: inner, width: w, height: h,
          xAxis: { domain: xDomain || [-8, 8] },
          yAxis: { domain: yDomain || [-8, 8] },
          grid: true,
          data: exprs.map(fn => ({ fn, sampler: 'builtIn', graphType: 'polyline' }))
        });
      } catch (err) {
        const errMsg = currentLang === 'tr' ? 'Plot hatası: ' : 'Plot error: ';
        inner.style.height = 'auto';
        inner.textContent = errMsg + err.message;
        Object.assign(inner.style, { color: '#c92a2a', padding: '10px', fontSize: '13px', fontFamily: 'monospace' });
      }
      if (view) view.requestMeasure();
    };

    handle.addEventListener('mousedown', e => {
      e.preventDefault();
      const startX = e.clientX, startY = e.clientY;
      const startW = curW, startH = curH;

      const onMove = ev => {
        const newW = Math.max(200, startW + ev.clientX - startX);
        const newH = Math.max(120, startH + ev.clientY - startY);
        inner.style.width = newW + 'px';
        inner.style.height = newH + 'px';
      };

      const onUp = ev => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        curW = Math.max(200, startW + ev.clientX - startX);
        curH = Math.max(120, startH + ev.clientY - startY);
        let xDom, yDom;
        try {
          if (plotInst?.meta) {
            xDom = plotInst.meta.xScale.domain();
            yDom = plotInst.meta.yScale.domain();
          }
        } catch {}
        renderPlot(curW, curH, xDom, yDom);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    requestAnimationFrame(() => renderPlot(curW, curH, null, null));

    return wrap;
  }

  eq(o) { return o.key === this.key; }
  // padding-top(6) + içerik(260) + handle(14) + border(2) = 282
  get estimatedHeight() { return 282; }
}

// ================================================================
// TYPE TAG GUTTER
// ================================================================

const TAG_COLORS = {
  'tag-f': '#7048e8', 'tag-v': '#2f9e44', 'tag-m': '#0c8599', 'tag-c': '#adb5bd',
  'tag-p': '#e8590c', 'tag-e': '#1971c2', 'tag-err': '#c92a2a',
  'tag-eq': '#c2860a', 'tag-ineq': '#0c7c5e',
};

class TypeTagMarker extends GutterMarker {
  constructor(tag, cls) {
    super();
    this.tag = tag;
    this.cls = cls;
  }
  toDOM() {
    const wrap = document.createElement('span');
    wrap.className = this.cls;

    const sq = document.createElement('i');
    sq.className = 'tag-sq';
    sq.style.background = TAG_COLORS[this.cls] || '#adb5bd';

    const lbl = document.createElement('span');
    lbl.textContent = this.tag;

    wrap.appendChild(sq);
    wrap.appendChild(lbl);
    return wrap;
  }
  eq(other) { return other.tag === this.tag; }
}

const TAG_MAP = {
  funcdef:  new TypeTagMarker('f',  'tag-f'),
  assign:   new TypeTagMarker('v',  'tag-v'),
  matassign: new TypeTagMarker('m', 'tag-m'),
  comment:  new TypeTagMarker('c',  'tag-c'),
  plot:     new TypeTagMarker('p',  'tag-p'),
  expr:     new TypeTagMarker('e',  'tag-e'),
  error:    new TypeTagMarker('!',  'tag-err'),
  equation:   new TypeTagMarker('eq', 'tag-eq'),
  inequality: new TypeTagMarker('<>', 'tag-ineq'),
};

const typeTagGutter = gutter({
  class: 'cm-type-gutter',
  markers(view) {
    let evalResult;
    try { evalResult = view.state.field(evalField); } catch { return RangeSet.empty; }
    const { lineResults } = evalResult;
    const markers = [];
    for (let ln = 1; ln <= view.state.doc.lines && (ln - 1) < lineResults.length; ln++) {
      const res = lineResults[ln - 1];
      if (!res || res.type === 'empty') continue;
      const markerKey = (res.type === 'assign' && res.val && res.val.isMatrix)
        ? 'matassign' : res.type;
      const marker = TAG_MAP[markerKey];
      if (marker) {
        markers.push(marker.range(view.state.doc.line(ln).from));
      }
    }
    return RangeSet.of(markers);
  },
  initialSpacer: () => new TypeTagMarker('f', 'tag-f'),
});

// Block decoration'lar ViewPlugin'dan GELEMEz — StateField zorunlu
function buildDecos(doc, evalResult) {
  const { lineResults } = evalResult;
  const decos = [];

  for (let ln = 1; ln <= doc.lines && (ln - 1) < lineResults.length; ln++) {
    const line = doc.line(ln);
    const res = lineResults[ln - 1];
    if (!res) continue;

    if (res.type === 'comment') {
      decos.push(Decoration.line({ class: 'cm-comment' }).range(line.from));
      continue;
    }

    if (res.type === 'empty') {
      decos.push(Decoration.line({ class: 'cm-empty-line' }).range(line.from));
      continue;
    }

    if (res.type === 'plot') {
      if (res.exprs.length === 0) continue;
      decos.push(
        Decoration.widget({
          widget: new PlotWidget(res.exprs),
          block: true,
          side: 1
        }).range(line.to)
      );
      continue;
    }

    let text, cls;
    if (res.type === 'error') {
      text = res.val; cls = 'error';
    } else if (res.type === 'funcdef') {
      continue;
    } else if (res.type === 'equation') {
      if (!res.solutions) { continue; }
      const noSol = currentLang === 'tr' ? 'çözüm yok' : 'no solution';
      if (res.solutions.length === 0) {
        text = noSol; cls = 'error';
      } else {
        text = res.solutions.map(s => `${res.eqVar} = ${s}`).join(', ');
        cls = 'equation';
      }
    } else if (res.type === 'inequality') {
      const trueText = currentLang === 'tr' ? 'doğru' : 'true';
      const falseText = currentLang === 'tr' ? 'yanlış' : 'false';
      
      if (res.error) { text = res.error; cls = 'error'; }
      else if (res.eqVar === null && res.boolResult !== undefined) {
        text = res.boolResult ? trueText : falseText;
        cls = res.boolResult ? 'value' : 'error';
      } else if (res.solutionStr) {
        text = res.solutionStr; cls = 'value';
      } else { continue; }
    } else if (res.val !== undefined && res.val !== null) {
      const s = fmtVal(res.val);
      if (!s || s === 'undefined') continue;
      text = (res.type === 'assign' && res.name ? res.name + ' = ' : '') + s;
      cls = res.type === 'assign'
        ? (res.val && res.val.isMatrix ? 'matassign' : 'assign')
        : 'value';
      const hasUnit = isUnit(res.val);
      
      decos.push(
        Decoration.widget({ widget: new ResultWidget(text, cls, hasUnit), side: 1 })
          .range(line.to)
      );
      continue;
    } else {
      continue;
    }

    decos.push(
      Decoration.widget({ widget: new ResultWidget(text, cls), side: 1 })
        .range(line.to)
    );
  }

  return Decoration.set(decos, true);
}

const decoField = StateField.define({
  create() { return Decoration.none; },
  update(decos, tr) {
    if (tr.effects.some(e => e.is(evalEffect))) {
      return buildDecos(tr.state.doc, tr.state.field(evalField));
    }
    return tr.docChanged ? decos.map(tr.changes) : decos;
  },
  provide: f => EditorView.decorations.from(f)
});

// ================================================================
// UNIT HIGHLIGHTING
// ================================================================

// Common units supported by Math.js
const UNITS = ['celsius', 'fahrenheit', 'kelvin', // longer names first
  'minute', 'hours', 'newton', 'degree', 'gallon', 'liter', 'litre', 'pound', 'ounce',
  'degC', 'degF', 'feet', 'foot', 'inch', 'yard', 'mile', 'tonne',
  'MHz', 'GHz', 'kHz', 'kPa', 'MPa', 'kWh',
  'km', 'cm', 'mm', 'kg', 'mg', 'ms', 'mL', 'mA', 'mV', 'kV', 'kW', 'MW', 'kJ',
  'm', 'g', 's', 'A', 'V', 'W', 'J', 'L',
  'ton', 'lbs', 'bar', 'atm', 'psi', 'cal', 'kcal', 'ohm',
  'min', 'day', 'week', 'month', 'year', 'hour',
  'Hz', 'Pa', 'hp', 'mol', 'rad', 'deg', 'gal', 'ft', 'lb', 'oz', 'N', 'K'];

function buildUnitDecorations(doc) {
  const decorations = [];
  
  // Build regex pattern
  const unitPattern = UNITS.join('|').replace(/\./g, '\\.');
  
  // Match patterns:
  // 1. [unit] or [unit/unit^2]
  // 2. Numbers followed by unit: 5 kg, 9.8 m/s^2
  // 3. Units after operators: * kg, + m
  const regex = new RegExp(
    `\\[\\s*(${unitPattern})(?:\\s*\\/\\s*(${unitPattern})(?:\\s*\\^\\s*[0-9]+)?)?\\s*\\]|` +
    `(${unitPattern})(?:\\s*\\/\\s*(${unitPattern})(?:\\s*\\^\\s*[0-9]+)?)?(?=\\s|$|\\)|,|\\*|\\+|\\-|;)`,
    'g'
  );
  
  for (let lineNum = 1; lineNum <= doc.lines; lineNum++) {
    const line = doc.line(lineNum);
    const lineText = line.text;
    
    // Skip comment lines
    if (lineText.trim().startsWith('#')) continue;
    
    let match;
    while ((match = regex.exec(lineText)) !== null) {
      // Check if this is after a number or whitespace or opening bracket
      const prevChar = match.index > 0 ? lineText[match.index - 1] : ' ';
      const isValid = /[\d\s\[\(\*]/.test(prevChar);
      
      if (isValid) {
        const from = line.from + match.index;
        const to = from + match[0].length;
        decorations.push(
          Decoration.mark({ class: 'cm-unit' }).range(from, to)
        );
      }
    }
  }
  
  return Decoration.set(decorations, true);
}

function highlightUnits(text) {
  const unitPattern = UNITS.join('|').replace(/\./g, '\\.');
  const regex = new RegExp(
    `(${unitPattern})(?:\\s*\\/\\s*(${unitPattern})(?:\\s*\\^\\s*[0-9]+)?)?(?=\\s|$|\\)|,|\\*|\\+|\\-|;|\\/|\\^)`,
    'g'
  );
  let result = '', last = 0;
  let m;
  while ((m = regex.exec(text)) !== null) {
    const prevChar = m.index > 0 ? text[m.index - 1] : ' ';
    if (!/[\d\s\[\(\*\/]/.test(prevChar)) continue;
    result += esc(text.slice(last, m.index));
    result += `<span style="color:#d9480f;font-weight:600">${esc(m[0])}</span>`;
    last = m.index + m[0].length;
  }
  result += esc(text.slice(last));
  return result;
}

const unitDecoField = StateField.define({
  create(state) {
    return buildUnitDecorations(state.doc);
  },
  update(decos, tr) {
    if (tr.docChanged) {
      return buildUnitDecorations(tr.state.doc);
    }
    return decos.map(tr.changes);
  },
  provide: f => EditorView.decorations.from(f)
});

// Single-letter variable highlighting
// Matches isolated letters not followed by '(' (function calls) and not 'e','i' (math constants)
function buildVarDecorations(doc) {
  const decorations = [];
  const excluded = new Set(['e', 'i', 'E', 'I']);
  // Preceded by non-letter/non-underscore, single letter, not followed by letter/digit/'('
  const regex = /(?<![a-zA-Z_])([a-zA-Z])(?![a-zA-Z0-9_(])/g;

  for (let lineNum = 1; lineNum <= doc.lines; lineNum++) {
    const line = doc.line(lineNum);
    const text = line.text;
    if (text.trim().startsWith('#')) continue;
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (excluded.has(match[1])) continue;
      const from = line.from + match.index;
      decorations.push(Decoration.mark({ class: 'cm-var' }).range(from, from + 1));
    }
  }
  return Decoration.set(decorations, true);
}

const varDecoField = StateField.define({
  create(state) { return buildVarDecorations(state.doc); },
  update(decos, tr) {
    if (tr.docChanged) return buildVarDecorations(tr.state.doc);
    return decos.map(tr.changes);
  },
  provide: f => EditorView.decorations.from(f)
});

// ================================================================
// ZOOM
// ================================================================

const ZOOM_KEY = 'mathnotebook_zoom';
const ZOOM_MIN = 50, ZOOM_MAX = 200, ZOOM_STEP = 10;
let zoomLevel = parseInt(localStorage.getItem(ZOOM_KEY)) || 100;

function applyZoom() {
  const scroller = document.querySelector('.cm-scroller');
  if (scroller) scroller.style.fontSize = (14 * zoomLevel / 100) + 'px';
  document.getElementById('zoom-level').textContent = zoomLevel + '%';
  localStorage.setItem(ZOOM_KEY, zoomLevel);
  if (view) view.requestMeasure();
}

function zoomIn() {
  if (zoomLevel < ZOOM_MAX) { zoomLevel += ZOOM_STEP; applyZoom(); }
}
function zoomOut() {
  if (zoomLevel > ZOOM_MIN) { zoomLevel -= ZOOM_STEP; applyZoom(); }
}

document.getElementById('zoom-in').addEventListener('click', zoomIn);
document.getElementById('zoom-out').addEventListener('click', zoomOut);

// Ctrl+= / Ctrl+- keyboard shortcuts for zoom
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
    e.preventDefault(); zoomIn();
  } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
    e.preventDefault(); zoomOut();
  } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
    e.preventDefault(); zoomLevel = 100; applyZoom();
  }
});

// ================================================================
// FUNC ANALYSIS (Nerdamer + nümerik fallback)
// ================================================================

function parseFuncDef(lineText) {
  const m = lineText.trim().match(/^([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*=\s*(.+)$/);
  if (!m) return null;
  return {
    name: m[1],
    vars: m[2].split(',').map(v => v.trim()).filter(Boolean),
    expr: m[3].trim()
  };
}

// Parantez derinliğine duyarlı split (Nerdamer çıktısını parçalamak için)
function splitTopLevelComma(str) {
  const parts = [];
  let depth = 0, start = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') depth--;
    else if (c === ',' && depth === 0) {
      parts.push(str.slice(start, i).trim());
      start = i + 1;
    }
  }
  const last = str.slice(start).trim();
  if (last) parts.push(last);
  return parts;
}

// Nümerik kök bulma: bisection + sign change tarama
function findRootsNumerically(exprStr, varName, from = -30, to = 30, steps = 3000) {
  const evalAt = x => {
    try {
      const scope = {}; scope[varName] = x;
      const y = math.evaluate(exprStr, scope);
      return (typeof y === 'number' && isFinite(y)) ? y : NaN;
    } catch { return NaN; }
  };

  const roots = [];
  const step = (to - from) / steps;
  let prevX = from, prevY = evalAt(from);

  for (let i = 1; i <= steps && roots.length < 8; i++) {
    const x = from + i * step;
    const y = evalAt(x);

    if (!isNaN(prevY) && !isNaN(y) && prevY * y < 0) {
      // İşaret değişimi → bisection
      let a = prevX, b = x, fa = prevY;
      for (let j = 0; j < 54; j++) {
        const m = (a + b) / 2;
        const fm = evalAt(m);
        if (isNaN(fm) || Math.abs(b - a) < 1e-12) break;
        if (Math.abs(fm) < 1e-11) { a = b = m; break; }
        if (fa * fm <= 0) { b = m; } else { a = m; fa = fm; }
      }
      const root = (a + b) / 2;
      if (!roots.some(r => Math.abs(r - root) < 1e-6)) roots.push(root);
    }

    // Tam sıfır
    if (!isNaN(y) && Math.abs(y) < 1e-11) {
      if (!roots.some(r => Math.abs(r - x) < 1e-6)) roots.push(x);
    }

    prevX = x; prevY = y;
  }

  return roots.sort((a, b) => a - b);
}

// Extract polynomial coefficients [a0,a1,...,an] via repeated differentiation at x=0.
// Returns null if the expression is not a polynomial (transcendental, rational, etc.).
function tryExtractPolyCoeffs(expr, v, nd, maxDeg = 8) {
  if (!nd) return null;
  try {
    const coeffs = [];
    let cur = expr;
    let fact = 1;
    for (let k = 0; k <= maxDeg; k++) {
      if (k > 0) fact *= k;
      const val = math.evaluate(cur, mkScope(v, 0));
      if (typeof val !== 'number' || !isFinite(val)) return null;
      coeffs.push(val / fact);
      if (k === maxDeg) break;
      cur = deNerdamify(nd.diff(cur, v).toString(), v);
      // Stop early if derivative is identically zero
      const z = [0, 1, -2].map(x => { try { return math.evaluate(cur, mkScope(v, x)); } catch { return 1; } });
      if (z.every(y => typeof y === 'number' && Math.abs(y) < 1e-10)) break;
    }
    while (coeffs.length > 1 && Math.abs(coeffs[coeffs.length - 1]) < 1e-9) coeffs.pop();
    if (coeffs.length < 2) return null;
    // Verify it's truly polynomial (no sin/exp/etc.)
    for (const x of [1.7, -2.3, 4.1]) {
      const expected = math.evaluate(expr, mkScope(v, x));
      if (typeof expected !== 'number' || !isFinite(expected)) return null;
      const poly = coeffs.reduce((s, c, i) => s + c * x ** i, 0);
      if (Math.abs(expected - poly) > Math.max(1e-5, Math.abs(expected) * 1e-4)) return null;
    }
    return coeffs;
  } catch { return null; }
}

// Build Horner nested form string from coefficients [a0,a1,...,an].
// e.g. [1,2,1] → "1 + x (2 + x)"
function buildHornerStr(coeffs, v) {
  const n = coeffs.length - 1;
  if (n < 1) return null;
  function fmt(c) {
    const r = Math.round(c * 1e8) / 1e8;
    return Number.isInteger(r) ? String(r) : String(+r.toPrecision(5));
  }
  let inner = fmt(coeffs[n]);
  for (let k = n - 1; k >= 0; k--) {
    const xp = inner === '1' ? v : inner === '-1' ? `-${v}` : `${v}(${inner})`;
    const c = coeffs[k];
    if (Math.abs(c) < 1e-10) {
      inner = xp;
    } else {
      inner = c > 0 ? `${fmt(c)}+${xp}` : `-${fmt(Math.abs(c))}+${xp}`;
    }
  }
  return inner;
}

// Nerdamer sometimes emits 't' as an auxiliary/substitution variable in its
// derivative and integration output. Replace every standalone 't' with the
// actual function variable so that downstream math.js evaluations work and
// the displayed expressions use the correct symbol.
function deNerdamify(str, v) {
  if (!str || v === 't') return str;
  // Only replace 't' that is not part of a longer word (tan, tanh, atan…)
  return str.replace(/(?<![a-zA-Z0-9_])t(?![a-zA-Z0-9_])/g, v);
}

// Build an evaluation scope that always has both the actual variable AND
// a 't' alias — so leftover Nerdamer 't' symbols don't break math.evaluate.
function mkScope(v, val) {
  const s = { [v]: val };
  if (v !== 't') s.t = val;
  return s;
}

// Even / odd / neither symmetry check (numerical sampling)
function analyzeSymmetry(expr, v) {
  const pts = [1, 2, 3.1, Math.PI, Math.E, 0.7, 5];
  let even = true, odd = true, tested = 0;
  for (const x of pts) {
    try {
      const fp = math.evaluate(expr, { [v]: x });
      const fn = math.evaluate(expr, { [v]: -x });
      if (typeof fp !== 'number' || typeof fn !== 'number' || !isFinite(fp) || !isFinite(fn)) continue;
      tested++;
      const tol = 1e-6 * (1 + Math.max(Math.abs(fp), Math.abs(fn)));
      if (Math.abs(fp - fn) > tol) even = false;
      if (Math.abs(fp + fn) > tol) odd = false;
    } catch {}
  }
  if (!tested) return null;
  
  if (even && odd) return t('zeroFunc');
  if (even) return t('even');
  if (odd)  return t('odd');
  return t('neither');
}

// Compact number formatter for critical/inflection points
function fmtShort(n) {
  if (n === null || n === undefined) return '—';
  const r = Math.round(n * 1e6) / 1e6;
  return Number.isInteger(r) ? String(r) : String(+n.toPrecision(5));
}

// Format a linear equation y = mx + b as a clean string
function fmtLinEq(m, b, v) {
  function n(x) {
    const r = Math.round(x * 1e5) / 1e5;
    return Number.isInteger(r) ? String(r) : String(r);
  }
  const mabs = Math.abs(m);
  let mPart;
  if (mabs < 1e-9) mPart = '';
  else if (Math.abs(mabs - 1) < 1e-9) mPart = m < 0 ? `−${v}` : v;
  else mPart = `${n(m)}${v}`;
  let bPart = '';
  if (Math.abs(b) > 1e-9) {
    bPart = mPart === '' ? n(b) : (b > 0 ? ` + ${n(Math.abs(b))}` : ` − ${n(Math.abs(b))}`);
  }
  if (!mPart && !bPart) return 'y = 0';
  return `y = ${mPart}${bPart}`;
}

let _lastAnaKey = null, _lastAna = null;

function analyzeFuncDef(lineText) {
  const key = lineText.trim();
  if (key === _lastAnaKey) return _lastAna;
  _lastAnaKey = key;
  _lastAna = null;

  const fd = parseFuncDef(preProcessLine(lineText));
  if (!fd) return null;

  const { vars, expr } = fd;
  const v = vars[0];
  const isUni = vars.length === 1 && /^[a-zA-Z_]\w*$/.test(v);

  // Display variable logic moved here
  const origParsed = parseFuncDef(lineText);
  const origArgVars = origParsed ? origParsed.vars[0].match(/[a-zA-Z_]\w*/g) : null;
  const dv = (origArgVars && origArgVars[0]) || v;

  const toDisplay = (s) => {
    if (!s || v === dv) return s;
    return s.replace(new RegExp('\\b' + v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'g'), dv);
  };

  const R = { fd, v, dv, toDisplay, isUni };

  const nd = (typeof nerdamer !== 'undefined') ? nerdamer : null;

  // ---- Türev (1.) ----
  if (isUni && nd) {
    try { R.deriv = deNerdamify(nd.diff(expr, v).toString(), v); } catch {}
  }

  // ---- Türev (2.) ----
  if (isUni && nd && R.deriv) {
    try { R.deriv2 = deNerdamify(nd.diff(R.deriv, v).toString(), v); } catch {}
  }

  // ---- Kritik Noktalar & Yerel Extremum (f'=0) ----
  if (isUni && R.deriv) {
    try {
      const cxs = findRootsNumerically(R.deriv, v);
      R.criticals = cxs.map(xc => {
        try {
          const fy = math.evaluate(expr, mkScope(v, xc));
          if (typeof fy !== 'number' || !isFinite(fy)) return null;
          let kind = 'saddle';
          if (R.deriv2) {
            try {
              const f2 = math.evaluate(R.deriv2, mkScope(v, xc));
              if (typeof f2 === 'number' && Math.abs(f2) > 1e-6)
                kind = f2 > 0 ? 'min' : 'max';
            } catch {}
          }
          // Sign-change of f' as fallback when second-derivative test is inconclusive
          if (kind === 'saddle') {
            try {
              const eps = 0.01;
              const fL = math.evaluate(R.deriv, mkScope(v, xc - eps));
              const fR = math.evaluate(R.deriv, mkScope(v, xc + eps));
              if (typeof fL === 'number' && typeof fR === 'number') {
                if (fL < 0 && fR > 0) kind = 'min';
                else if (fL > 0 && fR < 0) kind = 'max';
              }
            } catch {}
          }
          return { x: xc, y: fy, kind };
        } catch { return null; }
      }).filter(Boolean);
    } catch {}
  }

  // ---- Büküm Noktaları (f''=0 + işaret değişimi) ----
  if (isUni && R.deriv2) {
    try {
      const ixs = findRootsNumerically(R.deriv2, v);
      R.inflections = ixs.map(xi => {
        const eps = 0.05;
        try {
          const f2L = math.evaluate(R.deriv2, mkScope(v, xi - eps));
          const f2R = math.evaluate(R.deriv2, mkScope(v, xi + eps));
          if (typeof f2L !== 'number' || typeof f2R !== 'number' || f2L * f2R >= 0) return null;
          const fy = math.evaluate(expr, mkScope(v, xi));
          return { x: xi, y: typeof fy === 'number' && isFinite(fy) ? fy : null };
        } catch { return null; }
      }).filter(Boolean);
    } catch {}
  }

  // ---- Simetri ----
  if (isUni) {
    R.symmetry = analyzeSymmetry(expr, v);
  }

  // ---- İntegral ----
  if (isUni && nd) {
    try { R.intg = deNerdamify(nd('integrate(' + expr + ',' + v + ')').toString(), v); } catch {}
  }

  // ---- Kök Bulma: Nerdamer → nümerik fallback ----
  if (isUni) {
    let symbolicDone = false;

    if (nd) {
      try {
        const sol = nd.solve(expr, v);
        const solStr = (sol && typeof sol.toString === 'function') ? sol.toString().trim() : '';

        if (solStr.startsWith('[') && solStr.endsWith(']')) {
          const inner = solStr.slice(1, -1).trim();
          R.roots = inner ? splitTopLevelComma(inner) : [];
          R.rootsNumeric = false;
          symbolicDone = true;
        } else if (solStr && solStr !== '[]') {
          // tek kök, köşeli parantez olmadan döndü
          R.roots = [solStr];
          R.rootsNumeric = false;
          symbolicDone = true;
        }
      } catch { /* Nerdamer exception → nümerik fallback'e geç */ }
    }

    // Nerdamer başarısız ya da boş döndü → nümerik bisection
    if (!symbolicDone || (R.roots && R.roots.length === 0)) {
      const numRoots = findRootsNumerically(expr, v);
      if (numRoots.length > 0) {
        R.roots = numRoots.map(r => {
          // tam sayıya çok yakınsa tam göster
          const rounded = Math.round(r);
          return Math.abs(r - rounded) < 1e-6 ? String(rounded) : r.toPrecision(7).replace(/\.?0+$/, '');
        });
        R.rootsNumeric = true;
      } else if (!symbolicDone) {
        R.roots = []; // kesin boş — sembolik de çalışmadı
      }
    }
  }

  // ---- Sadeleştirme / Çarpanlar / Horner ----
  if (isUni && nd) {
    try { 
      const s = deNerdamify(nd.simplify(expr).toString(), v);
      if (s && s !== expr) R.simplified = s;
    } catch {}
    try { 
      const f = deNerdamify(nd.factor(expr).toString(), v);
      if (f && f !== expr) R.factor = f;
    } catch {}
    try { 
      const pc = tryExtractPolyCoeffs(expr, v, nd);
      if (pc) {
        const h = buildHornerStr(pc, v).replace(/\s+/g, '');
        if (h && h !== expr) R.horner = h;
      }
    } catch {}
  }

  // ---- Nümerik limitler (math.js) ----
  if (isUni) {
    const evalAt = x => {
      try {
        const scope = mkScope(v, x);
        const y = math.evaluate(expr, scope);
        return (typeof y === 'number' && isFinite(y)) ? y : null;
      } catch { return null; }
    };
    const EPS = 1e-9;
    const lL = evalAt(-EPS), lR = evalAt(EPS);
    if (lL !== null && lR !== null && Math.abs(lL - lR) < 1e-4) {
      R.lim0 = (lL + lR) / 2;
    } else {
      if (lL !== null) R.lim0L = lL;
      if (lR !== null) R.lim0R = lR;
    }
    const lInf = evalAt(1e10);
    if (lInf !== null) R.limInf = lInf;
    const lNInf = evalAt(-1e10);
    if (lNInf !== null) R.limNInf = lNInf;
  }

  // ---- Çok değişkenli: kısmi türevler, gradyan, Hessian ----
  if (!isUni && nd && vars.length >= 2) {
    R.partials = {};
    R.partials2 = {};
    for (const pv of vars) {
      try { R.partials[pv] = deNerdamify(nd.diff(expr, pv).toString(), pv); } catch {}
      if (R.partials[pv]) {
        try { R.partials2[pv] = deNerdamify(nd.diff(R.partials[pv], pv).toString(), pv); } catch {}
      }
    }
    if (vars.length === 2 && R.partials[vars[0]]) {
      try { R.mixedPartial = deNerdamify(nd.diff(R.partials[vars[0]], vars[1]).toString(), vars[1]); } catch {}
    }
  }

  // Apply display conversions at the very end
  if (isUni && v !== dv) {
    if (R.deriv) R.deriv = toDisplay(R.deriv);
    if (R.deriv2) R.deriv2 = toDisplay(R.deriv2);
    if (R.intg) R.intg = toDisplay(R.intg);
    if (R.roots) R.roots = R.roots.map(r => toDisplay(r));
    if (R.simplified) R.simplified = toDisplay(R.simplified);
    if (R.factor) R.factor = toDisplay(R.factor);
    if (R.horner) R.horner = toDisplay(R.horner);
  }

  _lastAna = R;
  return R;
}

function fmtNum(n) {
  if (n === null || n === undefined) return '—';
  return math.format(n, { precision: 8 });
}

// ================================================================
// EQUATION PANEL
// ================================================================

let _eqTexMode = 'tex';
window.toggleEqTexMode = function() {
  _eqTexMode = _eqTexMode === 'tex' ? 'plain' : 'tex';
  const wrapper = document.querySelector('.eq-dual');
  if (wrapper) {
    wrapper.classList.remove('mode-tex', 'mode-plain');
    wrapper.classList.add('mode-' + _eqTexMode);
  }
  const btn = document.getElementById('eq-tex-toggle-btn');
  if (btn) btn.textContent = _eqTexMode === 'tex' ? 'LaTeX' : 'Normal';
};

function renderEquationPanel(res) {
  const { lhs, rhs, eqVar, solutions, solutionsNumeric, altForm,
          isImplicit, implicitVars, yBranches, implicitDeriv, implicitDerivX,
          integerSolutions, geoFig } = res;

  const row = (lbl, val, cls = '') =>
    `<div class="ana-row"><span class="ana-lbl" style="min-width:60px">${lbl}</span><span class="ana-val ${cls}">${val}</span></div>`;
  const box = (title, body) =>
    `<div class="ana-box"><div class="ana-title">${title}</div>${body}</div>`;
  const dual = (texH, plainH) => dualBlock(texH, plainH);

  let html = `<div class="ana-wrapper eq-dual mode-${_eqTexMode}" style="position:relative">`;
  html += `<button id="eq-tex-toggle-btn" class="ana-tex-toggle" onmousedown="event.preventDefault()" onclick="toggleEqTexMode()">${_eqTexMode === 'tex' ? 'LaTeX' : 'Normal'}</button>`;

  // Header — dual mode
  const headerTeX = renderTeX(`${exprToTeX(lhs)} = ${exprToTeX(rhs)}`, true);
  const headerPlain = `<span style="font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;color:#c2860a">${esc(lhs)} = ${esc(rhs)}</span>`;
  html += `<div class="ana-header" style="color:#c2860a;background:#fff9db;border-color:#ffe066;margin-bottom:12px">${dual(headerTeX, headerPlain)}</div>`;

  if (isImplicit) {
    const [varX, varY] = implicitVars;

    // Geometric figure — plain text only (no formulas)
    const geoNames = { circle: t('circle'), ellipse: t('ellipse'), hyperbola: t('hyperbola'),
                       parabola: t('parabola'), line: t('straightLine'), point: t('pointFigure') };
    let geoBody = '';
    if (geoFig) {
      geoBody += row('', geoNames[geoFig.type] || geoFig.type, 'orange');
      if (geoFig.type === 'circle') {
        const fmt = n => Math.abs(n) < 1e-6 ? '0' : (+n.toPrecision(5)).toString();
        geoBody += row(t('center'), `(${fmt(geoFig.cx)}, ${fmt(geoFig.cy)})`);
        geoBody += row(t('radius'), (+geoFig.r.toPrecision(5)).toString(), 'green');
      }
    } else {
      geoBody = `<div class="ana-none">${t('implicitEquation')}</div>`;
    }

    // y-branches — dual mode
    let branchBody = '';
    if (!yBranches || yBranches.length === 0) {
      branchBody = `<div class="ana-none">${t('notCalculated')}</div>`;
    } else {
      branchBody = yBranches.map((br, i) => {
        const sub = yBranches.length > 1 ? (i + 1) : '';
        const subTeX = sub ? `_{${sub}}` : '';
        const texH = `<div class="ana-row"><span class="ana-katex-val">${renderTeX(`${varY}${subTeX} = ${exprToTeX(br)}`)}</span></div>`;
        const plainH = row('', `${varY}${sub ? `<sub>${sub}</sub>` : ''} = ${esc(br)}`, 'green');
        return dual(texH, plainH);
      }).join('');
    }

    // Implicit derivatives — both dy/dx and dx/dy
    let derivBody = '';
    if (implicitDeriv || implicitDerivX) {
      if (implicitDeriv) {
        const texH = `<div class="ana-row"><span class="ana-katex-val">${renderTeX(`\\frac{d${varY}}{d${varX}} = ${exprToTeX(implicitDeriv)}`)}</span></div>`;
        const plainH = row(`d${varY}/d${varX} =`, esc(implicitDeriv), 'orange');
        derivBody += dual(texH, plainH);
      }
      if (implicitDerivX) {
        const texH = `<div class="ana-row"><span class="ana-katex-val">${renderTeX(`\\frac{d${varX}}{d${varY}} = ${exprToTeX(implicitDerivX)}`)}</span></div>`;
        const plainH = row(`d${varX}/d${varY} =`, esc(implicitDerivX), 'orange');
        derivBody += dual(texH, plainH);
      }
    } else {
      derivBody = `<div class="ana-none">${t('notCalculated')}</div>`;
    }

    // Build integer solutions content
    const fmtInt = n => n === 0 ? '0' : String(n);
    let intSolBody = '';
    if (integerSolutions && integerSolutions.length > 0) {
      const pairs = integerSolutions.slice(0, 16);
      const intTexH = pairs.map(p =>
        `<div class="ana-row"><span class="ana-katex-val">${renderTeX(`${varX} = ${fmtInt(p.x)},\\; ${varY} = ${fmtInt(p.y)}`)}</span></div>`
      ).join('') + (integerSolutions.length > 16 ? `<div class="ana-none" style="font-size:11px">+${integerSolutions.length-16} more</div>` : '');
      const intPlainH = pairs.map(p =>
        row('', `${varX} = ${fmtInt(p.x)}, ${varY} = ${fmtInt(p.y)}`, 'green')
      ).join('') + (integerSolutions.length > 16 ? `<div class="ana-none" style="font-size:11px">+${integerSolutions.length-16} more</div>` : '');
      intSolBody = dual(intTexH, intPlainH);
    } else {
      intSolBody = `<div class="ana-none">${t('notCalculated')}</div>`;
    }

    // Build altForm content
    const altTexH = altForm
      ? `<div class="ana-row"><span class="ana-katex-val">${renderTeX(exprToTeX(altForm.replace(' = 0','')) + ' = 0')}</span></div>`
      : '';
    const altPlainH = altForm ? row('', esc(altForm)) : '';
    const altBody = altForm ? dual(altTexH, altPlainH) : `<div class="ana-none">—</div>`;

    // Single grid, explicit placement:
    // Row 1: altForm(1,1) | solution-Y(1,2) | integerSolutions(1,3)
    // Row 2: geometricFigure(2,1) | implicitDerivatives(2,2) | empty
    html += `<div class="ana-grid" style="grid-template-rows: auto auto">`;
    html += `<div class="ana-box" style="grid-column:1;grid-row:1"><div class="ana-title">${t('altForm')}</div>${altBody}</div>`;
    html += `<div class="ana-box" style="grid-column:2;grid-row:1"><div class="ana-title">${t('solution')} (${varY})</div>${branchBody}</div>`;
    html += `<div class="ana-box" style="grid-column:3;grid-row:1"><div class="ana-title">${t('integerSolutions')}</div>${intSolBody}</div>`;
    html += `<div class="ana-box" style="grid-column:1;grid-row:2"><div class="ana-title">${t('geometricFigure')}</div>${geoBody}</div>`;
    html += `<div class="ana-box" style="grid-column:2;grid-row:2"><div class="ana-title">${t('implicitDerivative')}</div>${derivBody}</div>`;
    html += `</div>`;

  } else {
    // Single-variable equation
    html += `<div class="ana-grid">`;

    if (altForm) {
      const altTexH = `<div class="ana-row"><span class="ana-katex-val">${renderTeX(exprToTeX(altForm.replace(' = 0', '')) + ' = 0')}</span></div>`;
      const altPlainH = row('', esc(altForm));
      html += box(t('altForm'), dual(altTexH, altPlainH));
    }

    let body = '';
    if (!solutions) {
      body = `<div class="ana-none">${t('notCalculated')}</div>`;
    } else if (solutions.length === 0) {
      body = `<div class="ana-none">${t('noRealSolution')}</div>`;
    } else {
      const op = solutionsNumeric ? '\\approx' : '=';
      const opPlain = solutionsNumeric ? '≈' : '=';
      const note = solutionsNumeric
        ? `<div style="font-size:10px;color:#adb5bd;margin-top:3px">${t('numeric')}</div>` : '';
      body = solutions.map((s, i) => {
        const sub = solutions.length > 1 ? (i + 1) : '';
        const subTeX = sub ? `_{${sub}}` : '';
        const texH = `<div class="ana-row"><span class="ana-katex-val">${renderTeX(`${eqVar}${subTeX} ${op} ${exprToTeX(s)}`)}</span></div>`;
        const plainH = row('', `${eqVar}${sub ? `<sub>${sub}</sub>` : ''} ${opPlain} ${esc(s)}`, 'green');
        return dual(texH, plainH);
      }).join('') + note;
    }
    html += box(`${t('solution')} (${eqVar || '?'})`, body);
    html += `</div>`;
  }

  html += `<div style="padding:0 4px 10px"><div id="eq-plot-slot"></div></div>`;
  html += `</div>`;
  return html;
}

let _eqPlotState = null;

function drawEqPlot() {
  const container = document.getElementById('eq-plot-inner');
  if (!container || !_eqPlotState) return;
  container.innerHTML = '';
  const s = _eqPlotState;

  // ── Implicit mode: örtük eğri ─────────────────────────────────
  if (s.isImplicit) {
    try {
      const plot = functionPlot({
        target: container, width: s.W, height: s.H,
        xAxis: { domain: s.xDomain },
        yAxis: { domain: s.yDomain },
        grid: true,
        data: [{ fn: s.fnExpr, fnType: 'implicit', color: '#1971c2' }]
      });
      plot.on('zoom', () => {
        if (_eqPlotState && plot.meta) {
          _eqPlotState.xDomain = plot.meta.xScale.domain().map(Number);
          _eqPlotState.yDomain = plot.meta.yScale.domain().map(Number);
        }
      });
    } catch (err) {
      container.innerHTML = `<div style="color:#c92a2a;font-size:12px;padding:8px">${t('plotError')} ${err.message}</div>`;
    }
    return;
  }

  const fnData = [
    { fn: s.lhsFn, color: '#e8590c', graphType: 'polyline' },
    { fn: s.rhsFn, color: '#1971c2', graphType: 'polyline' },
  ];
  if (s.numSols.length > 0) {
    const intPts = s.numSols.map(x => {
      try {
        const y = math.evaluate(s.lhsFn, { x });
        return typeof y === 'number' && isFinite(y) ? [x, y] : null;
      } catch { return null; }
    }).filter(Boolean);
    if (intPts.length > 0) {
      fnData.push({ points: intPts, fnType: 'points', graphType: 'scatter',
        color: '#c92a2a', attr: { r: 5, 'stroke-width': 2, stroke: '#fff' } });
    }
  }
  const annotations = s.numSols.map(x => ({ x, text: `${s.v}=${+x.toPrecision(4)}` }));

  try {
    const plot = functionPlot({
      target: container, width: s.W, height: s.H,
      xAxis: { domain: s.xDomain },
      ...(s.yDomain ? { yAxis: { domain: s.yDomain } } : {}),
      grid: true, data: fnData, annotations
    });
    plot.on('zoom', () => {
      if (_eqPlotState && plot.meta) {
        _eqPlotState.xDomain = plot.meta.xScale.domain().map(Number);
        _eqPlotState.yDomain = plot.meta.yScale.domain().map(Number);
      }
    });
  } catch (err) {
    const errMsg = currentLang === 'tr' ? 'Grafik çizilemedi: ' : 'Could not draw plot: ';
    container.innerHTML = `<div style="color:#c92a2a;font-size:12px;padding:8px">${errMsg}${err.message}</div>`;
  }
}

window.eqZoom = function(axis, factor) {
  if (!_eqPlotState) return;
  const s = _eqPlotState;
  const [lo, hi] = axis === 'x' ? s.xDomain : (s.yDomain || [-10, 10]);
  const mid = (lo + hi) / 2, half = (hi - lo) / 2 * factor;
  if (axis === 'x') s.xDomain = [mid - half, mid + half];
  else s.yDomain = [mid - half, mid + half];
  drawEqPlot();
};

window.eqZoomReset = function() {
  if (!_eqPlotState) return;
  const s = _eqPlotState;
  s.xDomain = s.xDomainInit.slice();
  s.yDomain = s.yDomainInit ? s.yDomainInit.slice() : null;
  drawEqPlot();
};

function renderEquationPlot(res) {
  const slot = document.getElementById('eq-plot-slot');
  if (!slot) return;
  slot.innerHTML = '';

  // ── Implicit plot ─────────────────────────────────────────────
  if (res.isImplicit) {
    const { lhs, rhs, implicitVars, geoFig } = res;
    const [varX, varY] = implicitVars;

    const eqKey = `impl:${lhs}:${rhs}`;
    const prev = (_eqPlotState && _eqPlotState.eqKey === eqKey) ? _eqPlotState : null;
    const sidebar = document.getElementById('sidebar');
    const sidebarW = sidebar ? sidebar.clientWidth : 260;
    const defaultW = Math.min(220, Math.max(150, sidebarW - 24));
    const W = prev ? prev.W : defaultW;
    const H = prev ? prev.H : defaultW;

    // Auto-domain based on detected figure
    let xDomain = [-7, 7], yDomain = [-7, 7];
    if (geoFig && geoFig.type === 'circle') {
      const r = geoFig.r, pad = Math.max(1.5, r * 0.5);
      xDomain = [geoFig.cx - r - pad, geoFig.cx + r + pad];
      yDomain = [geoFig.cy - r - pad, geoFig.cy + r + pad];
    }

    // Convert to x,y if needed (function-plot requires x and y)
    let fnExpr = `(${lhs})-(${rhs})`;
    if (varX !== 'x') fnExpr = fnExpr.replace(new RegExp(`(?<![a-zA-Z])${varX}(?![a-zA-Z])`, 'g'), 'x');
    if (varY !== 'y') fnExpr = fnExpr.replace(new RegExp(`(?<![a-zA-Z])${varY}(?![a-zA-Z])`, 'g'), 'y');

    _eqPlotState = {
      eqKey, isImplicit: true, fnExpr, W, H,
      xDomain: prev ? prev.xDomain.slice() : xDomain.slice(),
      yDomain: prev ? prev.yDomain.slice() : yDomain.slice(),
      xDomainInit: xDomain.slice(), yDomainInit: yDomain.slice()
    };

    slot.innerHTML = `
      <div class="ana-zoom-bar">
        <span class="ana-zoom-lbl">X</span>
        <button class="ana-zoom-btn" onmousedown="event.preventDefault()" onclick="eqZoom('x',0.6)">−</button>
        <button class="ana-zoom-btn" onmousedown="event.preventDefault()" onclick="eqZoom('x',1.67)">+</button>
        <span class="ana-zoom-lbl">Y</span>
        <button class="ana-zoom-btn" onmousedown="event.preventDefault()" onclick="eqZoom('y',0.6)">−</button>
        <button class="ana-zoom-btn" onmousedown="event.preventDefault()" onclick="eqZoom('y',1.67)">+</button>
        <span class="ana-zoom-reset" onmousedown="event.preventDefault()" onclick="eqZoomReset()">↺ ${t('reset')}</span>
      </div>
      <div style="position:relative;display:inline-block">
        <div id="eq-plot-inner"></div>
        <div class="plot-resize-corner" id="eq-plot-corner" title="${t('resize')}"></div>
      </div>
    `;

    slot.querySelector('#eq-plot-corner').addEventListener('mousedown', e => {
      e.preventDefault();
      const startX = e.clientX, startY = e.clientY;
      const startW = _eqPlotState ? _eqPlotState.W : 200;
      const startH = _eqPlotState ? _eqPlotState.H : 200;
      const onMove = ev => {
        const el = document.getElementById('eq-plot-inner');
        const newW = Math.max(150, startW + ev.clientX - startX);
        const newH = Math.max(120, startH + ev.clientY - startY);
        if (el) { el.style.width = newW + 'px'; el.style.height = newH + 'px'; }
      };
      const onUp = ev => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        if (_eqPlotState) {
          _eqPlotState.W = Math.max(150, startW + ev.clientX - startX);
          _eqPlotState.H = Math.max(120, startH + ev.clientY - startY);
          drawEqPlot();
        }
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    drawEqPlot();
    return;
  }

  const { lhs, rhs, eqVar, solutions } = res;
  const v = eqVar || 'x';

  const eqKey = `eq:${lhs}:${rhs}`;
  const prev = (_eqPlotState && _eqPlotState.eqKey === eqKey) ? _eqPlotState : null;
  const sidebar = document.getElementById('sidebar');
  const defaultW = Math.max(160, (sidebar ? sidebar.clientWidth : 230) - 20);
  const W = prev ? prev.W : defaultW;
  const H = prev ? prev.H : Math.round(defaultW * 0.6);

  const toFnExpr = e => v === 'x' ? e : e.replace(new RegExp(`\\b${v}\\b`, 'g'), 'x');
  const lhsFn = toFnExpr(lhs);
  const rhsFn = toFnExpr(rhs);

  const numSols = (solutions || []).map(s => {
    const n = parseFloat(s);
    if (!isNaN(n)) return n;
    try { return math.evaluate(s); } catch { return null; }
  }).filter(x => typeof x === 'number' && isFinite(x));

  let xMin = -10, xMax = 10;
  if (numSols.length > 0) {
    const sMin = Math.min(...numSols), sMax = Math.max(...numSols);
    const pad = Math.max(4, (sMax - sMin) * 0.7);
    const half = Math.max(Math.abs(sMin - pad), Math.abs(sMax + pad));
    xMin = -half - 1; xMax = half + 1;
  }

  const ys = [];
  const step = (xMax - xMin) / 300;
  for (let i = 0; i <= 300; i++) {
    const x = xMin + i * step;
    for (const fn of [lhsFn, rhsFn]) {
      try {
        const y = math.evaluate(fn, { x });
        if (typeof y === 'number' && isFinite(y)) ys.push(y);
      } catch {}
    }
  }
  let yDomain;
  if (ys.length > 2) {
    ys.sort((a, b) => a - b);
    const lo = ys[Math.floor(ys.length * 0.02)];
    const hi = ys[Math.floor(ys.length * 0.98)];
    const pad = Math.max(1, (hi - lo) * 0.15);
    yDomain = [lo - pad, hi + pad];
  }

  _eqPlotState = {
    eqKey, lhsFn, rhsFn, v, numSols, W, H,
    xDomain: prev ? prev.xDomain.slice() : [xMin, xMax],
    yDomain: prev ? prev.yDomain.slice() : yDomain,
    xDomainInit: [xMin, xMax], yDomainInit: yDomain ? yDomain.slice() : null
  };

  slot.innerHTML = `
    <div class="ana-zoom-bar">
      <span class="ana-zoom-lbl">X</span>
      <button class="ana-zoom-btn" onclick="eqZoom('x',0.6)" title="${currentLang === 'tr' ? 'X Yakınlaştır' : 'Zoom in X'}">−</button>
      <button class="ana-zoom-btn" onclick="eqZoom('x',1.67)" title="${currentLang === 'tr' ? 'X Uzaklaştır' : 'Zoom out X'}">+</button>
      <span class="ana-zoom-lbl">Y</span>
      <button class="ana-zoom-btn" onclick="eqZoom('y',0.6)" title="${currentLang === 'tr' ? 'Y Yakınlaştır' : 'Zoom in Y'}">−</button>
      <button class="ana-zoom-btn" onclick="eqZoom('y',1.67)" title="${currentLang === 'tr' ? 'Y Uzaklaştır' : 'Zoom out Y'}">+</button>
      <span class="ana-zoom-reset" onclick="eqZoomReset()" title="${currentLang === 'tr' ? 'Sıfırla' : 'Reset'}">↺ ${currentLang === 'tr' ? 'sıfırla' : 'reset'}</span>
    </div>
    <div style="position:relative;display:inline-block">
      <div id="eq-plot-inner"></div>
      <div class="plot-resize-corner" id="eq-plot-corner" title="${currentLang === 'tr' ? 'Sürükleyerek yeniden boyutlandır' : 'Drag to resize'}"></div>
    </div>
  `;

  slot.querySelector('#eq-plot-corner').addEventListener('mousedown', e => {
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const startW = _eqPlotState ? _eqPlotState.W : 200;
    const startH = _eqPlotState ? _eqPlotState.H : 200;
    const onMove = ev => {
      const el = document.getElementById('eq-plot-inner');
      const newW = Math.max(150, startW + ev.clientX - startX);
      const newH = Math.max(120, startH + ev.clientY - startY);
      if (el) { el.style.width = newW + 'px'; el.style.height = newH + 'px'; }
    };
    const onUp = ev => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      if (_eqPlotState) {
        _eqPlotState.W = Math.max(150, startW + ev.clientX - startX);
        _eqPlotState.H = Math.max(120, startH + ev.clientY - startY);
        drawEqPlot();
      }
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  drawEqPlot();
}

function renderInequalityPanel(res) {
  const { lhs, rhs, op, eqVar, solutionStr, boolResult, error } = res;
  const row = (lbl, val, cls = '') =>
    `<div class="ana-row"><span class="ana-lbl" style="min-width:60px">${lbl}</span><span class="ana-val ${cls}">${val}</span></div>`;
  const box = (title, body) =>
    `<div class="ana-box"><div class="ana-title">${title}</div>${body}</div>`;

  const opSymbol = op === '>=' ? '≥' : op === '<=' ? '≤' : op;

  let html = `<div class="ana-wrapper">`;
  html += `<div class="ana-header" style="color:#0c7c5e;background:#e6fcf5;border-color:#63e6be;margin-bottom:12px">${esc(lhs)} ${opSymbol} ${esc(rhs)}</div>`;
  html += `<div class="ana-grid">`;

  if (error) {
    html += box(t('solution'), `<div class="ana-none">${esc(error)}</div>`);
  } else if (eqVar === null && boolResult !== undefined) {
    const resText = boolResult ? t('true') : t('false');
    html += box(t('result'), row('', resText, boolResult ? 'green' : 'red'));
  } else if (solutionStr) {
    html += box(`${t('solution')} (${eqVar})`, row('', esc(solutionStr), 'green'));
  } else {
    html += box(t('solution'), `<div class="ana-none">${t('notFound')}</div>`);
  }

  html += `</div>`;
  html += `<div style="padding:0 4px 10px"><div id="ineq-plot-slot"></div></div>`;
  html += `</div>`;
  return html;
}

let _ineqPlotState = null;

function drawIneqPlot() {
  const container = document.getElementById('ineq-plot-inner');
  if (!container || !_ineqPlotState) return;
  container.innerHTML = '';
  const s = _ineqPlotState;

  let plot;
  try {
    plot = functionPlot({
      target: container, width: s.W, height: s.H,
      xAxis: { domain: s.xDomain },
      ...(s.yDomain ? { yAxis: { domain: s.yDomain } } : {}),
      grid: true,
      data: [
        { fn: s.lhsFn, color: '#e8590c', graphType: 'polyline' },
        { fn: s.rhsFn, color: '#1971c2', graphType: 'polyline' },
      ],
    });
  } catch (err) {
    const errMsg = currentLang === 'tr' ? 'Grafik çizilemedi: ' : 'Could not draw plot: ';
    container.innerHTML = `<div style="color:#c92a2a;font-size:12px;padding:8px">${errMsg}${err.message}</div>`;
    return;
  }

  const drawShading = () => {
    try {
      const svg = container.querySelector('svg');
      if (!svg || !plot.meta) return;
      svg.querySelectorAll('.ineq-shading').forEach(el => el.remove());

      const xScale = plot.meta.xScale;
      const yScale = plot.meta.yScale;
      const [yLo, yHi] = yScale.domain();
      const [xLoLive, xHiLive] = xScale.domain();

      const shadingGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      shadingGroup.setAttribute('class', 'ineq-shading');

      const clampY = y => Math.max(yLo, Math.min(yHi, y));
      const sampleY = (fnStr, x) => {
        try {
          const y = math.evaluate(fnStr, { x });
          return typeof y === 'number' && isFinite(y) ? clampY(y) : null;
        } catch { return null; }
      };

      for (const { lo, hi } of (s.intervals || [])) {
        const xLo = Math.max(isFinite(lo) ? lo : xLoLive, xLoLive);
        const xHi = Math.min(isFinite(hi) ? hi : xHiLive, xHiLive);
        if (xLo >= xHi) continue;
        const topPts = [], botPts = [];
        for (let i = 0; i <= 80; i++) {
          const x = xLo + (xHi - xLo) * i / 80;
          const y1 = sampleY(s.lhsFn, x), y2 = sampleY(s.rhsFn, x);
          if (y1 === null || y2 === null) continue;
          topPts.push([xScale(x), yScale(Math.max(y1, y2))]);
          botPts.push([xScale(x), yScale(Math.min(y1, y2))]);
        }
        if (topPts.length < 2) continue;
        const pts = [...topPts, ...botPts.slice().reverse()]
          .map(([px, py]) => `${px},${py}`).join(' ');
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', pts);
        polygon.setAttribute('fill', 'rgba(12, 124, 94, 0.18)');
        polygon.setAttribute('pointer-events', 'none');
        shadingGroup.appendChild(polygon);
      }

      const yPxTop = Math.min(yScale(yLo), yScale(yHi));
      const yPxBot = Math.max(yScale(yLo), yScale(yHi));
      for (const b of (s.boundary || [])) {
        const pxX = xScale(b);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', pxX); line.setAttribute('x2', pxX);
        line.setAttribute('y1', yPxTop); line.setAttribute('y2', yPxBot);
        line.setAttribute('stroke', '#e8590c');
        line.setAttribute('stroke-width', '1.5');
        line.setAttribute('stroke-dasharray', '4,3');
        line.setAttribute('pointer-events', 'none');
        shadingGroup.appendChild(line);
      }

      const contentGroup = svg.querySelector('.content');
      const insertTarget = contentGroup ? contentGroup.parentElement : svg;
      insertTarget.insertBefore(shadingGroup, contentGroup || null);
    } catch {}
  };

  plot.on('zoom', () => {
    if (_ineqPlotState && plot.meta) {
      _ineqPlotState.xDomain = plot.meta.xScale.domain().map(Number);
      _ineqPlotState.yDomain = plot.meta.yScale.domain().map(Number);
    }
    drawShading();
  });
  requestAnimationFrame(drawShading);
}

window.ineqZoom = function(axis, factor) {
  if (!_ineqPlotState) return;
  const s = _ineqPlotState;
  const [lo, hi] = axis === 'x' ? s.xDomain : (s.yDomain || [-10, 10]);
  const mid = (lo + hi) / 2, half = (hi - lo) / 2 * factor;
  if (axis === 'x') s.xDomain = [mid - half, mid + half];
  else s.yDomain = [mid - half, mid + half];
  drawIneqPlot();
};

window.ineqZoomReset = function() {
  if (!_ineqPlotState) return;
  const s = _ineqPlotState;
  s.xDomain = s.xDomainInit.slice();
  s.yDomain = s.yDomainInit ? s.yDomainInit.slice() : null;
  drawIneqPlot();
};

function renderInequalityPlot(res) {
  const slot = document.getElementById('ineq-plot-slot');
  if (!slot) return;
  slot.innerHTML = '';

  const { lhs, rhs, eqVar, boundary, intervals } = res;
  if (!eqVar) return;

  const v = eqVar;
  const sidebar = document.getElementById('sidebar');
  const W = Math.max(160, (sidebar ? sidebar.clientWidth : 230) - 20);
  const H = Math.round(W * 0.6);

  const toFnExpr = e => v === 'x' ? e
    : e.replace(new RegExp(`(?<![a-zA-Z])${v}(?![a-zA-Z])`, 'g'), 'x');
  const lhsFn = toFnExpr(lhs);
  const rhsFn = toFnExpr(rhs);

  let xMin = -10, xMax = 10;
  if (boundary && boundary.length > 0) {
    const bMin = Math.min(...boundary), bMax = Math.max(...boundary);
    const pad = Math.max(5, (bMax - bMin) + 4);
    xMin = bMin - pad; xMax = bMax + pad;
  }

  const ys = [];
  const step = (xMax - xMin) / 300;
  for (let i = 0; i <= 300; i++) {
    const x = xMin + i * step;
    for (const fn of [lhsFn, rhsFn]) {
      try {
        const y = math.evaluate(fn, { x });
        if (typeof y === 'number' && isFinite(y)) ys.push(y);
      } catch {}
    }
  }
  let yDomain;
  if (ys.length > 2) {
    ys.sort((a, b) => a - b);
    const lo = ys[Math.floor(ys.length * 0.02)];
    const hi = ys[Math.floor(ys.length * 0.98)];
    const pad = Math.max(1, (hi - lo) * 0.15);
    yDomain = [lo - pad, hi + pad];
  }

  _ineqPlotState = {
    lhsFn, rhsFn, intervals, boundary, W, H,
    xDomain: [xMin, xMax], yDomain,
    xDomainInit: [xMin, xMax], yDomainInit: yDomain ? yDomain.slice() : null
  };

  slot.innerHTML = `
    <div class="ana-zoom-bar">
      <span class="ana-zoom-lbl">X</span>
      <button class="ana-zoom-btn" onclick="ineqZoom('x',0.6)" title="${currentLang === 'tr' ? 'X Yakınlaştır' : 'Zoom in X'}">−</button>
      <button class="ana-zoom-btn" onclick="ineqZoom('x',1.67)" title="${currentLang === 'tr' ? 'X Uzaklaştır' : 'Zoom out X'}">+</button>
      <span class="ana-zoom-lbl">Y</span>
      <button class="ana-zoom-btn" onclick="ineqZoom('y',0.6)" title="${currentLang === 'tr' ? 'Y Yakınlaştır' : 'Zoom in Y'}">−</button>
      <button class="ana-zoom-btn" onclick="ineqZoom('y',1.67)" title="${currentLang === 'tr' ? 'Y Uzaklaştır' : 'Zoom out Y'}">+</button>
      <span class="ana-zoom-reset" onclick="ineqZoomReset()" title="${currentLang === 'tr' ? 'Sıfırla' : 'Reset'}">↺ ${currentLang === 'tr' ? 'sıfırla' : 'reset'}</span>
    </div>
    <div id="ineq-plot-inner"></div>
    <div class="plot-resize-handle" id="ineq-plot-resize" title="${currentLang === 'tr' ? 'Sürükleyerek yeniden boyutlandır' : 'Drag to resize'}"><span></span></div>
  `;

  slot.querySelector('#ineq-plot-resize').addEventListener('mousedown', e => {
    e.preventDefault();
    const startY = e.clientY, startH = _ineqPlotState ? _ineqPlotState.H : 200;
    const onMove = ev => {
      const el = document.getElementById('ineq-plot-inner');
      if (el) el.style.height = Math.max(120, startH + ev.clientY - startY) + 'px';
    };
    const onUp = ev => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      if (_ineqPlotState) { _ineqPlotState.H = Math.max(120, startH + ev.clientY - startY); drawIneqPlot(); }
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  drawIneqPlot();
}

/**
 * Convert a math expression string to LaTeX using nerdamer's toTeX.
 * Falls back to a basic manual conversion if nerdamer is unavailable.
 */
function exprToTeX(expr) {
  if (!expr) return expr;
  const nd = (typeof nerdamer !== 'undefined') ? nerdamer : null;
  if (nd) {
    try {
      return nd(expr).toTeX();
    } catch {}
  }
  // Basic manual fallback
  return expr
    .replace(/\^\(([^)]+)\)/g, '^{$1}')
    .replace(/\^(-?\d+)/g, '^{$1}')
    .replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}')
    .replace(/pi/g, '\\pi')
    .replace(/\*/g, ' \\cdot ');
}

/**
 * Render a LaTeX string to HTML using KaTeX. Returns raw HTML string.
 */
function renderTeX(latex, displayMode) {
  if (typeof katex === 'undefined') return `<code>${latex}</code>`;
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode: displayMode || false
    });
  } catch {
    return `<code>${latex}</code>`;
  }
}

// Toggle state: 'tex' or 'plain'
let _anaTexMode = 'tex';

window.toggleAnaTexMode = function() {
  _anaTexMode = _anaTexMode === 'tex' ? 'plain' : 'tex';
  const wrapper = document.querySelector('.ana-dual');
  if (wrapper) {
    wrapper.classList.remove('mode-tex', 'mode-plain');
    wrapper.classList.add('mode-' + _anaTexMode);
  }
  const btn = document.getElementById('ana-tex-toggle-btn');
  if (btn) btn.textContent = _anaTexMode === 'tex' ? 'LaTeX' : 'Normal';
};

/**
 * Create dual-mode content: shows LaTeX or plain text depending on toggle.
 */
function dual(texHtml, plainHtml) {
  return `<span class="dual-tex">${texHtml}</span><span class="dual-plain">${plainHtml}</span>`;
}
function dualBlock(texHtml, plainHtml) {
  return `<div data-mode="tex">${texHtml}</div><div data-mode="plain">${plainHtml}</div>`;
}

function renderFuncAnalysis(lineText) {
  const ana = analyzeFuncDef(lineText);
  const cannotParse = currentLang === 'tr' ? 'Ayrıştırılamadı' : 'Could not parse';
  if (!ana) return `<div class="s-empty">${cannotParse}</div>`;

  const { fd, deriv, deriv2, intg, roots, criticals, inflections,
          simplified, factor, horner, symmetry,
          lim0, lim0L, lim0R, limInf, limNInf,
          v, dv, toDisplay, isUni } = ana;
  const { name, vars, expr } = fd;

  const row = (lbl, val, cls = '') =>
    `<div class="ana-row"><span class="ana-lbl" style="min-width:60px">${lbl}</span><span class="ana-val ${cls}">${val}</span></div>`;

  const box = (title, body) =>
    `<div class="ana-box"><div class="ana-title">${title}</div>${body}</div>`;

  let html = `<div class="ana-wrapper ana-dual mode-${_anaTexMode}" style="position:relative">`;
  html += `<button id="ana-tex-toggle-btn" class="ana-tex-toggle" onmousedown="event.preventDefault()" onclick="toggleAnaTexMode()">${_anaTexMode === 'tex' ? 'LaTeX' : 'Normal'}</button>`;

  // Build the header: dual mode
  const origFd = parseFuncDef(lineText);
  const lhsTeX = origFd
    ? `${origFd.name}(${origFd.vars.join(', ')})` 
    : `${name}(${vars.join(', ')})`;
  const rhsTeX = exprToTeX(origFd ? origFd.expr : expr);
  const headerTeX = renderTeX(`${lhsTeX} = ${rhsTeX}`, true);
  const headerPlain = origFd
    ? `${origFd.name}(${origFd.vars.join(', ')}) = ${origFd.expr}`
    : `${name}(${vars.join(', ')}) = ${expr}`;
  html += `<div class="ana-header">${dualBlock(headerTeX, `<span style="font-family:'JetBrains Mono',monospace;font-size:13.5px;font-weight:600;color:#5f3dc4">${esc(headerPlain)}</span>`)}</div>`;

  if (isUni) {
    // ── Plot payload ──────────────────────────────────────────────
    const numericRoots = (roots || []).map(r => {
      const n = parseFloat(r);
      if (!isNaN(n)) return n;
      try { const v2 = math.evaluate(r); return (typeof v2 === 'number' && isFinite(v2)) ? v2 : null; }
      catch { return null; }
    }).filter(x => x !== null);
    const plotPayload = encodeURIComponent(JSON.stringify({ expr: toDisplay(expr), v: dv, roots: numericRoots }));

    // ── 11 Türev ──────────────────────────────────────────────────
    const drvTexH = (deriv ? `<div class="ana-row"><span class="ana-lbl" style="min-width:60px">${name}'(${dv}) =</span><span class="ana-katex-val">${renderTeX(exprToTeX(toDisplay(deriv)))}</span></div>` : '') +
                    (deriv2 ? `<div class="ana-row"><span class="ana-lbl" style="min-width:60px">${name}''(${dv}) =</span><span class="ana-katex-val">${renderTeX(exprToTeX(toDisplay(deriv2)))}</span></div>` : '');
    const drvPlainH = (deriv ? row(`${name}'(${dv}) =`, esc(toDisplay(deriv)), 'orange') : '') +
                      (deriv2 ? row(`${name}''(${dv}) =`, esc(toDisplay(deriv2)), 'orange') : '');
    const turevBody = (deriv || deriv2) ? dualBlock(drvTexH, drvPlainH) : `<div class="ana-none">${t('notCalculated')}</div>`;

    // ── 12 İntegral ───────────────────────────────────────────────
    const intgTexH = intg ? `<div class="ana-row"><span class="ana-katex-val">${renderTeX(exprToTeX(toDisplay(intg)) + '+C')}</span></div>` : '';
    const intgPlainH = intg ? row(`∫ d${dv} =`, esc(toDisplay(intg)) + ' + C') : '';
    const integralBody = intg ? dualBlock(intgTexH, intgPlainH) : `<div class="ana-none">${t('none')}</div>`;

    // ── 21 Limit ──────────────────────────────────────────────────
    let limTexH = '', limPlainH = '';
    const limRow = (texLbl, plainLbl, val) => {
      limTexH += `<div class="ana-row"><span class="ana-lbl" style="min-width:60px">${renderTeX(texLbl)}</span><span class="ana-val">${esc(fmtNum(val))}</span></div>`;
      limPlainH += row(plainLbl, esc(fmtNum(val)));
    };
    if (lim0 !== undefined) limRow(`\\lim_{${dv}\\to 0}`, `${dv}→0`, lim0);
    else {
      if (lim0L !== undefined) limRow(`\\lim_{${dv}\\to 0^-}`, `${dv}→0⁻`, lim0L);
      if (lim0R !== undefined) limRow(`\\lim_{${dv}\\to 0^+}`, `${dv}→0⁺`, lim0R);
    }
    if (limInf !== undefined) limRow(`\\lim_{${dv}\\to\\infty}`, `${dv}→∞`, limInf);
    if (limNInf !== undefined) limRow(`\\lim_{${dv}\\to-\\infty}`, `${dv}→−∞`, limNInf);
    const limitBody = limTexH ? dualBlock(limTexH, limPlainH) : `<div class="ana-none">${t('none')}</div>`;

    // ── 22 Sadeleştirme ───────────────────────────────────────────
    let sadTexH = '', sadPlainH = '';
    if (simplified) {
      sadTexH += `<div class="ana-row"><span class="ana-lbl" style="min-width:60px">${t('simple')}</span><span class="ana-katex-val">${renderTeX(exprToTeX(toDisplay(simplified)))}</span></div>`;
      sadPlainH += row(t('simple'), esc(toDisplay(simplified)));
    }
    if (factor) {
      sadTexH += `<div class="ana-row"><span class="ana-lbl" style="min-width:60px">${t('factor')}</span><span class="ana-katex-val">${renderTeX(exprToTeX(toDisplay(factor)))}</span></div>`;
      sadPlainH += row(t('factor'), esc(toDisplay(factor)));
    }
    if (horner) {
      sadTexH += `<div class="ana-row"><span class="ana-lbl" style="min-width:60px">${t('horner')}</span><span class="ana-katex-val">${renderTeX(exprToTeX(toDisplay(horner)))}</span></div>`;
      sadPlainH += row(t('horner'), esc(toDisplay(horner)));
    }
    const sadelestirmeBody = (simplified || factor || horner) ? dualBlock(sadTexH, sadPlainH) : `<div class="ana-none">${t('same')}</div>`;

    // ── 31 Kök Bulma ──────────────────────────────────────────────
    let rootBody = '';
    if (!roots || roots.length === 0) rootBody = `<div class="ana-none">${t('none')}</div>`;
    else rootBody = roots.map((r, i) => row(`${dv}${i+1}`, esc(toDisplay(r)), 'green')).join('');

    // ── 32 Kritik & Extremum ──────────────────────────────────────
    let extBody = '';
    if (criticals && criticals.length > 0) {
      extBody = criticals.map(c => {
        const lbl = c.kind === 'min' ? t('min') : c.kind === 'max' ? t('max') : t('saddle');
        return row(lbl, `${fmtShort(c.x)} / ${fmtShort(c.y)}`);
      }).join('');
    } else extBody = `<div class="ana-none">${t('none')}</div>`;

    // ── 33 Simetri ────────────────────────────────────────────────
    const simetriBody = symmetry
      ? `<div class="ana-val">${esc(symmetry.split(' — ')[0])}</div><div class="ana-none" style="font-size:9px">${esc(symmetry.split(' — ')[1] || '')}</div>`
      : `<div class="ana-none">${t('unknown')}</div>`;

    // ── 41 Teğet & Normal ─────────────────────────────────────────
    const tegetBody = deriv
      ? `<div style="display:flex;align-items:center;gap:6px;margin:5px 0;flex-wrap:wrap">
           <span class="ana-lbl" style="min-width:auto">${renderTeX('x_0 =')}</span>
           <input class="ana-tan-input" id="ana-tan-x" type="number" value="0" step="any" oninput="computeAnaTangent()" style="width:60px" />
         </div>
         <div id="ana-tan-result"></div>`
      : `<div class="ana-none">${t('noDerivative')}</div>`;

    // ── 42 Büküm Noktaları ────────────────────────────────────────
    let infBody = '';
    if (inflections && inflections.length > 0) {
      infBody = inflections.map((p, i) => row(`${t('inflectionPrefix')}${i+1}`, `${dv}=${fmtShort(p.x)}`)).join('');
    } else infBody = `<div class="ana-none">${t('none')}</div>`;

    // ── Grid ──────────────────────────────────────────────────────
    html += `<div class="ana-grid">`;

    // Row 1
    html += `<div class="ana-box" style="grid-column:1;grid-row:1"><div class="ana-title">${t('derivative')}</div>${turevBody}</div>`;
    html += `<div class="ana-box" style="grid-column:2;grid-row:1"><div class="ana-title">${t('integral')}</div>${integralBody}</div>`;
    // 13+23: plot — col 3, rows 1–2
    html += `<div class="ana-box" style="grid-column:3;grid-row:1/3;padding:0;overflow:hidden;min-height:220px">
               <div id="ana-plot-slot" data-d="${plotPayload}" style="height:100%"></div>
             </div>`;

    // Row 2
    html += `<div class="ana-box" style="grid-column:1;grid-row:2"><div class="ana-title">${t('limit')}</div>${limitBody}</div>`;
    html += `<div class="ana-box" style="grid-column:2;grid-row:2"><div class="ana-title">${t('simplification')}</div>${sadelestirmeBody}</div>`;

    // Row 3
    html += `<div class="ana-box" style="grid-column:1;grid-row:3"><div class="ana-title">${t('rootFinding')}</div>${rootBody}</div>`;
    html += `<div class="ana-box" style="grid-column:2;grid-row:3"><div class="ana-title">${t('criticalExtremum')}</div>${extBody}</div>`;
    html += `<div class="ana-box" style="grid-column:3;grid-row:3"><div class="ana-title">${t('symmetry')}</div>${simetriBody}</div>`;

    // Row 4
    html += `<div class="ana-box" style="grid-column:1;grid-row:4"><div class="ana-title">${t('tangentNormal')}</div>${tegetBody}</div>`;
    html += `<div class="ana-box" style="grid-column:2;grid-row:4"><div class="ana-title">${t('inflectionPoints')}</div>${infBody}</div>`;

    html += `</div>`; // end grid

  } else {
    // ── Çok değişkenli analiz ────────────────────────────────────
    const { partials = {}, partials2 = {}, mixedPartial } = ana;
    const multiRow = (lbl, val, cls = '') =>
      `<div class="ana-row"><span class="ana-lbl" style="min-width:80px">${lbl}</span><span class="ana-val ${cls}">${val}</span></div>`;

    if (vars.length === 2) {
      const [vx, vy] = vars;

      // ∂f/∂x
      const pxTexH = partials[vx]
        ? `<div class="ana-row"><span class="ana-katex-val">${renderTeX(`\\frac{\\partial f}{\\partial ${vx}} = ${exprToTeX(partials[vx])}`)}</span></div>` : '';
      const pxPlainH = partials[vx] ? multiRow(`∂f/∂${vx} =`, esc(partials[vx]), 'orange') : '';

      // ∂f/∂y
      const pyTexH = partials[vy]
        ? `<div class="ana-row"><span class="ana-katex-val">${renderTeX(`\\frac{\\partial f}{\\partial ${vy}} = ${exprToTeX(partials[vy])}`)}</span></div>` : '';
      const pyPlainH = partials[vy] ? multiRow(`∂f/∂${vy} =`, esc(partials[vy]), 'orange') : '';

      // Hessian (∂²f/∂x², ∂²f/∂y², ∂²f/∂x∂y)
      const hxxTexH = partials2[vx]
        ? `<div class="ana-row"><span class="ana-katex-val">${renderTeX(`\\frac{\\partial^2 f}{\\partial ${vx}^2} = ${exprToTeX(partials2[vx])}`)}</span></div>` : '';
      const hyyTexH = partials2[vy]
        ? `<div class="ana-row"><span class="ana-katex-val">${renderTeX(`\\frac{\\partial^2 f}{\\partial ${vy}^2} = ${exprToTeX(partials2[vy])}`)}</span></div>` : '';
      const hxyTexH = mixedPartial
        ? `<div class="ana-row"><span class="ana-katex-val">${renderTeX(`\\frac{\\partial^2 f}{\\partial ${vx}\\partial ${vy}} = ${exprToTeX(mixedPartial)}`)}</span></div>` : '';
      const hessTexH = hxxTexH + hyyTexH + hxyTexH;
      const hxxPlainH = partials2[vx] ? multiRow(`∂²f/∂${vx}² =`, esc(partials2[vx])) : '';
      const hyyPlainH = partials2[vy] ? multiRow(`∂²f/∂${vy}² =`, esc(partials2[vy])) : '';
      const hxyPlainH = mixedPartial  ? multiRow(`∂²f/∂${vx}∂${vy} =`, esc(mixedPartial)) : '';
      const hessPlainH = hxxPlainH + hyyPlainH + hxyPlainH;

      // Gradyan
      const gradTexH = (partials[vx] && partials[vy])
        ? `<div class="ana-row"><span class="ana-katex-val">${renderTeX(`\\nabla f = \\left(${exprToTeX(partials[vx])},\\;${exprToTeX(partials[vy])}\\right)`)}</span></div>` : '';
      const gradPlainH = (partials[vx] && partials[vy])
        ? multiRow('∇f =', `(${esc(partials[vx])}, ${esc(partials[vy])})`) : '';

      const plotPayload3d = encodeURIComponent(JSON.stringify({ expr: toDisplay(expr), varX: vx, varY: vy }));

      html += `<div class="ana-grid">`;

      // Row 1 col 1: ∂f/∂x
      html += `<div class="ana-box" style="grid-column:1;grid-row:1"><div class="ana-title">∂f/∂${vx}</div>${pxTexH ? dualBlock(pxTexH, pxPlainH) : `<div class="ana-none">${t('notCalculated')}</div>`}</div>`;
      // Row 1 col 2: ∂f/∂y
      html += `<div class="ana-box" style="grid-column:2;grid-row:1"><div class="ana-title">∂f/∂${vy}</div>${pyTexH ? dualBlock(pyTexH, pyPlainH) : `<div class="ana-none">${t('notCalculated')}</div>`}</div>`;
      // Col 3 rows 1-2: 3B yüzey grafik
      html += `<div class="ana-box" style="grid-column:3;grid-row:1/3;padding:0;overflow:hidden;min-height:220px">
                 <div id="ana-3d-slot" data-d="${plotPayload3d}" style="height:100%"></div>
               </div>`;
      // Row 2 col 1: Hessian
      html += `<div class="ana-box" style="grid-column:1;grid-row:2"><div class="ana-title">${t('hessian')}</div>${hessTexH ? dualBlock(hessTexH, hessPlainH) : `<div class="ana-none">${t('notCalculated')}</div>`}</div>`;
      // Row 2 col 2: Gradyan
      html += `<div class="ana-box" style="grid-column:2;grid-row:2"><div class="ana-title">${t('gradient')}</div>${gradTexH ? dualBlock(gradTexH, gradPlainH) : `<div class="ana-none">${t('notCalculated')}</div>`}</div>`;

      html += `</div>`; // end grid

    } else {
      // 3+ değişken: sadece kısmi türevler
      const box3 = (title, body) =>
        `<div class="ana-box"><div class="ana-title">${title}</div>${body}</div>`;
      html += `<div class="ana-grid">`;
      for (const pv of vars) {
        const pTexH = partials[pv]
          ? `<div class="ana-row"><span class="ana-katex-val">${renderTeX(`\\frac{\\partial f}{\\partial ${pv}} = ${exprToTeX(partials[pv])}`)}</span></div>` : '';
        const pPlainH = partials[pv] ? multiRow(`∂f/∂${pv} =`, esc(partials[pv]), 'orange') : '';
        html += box3(`∂f/∂${pv}`, pTexH ? dualBlock(pTexH, pPlainH) : `<div class="ana-none">${t('notCalculated')}</div>`);
      }
      html += `</div>`;
    }
  }

  html += `</div>`; // end wrapper
  return html;
}

// Teğet ve Normal doğrusu hesaplama — ana-tan-x input'undan çağrılır
window.computeAnaTangent = function() {
  const input  = document.getElementById('ana-tan-x');
  const result = document.getElementById('ana-tan-result');
  if (!input || !result || !_lastAna) return;

  const a = parseFloat(input.value);
  if (isNaN(a)) {
    result.innerHTML = `<div class="ana-none">${t('invalidValue')}</div>`;
    return;
  }

  const { fd, deriv, v, dv, toDisplay } = _lastAna;
  const { expr } = fd;

  try {
    const sc  = mkScope(v, a);
    const fa  = math.evaluate(expr,  sc);
    const fpa = math.evaluate(deriv, sc);

    if (typeof fa !== 'number' || !isFinite(fa) || typeof fpa !== 'number' || !isFinite(fpa)) {
      result.innerHTML = `<div class="ana-none">${t('undefined')}</div>`;
      return;
    }

    const bTan = fa - fpa * a;
    const tanEq = fmtLinEq(fpa, bTan, v);

    let normEq;
    if (Math.abs(fpa) < 1e-9) {
      normEq = `${v} = ${fmtShort(a)}`;
    } else {
      const mNorm = -1 / fpa;
      normEq = fmtLinEq(mNorm, fa - mNorm * a, v);
    }

    // Build LaTeX for tangent/normal
    const tanTeX = exprToTeX(toDisplay(tanEq.replace('y = ', '')));
    const normTeX = exprToTeX(toDisplay(normEq.replace('y = ', '').replace(`${v} = `, '')));
    const isVertNorm = normEq.startsWith(v);

    const texH = `<div class="ana-row"><span class="ana-lbl">${t('tangent')}</span><span class="ana-katex-val">${renderTeX('y = ' + tanTeX)}</span></div>` +
                 `<div class="ana-row"><span class="ana-lbl">${t('normal')}</span><span class="ana-katex-val">${renderTeX((isVertNorm ? dv + ' = ' : 'y = ') + normTeX)}</span></div>`;
    const plainH = `<div class="ana-row"><span class="ana-lbl">${t('tangent')}</span><span class="ana-val">${esc(toDisplay(tanEq))}</span></div>` +
                   `<div class="ana-row"><span class="ana-lbl">${t('normal')}</span><span class="ana-val">${esc(toDisplay(normEq))}</span></div>`;

    result.innerHTML = dualBlock(texH, plainH);
  } catch {
    result.innerHTML = `<div class="ana-none">${t('notCalculated')}</div>`;
  }
};

// Fonksiyon analiz paneli grafiği — otomatik render
// Sample the function and return a clipped [yMin, yMax] domain.
// Uses percentile clipping so asymptotes/singularities don't dominate.
function computeYDomain(expr, v, xMin, xMax, nSamples = 400) {
  const step = (xMax - xMin) / nSamples;
  const ys = [];
  for (let i = 0; i <= nSamples; i++) {
    const x = xMin + i * step;
    try {
      const y = math.evaluate(expr, { [v]: x });
      if (typeof y === 'number' && isFinite(y)) ys.push(y);
    } catch {}
  }
  if (ys.length < 2) return null;
  ys.sort((a, b) => a - b);
  // Clip to 2nd–98th percentile to suppress singularities
  const lo = ys[Math.floor(ys.length * 0.02)];
  const hi = ys[Math.floor(ys.length * 0.98)];
  if (lo === hi) return [lo - 1, hi + 1];
  const pad = (hi - lo) * 0.12;
  return [lo - pad, hi + pad];
}

// ================================================================
// 3D SURFACE PLOT (canvas-based, no external library)
// ================================================================

function render3DAnalysisPlot() {
  const slot = document.getElementById('ana-3d-slot');
  if (!slot || !slot.dataset.d) return;

  let payload;
  try { payload = JSON.parse(decodeURIComponent(slot.dataset.d)); }
  catch { slot.textContent = 'Veri hatası'; return; }

  const { expr, varX, varY } = payload;

  const W = Math.max(120, slot.offsetWidth || slot.parentElement?.offsetWidth || 200);
  const H = Math.max(160, slot.parentElement?.offsetHeight || Math.round(W * 1.1));

  // Sample grid
  const N = 36;
  const xR = [-5, 5], yR = [-5, 5];
  const xStep = (xR[1] - xR[0]) / (N - 1);
  const yStep = (yR[1] - yR[0]) / (N - 1);
  const grid = [];
  const allZ = [];

  for (let i = 0; i < N; i++) {
    grid[i] = [];
    for (let j = 0; j < N; j++) {
      const x = xR[0] + i * xStep, y = yR[0] + j * yStep;
      let z = null;
      try {
        const val = math.evaluate(expr, { [varX]: x, [varY]: y });
        if (typeof val === 'number' && isFinite(val)) z = val;
      } catch {}
      grid[i][j] = z;
      if (z !== null) allZ.push(z);
    }
  }

  if (allZ.length === 0) {
    slot.innerHTML = `<div style="padding:20px;text-align:center;color:#adb5bd;font-size:12px">${t('notCalculated')}</div>`;
    return;
  }

  allZ.sort((a, b) => a - b);
  const zLo = allZ[Math.floor(allZ.length * 0.02)];
  const zHi = allZ[Math.floor(allZ.length * 0.98)];
  const zRange = zHi > zLo ? zHi - zLo : 1;

  // Build canvas
  slot.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  canvas.style.cssText = 'display:block;cursor:grab;border-radius:0';
  slot.appendChild(canvas);

  // Hint label
  const hint = document.createElement('div');
  hint.style.cssText = 'position:absolute;bottom:4px;right:8px;font-size:9px;color:#adb5bd;pointer-events:none';
  hint.textContent = t('dragToRotate');
  slot.style.position = 'relative';
  slot.appendChild(hint);

  const ctx = canvas.getContext('2d');
  let rotX = 1.0, rotZ = 0.6;

  function project(nx, ny, nz) {
    const cZ = Math.cos(rotZ), sZ = Math.sin(rotZ);
    const rx = nx * cZ - ny * sZ;
    const ry = nx * sZ + ny * cZ;
    const cX = Math.cos(rotX), sX = Math.sin(rotX);
    const fy =  ry * cX - nz * sX;
    const fz =  ry * sX + nz * cX;
    const scale = Math.min(W, H) * 0.36;
    return [rx * scale + W / 2, -fy * scale + H * 0.52, fz];
  }

  // Warm rainbow colormap (cool→warm similar to Wolfram default)
  const cmStops = [
    [0,   [59,  76,  192]],
    [0.2, [88,  180, 240]],
    [0.4, [50,  210, 130]],
    [0.6, [220, 220, 50 ]],
    [0.8, [234, 130, 30 ]],
    [1.0, [180, 24,  43 ]],
  ];
  function zColor(t) {
    t = Math.max(0, Math.min(1, t));
    let i = 0;
    while (i < cmStops.length - 2 && t > cmStops[i+1][0]) i++;
    const [t0, c0] = cmStops[i], [t1, c1] = cmStops[i+1];
    const u = (t - t0) / (t1 - t0);
    return `rgb(${Math.round(c0[0]+u*(c1[0]-c0[0]))},${Math.round(c0[1]+u*(c1[1]-c0[1]))},${Math.round(c0[2]+u*(c1[2]-c0[2]))})`;
  }

  const zB = -0.7, zT = 0.7;
  const toNZ = z => (z - zLo) / zRange * 1.4 + zB;

  // Light direction for diffuse shading
  const Lx = 0.5, Ly = -0.3, Lz = 0.9;
  const Llen = Math.sqrt(Lx*Lx+Ly*Ly+Lz*Lz);

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // ── Bounding box ─────────────────────────────────────────────
    // 8 corners: 0-3 = bottom, 4-7 = top (same XY order)
    const bp = [
      project(-1,-1,zB), project(1,-1,zB), project(1,1,zB), project(-1,1,zB),
      project(-1,-1,zT), project(1,-1,zT), project(1,1,zT), project(-1,1,zT),
    ];

    // Identify back-bottom corner (smallest projected y = furthest from viewer)
    let backI = 0;
    for (let k = 1; k < 4; k++) if (bp[k][1] < bp[backI][1]) backI = k;
    const nI = (backI+1)%4, pI = (backI+3)%4; // neighbors of back corner

    // Draw 2 back wall panels
    const wallFill = 'rgba(225,228,238,0.72)';
    const edgeCol  = 'rgba(140,145,160,0.85)';
    const fillQuad = (i0,i1,i2,i3, fill) => {
      ctx.beginPath();
      ctx.moveTo(bp[i0][0],bp[i0][1]); ctx.lineTo(bp[i1][0],bp[i1][1]);
      ctx.lineTo(bp[i2][0],bp[i2][1]); ctx.lineTo(bp[i3][0],bp[i3][1]);
      ctx.closePath();
      ctx.fillStyle = fill; ctx.fill();
      ctx.strokeStyle = edgeCol; ctx.lineWidth = 0.8; ctx.stroke();
    };
    fillQuad(backI, nI, nI+4, backI+4, wallFill);
    fillQuad(backI, pI, pI+4, backI+4, wallFill);
    fillQuad(0, 1, 2, 3, 'rgba(210,214,228,0.5)'); // floor

    // Back vertical edge
    ctx.beginPath();
    ctx.moveTo(bp[backI][0],bp[backI][1]); ctx.lineTo(bp[backI+4][0],bp[backI+4][1]);
    ctx.strokeStyle = edgeCol; ctx.lineWidth = 0.8; ctx.stroke();

    // ── Axis tick labels ─────────────────────────────────────────
    const fontSize = Math.max(9, Math.round(W * 0.027));
    ctx.font = `${fontSize}px monospace`;
    ctx.fillStyle = 'rgba(90,95,115,0.9)';
    ctx.textAlign = 'center';
    const fmtTick = v => { const r = Math.round(v*100)/100; return r === 0 ? '0' : String(r); };

    // X ticks — along floor edge backI→nI direction (varies with view)
    const xEdgeA = backI, xEdgeB = nI; // one of the x-aligned floor edges
    [0, 0.5, 1].forEach(u => {
      const nx = -1 + u * 2, ny = -1; // x varies, y fixed at -1 (approx)
      const xv = xR[0] + u * (xR[1] - xR[0]);
      const p = project(nx, -1, zB);
      const offX = (bp[xEdgeB][0] - bp[xEdgeA][0]);
      const offY = (bp[xEdgeB][1] - bp[xEdgeA][1]);
      const len  = Math.sqrt(offX*offX+offY*offY) || 1;
      ctx.fillText(fmtTick(xv), p[0] - offY/len*10, p[1] + offX/len*10 + fontSize*0.4);
    });

    // Y ticks — along floor edge perpendicular to x
    [0, 0.5, 1].forEach(u => {
      const ny = -1 + u * 2, yv = yR[0] + u * (yR[1] - yR[0]);
      const p = project(-1, ny, zB);
      const eA = bp[0], eB = bp[3]; // edge -1,-1 → -1,1
      const offX = eB[0]-eA[0], offY = eB[1]-eA[1];
      const len  = Math.sqrt(offX*offX+offY*offY) || 1;
      ctx.fillText(fmtTick(yv), p[0] - offY/len*10, p[1] + offX/len*10 + fontSize*0.4);
    });

    // Z ticks — along back vertical edge
    const bxCorner = (backI===1||backI===2) ? 1 : -1;
    const byCorner = (backI===2||backI===3) ? 1 : -1;
    [0, 0.5, 1].forEach(u => {
      const nz = zB + u*(zT-zB), zv = zLo + u*zRange;
      const p = project(bxCorner, byCorner, nz);
      ctx.textAlign = 'right';
      ctx.fillText(fmtTick(zv), p[0]-6, p[1]+fontSize*0.35);
    });
    ctx.textAlign = 'center';

    // ── Surface quads ─────────────────────────────────────────────
    const quads = [];
    for (let i = 0; i < N-1; i++) {
      for (let j = 0; j < N-1; j++) {
        const z00=grid[i][j], z10=grid[i+1][j], z01=grid[i][j+1], z11=grid[i+1][j+1];
        if (z00===null||z10===null||z01===null||z11===null) continue;
        const nx0=(i/(N-1))*2-1, ny0=(j/(N-1))*2-1;
        const nx1=((i+1)/(N-1))*2-1, ny1=((j+1)/(N-1))*2-1;
        const nz00=toNZ(z00), nz10=toNZ(z10), nz01=toNZ(z01), nz11=toNZ(z11);
        const p00=project(nx0,ny0,nz00), p10=project(nx1,ny0,nz10);
        const p11=project(nx1,ny1,nz11), p01=project(nx0,ny1,nz01);
        // Face normal (3D cross product) for diffuse lighting
        const e1=[nx1-nx0, 0, nz10-nz00], e2=[0, ny1-ny0, nz01-nz00];
        const nx_n=e1[1]*e2[2]-e1[2]*e2[1], ny_n=e1[2]*e2[0]-e1[0]*e2[2], nz_n=e1[0]*e2[1]-e1[1]*e2[0];
        const nlen=Math.sqrt(nx_n*nx_n+ny_n*ny_n+nz_n*nz_n)||1;
        const diffuse=Math.max(0.25, (nx_n/nlen*Lx+ny_n/nlen*Ly+nz_n/nlen*Lz)/Llen);
        const zAvg=(z00+z10+z01+z11)/4;
        const depth=(p00[2]+p10[2]+p11[2]+p01[2])/4;
        quads.push({pts:[p00,p10,p11,p01], t:(zAvg-zLo)/zRange, diffuse, depth});
      }
    }
    quads.sort((a,b) => a.depth-b.depth);

    for (const q of quads) {
      const [p0,p1,p2,p3] = q.pts;
      ctx.beginPath();
      ctx.moveTo(p0[0],p0[1]); ctx.lineTo(p1[0],p1[1]);
      ctx.lineTo(p2[0],p2[1]); ctx.lineTo(p3[0],p3[1]);
      ctx.closePath();
      ctx.fillStyle = zColor(q.t);
      ctx.fill();
      // Diffuse shading overlay
      const shade = Math.round((1-q.diffuse)*160);
      ctx.fillStyle = `rgba(0,0,0,${((1-q.diffuse)*0.45).toFixed(2)})`;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = 0.45;
      ctx.stroke();
    }

    // ── Front box edges (drawn over surface) ─────────────────────
    const frontIs = [0,1,2,3].filter(k=>k!==backI);
    // Top face
    ctx.beginPath();
    for (let k=0;k<4;k++) k===0?ctx.moveTo(bp[4][0],bp[4][1]):ctx.lineTo(bp[4+k][0],bp[4+k][1]);
    ctx.closePath(); ctx.strokeStyle=edgeCol; ctx.lineWidth=1; ctx.stroke();
    // Front vertical edges
    frontIs.forEach(k=>{
      ctx.beginPath(); ctx.moveTo(bp[k][0],bp[k][1]); ctx.lineTo(bp[k+4][0],bp[k+4][1]);
      ctx.strokeStyle=edgeCol; ctx.lineWidth=1; ctx.stroke();
    });
    // Front bottom edges (those not touching backI)
    for (let k=0;k<4;k++) {
      if (k===backI || (k+1)%4===backI) continue;
      ctx.beginPath(); ctx.moveTo(bp[k][0],bp[k][1]); ctx.lineTo(bp[(k+1)%4][0],bp[(k+1)%4][1]);
      ctx.strokeStyle=edgeCol; ctx.lineWidth=1; ctx.stroke();
    }

    // ── Axis labels ───────────────────────────────────────────────
    ctx.font = `bold ${Math.max(10,Math.round(W*0.032))}px monospace`;
    ctx.fillStyle = 'rgba(70,75,100,0.95)';
    ctx.textAlign = 'center';
    const axX = project(0, -1.28, zB);
    const axY = project(-1.28, 0, zB);
    ctx.fillText(varX, axX[0], axX[1]+4);
    ctx.fillText(varY, axY[0], axY[1]+4);
    // Z label next to back top corner
    const zt = project(
      backI===0||backI===3 ? -1.22 : 1.22,
      backI===0||backI===1 ? -1.22 : 1.22,
      zT
    );
    ctx.fillText(expr.length > 8 ? 'f' : expr.slice(0,6), zt[0], zt[1]-6);
  }

  draw();

  let dragging = false, lastMX, lastMY;
  canvas.addEventListener('mousedown', e => {
    dragging = true; lastMX = e.clientX; lastMY = e.clientY;
    canvas.style.cursor = 'grabbing';
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    rotZ += (e.clientX - lastMX) * 0.013;
    rotX -= (e.clientY - lastMY) * 0.013;
    rotX = Math.max(0.15, Math.min(Math.PI - 0.15, rotX));
    lastMX = e.clientX; lastMY = e.clientY;
    draw();
  });
  document.addEventListener('mouseup', () => {
    dragging = false;
    canvas.style.cursor = 'grab';
  });
}

// Persistent state for analysis plot — lets zoom buttons update and re-draw
let _anaPlotState = null;

function _buildAnaFnData(state) {
  const { expr, v, roots, yIntercept } = state;
  const fnData = [
    { fn: expr, sampler: 'builtIn', graphType: 'polyline', color: '#1971c2' }
  ];
  if (roots.length > 0) {
    fnData.push({
      points: roots.map(x => [x, 0]),
      fnType: 'points', graphType: 'scatter', color: '#2f9e44',
      attr: { r: 5, 'stroke-width': 2, stroke: '#fff' }
    });
    fnData.push({ fn: '0', graphType: 'polyline', color: '#ced4da', nSamples: 2 });
  }
  if (yIntercept !== null) {
    fnData.push({
      points: [[0, yIntercept]],
      fnType: 'points', graphType: 'scatter', color: '#e8590c',
      attr: { r: 5, 'stroke-width': 2, stroke: '#fff' }
    });
  }
  const annotations = roots.map(x => ({ x, text: `x=${+x.toPrecision(4)}` }));
  if (yIntercept !== null) annotations.push({ y: yIntercept, text: `y=${+yIntercept.toPrecision(4)}` });
  return { fnData, annotations };
}

function drawAnaPlot(container) {
  if (!container || !_anaPlotState) return;
  container.innerHTML = '';
  const s = _anaPlotState;
  const { fnData, annotations } = _buildAnaFnData(s);
  const opts = {
    target: container,
    width: s.W, height: s.H,
    xAxis: { domain: s.xDomain },
    grid: true, data: fnData, annotations
  };
  if (s.yDomain) opts.yAxis = { domain: s.yDomain };
  try {
    const plot = functionPlot(opts);
    // Sync native pan/zoom back into state so buttons start from current view
    try {
      plot.on('zoom', () => {
        if (_anaPlotState && plot.meta && plot.meta.xScale) {
          _anaPlotState.xDomain = plot.meta.xScale.domain().map(Number);
          _anaPlotState.yDomain = plot.meta.yScale.domain().map(Number);
        }
      });
    } catch {}
  } catch (err) {
    const errMsg = currentLang === 'tr' ? 'Grafik çizilemedi: ' : 'Could not draw plot: ';
    container.innerHTML = `<div style="color:#c92a2a;font-size:12px;padding:8px">${errMsg}${err.message}</div>`;
  }
}

window.anaZoom = function(axis, factor) {
  if (!_anaPlotState) return;
  const s = _anaPlotState;
  const [lo, hi] = axis === 'x' ? s.xDomain : (s.yDomain || [-10, 10]);
  const mid = (lo + hi) / 2;
  const half = (hi - lo) / 2 * factor;
  if (axis === 'x') s.xDomain = [mid - half, mid + half];
  else s.yDomain = [mid - half, mid + half];
  drawAnaPlot(document.getElementById('ana-plot-inner'));
};

window.anaZoomReset = function() {
  if (!_anaPlotState) return;
  const s = _anaPlotState;
  s.xDomain = s.xDomainInit.slice();
  s.yDomain = s.yDomainInit ? s.yDomainInit.slice() : null;
  drawAnaPlot(document.getElementById('ana-plot-inner'));
};

function renderAnaPlot() {
  const slot = document.getElementById('ana-plot-slot');
  if (!slot || !slot.dataset.d) return;

  let payload;
  const dataError = currentLang === 'tr' ? 'Veri hatası' : 'Data error';
  try { payload = JSON.parse(decodeURIComponent(slot.dataset.d)); }
  catch { slot.textContent = dataError; return; }

  const { expr, v, roots } = payload;
  const slotW = slot.offsetWidth || slot.parentElement?.offsetWidth || 0;
  const sidebar = document.getElementById('sidebar');
  const W = Math.max(120, slotW > 0 ? slotW - 4 : (sidebar ? sidebar.clientWidth : 230) - 20);
  const slotH = slot.parentElement?.offsetHeight || 0;
  const H = slotH > 40 ? slotH - 4 : Math.round(W * 1.1);

  // Y-intercept: f(0)
  let yIntercept = null;
  try {
    const yVal = math.evaluate(expr, { [v]: 0 });
    if (typeof yVal === 'number' && isFinite(yVal)) yIntercept = yVal;
  } catch {}

  // X domain: always include x=0 so y-axis is visible
  let xMin = -10, xMax = 10;
  const keyPoints = [...roots, 0];
  const rMin = Math.min(...keyPoints), rMax = Math.max(...keyPoints);
  const pad = Math.max(3, (rMax - rMin) * 0.6);
  const half = Math.max(Math.abs(rMin - pad), Math.abs(rMax + pad));
  xMin = -half - 2; xMax = half + 2;

  const yDomain = computeYDomain(expr, v, xMin, xMax);

  _anaPlotState = {
    expr, v, roots, yIntercept, W, H,
    xDomain: [xMin, xMax], yDomain,
    xDomainInit: [xMin, xMax], yDomainInit: yDomain ? yDomain.slice() : null
  };

  slot.innerHTML = `
    <div class="ana-zoom-bar">
      <span class="ana-zoom-lbl">X</span>
      <button class="ana-zoom-btn" onmousedown="event.preventDefault()" onclick="anaZoom('x',0.6)" title="${currentLang === 'tr' ? 'X Yakınlaştır' : 'Zoom in X'}">−</button>
      <button class="ana-zoom-btn" onmousedown="event.preventDefault()" onclick="anaZoom('x',1.67)" title="${currentLang === 'tr' ? 'X Uzaklaştır' : 'Zoom out X'}">+</button>
      <span class="ana-zoom-lbl">Y</span>
      <button class="ana-zoom-btn" onmousedown="event.preventDefault()" onclick="anaZoom('y',0.6)" title="${currentLang === 'tr' ? 'Y Yakınlaştır' : 'Zoom in Y'}">−</button>
      <button class="ana-zoom-btn" onmousedown="event.preventDefault()" onclick="anaZoom('y',1.67)" title="${currentLang === 'tr' ? 'Y Uzaklaştır' : 'Zoom out Y'}">+</button>
      <span class="ana-zoom-reset" onmousedown="event.preventDefault()" onclick="anaZoomReset()" title="${currentLang === 'tr' ? 'Sıfırla' : 'Reset'}">↺ ${currentLang === 'tr' ? 'sıfırla' : 'reset'}</span>
    </div>
    <div id="ana-plot-inner"></div>
    <div class="plot-resize-handle" id="ana-plot-resize" title="${currentLang === 'tr' ? 'Sürükleyerek yeniden boyutlandır' : 'Drag to resize'}"><span></span></div>
  `;

  slot.querySelector('#ana-plot-resize').addEventListener('mousedown', e => {
    e.preventDefault();
    const startY = e.clientY, startH = _anaPlotState ? _anaPlotState.H : 200;
    const onMove = ev => {
      const el = document.getElementById('ana-plot-inner');
      if (el) el.style.height = Math.max(120, startH + ev.clientY - startY) + 'px';
    };
    const onUp = ev => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      if (_anaPlotState) {
        _anaPlotState.H = Math.max(120, startH + ev.clientY - startY);
        drawAnaPlot(document.getElementById('ana-plot-inner'));
      }
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  drawAnaPlot(document.getElementById('ana-plot-inner'));
}

// ================================================================
// STATUS BAR
// ================================================================

function getSubstitutedString(expr, vars) {
  if (!expr) return '';
  let substituted = expr;
  // Değişkenleri uzunluklarına göre sırala (x1'den önce x'i değiştirmemek için)
  const keys = Object.keys(vars).sort((a, b) => b.length - a.length);
  keys.forEach(k => {
    const val = vars[k].val;
    // Sadece sayısal veya basit değerleri yerleştir
    if (typeof val === 'number' || (val && val.isBigNumber) || (val && val.isFraction)) {
      const reg = new RegExp('\\b' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'g');
      substituted = substituted.replace(reg, fmtVal(val));
    }
  });
  return substituted;
}

// ================================================================
// NUMBER LINE VISUALIZATION
// ================================================================

function renderNumberLine(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object' && (value.isMatrix || value.isNode)) return '';

  let numValue;
  if (isUnit(value)) {
    try { numValue = value.toNumber(); } catch { return ''; }
  } else if (typeof value === 'number') {
    numValue = value;
  } else if (value && value.isBigNumber) {
    numValue = value.toNumber();
  } else if (value && value.isFraction) {
    numValue = value.valueOf();
  } else {
    return ''; // Not a numeric type we can visualize
  }
  
  if (!isFinite(numValue) || isNaN(numValue)) return ''; // Skip infinity/NaN
  if (Math.abs(numValue) > 1e6) return ''; // Skip very large numbers
  
  // Find the two integers the value is between
  const floor = Math.floor(numValue);
  const ceil = Math.ceil(numValue);
  
  // If it's already an integer
  if (floor === ceil) {
    const left = floor - 1;
    const right = floor + 1;
    const leftMargin = 15;
    const rightMargin = 15;
    
    return `
      <div class="ana-box" style="margin-top:8px; border-color:#e9ecef; background:#f8f9fa; padding:12px 10px">
        <div class="ana-title" style="color:#868e96; margin-bottom:8px">${currentLang === 'tr' ? 'Sayı Doğrusu' : 'Number Line'}</div>
        <div style="position:relative; height:40px; padding:0 10px">
          <div style="position:absolute; left:${leftMargin}%; right:${rightMargin}%; top:50%; height:2px; background:#dee2e6"></div>
          <div style="position:absolute; left:${leftMargin}%; top:50%; transform:translate(-50%, -50%)">
            <div style="width:8px; height:8px; border-radius:50%; background:#dee2e6"></div>
            <div style="position:absolute; top:16px; left:50%; transform:translateX(-50%); font-size:11px; color:#868e96; font-family:'JetBrains Mono'">${left}</div>
          </div>
          <div style="position:absolute; left:50%; top:50%; transform:translate(-50%, -50%)">
            <div style="width:12px; height:12px; border-radius:50%; background:#1971c2; box-shadow:0 0 0 3px rgba(25,113,194,0.2)"></div>
            <div style="position:absolute; top:16px; left:50%; transform:translateX(-50%); font-size:12px; color:#1971c2; font-weight:700; font-family:'JetBrains Mono'">${floor}</div>
          </div>
          <div style="position:absolute; left:${100 - rightMargin}%; top:50%; transform:translate(-50%, -50%)">
            <div style="width:8px; height:8px; border-radius:50%; background:#dee2e6"></div>
            <div style="position:absolute; top:16px; left:50%; transform:translateX(-50%); font-size:11px; color:#868e96; font-family:'JetBrains Mono'">${right}</div>
          </div>
        </div>
      </div>
    `;
  }
  
  // Value is between two integers
  const ratio = numValue - floor; // 0 to 1, position between floor and ceil
  const leftMargin = 15; // percentage from left edge
  const rightMargin = 15; // percentage from right edge
  const usableWidth = 100 - leftMargin - rightMargin; // 70%
  const position = leftMargin + (ratio * usableWidth); // Calculate position in usable range
  
  return `
    <div class="ana-box" style="margin-top:8px; border-color:#e9ecef; background:#f8f9fa; padding:12px 10px">
      <div class="ana-title" style="color:#868e96; margin-bottom:8px">${currentLang === 'tr' ? 'Sayı Doğrusu' : 'Number Line'}</div>
      <div style="position:relative; height:40px; padding:0 10px">
        <div style="position:absolute; left:${leftMargin}%; right:${rightMargin}%; top:50%; height:2px; background:#dee2e6"></div>
        <div style="position:absolute; left:${position}%; top:50%; transform:translate(-50%, -50%)">
          <div style="width:10px; height:10px; border-radius:50%; background:#e8590c; box-shadow:0 0 0 3px rgba(232,89,12,0.2)"></div>
          <div style="position:absolute; top:-22px; left:50%; transform:translateX(-50%); white-space:nowrap; font-size:11px; color:#e8590c; font-weight:700; font-family:'JetBrains Mono'">${numValue.toFixed(2)}</div>
        </div>
        <div style="position:absolute; left:${leftMargin}%; top:50%; transform:translate(-50%, -50%)">
          <div style="width:10px; height:10px; border-radius:50%; background:#1971c2"></div>
          <div style="position:absolute; top:16px; left:50%; transform:translateX(-50%); font-size:12px; color:#1971c2; font-weight:600; font-family:'JetBrains Mono'">${floor}</div>
        </div>
        <div style="position:absolute; left:${100 - rightMargin}%; top:50%; transform:translate(-50%, -50%)">
          <div style="width:10px; height:10px; border-radius:50%; background:#1971c2"></div>
          <div style="position:absolute; top:16px; left:50%; transform:translateX(-50%); font-size:12px; color:#1971c2; font-weight:600; font-family:'JetBrains Mono'">${ceil}</div>
        </div>
      </div>
      <div style="text-align:center; margin-top:8px; font-size:11px; color:#868e96">
        ${floor} < ${numValue.toFixed(3)} < ${ceil}
      </div>
    </div>
  `;
}


function renderMatrixHTML(val) {
  if (!val || !val.isMatrix) return '';
  try {
    const data = val.toArray();
    const is1D = !Array.isArray(data[0]);
    const rows = is1D ? [data] : data;
    const nRows = rows.length;
    const nCols = rows[0] ? rows[0].length : 0;
    if (!nRows || !nCols) return '';
    const isSquare = nRows === nCols;

    const fmtN = v => {
      if (typeof v === 'number') return String(Math.round(v * 1e10) / 1e10);
      try { return math.format(v, { precision: 6 }); } catch { return String(v); }
    };

    // Column widths: pre-compute for alignment
    const colMaxLen = Array(nCols).fill(0);
    for (let r = 0; r < nRows; r++)
      for (let c = 0; c < nCols; c++) {
        const cell = is1D ? rows[0][c] : rows[r][c];
        colMaxLen[c] = Math.max(colMaxLen[c], fmtN(cell).length);
      }

    let tableRows = '';
    for (let r = 0; r < nRows; r++) {
      tableRows += '<tr>';
      for (let c = 0; c < nCols; c++) {
        const cell = is1D ? rows[0][c] : rows[r][c];
        const neg = typeof cell === 'number' && cell < 0;
        tableRows += `<td style="padding:3px 12px 3px ${c===0?'6px':'4px'};text-align:right;font-family:'JetBrains Mono';font-size:12.5px;color:${neg?'#c92a2a':'#343a40'};white-space:nowrap">${esc(fmtN(cell))}</td>`;
      }
      tableRows += '</tr>';
    }

    let propsHtml = '';
    if (isSquare && nRows >= 2 && nRows <= 6) {
      const props = [];
      try { props.push(`det = ${fmtN(math.det(val))}`); } catch {}
      try { props.push(`trace = ${fmtN(math.trace(val))}`); } catch {}
      if (props.length)
        propsHtml = `<div style="margin-top:8px;padding-top:6px;border-top:1px solid #e9d7fe;font-family:'JetBrains Mono';font-size:11px;color:#9775fa;letter-spacing:0.01em">${props.join(' &nbsp;·&nbsp; ')}</div>`;
    }

    const dimLabel = is1D
      ? `${nCols}${currentLang==='tr'?' elemanlı vektör':'-element vector'}`
      : `${nRows} × ${nCols} ${currentLang==='tr'?'matris':'matrix'}`;

    return `
      <div class="ana-box" style="margin-top:8px;border-color:#7048e8;background:#f3f0ff">
        <div class="ana-title" style="color:#7048e8">${dimLabel}</div>
        <div style="overflow-x:auto;margin-top:6px;display:inline-block">
          <table style="border-collapse:collapse;border-left:3px solid #9775fa;border-right:3px solid #9775fa">
            ${tableRows}
          </table>
        </div>
        ${propsHtml}
      </div>`;
  } catch { return ''; }
}

let _vecTab = 'table';
window.switchVecTab = function(tab) {
  _vecTab = tab;
  document.querySelectorAll('.vec-tab-btn').forEach(b => {
    const on = b.dataset.tab === tab;
    b.style.color = on ? '#7048e8' : '#868e96';
    b.style.borderBottom = '2px solid ' + (on ? '#7048e8' : 'transparent');
    b.style.fontWeight = on ? '600' : '400';
  });
  document.querySelectorAll('[data-vec-panel]').forEach(p => {
    p.style.display = p.dataset.vecPanel === tab ? 'block' : 'none';
  });
};

function renderVectorPanel(val) {
  if (!val || !val.isMatrix) return '';
  try {
    const raw = val.toArray();
    if (!Array.isArray(raw) || Array.isArray(raw[0])) return '';
    const n = raw.length;
    if (n < 1) return '';

    const fmt6 = v => String(Math.round(v * 1e6) / 1e6);
    const nums = raw.map(v => typeof v === 'number' ? v : (v && typeof v.toNumber === 'function' ? v.toNumber() : null));
    const allNumeric = !nums.some(v => v === null || !isFinite(v));

    // ── Tab: Table ──────────────────────────────────────────────────
    const shown = raw.slice(0, 30);
    let tableHtml = `<table style="border-collapse:collapse;width:100%;font-family:'JetBrains Mono';font-size:12px">
      <thead><tr>
        <th style="padding:3px 8px;text-align:right;color:#9775fa;border-bottom:1px solid #ede4ff;font-weight:500;font-size:10.5px">#</th>
        <th style="padding:3px 8px;text-align:right;color:#9775fa;border-bottom:1px solid #ede4ff;font-weight:500;font-size:10.5px">value</th>
      </tr></thead><tbody>`;
    shown.forEach((v, i) => {
      const disp = allNumeric ? fmt6(nums[i]) : String(v);
      const neg = allNumeric && nums[i] < 0;
      tableHtml += `<tr style="${i%2===0?'':'background:#faf8ff'}">
        <td style="padding:2px 8px;text-align:right;color:#adb5bd">${i}</td>
        <td style="padding:2px 8px;text-align:right;color:${neg?'#c92a2a':'#343a40'}">${esc(disp)}</td>
      </tr>`;
    });
    if (n > shown.length)
      tableHtml += `<tr><td colspan="2" style="padding:4px 8px;text-align:center;color:#adb5bd;font-size:10.5px">… ${n - shown.length} more</td></tr>`;
    tableHtml += '</tbody></table>';

    if (!allNumeric) {
      return `<div class="ana-box" style="margin-top:8px;border-color:#7048e8;background:#f3f0ff">
        <div class="ana-title" style="color:#7048e8">${currentLang==='tr'?n+' elemanlı vektör':n+'-element vector'}</div>
        <div style="overflow-x:auto;margin-top:6px">${tableHtml}</div>
      </div>`;
    }

    // ── Stats ───────────────────────────────────────────────────────
    const sorted = [...nums].sort((a, b) => a - b);
    const mean = nums.reduce((a, b) => a + b, 0) / n;
    const variance = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    const std = Math.sqrt(variance);
    const min = sorted[0], max = sorted[n - 1], range = max - min;
    const quantile = p => { const idx = p*(n-1), lo = Math.floor(idx), hi = Math.ceil(idx); return sorted[lo] + (sorted[hi]-sorted[lo])*(idx-lo); };
    const median = quantile(0.5), q1 = quantile(0.25), q3 = quantile(0.75), iqr = q3 - q1;
    const freqMap = {};
    nums.forEach(v => { freqMap[v] = (freqMap[v]||0)+1; });
    const maxFreq = Math.max(...Object.values(freqMap));
    const modes = maxFreq > 1 ? Object.entries(freqMap).filter(([,f])=>f===maxFreq).map(([v])=>fmt6(+v)) : null;

    const statsRows = [
      ['n', n],                ['min',  fmt6(min)],
      ['mean',   fmt6(mean)],  ['max',  fmt6(max)],
      ['median', fmt6(median)],['range',fmt6(range)],
      ['std',    fmt6(std)],   ['Q1',   fmt6(q1)],
      ['var',    fmt6(variance)],['Q3', fmt6(q3)],
      ['mode', modes ? modes.join(', ') : '—'], ['IQR', fmt6(iqr)],
    ];
    let statsHtml = `<div style="display:grid;grid-template-columns:1fr 1fr;column-gap:10px">`;
    for (const [lbl, val_] of statsRows)
      statsHtml += `<div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid #ede4ff;padding:3px 2px">
        <span style="font-size:10.5px;color:#9775fa;font-family:'JetBrains Mono'">${lbl}</span>
        <span style="font-size:12px;font-weight:600;color:#343a40;font-family:'JetBrains Mono'">${esc(String(val_))}</span>
      </div>`;
    statsHtml += '</div>';

    // ── Histogram tab: box plot + bars ──────────────────────────────
    let boxHtml = '';
    if (range > 0) {
      const pct = v => Math.max(0, Math.min(100, ((v-min)/range)*100));
      const pQ1 = pct(q1), pMed = pct(median), pQ3 = pct(q3);
      boxHtml = `<div style="margin-bottom:14px">
        <div style="font-size:10px;color:#9775fa;letter-spacing:.04em;margin-bottom:5px;font-family:'JetBrains Mono'">box plot</div>
        <div style="position:relative;height:22px;margin:0 4px">
          <div style="position:absolute;top:50%;left:0;right:0;height:1.5px;background:#d0bfff;transform:translateY(-50%)"></div>
          <div style="position:absolute;top:3px;bottom:3px;left:${pQ1}%;width:${Math.max(1,pQ3-pQ1)}%;background:#ddd2ff;border:1.5px solid #9775fa;border-radius:2px"></div>
          <div style="position:absolute;top:1px;bottom:1px;left:calc(${pMed}% - 1px);width:3px;background:#7048e8;border-radius:1px"></div>
          <div style="position:absolute;top:5px;bottom:5px;left:0;width:2px;background:#9775fa;border-radius:1px"></div>
          <div style="position:absolute;top:5px;bottom:5px;right:0;width:2px;background:#9775fa;border-radius:1px"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:3px;font-size:10px;color:#868e96;font-family:'JetBrains Mono'">
          <span>${esc(fmt6(min))}</span><span>Q1 ${esc(fmt6(q1))}</span>
          <span>mdn ${esc(fmt6(median))}</span>
          <span>Q3 ${esc(fmt6(q3))}</span><span>${esc(fmt6(max))}</span>
        </div>
      </div>`;
    }
    const numBins = range === 0 ? 1 : Math.max(3, Math.min(10, Math.ceil(Math.sqrt(n))));
    const binW = range === 0 ? 1 : range / numBins;
    const bins = Array(numBins).fill(0);
    nums.forEach(v => { bins[Math.min(numBins-1, Math.floor((v-min)/binW))]++; });
    const maxBin = Math.max(...bins, 1);
    let barsHtml = `<div style="font-size:10px;color:#9775fa;letter-spacing:.04em;margin-bottom:5px;font-family:'JetBrains Mono'">histogram</div>
      <div style="display:flex;align-items:flex-end;gap:2px;height:52px">`;
    bins.forEach(count => {
      const h = Math.max(count > 0 ? 3 : 0, Math.round((count/maxBin)*50));
      const op = count > 0 ? (0.38 + 0.62*count/maxBin).toFixed(2) : '0.1';
      barsHtml += `<div style="flex:1;height:${h}px;background:#9775fa;border-radius:2px 2px 0 0;opacity:${op}" title="${count}"></div>`;
    });
    barsHtml += `</div><div style="display:flex;justify-content:space-between;font-size:9.5px;color:#adb5bd;font-family:'JetBrains Mono';margin-top:2px">
      <span>${esc(fmt6(min))}</span><span>${esc(fmt6(max))}</span></div>`;

    const sortedStr = n <= 24
      ? sorted.map(fmt6).join(', ')
      : sorted.slice(0,12).map(fmt6).join(', ') + ` … (${n-12} more)`;
    const histPanelHtml = boxHtml + barsHtml
      + `<div style="font-size:10.5px;color:#868e96;font-family:'JetBrains Mono';word-break:break-all;border-top:1px solid #ede4ff;padding-top:5px;margin-top:8px">${esc(sortedStr)}</div>`;

    // ── Tab bar ─────────────────────────────────────────────────────
    const hasAnalysis = n >= 2;
    // Clamp active tab to available tabs when n<2
    if (!hasAnalysis && _vecTab !== 'table') _vecTab = 'table';
    const TABS = [
      ['table',     currentLang==='tr'?'Tablo':'Table'],
      ...(hasAnalysis ? [
        ['stats',     currentLang==='tr'?'İstatistik':'Stats'],
        ['histogram', 'Histogram'],
      ] : []),
    ];
    const active = _vecTab;
    const tabBar = `<div style="display:flex;margin-bottom:10px;border-bottom:1px solid #ede4ff">`
      + TABS.map(([id, label]) => {
          const on = active === id;
          return `<button class="vec-tab-btn" data-tab="${id}" onclick="switchVecTab('${id}')"
            style="padding:4px 10px;border:none;background:none;font-family:'JetBrains Mono';font-size:11px;cursor:pointer;
                   color:${on?'#7048e8':'#868e96'};border-bottom:2px solid ${on?'#7048e8':'transparent'};
                   font-weight:${on?600:400};margin-bottom:-1px;transition:color .12s">${label}</button>`;
        }).join('') + '</div>';

    const panels = {
      table: `<div style="overflow-x:auto">${tableHtml}</div>`,
      ...(hasAnalysis ? { stats: statsHtml, histogram: histPanelHtml } : {}),
    };

    const panelsHtml = TABS.map(([id]) =>
      `<div data-vec-panel="${id}" style="display:${active===id?'block':'none'}">${panels[id]}</div>`
    ).join('');

    const dimLabel = currentLang==='tr' ? `${n} elemanlı vektör` : `${n}-element vector`;
    return `<div class="ana-box" style="margin-top:8px;border-color:#7048e8;background:#f8f5ff">
      <div class="ana-title" style="color:#7048e8;margin-bottom:8px">${dimLabel}</div>
      ${tabBar}
      ${panelsHtml}
    </div>`;
  } catch { return ''; }
}

function updateLineInfo(state) {
  const panel = document.getElementById('s-lineinfo');
  if (!panel) return;

  const sel = state.selection.main;
  if (!sel.empty) {
    const lineStart = state.doc.lineAt(sel.from).number;
    const lineEnd = state.doc.lineAt(sel.to).number;
    const numLines = lineEnd - lineStart + 1;
    
    if (numLines > 1) {
      panel.classList.remove('has-analysis');
      const selectedText = state.sliceDoc(sel.from, sel.to);
      
      panel.innerHTML = `
        <div class="s-item" style="margin: 4px; cursor: default; border-color: transparent;">
          <div class="s-section-title" style="padding: 0 0 6px; border-bottom: 1px solid #f1f3f5; margin-bottom: 6px;">${numLines} ${t('linesSelected')}</div>
          <div class="s-item-sub" style="margin-top:6px; line-height:1.4; font-family: 'JetBrains Mono', monospace; white-space: pre-wrap; max-height: 200px; overflow-y: auto;">${esc(selectedText)}</div>
          <div style="margin-top: 12px; text-align: right;">
             <button id="btn-save-selection" class="primary" style="padding: 6px 10px; font-size: 11px; border: none; border-radius: 4px; cursor: pointer; background: #1971c2; color: #fff;">${t('saveAsNewFile')}</button>
          </div>
        </div>
      `;
      
      document.getElementById('btn-save-selection').addEventListener('click', () => {
         newFile(selectedText);
      });
      return;
    }
  }

  const pos = state.selection.main.head;
  const line = state.doc.lineAt(pos);

  let evalResult;
  try { evalResult = state.field(evalField); } catch { return; }

  const res = evalResult.lineResults[line.number - 1];

  // Fonksiyon tanımı → tam analiz
  if (res && res.type === 'funcdef') {
    const funcKey = `${line.number}:${line.text}`;
    if (panel.dataset.funcKey !== funcKey) {
      panel.dataset.funcKey = funcKey;
      panel.classList.add('has-analysis');
      panel.innerHTML = `
        <div style="padding: 6px 8px 4px; border-bottom: 1px solid #dee2e6; font-size: 10px; font-weight: 700; color: #adb5bd; letter-spacing: 0.07em; text-transform: uppercase;">
          ${t('line')} ${line.number} · ${t('funcAnalysis')}
        </div>
        ${renderFuncAnalysis(line.text)}
      `;
      renderAnaPlot();
      render3DAnalysisPlot();
      computeAnaTangent();
    }
    return;
  }
  panel.dataset.funcKey = '';

  // Denklem → özel panel
  if (res && res.type === 'equation') {
    panel.classList.add('has-analysis');
    panel.innerHTML = `
      <div style="padding: 6px 8px 4px; border-bottom: 1px solid #dee2e6; font-size: 10px; font-weight: 700; color: #adb5bd; letter-spacing: 0.07em; text-transform: uppercase;">
        ${t('line')} ${line.number} · ${t('equation')}
      </div>
      ${renderEquationPanel(res)}
    `;
    renderEquationPlot(res);
    return;
  }

  // Eşitsizlik → özel panel
  if (res && res.type === 'inequality') {
    panel.classList.add('has-analysis');
    const opSymbol = res.op === '>=' ? '≥' : res.op === '<=' ? '≤' : res.op;
    panel.innerHTML = `
      <div style="padding: 6px 8px 4px; border-bottom: 1px solid #dee2e6; font-size: 10px; font-weight: 700; color: #adb5bd; letter-spacing: 0.07em; text-transform: uppercase;">
        ${t('line')} ${line.number} · ${t('inequality')}
      </div>
      ${renderInequalityPanel(res)}
    `;
    renderInequalityPlot(res);
    return;
  }

  panel.classList.remove('has-analysis');

  if (!res) {
    panel.innerHTML = `<div class="s-empty">${t('noLineInfo')}</div>`;
    return;
  }

  let title = t('expression'), desc = '', valHtml = '';

  if (res.type === 'empty') {
    title = t('emptyLine'); desc = t('emptyLineDesc');
  } else if (res.type === 'comment') {
    title = t('comment'); desc = line.text.trim();
  } else if (res.type === 'plot') {
    title = t('plot');
    if (res.exprs?.length) valHtml = `<div class="s-item-sub" style="margin-top:6px">${esc(res.exprs.join(', '))}</div>`;
  } else if (res.type === 'assign') {
    const isMatrix = res.val && res.val.isMatrix;
    const matSize = isMatrix ? res.val.size() : null;
    const isVec = matSize && matSize.length === 1;
    const isMat = matSize && matSize.length === 2;

    title = isVec ? t('vectorAssignment') : isMat ? t('matrixAssignment') : t('variableAssignment');

    const parts = line.text.split('=');
    const lhs = parts[0]?.trim();
    const rhs = parts.slice(1).join('=')?.trim();

    if (isVec || isMat) {
      const varName = lhs || '?';
      valHtml = `
        <div class="ana-box" style="margin-top:10px;border-color:#e9ecef;background:#f8f9fa">
          <div class="ana-title" style="color:#868e96">${t('definition')}</div>
          <div style="font-family:'JetBrains Mono';font-size:13px;color:#343a40;padding:4px 0">${highlightUnits(line.text.trim())}</div>
        </div>
        <div style="margin-top:2px;padding-left:2px;font-size:11px;color:#9775fa;font-family:'JetBrains Mono'">${esc(varName)} =</div>
        ${isVec ? renderVectorPanel(res.val) : renderMatrixHTML(res.val)}
      `;
    } else if (lhs && rhs) {
      const substituted = getSubstitutedString(rhs, evalResult.vars);
      const finalVal = fmtVal(res.val);
      valHtml = `
        <div class="ana-box" style="margin-top:10px; border-color:#e9ecef; background:#f8f9fa">
          <div class="ana-title" style="color:#868e96">${t('definition')}</div>
          <div style="font-family:'JetBrains Mono'; font-size:13px; color:#343a40; padding:4px 0">${highlightUnits(line.text.trim())}</div>
        </div>
        ${substituted !== rhs && substituted !== finalVal ? `
          <div class="ana-box" style="margin-top:8px; border-color:#e9ecef">
            <div class="ana-title" style="color:#adb5bd">${t('valueSubstitution')}</div>
            <div style="font-family:'JetBrains Mono'; font-size:12px; color:#868e96; padding:4px 0">${esc(substituted)}</div>
          </div>` : ''}
        <div class="ana-box" style="margin-top:8px; border-color:#2f9e44; background:#ebfbee">
          <div class="ana-title" style="color:#2f9e44">${t('resultLabel')}</div>
          ${renderNumberLine(res.val)}
          <div style="font-family:'JetBrains Mono'; font-weight:700; font-size:14px; color:#2b8a3e; padding:4px 0">${esc(lhs || res.name || '')} = ${isUnit(res.val) ? fmtValHTML(res.val) : esc(finalVal)}</div>
        </div>
      `;
    } else {
      if (res.val !== undefined) valHtml = `
        <div class="ana-box" style="margin-top:8px; border-color:#2f9e44; background:#ebfbee">
          <div class="ana-title" style="color:#2f9e44">${t('resultLabel')}</div>
          ${renderNumberLine(res.val)}
          <div style="font-family:'JetBrains Mono'; font-weight:700; font-size:14px; color:#2b8a3e; padding:4px 0">${esc(res.name ? res.name + ' ' : '')}= ${fmtValHTML(res.val)}</div>
        </div>
      `;
    }
  } else if (res.type === 'error') {
    title = t('error');
    valHtml = `
      <div class="ana-box" style="margin-top:8px; border-color:#c92a2a; background:#fff5f5">
        <div class="ana-title" style="color:#c92a2a">${t('errorMessage')}</div>
        <div style="color:#c92a2a; font-size:12px; padding:4px 0">${esc(res.val)}</div>
      </div>`;
  } else if (res.val !== undefined) {
    const expr = line.text.trim();
    const substituted = getSubstitutedString(expr, evalResult.vars);
    const finalVal = fmtVal(res.val);
    const isMatrixVal = res.val && res.val.isMatrix;

    valHtml = `
      <div class="ana-box" style="margin-top:10px; border-color:#e9ecef; background:#f8f9fa">
        <div class="ana-title" style="color:#868e96">${t('expression')}</div>
        <div style="font-family:'JetBrains Mono'; font-size:13px; color:#343a40; padding:4px 0">${highlightUnits(expr)}</div>
      </div>
      ${substituted !== expr && substituted !== finalVal ? `
        <div class="ana-box" style="margin-top:8px; border-color:#e9ecef">
          <div class="ana-title" style="color:#adb5bd">${t('calculation')}</div>
          <div style="font-family:'JetBrains Mono'; font-size:12px; color:#868e96; padding:4px 0">${highlightUnits(substituted)}</div>
        </div>` : ''}
      ${isMatrixVal
        ? (res.val.size().length === 1 ? renderVectorPanel(res.val) : renderMatrixHTML(res.val))
        : `<div class="ana-box" style="margin-top:8px; border-color:#1971c2; background:#e7f5ff">
            <div class="ana-title" style="color:#1971c2">${t('resultLabel')}</div>
            ${renderNumberLine(res.val)}
            <div style="font-family:'JetBrains Mono'; font-weight:700; font-size:14px; color:#1864ab; padding:4px 0">= ${isUnit(res.val) ? fmtValHTML(res.val) : esc(finalVal)}</div>
          </div>`}
    `;
  }

  panel.innerHTML = `
    <div class="s-item" style="margin: 4px; cursor: default; border-color: transparent;">
      <div class="s-section-title" style="padding: 0 0 6px; border-bottom: 1px solid #f1f3f5; margin-bottom: 6px;">${t('line')} ${line.number}</div>
      <div class="s-item-name" style="font-size:13px; color:#1971c2;">${esc(title)}</div>
      ${valHtml}
      ${desc ? `<div class="s-item-sub" style="margin-top:6px; line-height:1.4">${esc(desc)}</div>` : ''}
    </div>
  `;
}

function updateStatusBar(state) {
  let evalResult;
  try { evalResult = state.field(evalField); } catch (e) { return; }

  const varsCount = Object.keys(evalResult.vars || {}).length;
  const funcsCount = Object.keys(evalResult.funcs || {}).length;
  
  let eqCount = 0;
  if (evalResult.lineResults) {
    for (const res of evalResult.lineResults) {
      if (res && res.type === 'equation') eqCount++;
    }
  }

  const line = state.doc.lineAt(state.selection.main.head);
  document.getElementById('st-line').textContent = `${line.number}. ${t('line')}`;

  const setItem = (id, sepId, count, labelKey) => {
    const el = document.getElementById(id);
    const sep = document.getElementById(sepId);
    if (count > 0) {
      el.textContent = `${count} ${t(labelKey)}`;
      el.style.display = 'inline';
      if (sep) sep.style.display = 'inline';
    } else {
      el.style.display = 'none';
      if (sep) sep.style.display = 'none';
    }
  };

  setItem('st-funcs', 'sep-funcs', funcsCount, 'functions');
  setItem('st-vars',  'sep-vars',  varsCount,  'variables');
  setItem('st-eqs',   'sep-eqs',   eqCount,    'equations');

  updateLineInfo(state);
}

// ================================================================
// EDITOR
// ================================================================

let ignoreNextChange = false;

function replaceEditorContent(content) {
  if (!view) return;
  const result = evalAll(content);
  renderSidebar(result.vars, result.funcs, result.plots);
  ignoreNextChange = true;
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: content },
    effects: evalEffect.of(result)
  });
  updateStatusBar(view.state);
}

function initEditor(initialContent) {
  const initResult = evalAll(initialContent);
  renderSidebar(initResult.vars, initResult.funcs, initResult.plots);

  const state = EditorState.create({
    doc: initialContent,
    extensions: [
      basicSetup,
      evalField,
      decoField,
      unitDecoField,
      varDecoField,
      typeTagGutter,
      EditorView.updateListener.of(upd => {
        // Update status bar on any update (cursor, selection, doc change)
        updateStatusBar(upd.state);

        if (!upd.docChanged) return;
        if (ignoreNextChange) { ignoreNextChange = false; return; }

        const content = upd.state.doc.toString();
        files[activeIdx].content = content;
        scheduleSave();

        const result = evalAll(content);
        renderSidebar(result.vars, result.funcs, result.plots);

        setTimeout(() => {
          if (view) view.dispatch({ effects: evalEffect.of(result) });
        }, 0);
      }),
      EditorView.theme({
        '&': { height: '100%', background: '#fff' },
        '.cm-content': { paddingTop: '12px', paddingBottom: '60px' },
        '.cm-focused .cm-cursor': { borderLeftColor: '#1971c2' },
        '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
          background: '#d0ebff'
        },
      }),
    ]
  });

  view = new EditorView({
    state,
    parent: document.getElementById('editor-wrap')
  });

  // evalField başlangıçta boş; ilk sonuçları hemen dispatch et
  view.dispatch({ effects: evalEffect.of(initResult) });
  updateStatusBar(view.state);
  applyZoom();
}

// ================================================================
// INSERT FAB
// ================================================================

let _insertType = 'func';
let _insMatRows = 2;
let _insMatCols = 2;

const TYPE_COLORS = {
  func: '#7048e8',
  eq:   '#d9480f',
  ineq: '#e67700',
  mat:  '#0c8599',
  expr: '#1971c2',
};

function switchInsertType(type) {
  _insertType = type;
  document.querySelectorAll('.insert-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.type === type);
  });
  const color = TYPE_COLORS[type] || '#1971c2';
  const confirm = document.getElementById('insert-confirm');
  if (confirm) confirm.style.background = color;
  const preview = document.getElementById('insert-preview');
  if (preview) { preview.style.borderLeftColor = color; preview.style.color = color; }
  renderInsertForm();
  updateInsertPreview();
}
window.switchInsertType = switchInsertType;

function renderInsertForm() {
  const el = document.getElementById('insert-form');
  if (!el) return;

  if (_insertType === 'func') {
    el.innerHTML = `
      <div class="ins-row">
        <div style="flex:0 0 auto;min-width:90px">
          <label class="ins-label">${t('insFuncName')}</label>
          <input class="ins-input" id="ins-fname" placeholder="f" style="width:90px" oninput="updateInsertPreview()">
        </div>
        <div style="flex:0 0 auto;padding-top:20px;font-size:16px;color:#adb5bd">(</div>
        <div style="flex:0 0 auto;min-width:70px">
          <label class="ins-label">${t('insFuncVar')}</label>
          <input class="ins-input" id="ins-fvar" placeholder="x" style="width:70px" oninput="updateInsertPreview()">
        </div>
        <div style="flex:0 0 auto;padding-top:20px;font-size:16px;color:#adb5bd">) =</div>
        <div style="flex:1">
          <label class="ins-label">${t('insFuncDef')}</label>
          <input class="ins-input" id="ins-fdef" placeholder="x^2 + 1" oninput="updateInsertPreview()">
        </div>
      </div>`;
  } else if (_insertType === 'eq') {
    el.innerHTML = `
      <div class="ins-row">
        <div style="flex:1">
          <label class="ins-label">${t('insLhs')}</label>
          <input class="ins-input" id="ins-elhs" placeholder="2*x + 1" oninput="updateInsertPreview()">
        </div>
        <div class="ins-sep">=</div>
        <div style="flex:1">
          <label class="ins-label">${t('insRhs')}</label>
          <input class="ins-input" id="ins-erhs" placeholder="0" oninput="updateInsertPreview()">
        </div>
      </div>`;
  } else if (_insertType === 'ineq') {
    el.innerHTML = `
      <div class="ins-row">
        <div style="flex:1">
          <label class="ins-label">${t('insLhs')}</label>
          <input class="ins-input" id="ins-ilhs" placeholder="x^2" oninput="updateInsertPreview()">
        </div>
        <div style="flex:0 0 auto;padding-top:20px">
          <select class="ins-select" id="ins-iop" onchange="updateInsertPreview()">
            <option value="<">&lt;</option>
            <option value="<=">&le;</option>
            <option value=">">&gt;</option>
            <option value=">=">&ge;</option>
          </select>
        </div>
        <div style="flex:1">
          <label class="ins-label">${t('insRhs')}</label>
          <input class="ins-input" id="ins-irhs" placeholder="4" oninput="updateInsertPreview()">
        </div>
      </div>`;
  } else if (_insertType === 'mat') {
    el.innerHTML = `
      <div class="ins-row" style="margin-bottom:8px">
        <div style="flex:0 0 auto;min-width:80px">
          <label class="ins-label">${t('insMatVar')}</label>
          <input class="ins-input" id="ins-mname" placeholder="A" style="width:80px" oninput="updateInsertPreview()">
        </div>
        <div style="flex:0 0 auto;padding-top:20px;font-size:14px;color:#868e96;padding-left:8px">${t('insMatRows')}</div>
        <div style="flex:0 0 auto">
          <label class="ins-label">&nbsp;</label>
          <select class="ins-select" id="ins-mrows" onchange="updateMatGrid()">
            ${[1,2,3,4,5,6].map(n => `<option${n===_insMatRows?' selected':''}>${n}</option>`).join('')}
          </select>
        </div>
        <div style="flex:0 0 auto;padding-top:20px;font-size:14px;color:#868e96">${t('insMatCols')}</div>
        <div style="flex:0 0 auto">
          <label class="ins-label">&nbsp;</label>
          <select class="ins-select" id="ins-mcols" onchange="updateMatGrid()">
            ${[1,2,3,4,5,6].map(n => `<option${n===_insMatCols?' selected':''}>${n}</option>`).join('')}
          </select>
        </div>
      </div>
      <div id="ins-mat-grid-wrap" style="overflow-x:auto;margin-bottom:12px">
        ${buildMatGrid(_insMatRows, _insMatCols)}
      </div>`;
  } else if (_insertType === 'expr') {
    el.innerHTML = `
      <div class="ins-row">
        <div style="flex:1">
          <label class="ins-label">${t('insExprLabel')}</label>
          <input class="ins-input" id="ins-expr" placeholder="sqrt(2) * pi" oninput="updateInsertPreview()">
        </div>
      </div>`;
  }
}

function buildMatGrid(rows, cols) {
  let cells = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells += `<input class="ins-mat-cell" id="ins-mc-${r}-${c}" placeholder="0" oninput="updateInsertPreview()">`;
    }
  }
  return `<div class="ins-mat-wrap" style="grid-template-columns:repeat(${cols},54px)">${cells}</div>`;
}
window.updateMatGrid = function() {
  _insMatRows = parseInt(document.getElementById('ins-mrows').value) || 2;
  _insMatCols = parseInt(document.getElementById('ins-mcols').value) || 2;
  document.getElementById('ins-mat-grid-wrap').innerHTML = buildMatGrid(_insMatRows, _insMatCols);
  updateInsertPreview();
};

function buildInsertText() {
  if (_insertType === 'func') {
    const name = (document.getElementById('ins-fname')?.value || 'f').trim() || 'f';
    const varr = (document.getElementById('ins-fvar')?.value || 'x').trim() || 'x';
    const def  = (document.getElementById('ins-fdef')?.value || '').trim();
    return `${name}(${varr}) = ${def}`;
  } else if (_insertType === 'eq') {
    const lhs = (document.getElementById('ins-elhs')?.value || '').trim();
    const rhs = (document.getElementById('ins-erhs')?.value || '0').trim() || '0';
    return `${lhs} = ${rhs}`;
  } else if (_insertType === 'ineq') {
    const lhs = (document.getElementById('ins-ilhs')?.value || '').trim();
    const op  = document.getElementById('ins-iop')?.value || '<';
    const rhs = (document.getElementById('ins-irhs')?.value || '').trim();
    return `${lhs} ${op} ${rhs}`;
  } else if (_insertType === 'mat') {
    const name = (document.getElementById('ins-mname')?.value || '').trim();
    const rows = _insMatRows;
    const cols = _insMatCols;
    let rows_arr = [];
    for (let r = 0; r < rows; r++) {
      let row = [];
      for (let c = 0; c < cols; c++) {
        const v = (document.getElementById(`ins-mc-${r}-${c}`)?.value || '0').trim() || '0';
        row.push(v);
      }
      rows_arr.push('[' + row.join(', ') + ']');
    }
    const mat = '[' + rows_arr.join(', ') + ']';
    return name ? `${name} = ${mat}` : mat;
  } else if (_insertType === 'expr') {
    return (document.getElementById('ins-expr')?.value || '').trim();
  }
  return '';
}

function updateInsertPreview() {
  const text = buildInsertText();
  const el = document.getElementById('insert-preview');
  if (el) el.textContent = text || ' ';
}
window.updateInsertPreview = updateInsertPreview;

function doInsert() {
  if (!view) return;
  const text = buildInsertText();
  if (!text) return;

  const state = view.state;
  const sel = state.selection.main;
  const docLen = state.doc.length;

  let insertAt, insertText;

  if (sel.empty) {
    // No selection — insert at end of document
    const doc = state.doc.toString();
    const lastNonEmpty = doc.trimEnd();
    const base = lastNonEmpty.length;
    const needsNewline = base > 0 && !doc.slice(base - 1, base).match(/\n/);
    insertAt = docLen;
    insertText = (needsNewline ? '\n' : '') + text + '\n';
  } else {
    // Insert at cursor position (start of selection)
    const line = state.doc.lineAt(sel.from);
    insertAt = line.to;
    insertText = '\n' + text;
  }

  view.dispatch({
    changes: { from: insertAt, to: insertAt, insert: insertText },
    selection: { anchor: insertAt + insertText.length }
  });

  view.focus();
  document.getElementById('insert-modal').classList.remove('active');
}

// FAB + modal event wiring (runs after DOM is ready)
document.getElementById('insert-fab').addEventListener('click', () => {
  switchInsertType('func');
  document.getElementById('insert-modal').classList.add('active');
});

document.getElementById('insert-cancel').addEventListener('click', () => {
  document.getElementById('insert-modal').classList.remove('active');
});

document.getElementById('insert-confirm').addEventListener('click', doInsert);

document.getElementById('insert-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('insert-modal'))
    document.getElementById('insert-modal').classList.remove('active');
});

// ================================================================
// BOOT
// ================================================================

renderTabs();
initEditor(files[activeIdx].content);

// Service worker registration is intentionally handled by the small inline
// bootstrap in index.html. This keeps PWA recovery independent from app boot.
