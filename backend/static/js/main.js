// State
let Graph = null;
let graphData = null;
let highlightedNodes = new Set();
let highlightedLinks = new Set();
let hoverNode = null;
let hoverLink = null;
let isSelectionActive = false;
let currentMode = '3D'; // '2D' or '3D'
let activeFilter = { type: null, value: null }; // { type: 'division'|'circle'|'zone'|'edge', value: '...' }
let fixNodes = false;
let nodeColorAttribute = 'division';
let hoverEnabled = true;
let labelDensity = 0.1;
let nodeSizeAttribute = 'amount';
let edgeWidthAttribute = 'Assesment Amount';
let nodeLabelAttribute = 'legal_name';
let edgeLabelAttribute = 'assamtstr';
let particleWidthAttribute = 'Assesment Amount';
let nodeLabelSize = 12;
let edgeLabelSize = 10;
let arrowPos = 0.5;
let arrowLength = 3.5;
let maxNodeSize = 10;
let maxEdgeWidth = 5;
let maxParticleWidth = 4;

// 3D Specific State
let linkOpacity = 0.2;
let linkResolution = 6;
let linkMaterialType = 'MeshLambertMaterial';
let particleResolution = 6;
let nodeResolution = 8;
let THREE = null; // Will be imported dynamically
let SpriteText = null; // Global reference for 3D labels

// DOM Elements
const uploadContainer = document.getElementById('upload-container');
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const loadingIndicator = document.getElementById('loading-indicator');
const errorMessage = document.getElementById('error-message');
const graphContainer = document.getElementById('graph-container');
const newFileBtn = document.getElementById('new-file-btn');

// Sidebar Elements
const sidebarPanel = document.getElementById('sidebar-panel');
const sidebarToggle = document.getElementById('sidebar-toggle');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabFilters = document.getElementById('tab-filters');
const tabSettings = document.getElementById('tab-settings');
const settingsFooter = document.getElementById('settings-footer');

// Filter Elements
const searchInput = document.getElementById('search-input');
const filterContainers = {
    division: document.getElementById('filter-division'),
    circle: document.getElementById('filter-circle'),
    zone: document.getElementById('filter-zone'),
    edge: document.getElementById('filter-edge')
};

// Settings Elements
const dagSelect = document.getElementById('dag-mode');
const zoomBtn = document.getElementById('zoom-btn');
const dimBtns = document.querySelectorAll('.dim-btn');
const particleSpeedSlider = document.getElementById('particle-speed');
const maxNodeSizeSlider = document.getElementById('max-node-size');
const maxEdgeWidthSlider = document.getElementById('max-edge-width');
const maxParticleWidthSlider = document.getElementById('max-particle-width');
const arrowLengthSlider = document.getElementById('arrow-length');
const nodeColorSelect = document.getElementById('node-color-by');
const fixNodesToggle = document.getElementById('fix-nodes-toggle');
const hoverToggle = document.getElementById('hover-toggle');
const labelDensitySlider = document.getElementById('label-density');
const nodeSizeSelect = document.getElementById('node-size-attr');
const edgeWidthSelect = document.getElementById('edge-width-attr');
const nodeLabelSelect = document.getElementById('node-label-attr');
const edgeLabelSelect = document.getElementById('edge-label-attr');
const particleWidthSelect = document.getElementById('particle-width-attr');
const nodeLabelSizeSlider = document.getElementById('node-label-size');
const edgeLabelSizeSlider = document.getElementById('edge-label-size');
const arrowPosSlider = document.getElementById('arrow-pos');

// 3D Settings Elements
const settings3dContainer = document.getElementById('settings-3d-container');
const linkOpacitySlider = document.getElementById('link-opacity');
const linkResolutionSlider = document.getElementById('link-resolution');
const linkMaterialSelect = document.getElementById('link-material');
const particleResolutionSlider = document.getElementById('particle-resolution');
const nodeResolutionSlider = document.getElementById('node-resolution');

const applyBtn = document.getElementById('apply-btn');
const resetBtn = document.getElementById('reset-btn');

// Floating Controls
const zoomInBtn = document.getElementById('zoom-in-btn');
const zoomOutBtn = document.getElementById('zoom-out-btn');
const fitBtn = document.getElementById('fit-btn');
const pauseBtn = document.getElementById('pause-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');

// Info Panel
const infoPanel = document.getElementById('info-panel');
const infoContent = document.getElementById('info-content');
const infoTitle = document.getElementById('info-title');
const closeInfoBtn = document.getElementById('close-info-btn');

// Constants
const MIN_NODE_SIZE = 2;
// const MAX_NODE_SIZE = 20; // Now dynamic
const MIN_EDGE_WIDTH = 0.1;
// const MAX_EDGE_WIDTH = 5; // Now dynamic
const MIN_PARTICLE_WIDTH = 0.1;
// const MAX_PARTICLE_WIDTH = 4; // Now dynamic
const BACKGROUND_COLOR = '#000011'; // Dark background for consistency
// const LABEL_DENSITY = 0.1; // Removed constant, now using state variable

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
sidebarToggle.addEventListener('click', () => sidebarPanel.classList.remove('translate-x-full'));
closeSidebarBtn.addEventListener('click', () => sidebarPanel.classList.add('translate-x-full'));
closeInfoBtn.addEventListener('click', closeInfo);

