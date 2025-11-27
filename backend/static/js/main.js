// State
let Graph = null;
let graphData = null;
let highlightedNodes = new Set();
let highlightedLinks = new Set();
let hoverNode = null;

// DOM Elements
const uploadContainer = document.getElementById('upload-container');
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const loadingIndicator = document.getElementById('loading-indicator');
const errorMessage = document.getElementById('error-message');
const graphContainer = document.getElementById('graph-container');
const newFileBtn = document.getElementById('new-file-btn');
const settingsPanel = document.getElementById('settings-panel');
const settingsToggle = document.getElementById('settings-toggle');
const infoPanel = document.getElementById('info-panel');
const infoContent = document.getElementById('info-content');
const infoTitle = document.getElementById('info-title');
const closeInfoBtn = document.getElementById('close-info-btn');

// Settings Elements
const dagSelect = document.getElementById('dag-mode');
const pauseBtn = document.getElementById('pause-btn');
const zoomBtn = document.getElementById('zoom-btn');
const engineBtns = document.querySelectorAll('.engine-btn');
const dimBtns = document.querySelectorAll('.dim-btn');

// Constants
const NODE_R = 4;

// --- Event Listeners ---

// File Upload
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-indigo-500', 'bg-gray-800/50');
});
dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-indigo-500', 'bg-gray-800/50');
});
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-indigo-500', 'bg-gray-800/50');
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFile(e.target.files[0]);
});

// UI Controls
newFileBtn.addEventListener('click', resetApp);
settingsToggle.addEventListener('click', toggleSettings);
closeInfoBtn.addEventListener('click', closeInfo);

// Settings
dagSelect.addEventListener('change', (e) => {
    if (Graph) {
        const mode = e.target.value || null;
        Graph.dagMode(mode);
        Graph.dagLevelDistance(mode ? 50 : null);
    }
});

pauseBtn.addEventListener('click', () => {
    if (Graph) {
        const isPaused = pauseBtn.querySelector('span').textContent === 'Resume';
        if (isPaused) {
            Graph.resumeAnimation();
            pauseBtn.innerHTML = '<i data-lucide="pause" class="w-5 h-5"></i><span>Pause</span>';
        } else {
            Graph.pauseAnimation();
            pauseBtn.innerHTML = '<i data-lucide="play" class="w-5 h-5"></i><span>Resume</span>';
        }
        lucide.createIcons();
    }
});

zoomBtn.addEventListener('click', () => {
    if (Graph) Graph.zoomToFit(400);
});

engineBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const val = e.target.dataset.value;
        engineBtns.forEach(b => {
            b.classList.remove('bg-indigo-600', 'text-white', 'font-semibold', 'shadow');
            b.classList.add('hover:bg-gray-600');
        });
        e.target.classList.add('bg-indigo-600', 'text-white', 'font-semibold', 'shadow');
        e.target.classList.remove('hover:bg-gray-600');
        if (Graph) Graph.forceEngine(val);
    });
});

dimBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const val = parseInt(e.target.dataset.value);
        dimBtns.forEach(b => {
            b.classList.remove('bg-indigo-600', 'text-white', 'font-semibold', 'shadow');
            b.classList.add('hover:bg-gray-600');
        });
        e.target.classList.add('bg-indigo-600', 'text-white', 'font-semibold', 'shadow');
        e.target.classList.remove('hover:bg-gray-600');
        if (Graph) Graph.numDimensions(val);
    });
});


// --- Functions ---

async function handleFile(file) {
    loadingIndicator.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    dropZone.classList.add('pointer-events-none', 'opacity-50');

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Upload failed');
        }

        graphData = await response.json();

        uploadContainer.classList.add('hidden');
        graphContainer.classList.remove('hidden');
        newFileBtn.classList.remove('hidden');
        settingsToggle.classList.remove('hidden');
        settingsPanel.classList.remove('-translate-x-full');
        settingsToggle.style.left = '320px';
        settingsToggle.innerHTML = '<i data-lucide="chevron-left" class="w-6 h-6"></i>';

        initGraph(graphData);
        lucide.createIcons();

    } catch (e) {
        errorMessage.textContent = e.message;
        errorMessage.classList.remove('hidden');
    } finally {
        loadingIndicator.classList.add('hidden');
        dropZone.classList.remove('pointer-events-none', 'opacity-50');
    }
}