// Tab Switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Update Tabs
        tabBtns.forEach(b => {
            b.classList.remove('text-indigo-400', 'border-b-2', 'border-indigo-400', 'bg-gray-800/50');
            b.classList.add('text-gray-400');
        });
        btn.classList.add('text-indigo-400', 'border-b-2', 'border-indigo-400', 'bg-gray-800/50');
        btn.classList.remove('text-gray-400');

        // Show Content
        const tab = btn.dataset.tab;
        if (tab === 'filters') {
            tabFilters.classList.remove('hidden');
            tabSettings.classList.add('hidden');
            settingsFooter.classList.add('hidden');
        } else {
            tabFilters.classList.add('hidden');
            tabSettings.classList.remove('hidden');
            settingsFooter.classList.remove('hidden');
        }
    });
});

// Search
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    if (!term) {
        if (!activeFilter.value) resetHighlight();
        else applyFilter(); // Re-apply active filter if search cleared
        return;
    }

    const matchingNodes = graphData.nodes.filter(n =>
        (n.legal_name && n.legal_name.toLowerCase().includes(term)) ||
        (n.name && n.name.toLowerCase().includes(term)) ||
        (n.id && n.id.toString().toLowerCase().includes(term))
    );

    if (matchingNodes.length > 0) {
        highlightedNodes.clear();
        highlightedLinks.clear();
        matchingNodes.forEach(node => highlightedNodes.add(node.id));
        updateHighlight();

        // Zoom to first match if only one
        if (matchingNodes.length === 1 && Graph) {
            zoomToNode(matchingNodes[0]);
        }
    } else {
        if (term.length > 0) {
            highlightedNodes.clear();
            highlightedLinks.clear();
            updateHighlight();
        }
    }
});


// Settings - Layout
dagSelect.addEventListener('change', (e) => {
    if (Graph) {
        const mode = e.target.value || null;
        Graph.dagMode(mode);
        Graph.dagLevelDistance(mode ? 50 : null);

        // Force layout update
        if (currentMode === '3D') {
            Graph.numDimensions(3);
        } else {
            Graph.d3ReheatSimulation();
        }
    }
});

// Settings - Appearance
particleSpeedSlider.addEventListener('input', (e) => {
    document.getElementById('val-particle-speed').textContent = e.target.value;
    if (Graph) Graph.linkDirectionalParticleSpeed(parseFloat(e.target.value) * 0.001);
});

nodeColorSelect.addEventListener('change', (e) => {
    nodeColorAttribute = e.target.value;
    if (Graph) {
        // Re-calculate color map
        const values = [...new Set(graphData.nodes.map(n => n[nodeColorAttribute]).filter(Boolean))].sort();
        const colors = generateColors(values.length);
        const colorMap = {};
        values.forEach((v, i) => colorMap[v] = colors[i]);

        Graph.nodeColor(node => {
            if (highlightedNodes.size > 0 && !highlightedNodes.has(node.id)) return 'rgba(100, 100, 100, 0.2)';
            return colorMap[node[nodeColorAttribute]] || '#9ca3af';
        });
    }
});

fixNodesToggle.addEventListener('click', () => {
    fixNodes = !fixNodes;
    const span = fixNodesToggle.querySelector('span');
    if (fixNodes) {
        fixNodesToggle.classList.add('bg-indigo-600');
        fixNodesToggle.classList.remove('bg-gray-700');
        span.classList.add('translate-x-5');
    } else {
        fixNodesToggle.classList.remove('bg-indigo-600');
        fixNodesToggle.classList.add('bg-gray-700');
        span.classList.remove('translate-x-5');
    }
});

hoverToggle.addEventListener('click', () => {
    hoverEnabled = !hoverEnabled;
    const span = hoverToggle.querySelector('span');
    if (hoverEnabled) {
        hoverToggle.classList.add('bg-indigo-600');
        hoverToggle.classList.remove('bg-gray-700');
        span.classList.add('translate-x-5');
    } else {
        hoverToggle.classList.remove('bg-indigo-600');
        hoverToggle.classList.add('bg-gray-700');
        span.classList.remove('translate-x-5');
    }
});

labelDensitySlider.addEventListener('input', (e) => {
    labelDensity = parseFloat(e.target.value);
    document.getElementById('val-label-density').textContent = labelDensity;
    // Force re-render for 2D labels (might need a better way to trigger canvas update)
    if (Graph && currentMode === '2D') {
        // A slight hack to trigger update without full re-init
        Graph.d3ReheatSimulation();
    }
});

nodeSizeSelect.addEventListener('change', (e) => {
    nodeSizeAttribute = e.target.value;
    if (Graph && graphData) initGraph(graphData); // Re-init to recalc ranges
});

edgeWidthSelect.addEventListener('change', (e) => {
    edgeWidthAttribute = e.target.value;
    if (Graph && graphData) initGraph(graphData);
});

maxNodeSizeSlider.addEventListener('input', (e) => {
    maxNodeSize = parseInt(e.target.value);
    document.getElementById('val-max-node-size').textContent = maxNodeSize;
    updateGraphSettings();
});