function initGraph(data) {
    // Color mapping
    const divisions = [...new Set(data.nodes.map(n => n.division).filter(Boolean))];
    const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];
    const colorMap = {};
    divisions.forEach((d, i) => colorMap[d] = colors[i % colors.length]);

    const linkColors = [...new Set(data.links.map(l => l.color).filter(Boolean))];
    const linkColorMap = {};
    linkColors.forEach((c, i) => linkColorMap[c] = colors[i % colors.length]);

    Graph = ForceGraph3D()
        (graphContainer)
        .width(graphContainer.offsetWidth)
        .height(graphContainer.offsetHeight)
        .graphData(data)
        .nodeLabel('name')
        .nodeColor(node => {
            if (highlightedNodes.size > 0 && !highlightedNodes.has(node.id)) return 'rgba(100, 100, 100, 0.1)';
            return colorMap[node.division] || 'rgba(173, 216, 230, 0.75)';
        })
        .linkWidth(link => (highlightedLinks.has(getLinkId(link)) ? 2 : 1))
        .linkColor(link => {
            if (highlightedNodes.size > 0) {
                return highlightedLinks.has(getLinkId(link)) ? (linkColorMap[link.color] || 'rgba(255,255,255,0.8)') : 'rgba(100,100,100,0.05)';
            }
            return linkColorMap[link.color] || 'rgba(255,255,255,0.5)';
        })
        .linkDirectionalArrowLength(3.5)
        .linkDirectionalArrowRelPos(1)
        .onNodeClick(handleNodeClick)
        .onLinkClick(handleLinkClick)
        .onBackgroundClick(resetHighlight);

    // Resize handler
    window.addEventListener('resize', () => {
        Graph.width(graphContainer.offsetWidth);
        Graph.height(graphContainer.offsetHeight);
    });
}

function getLinkId(link) {
    const source = typeof link.source === 'object' ? link.source.id : link.source;
    const target = typeof link.target === 'object' ? link.target.id : link.target;
    return `${source}___${target}`;
}

function handleNodeClick(node) {
    showInfo(node, 'Node Details');

    highlightedNodes.clear();
    highlightedLinks.clear();

    highlightedNodes.add(node.id);
    graphData.links.forEach(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;

        if (sourceId === node.id || targetId === node.id) {
            highlightedLinks.add(getLinkId(link));
            highlightedNodes.add(sourceId === node.id ? targetId : sourceId);
        }
    });

    Graph.nodeColor(Graph.nodeColor())
        .linkWidth(Graph.linkWidth())
        .linkColor(Graph.linkColor());
}

function handleLinkClick(link) {
    showInfo(link, 'Link Details');

    highlightedNodes.clear();
    highlightedLinks.clear();

    highlightedLinks.add(getLinkId(link));
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    highlightedNodes.add(sourceId);
    highlightedNodes.add(targetId);

    Graph.nodeColor(Graph.nodeColor())
        .linkWidth(Graph.linkWidth())
        .linkColor(Graph.linkColor());
}

function resetHighlight() {
    highlightedNodes.clear();
    highlightedLinks.clear();
    Graph.nodeColor(Graph.nodeColor())
        .linkWidth(Graph.linkWidth())
        .linkColor(Graph.linkColor());
    closeInfo();
}

function showInfo(data, title) {
    infoTitle.textContent = title;
    infoContent.innerHTML = '';

    const dl = document.createElement('dl');

    const sortedKeys = Object.keys(data).sort((a, b) => {
        const order = { id: 1, key: 2, source: 3, target: 4, name: 5, legal_name: 6 };
        return (order[a] || 99) - (order[b] || 99);
    });

    sortedKeys.forEach(key => {
        if (['vx', 'vy', 'vz', 'x', 'y', 'z', 'index', '__indexColor', '__threeObj', '__lineObj', '__arrowObj'].includes(key)) return;

        let value = data[key];
        if (key === 'source' || key === 'target') {
            value = typeof value === 'object' ? value.id : value;
        }

        if (value === null || value === undefined) value = 'null';
        else if (typeof value === 'object') value = JSON.stringify(value, null, 2);

        const div = document.createElement('div');
        div.className = 'grid grid-cols-3 gap-2 items-start py-2 border-b border-gray-700/50 text-sm';
        div.innerHTML = `
            <dt class="font-semibold text-gray-300 col-span-1 break-words">${key}</dt>
            <dd class="col-span-2 text-gray-200 break-words">${value}</dd>
        `;
        dl.appendChild(div);
    });

    infoContent.appendChild(dl);
    infoPanel.classList.remove('translate-x-full');
}

function closeInfo() {
    infoPanel.classList.add('translate-x-full');
}

function toggleSettings() {
    const isClosed = settingsPanel.classList.contains('-translate-x-full');
    if (isClosed) {
        settingsPanel.classList.remove('-translate-x-full');
        settingsToggle.style.left = '320px';
        settingsToggle.innerHTML = '<i data-lucide="chevron-left" class="w-6 h-6"></i>';
    } else {
        settingsPanel.classList.add('-translate-x-full');
        settingsToggle.style.left = '0';
        settingsToggle.innerHTML = '<i data-lucide="settings" class="w-6 h-6"></i>';
    }
    lucide.createIcons();
}

function resetApp() {
    graphData = null;
    if (Graph) {
        Graph._destructor(); // Cleanup if available, or just clear container
        graphContainer.innerHTML = '';
        Graph = null;
    }

    uploadContainer.classList.remove('hidden');
    graphContainer.classList.add('hidden');
    newFileBtn.classList.add('hidden');
    settingsToggle.classList.add('hidden');
    settingsPanel.classList.add('-translate-x-full');
    infoPanel.classList.add('translate-x-full');
    fileInput.value = '';
}