maxEdgeWidthSlider.addEventListener('input', (e) => {
    maxEdgeWidth = parseInt(e.target.value);
    document.getElementById('val-max-edge-width').textContent = maxEdgeWidth;
    updateGraphSettings();
});

maxParticleWidthSlider.addEventListener('input', (e) => {
    maxParticleWidth = parseInt(e.target.value);
    document.getElementById('val-max-particle-width').textContent = maxParticleWidth;
    updateGraphSettings();
});

arrowLengthSlider.addEventListener('input', (e) => {
    arrowLength = parseFloat(e.target.value);
    document.getElementById('val-arrow-length').textContent = arrowLength;
    updateGraphSettings();
});

nodeLabelSelect.addEventListener('change', (e) => {
    nodeLabelAttribute = e.target.value;
    if (Graph) Graph.nodeLabel(node => node[nodeLabelAttribute] || node.id);
});

edgeLabelSelect.addEventListener('change', (e) => {
    edgeLabelAttribute = e.target.value;
    updateGraphSettings();
});

particleWidthSelect.addEventListener('change', (e) => {
    particleWidthAttribute = e.target.value;
    updateGraphSettings();
});

nodeLabelSizeSlider.addEventListener('input', (e) => {
    nodeLabelSize = parseInt(e.target.value);
    document.getElementById('val-node-label-size').textContent = nodeLabelSize;
    updateGraphSettings();
});

edgeLabelSizeSlider.addEventListener('input', (e) => {
    edgeLabelSize = parseInt(e.target.value);
    document.getElementById('val-edge-label-size').textContent = edgeLabelSize;
    updateGraphSettings();
});

arrowPosSlider.addEventListener('input', (e) => {
    arrowPos = parseFloat(e.target.value);
    document.getElementById('val-arrow-pos').textContent = arrowPos;
    updateGraphSettings();
});

// 3D Settings Listeners
linkOpacitySlider.addEventListener('input', (e) => {
    linkOpacity = parseFloat(e.target.value);
    document.getElementById('val-link-opacity').textContent = linkOpacity;
    updateGraphSettings();
});

linkResolutionSlider.addEventListener('input', (e) => {
    linkResolution = parseInt(e.target.value);
    document.getElementById('val-link-resolution').textContent = linkResolution;
    updateGraphSettings();
});

linkMaterialSelect.addEventListener('change', (e) => {
    linkMaterialType = e.target.value;
    updateGraphSettings();
});

particleResolutionSlider.addEventListener('input', (e) => {
    particleResolution = parseInt(e.target.value);
    document.getElementById('val-particle-resolution').textContent = particleResolution;
    updateGraphSettings();
});

nodeResolutionSlider.addEventListener('input', (e) => {
    nodeResolution = parseInt(e.target.value);
    document.getElementById('val-node-resolution').textContent = nodeResolution;
    updateGraphSettings();
});

applyBtn.addEventListener('click', () => {
    if (graphData) {
        // Force full re-init
        Graph = null;
        const graphContainer = document.getElementById('graph-container');
        graphContainer.innerHTML = ''; // Clear container
        initGraph(graphData);
    }
});

resetBtn.addEventListener('click', () => {
    resetSettings();
});

function resetSettings() {
    // Reset State Variables
    fixNodes = false;
    hoverEnabled = true;
    labelDensity = 0.7;
    nodeSizeAttribute = 'amount';
    edgeWidthAttribute = 'Assesment Amount';
    nodeLabelAttribute = 'legal_name';
    edgeLabelAttribute = 'assamtstr';
    particleWidthAttribute = 'Assesment Amount';
    nodeLabelSize = 12;
    edgeLabelSize = 10;

    // Reset UI Elements
    document.getElementById('fix-nodes-toggle').checked = false;
    document.getElementById('hover-toggle').checked = true;

    document.getElementById('label-density').value = 0.7;
    document.getElementById('val-label-density').textContent = '0.7';

    document.getElementById('node-size-attr').value = 'amount';
    document.getElementById('edge-width-attr').value = 'Assesment Amount';
    document.getElementById('node-label-attr').value = 'legal_name';
    document.getElementById('edge-label-attr').value = 'assamtstr';
    document.getElementById('particle-width-attr').value = 'Assesment Amount';

    document.getElementById('particle-speed').value = 4;
    document.getElementById('val-particle-speed').textContent = '4';

    document.getElementById('node-label-size').value = 12;
    document.getElementById('val-node-label-size').textContent = '12';

    document.getElementById('edge-label-size').value = 10;
    document.getElementById('val-edge-label-size').textContent = '10';

    document.getElementById('arrow-pos').value = 0.5;
    document.getElementById('val-arrow-pos').textContent = '0.5';

    // Reset Scales
    maxNodeSize = 10;
    maxEdgeWidth = 5;
    maxParticleWidth = 4;
    arrowLength = 3.5;

    document.getElementById('max-node-size').value = 10;
    document.getElementById('val-max-node-size').textContent = '10';
    document.getElementById('max-edge-width').value = 5;
    document.getElementById('val-max-edge-width').textContent = '5';
    document.getElementById('max-particle-width').value = 4;
    document.getElementById('val-max-particle-width').textContent = '4';
    document.getElementById('arrow-length').value = 3.5;
    document.getElementById('val-arrow-length').textContent = '3.5';

    // Reset 3D Settings
    linkOpacity = 0.2;
    linkResolution = 6;
    linkMaterialType = 'MeshLambertMaterial';
    particleResolution = 6;
    nodeResolution = 8;

    document.getElementById('link-opacity').value = 0.2;
    document.getElementById('val-link-opacity').textContent = '0.2';
    document.getElementById('link-resolution').value = 6;
    document.getElementById('val-link-resolution').textContent = '6';
    document.getElementById('link-material').value = 'MeshLambertMaterial';
    document.getElementById('particle-resolution').value = 6;
    document.getElementById('val-particle-resolution').textContent = '6';
    document.getElementById('node-resolution').value = 8;
    document.getElementById('val-node-resolution').textContent = '8';

    // Apply Changes
    updateGraphSettings();
}

// Controls
zoomInBtn.addEventListener('click', () => {
    if (!Graph) return;
    if (currentMode === '2D') {
        Graph.zoom(Graph.zoom() * 1.2, 400);
    } else {
        const pos = Graph.cameraPosition();
        Graph.cameraPosition({ x: pos.x * 0.8, y: pos.y * 0.8, z: pos.z * 0.8 }, pos.lookAt, 400);
    }
});

zoomOutBtn.addEventListener('click', () => {
    if (!Graph) return;
    if (currentMode === '2D') {
        Graph.zoom(Graph.zoom() / 1.2, 400);
    } else {
        const pos = Graph.cameraPosition();
        Graph.cameraPosition({ x: pos.x * 1.2, y: pos.y * 1.2, z: pos.z * 1.2 }, pos.lookAt, 400);
    }
});

fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
});

pauseBtn.addEventListener('click', () => {
    if (Graph) {
        if (isPaused) {
            if (currentMode === '2D') Graph.d3ReheatSimulation();
            else Graph.resumeAnimation();
            pauseBtn.innerHTML = '<i data-lucide="pause" class="w-5 h-5"></i>';
            pauseBtn.title = "Pause Simulation";
        } else {
            if (currentMode === '2D') Graph.d3StopSimulation();
            else Graph.pauseAnimation();
            pauseBtn.innerHTML = '<i data-lucide="play" class="w-5 h-5"></i>';
            pauseBtn.title = "Resume Simulation";
        }
        isPaused = !isPaused;
        lucide.createIcons();
    }
});

fitBtn.addEventListener('click', () => {
    if (Graph) {
        Graph.zoomToFit(400);
    }
});

// 2D/3D Toggle
dimBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const val = e.target.dataset.value; // '2' or '3'
        const mode = val === '2' ? '2D' : '3D';

        if (currentMode === mode) return;

        dimBtns.forEach(b => {
            b.classList.remove('bg-indigo-600', 'text-white', 'shadow-sm');
            b.classList.add('text-gray-300', 'hover:bg-gray-600');
        });
        e.target.classList.add('bg-indigo-600', 'text-white', 'shadow-sm');
        e.target.classList.remove('text-gray-300', 'hover:bg-gray-600');

        switchGraphMode(mode);
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
        sidebarToggle.classList.remove('hidden');
        sidebarPanel.classList.remove('translate-x-full');

        processLinkCurvature(graphData.links);
        initGraph(graphData);
        populateFilters(graphData);
        lucide.createIcons();

    } catch (e) {
        errorMessage.textContent = e.message;
        errorMessage.classList.remove('hidden');
    } finally {
        loadingIndicator.classList.add('hidden');
        dropZone.classList.remove('pointer-events-none', 'opacity-50');
    }
}

function switchGraphMode(mode) {
    currentMode = mode;

    // Toggle visibility of 3D settings
    if (currentMode === '3D') {
        settings3dContainer.classList.remove('hidden');
    } else {
        settings3dContainer.classList.add('hidden');
    }

    if (Graph) {
        Graph._destructor(); // Cleanup
        graphContainer.innerHTML = ''; // Ensure container is empty
        Graph = null;
    }
    if (graphData) {
        initGraph(graphData);
    }
}

function populateFilters(data) {
    // Clear existing
    Object.values(filterContainers).forEach(el => el.innerHTML = '');

    // Helper to create filter buttons
    const createFilterBtn = (container, type, value, color) => {
        if (!value) return;
        const btn = document.createElement('button');
        btn.className = 'w-full text-left px-3 py-2 rounded-md hover:bg-gray-800 flex items-center space-x-3 transition-colors group';
        btn.innerHTML = `
            <span class="w-3 h-3 rounded-full shrink-0" style="background-color: ${color || '#9ca3af'}"></span>
            <span class="text-sm text-gray-300 group-hover:text-white truncate">${value}</span>
        `;

        btn.addEventListener('click', () => handleFilterClick(type, value, btn));
        container.appendChild(btn);
    };

    // 1. Division
    const divisions = [...new Set(data.nodes.map(n => n.division).filter(Boolean))].sort();
    const divColors = generateColors(divisions.length);
    divisions.forEach((div, i) => createFilterBtn(filterContainers.division, 'division', div, divColors[i]));

    // 2. Circle
    const circles = [...new Set(data.nodes.map(n => n.circle).filter(Boolean))].sort();
    const circleColors = generateColors(circles.length);
    circles.forEach((c, i) => createFilterBtn(filterContainers.circle, 'circle', c, circleColors[i]));

    // 3. Zone
    const zones = [...new Set(data.nodes.map(n => n.zone).filter(Boolean))].sort();
    const zoneColors = generateColors(zones.length);
    zones.forEach((z, i) => createFilterBtn(filterContainers.zone, 'zone', z, zoneColors[i]));

    // 4. Edge Color
    const edgeColors = [...new Set(data.links.map(l => l.color).filter(Boolean))].sort();
    const edgeColorPalette = generateColors(edgeColors.length);
    edgeColors.forEach((c, i) => createFilterBtn(filterContainers.edge, 'edge', c, edgeColorPalette[i]));
}

function handleFilterClick(type, value, btnElement) {
    // Toggle logic
    if (activeFilter.type === type && activeFilter.value === value) {
        // Deselect
        activeFilter = { type: null, value: null };
        btnElement.classList.remove('bg-gray-800');
    } else {
        // Select new
        activeFilter = { type, value };
        // Clear all active states
        document.querySelectorAll('#sidebar-panel button').forEach(b => b.classList.remove('bg-gray-800'));
        btnElement.classList.add('bg-gray-800');
    }

    applyFilter();
}

function applyFilter() {
    highlightedNodes.clear();
    highlightedLinks.clear();

    if (!activeFilter.value) {
        updateHighlight();
        return;
    }

    if (activeFilter.type === 'edge') {
        // Filter by Edge Color
        graphData.links.forEach(link => {
            if (link.color === activeFilter.value) {
                highlightedLinks.add(getLinkId(link));
                const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                highlightedNodes.add(sourceId);
                highlightedNodes.add(targetId);
            }
        });
    } else {
        // Filter by Node Attribute
        graphData.nodes.forEach(node => {
            if (node[activeFilter.type] === activeFilter.value) {
                highlightedNodes.add(node.id);
            }
        });

        // Also highlight connected links? Optional. Let's keep it simple: just nodes.
    }

    updateHighlight();
}

// Helper for min-max scaling
function scaleValue(value, minVal, maxVal, minSize, maxSize) {
    if (minVal === maxVal) return (minSize + maxSize) / 2;
    const val = parseFloat(value);
    if (isNaN(val)) return minSize;

    // Clamp
    if (val <= minVal) return minSize;
    if (val >= maxVal) return maxSize;

    return minSize + ((val - minVal) / (maxVal - minVal)) * (maxSize - minSize);
}

async function initGraph(data) {
    if (currentMode === '3D') {
        if (!SpriteText) {
            try {
                const module = await import('https://esm.sh/three-spritetext');
                SpriteText = module.default;
            } catch (e) {
                console.error("Failed to load SpriteText", e);
            }
        }
        if (!THREE) {
            try {
                const module = await import('https://esm.sh/three');
                THREE = module;
            } catch (e) {
                console.error("Failed to load THREE", e);
            }
        }
    }

    const graphContainer = document.getElementById('graph-container');
    const GraphConstructor = currentMode === '2D' ? ForceGraph : ForceGraph3D;

    // Only create new instance if needed
    if (!Graph || Graph.constructor.name !== (currentMode === '2D' ? 'ForceGraph' : 'ForceGraph3D')) {
        if (Graph) Graph._destructor(); // Cleanup previous instance if it exists
        graphContainer.innerHTML = ''; // Clear previous graph
        Graph = GraphConstructor()(graphContainer)
            .width(graphContainer.offsetWidth)
            .height(graphContainer.offsetHeight)
            .backgroundColor(BACKGROUND_COLOR);
    }

    Graph.graphData(data);

    // Apply all settings
    updateGraphSettings();

    // Event handlers that don't need frequent updates
    Graph
        .onNodeClick(handleNodeClick)
        .onLinkClick(handleLinkClick)
        .onBackgroundClick(resetHighlight)
        .onNodeHover(node => {
            if (isSelectionActive || !hoverEnabled) return; // Disable hover when selection is active OR hover disabled
            hoverNode = node || null;
            updateHighlight();
            graphContainer.style.cursor = node ? 'pointer' : null;
            if (node) {
                showInfo(node, 'Node Details');
            } else if (!hoverLink) {
                closeInfo();
            }
        })
        .onLinkHover(link => {
            if (isSelectionActive || !hoverEnabled) return; // Disable hover when selection is active OR hover disabled
            hoverLink = link || null;
            updateHighlight();
            graphContainer.style.cursor = link ? 'pointer' : null;
            if (link) {
                showInfo(link, 'Link Details');
            } else if (!hoverNode) {
                closeInfo();
            }
        })
        .onNodeDragEnd(node => {
            if (fixNodes) {
                node.fx = node.x;
                node.fy = node.y;
                if (currentMode === '3D') node.fz = node.z;
            } else {
                node.fx = null;
                node.fy = null;
                if (currentMode === '3D') node.fz = null;
            }
        });

    // Resize handler
    window.addEventListener('resize', () => {
        Graph.width(graphContainer.offsetWidth);
        Graph.height(graphContainer.offsetHeight);
    });
}

function updateGraphSettings() {
    if (!Graph || !graphData) return;

    const data = graphData; // Use global data

    // Calculate ranges for scaling
    // Nodes
    const nodeValues = data.nodes.map(n => parseFloat(n[nodeSizeAttribute])).filter(v => !isNaN(v));
    const minNodeVal = nodeValues.length ? Math.min(...nodeValues) : 0;
    const maxNodeVal = nodeValues.length ? Math.max(...nodeValues) : 1;

    // Links
    const linkValues = data.links.map(l => parseFloat(l[edgeWidthAttribute])).filter(v => !isNaN(v));
    const minLinkVal = linkValues.length ? Math.min(...linkValues) : 0;
    const maxLinkVal = linkValues.length ? Math.max(...linkValues) : 1;

    // Particles
    const particleValues = data.links.map(l => parseFloat(l[particleWidthAttribute])).filter(v => !isNaN(v));
    const minParticleVal = particleValues.length ? Math.min(...particleValues) : 0;
    const maxParticleVal = particleValues.length ? Math.max(...particleValues) : 1;

    // Color mapping based on current selection
    const values = [...new Set(data.nodes.map(n => n[nodeColorAttribute]).filter(Boolean))].sort();
    const colors = generateColors(values.length);
    const colorMap = {};
    values.forEach((v, i) => colorMap[v] = colors[i]);

    // Color mapping for Edge Colors
    const edgeColors = [...new Set(data.links.map(l => l.color).filter(Boolean))].sort();
    const edgeColorPalette = generateColors(edgeColors.length);
    const edgeColorMap = {};
    edgeColors.forEach((c, i) => edgeColorMap[c] = edgeColorPalette[i]);

    // Apply settings
    Graph
        .nodeLabel(node => {
            if (!nodeLabelAttribute) return '';
            return node[nodeLabelAttribute] || node.id;
        }) // Tooltip
        .linkLabel(link => {
            if (!edgeLabelAttribute) return '';
            return link[edgeLabelAttribute] || '';
        }) // Tooltip
        .nodeColor(node => {
            if (highlightedNodes.size > 0 && !highlightedNodes.has(node.id)) return 'rgba(100, 100, 100, 0.2)'; // Increased visibility
            if (!nodeColorAttribute) return '#ffffff'; // Default white
            return colorMap[node[nodeColorAttribute]] || '#9ca3af';
        })
        .nodeVal(node => {
            // Scale node size (radius) based on selected attribute
            if (!nodeSizeAttribute) return 4; // Default constant size
            return scaleValue(node[nodeSizeAttribute], minNodeVal, maxNodeVal, MIN_NODE_SIZE, maxNodeSize);
        })
        .nodeRelSize(1) // Use nodeVal directly as radius (or close to it)
        .linkWidth(link => {
            // Scale link width based on selected attribute
            let width = 1; // Default thin
            if (edgeWidthAttribute) {
                width = scaleValue(link[edgeWidthAttribute], minLinkVal, maxLinkVal, MIN_EDGE_WIDTH, maxEdgeWidth);
            }

            if (highlightedLinks.has(getLinkId(link))) return width * 2;
            if (hoverLink === link) return width * 2;
            return width;
        })
        .linkCurvature('curvature')
        .linkColor(link => {
            const color = edgeColorMap[link.color] || '#ffffff';
            if (highlightedNodes.size > 0 || highlightedLinks.size > 0) {
                return highlightedLinks.has(getLinkId(link)) ? color : 'rgba(100,100,100,0.15)'; // Increased visibility
            }
            // Hover dimming removed per request
            return color;
        })

        .linkDirectionalArrowLength(arrowLength)
        .linkDirectionalArrowRelPos(arrowPos)
        .linkDirectionalParticles(link => {
            if (!particleWidthAttribute) return 0; // No particles if None selected
            // Map 'Degree' to particle count
            const degree = parseInt(link.Degree);
            return !isNaN(degree) ? Math.min(degree, 5) : 2; // Cap at 5
        })
        .linkDirectionalParticleWidth(link => {
            if (!particleWidthAttribute) return 0;
            // Map selected attribute to particle width
            return scaleValue(link[particleWidthAttribute], minParticleVal, maxParticleVal, MIN_PARTICLE_WIDTH, maxParticleWidth);
        })
        .linkDirectionalParticleSpeed(parseFloat(particleSpeedSlider.value) * 0.0005) // Reduced speed multiplier
        .linkHoverPrecision(5); // Increased precision

    if (currentMode === '3D') {
        Graph
            .linkOpacity(linkOpacity)
            .linkResolution(linkResolution)
            .linkDirectionalParticleResolution(particleResolution)
            .nodeResolution(nodeResolution);

        if (THREE && linkMaterialType) {
            // Create material based on type
            // We need to create a material function or object? 
            // 3d-force-graph expects linkMaterial to be a Material object or function returning one.
            // But we want to apply it to all links.
            // Let's use a function that returns a new material instance for each link (expensive?) or reuse?
            // Reusing is better.

            let mat;
            if (linkMaterialType === 'MeshBasicMaterial') mat = new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: linkOpacity });
            else if (linkMaterialType === 'MeshPhongMaterial') mat = new THREE.MeshPhongMaterial({ color: 0xcccccc, transparent: true, opacity: linkOpacity });
            else mat = new THREE.MeshLambertMaterial({ color: 0xcccccc, transparent: true, opacity: linkOpacity });

            // We need to update color per link?
            // If we set linkMaterial, it overrides linkColor?
            // Actually linkColor sets the color of the default material.
            // If we provide a custom material, we must handle color.

            Graph.linkMaterial(link => {
                const color = edgeColorMap[link.color] || '#ffffff';
                const material = mat.clone(); // Clone to allow different colors
                material.color.set(color);

                // Highlight logic
                if (highlightedNodes.size > 0 || highlightedLinks.size > 0) {
                    if (!highlightedLinks.has(getLinkId(link))) {
                        material.opacity = 0.15;
                    } else {
                        material.opacity = linkOpacity; // Restore selected opacity
                    }
                }

                return material;
            });
        }

        if (SpriteText) {
            Graph.nodeThreeObject(node => {
                // Visibility Logic
                const showLabel = (isSelectionActive && highlightedNodes.has(node.id)) ||
                    (!isSelectionActive && checkLabelDensity(node.id));

                if (!showLabel) return null;

                const label = node[nodeLabelAttribute] || node.id;
                const sprite = new SpriteText(label);
                sprite.material.depthWrite = false;
                sprite.color = (highlightedNodes.size > 0 && !highlightedNodes.has(node.id)) ? 'rgba(100, 100, 100, 0.2)' : '#ffffff';
                sprite.textHeight = nodeLabelSize;
                sprite.center.y = -0.6; // Shift above node (radius is ~4-10, textHeight ~12. 0.5 is center. -0.5 is top edge?)
                // Actually center.y = 0 is center. 0.5 is bottom, -0.5 is top.
                // Let's try shifting it up by radius + padding.
                // But SpriteText positioning is relative to the node center.
                // We can just set a fixed offset or rely on center.y

                return sprite;
            })
                .nodeThreeObjectExtend(true)
                .linkThreeObject(link => {
                    // Visibility Logic
                    const showLabel = (isSelectionActive && highlightedLinks.has(getLinkId(link))) ||
                        (!isSelectionActive && checkLabelDensity(getLinkId(link)));

                    if (!showLabel) return null;

                    if (!showLabel) return null;
                    if (!edgeLabelAttribute) return null; // No label if None selected

                    const label = link[edgeLabelAttribute] || '';
                    if (!label) return null;

                    const sprite = new SpriteText(label);
                    sprite.material.depthWrite = false;
                    sprite.color = 'rgba(200, 200, 200, 0.8)';
                    sprite.textHeight = edgeLabelSize;
                    return sprite;
                })
                .linkThreeObjectExtend(true)
                .linkPositionUpdate((sprite, { start, end }) => {
                    if (!sprite) return;
                    const middlePos = Object.assign(...['x', 'y', 'z'].map(c => ({
                        [c]: start[c] + (end[c] - start[c]) / 2 // calc middle point
                    })));
                    Object.assign(sprite.position, middlePos);
                });
        }
    }

    if (currentMode === '2D') { // 2D Specific: Render Labels
        Graph.nodeCanvasObject((node, ctx, globalScale) => {
            const label = nodeLabelAttribute ? (node[nodeLabelAttribute] || node.id) : '';
            const fontSize = nodeLabelSize / globalScale;

            // Draw Node
            let radius = 4;
            if (nodeSizeAttribute) {
                radius = scaleValue(node[nodeSizeAttribute], minNodeVal, maxNodeVal, MIN_NODE_SIZE, maxNodeSize);
            }

            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = (highlightedNodes.size > 0 && !highlightedNodes.has(node.id)) ? 'rgba(100, 100, 100, 0.2)' : (colorMap[node[nodeColorAttribute]] || '#9ca3af');
            ctx.fill();

            // Draw Label
            // Show if selection is active AND node is highlighted, OR if no selection and zoomed in (filtered by density)
            const showLabel = (isSelectionActive && highlightedNodes.has(node.id)) ||
                (!isSelectionActive && globalScale >= 1.5 && checkLabelDensity(node.id));

            if (showLabel && nodeLabelAttribute) {
                ctx.font = `${fontSize}px Sans-Serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.fillText(label, node.x, node.y + radius + fontSize, 200);
            }
        })
            .linkCanvasObjectMode(() => 'after')
            .linkCanvasObject((link, ctx, globalScale) => {
                if (!edgeLabelAttribute) return;
                const label = link[edgeLabelAttribute] || '';
                if (!label) return;

                // Show if selection is active AND link is highlighted, OR if no selection and zoomed in (filtered by density)
                const showLabel = (isSelectionActive && highlightedLinks.has(getLinkId(link))) ||
                    (!isSelectionActive && globalScale >= 1.5 && checkLabelDensity(getLinkId(link)));

                if (showLabel) {
                    const fontSize = edgeLabelSize / globalScale;
                    ctx.font = `${fontSize}px Sans-Serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';

                    // Calculate position
                    const start = link.source;
                    const end = link.target;

                    if (typeof start !== 'object' || typeof end !== 'object') return; // Safety check

                    let x, y;
                    if (link.curvature) {
                        // Calculate midpoint of quadratic bezier
                        // Control point is roughly: mid + normal * curvature * dist
                        const dx = end.x - start.x;
                        const dy = end.y - start.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        const midX = (start.x + end.x) / 2;
                        const midY = (start.y + end.y) / 2;

                        // Normal vector (-dy, dx)
                        const nx = -dy / dist;
                        const ny = dx / dist;

                        // Peak of curve (t=0.5) is at mid + 0.5 * offset
                        // The force-graph curvature offset is applied to the control point
                        // Control point = mid + curvature * dist * normal
                        // Bezier peak = mid + 0.5 * (control - mid) = mid + 0.5 * curvature * dist * normal
                        const offset = 0.5 * link.curvature * dist;
                        x = midX + nx * offset;
                        y = midY + ny * offset;
                    } else {
                        x = (start.x + end.x) / 2;
                        y = (start.y + end.y) / 2;
                    }

                    ctx.fillText(label, x, y);
                }
            });
    }

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
    isSelectionActive = true; // Activate selection mode
    showInfo(node, 'Node Details');
    zoomToNode(node);

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

    updateHighlight();
}

function handleLinkClick(link) {
    isSelectionActive = true; // Activate selection mode
    showInfo(link, 'Link Details');

    highlightedNodes.clear();
    highlightedLinks.clear();

    highlightedLinks.add(getLinkId(link));
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    highlightedNodes.add(sourceId);
    highlightedNodes.add(targetId);

    updateHighlight();
}

function zoomToNode(node) {
    if (currentMode === '3D') {
        const distance = 100;
        const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
        Graph.cameraPosition(
            { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
            node, // lookAt ({ x, y, z })
            3000  // ms transition duration
        );
    } else {
        Graph.centerAt(node.x, node.y, 1000);
        Graph.zoom(8, 2000);
    }
}

function resetHighlight() {
    isSelectionActive = false; // Deactivate selection mode
    highlightedNodes.clear();
    highlightedLinks.clear();
    activeFilter = { type: null, value: null };
    document.querySelectorAll('#sidebar-panel button').forEach(b => b.classList.remove('bg-gray-800'));
    updateHighlight();
    closeInfo();
}

function updateHighlight() {
    if (Graph) {
        Graph.nodeColor(Graph.nodeColor())
            .linkWidth(Graph.linkWidth())
            .linkColor(Graph.linkColor());
    }
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
        if (['vx', 'vy', 'vz', 'x', 'y', 'z', 'index', '__indexColor', '__threeObj', '__lineObj', '__arrowObj', 'curvature'].includes(key)) return;

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
    infoPanel.classList.remove('translate-y-[120%]');
}

function closeInfo() {
    infoPanel.classList.add('translate-y-[120%]');
}

function resetApp() {
    graphData = null;
    if (Graph) {
        Graph._destructor();
        graphContainer.innerHTML = '';
        Graph = null;
    }

    uploadContainer.classList.remove('hidden');
    graphContainer.classList.add('hidden');
    newFileBtn.classList.add('hidden');
    sidebarToggle.classList.add('hidden');
    sidebarPanel.classList.add('translate-x-full');
    infoPanel.classList.add('translate-y-[120%]');
    fileInput.value = '';
}

function processLinkCurvature(links) {
    const linkGroups = {};

    links.forEach(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;

        // Group by unordered pair to handle cycles (A->B and B->A) and parallel edges
        const key = [sourceId, targetId].sort().join('__');
        if (!linkGroups[key]) linkGroups[key] = [];
        linkGroups[key].push(link);
    });

    Object.keys(linkGroups).forEach(key => {
        const group = linkGroups[key];
        const len = group.length;

        if (len > 1) {
            // Multi-edge (parallel or cycle)
            group.forEach((link, i) => {
                const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                const isForward = sourceId < targetId;
                const direction = isForward ? 1 : -1;

                // Distribute curvature
                let rawCurvature;
                if (len === 2) {
                    rawCurvature = i === 0 ? 0.2 : -0.2;
                } else {
                    rawCurvature = ((i / (len - 1)) - 0.5);
                }

                // Adjust curvature based on direction so anti-parallel edges curve away from each other
                // If sourceId === targetId (self-loop), direction is -1, which is fine
                link.curvature = rawCurvature * direction;
            });
        } else {
            // Single edge
            const link = group[0];
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;

            if (sourceId === targetId) {
                // Self-loop
                link.curvature = 0.4;
            } else {
                // Single straight edge
                link.curvature = 0;
            }
        }
    });
}

function generateColors(count) {
    const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];
    if (count <= colors.length) return colors.slice(0, count);
    // If more needed, repeat
    const res = [];
    for (let i = 0; i < count; i++) res.push(colors[i % colors.length]);
    return res;
}

function checkLabelDensity(id) {
    if (labelDensity >= 1) return true;
    let hash = 0;
    const str = String(id);
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return ((Math.abs(hash) % 100) / 100) < labelDensity;
}
