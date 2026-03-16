// State
let Graph = null;
let graphData = null;
let highlightedNodes = new Set();
let highlightedLinks = new Set();
let hoverNode = null;
let hoverLink = null;
let isSelectionActive = false;
let currentMode = '2D'; // '2D' or '3D'
let activeFilter = { type: null, value: null }; // { type: 'division'|'circle'|'zone'|'edge', value: '...' }
let fixNodes = false;
let nodeColorAttribute = 'shape';
let hoverEnabled = true;
let showEdges = true;
let labelDensity = 0.1;
let nodeSizeAttribute = 'amount';
let edgeWidthAttribute = 'Assesment Amount';
let nodeLabelAttribute = 'legal_name';
let edgeLabelAttribute = 'assamtstr';
let particleWidthAttribute = 'Assesment Amount';
let fraudScoreAttribute = 'neighbour_count'
let scoreThreshold = 0.15;
let nodeLabelSize = 12;
let edgeLabelSize = 2.5;
let arrowPos = 0.5;
let arrowLength = 6;
let maxNodeSize = 7;
let maxEdgeWidth = 4;
let maxParticleWidth = 3;
let minNodeSize = 2;
let minEdgeWidth = 1;
let minParticleWidth = 1;
let nodeScaleType = 'linear';
let edgeScaleType = 'linear';
let particleScaleType = 'linear';
let isPaused = false;

let edgeWidthMultiplier = 0.8;
let particleWidthMultiplier = 0.5;

// 3D Specific State
let linkOpacity = 0.5;
let linkResolution = 6;
let linkMaterialType = 'MeshLambertMaterial';
let particleResolution = 6;
let nodeResolution = 8;
let THREE = null; // Will be imported dynamically
let SpriteText = null; // Global reference for 3D labels

// Physics State
let chargeStrength = -30;
let chargeTheta = 0.9;
let chargeDistMin = 1;
let chargeDistMax = 1000;
let linkDistance = 30;
let linkIterations = 5;
let collideStrength = 0.7;
let collideRadius = 1;
let collideIterations = 1;
let centerStrength = 1;

const DEFAULTS_2D = {
    // Common
    fixNodes: false,
    hoverEnabled: true,
    showEdges: true,
    labelDensity: 0.2,

    // Layout & Clustering defaults
    dagMode: '',
    layoutMode: 'disjoint',
    clusterStrength: 0.3,
    disjointStrength: 0.05,
    clusteringAlgorithm: 'louvain',
    clusterBins: 5,

    nodeSizeAttribute: 'amount',
    edgeWidthAttribute: 'Assesment Amount',
    particleWidthAttribute: 'Assesment Amount',

    nodeLabelAttribute: 'legal_name',
    edgeLabelAttribute: 'assamtstr',

    nodeLabelSize: 10,
    edgeLabelSize: 10,

    arrowPos: 0.5,
    arrowLength: 2.5,

    maxNodeSize: 7,
    maxEdgeWidth: 8,
    maxParticleWidth: 9, // usually no particles in 2D
    minNodeSize: 2,
    minEdgeWidth: 1,
    minParticleWidth: 1,
    nodeScaleType: 'linear',
    edgeScaleType: 'linear',
    particleScaleType: 'linear',

    // 3D-only values disabled
    linkOpacity: null,
    linkResolution: null,
    linkMaterialType: null,
    particleResolution: null,
    nodeResolution: null,

    // Physics
    chargeStrength: -30,
    chargeTheta: 0.9,
    chargeDistMin: 1,
    chargeDistMax: 1000,
    linkDistance: 30,
    linkIterations: 5,
    collideStrength: 0.7,
    collideRadius: 1,
    collideIterations: 1,
    centerStrength: 1
};



const DEFAULTS_3D = {
    // Common
    fixNodes: false,
    hoverEnabled: true,
    showEdges: true,
    labelDensity: 0.1,

    // Layout & Clustering defaults
    dagMode: '',
    layoutMode: 'disjoint',
    clusterStrength: 0.3,
    disjointStrength: 0.05,
    clusteringAlgorithm: 'louvain',
    clusterBins: 5,

    nodeSizeAttribute: 'amount',
    edgeWidthAttribute: 'Assesment Amount',
    particleWidthAttribute: 'Assesment Amount',

    nodeLabelAttribute: 'legal_name',
    edgeLabelAttribute: 'assamtstr',

    nodeLabelSize: 12,
    edgeLabelSize: 2.5,

    arrowPos: 0.5,
    arrowLength: 6,

    maxNodeSize: 8,
    maxEdgeWidth: 4,
    maxParticleWidth: 5,
    minNodeSize: 1,
    minEdgeWidth: 0.5,
    minParticleWidth: 0.5,
    nodeScaleType: 'linear', // 3D might benefit from log? Keep linear for consistency
    edgeScaleType: 'linear',
    particleScaleType: 'linear',

    // 3D-specific
    linkOpacity: 0.5,
    linkResolution: 6,
    linkMaterialType: 'MeshLambertMaterial',
    particleResolution: 6,
    nodeResolution: 8,

    // Physics
    chargeStrength: -30,
    chargeTheta: 0.9,
    chargeDistMin: 1,
    chargeDistMax: 2000,
    linkDistance: 30,
    linkIterations: 5,
    collideStrength: 0.7,
    collideRadius: 1,
    collideIterations: 1,
    centerStrength: 1
};


function getDefaultsForMode(mode) {
    return mode === '2D' ? DEFAULTS_2D : DEFAULTS_3D;
}




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
const tabPhysics = document.getElementById('tab-physics');
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
const minNodeSizeSlider = document.getElementById('min-node-size');
const minEdgeWidthSlider = document.getElementById('min-edge-width');
const minParticleWidthSlider = document.getElementById('min-particle-width');
const nodeScaleTypeSelect = document.getElementById('node-scale-type');
const edgeScaleTypeSelect = document.getElementById('edge-scale-type');
const particleScaleTypeSelect = document.getElementById('particle-scale-type');
const arrowLengthSlider = document.getElementById('arrow-length');
const scoreThresholdSlider = document.getElementById('score-threshold');
const nodeColorSelect = document.getElementById('node-color-by');
const fixNodesToggle = document.getElementById('fix-nodes-toggle');
const hoverToggle = document.getElementById('hover-toggle');
const showEdgesToggle = document.getElementById('show-edges-toggle');
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

// Physics Settings Elements
const chargeStrengthSlider = document.getElementById('charge-strength');
const chargeThetaSlider = document.getElementById('charge-theta');
const chargeDistMinSlider = document.getElementById('charge-dist-min');
const chargeDistMaxSlider = document.getElementById('charge-dist-max');

const linkDistanceSlider = document.getElementById('link-distance');
const linkIterationsSlider = document.getElementById('link-iterations');

const collideStrengthSlider = document.getElementById('collide-strength');
const collideRadiusSlider = document.getElementById('collide-radius');
const collideIterationsSlider = document.getElementById('collide-iterations');

const centerStrengthSlider = document.getElementById('center-strength');

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

// Chart Panel
const chartPanel = document.getElementById('chart-panel');
const chartTitle = document.getElementById('chart-title');
const closeChartBtn = document.getElementById('close-chart-btn');
let pieChartCanvas = document.getElementById('pie-chart');
let currentChart = null; // Active Chart.js instance

// Sankey Panel
const sankeyPanel = document.getElementById('sankey-panel');
const sankeyTitle = document.getElementById('sankey-title');
const closeSankeyBtn = document.getElementById('close-sankey-btn');
let sankeyChart = null; // Active ECharts instance

// Zoom Modal
const zoomPieBtn = document.getElementById('zoom-pie-btn');
const zoomSankeyBtn = document.getElementById('zoom-sankey-btn');
const chartModal = document.getElementById('chart-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalContent = document.getElementById('modal-content');
const modalTitle = document.getElementById('modal-title');
let modalChartInstance = null;

// Constants
// const MIN_NODE_SIZE = 2;
// const MAX_NODE_SIZE = 20; // Now dynamic
// const MIN_EDGE_WIDTH = 1;
// const MAX_EDGE_WIDTH = 5; // Now dynamic
// const MIN_PARTICLE_WIDTH = 1;
// const MAX_PARTICLE_WIDTH = 4; // Now dynamic
const BACKGROUND_COLOR = '#1a202c'; // Dark background for consistency
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
sidebarToggle.addEventListener('click', () => sidebarPanel.classList.add('sidebar-visible'));
closeSidebarBtn.addEventListener('click', () => sidebarPanel.classList.remove('sidebar-visible'));
closeInfoBtn.addEventListener('click', closeInfo);
closeChartBtn.addEventListener('click', closeChart);
closeSankeyBtn.addEventListener('click', closeSankey);

if (zoomPieBtn) zoomPieBtn.addEventListener('click', () => openChartModal('pie'));
if (zoomSankeyBtn) zoomSankeyBtn.addEventListener('click', () => openChartModal('sankey'));
if (closeModalBtn) closeModalBtn.addEventListener('click', closeChartModal);

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
        tabFilters.classList.add('hidden');
        tabSettings.classList.add('hidden');
        tabPhysics.classList.add('hidden');

        if (tab === 'filters') {
            tabFilters.classList.remove('hidden');
        } else if (tab === 'settings') {
            tabSettings.classList.remove('hidden');
        } else if (tab === 'physics') {
            tabPhysics.classList.remove('hidden');
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
            return colorMap[node[nodeColorAttribute]] || '#9daf9cff';
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

showEdgesToggle.addEventListener('click', () => {
    showEdges = !showEdges;
    const span = showEdgesToggle.querySelector('span');
    if (showEdges) {
        showEdgesToggle.classList.add('bg-indigo-600');
        showEdgesToggle.classList.remove('bg-gray-700');
        span.classList.add('translate-x-5');
    } else {
        showEdgesToggle.classList.remove('bg-indigo-600');
        showEdgesToggle.classList.add('bg-gray-700');
        span.classList.remove('translate-x-5');
    }
    updateGraphSettings();
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

    // if (currentMode === '3D') {
    //     maxNodeSize = maxNodeSize_temp * maxNodeSize_temp; // Scale up for 3D visibility
    // }

    document.getElementById('val-max-node-size').textContent = maxNodeSize;
    updateGraphSettings();
});

maxEdgeWidthSlider.addEventListener('input', (e) => {
    maxEdgeWidth = parseInt(e.target.value);

    // if (currentMode === '3D') {
    //     maxEdgeWidth = maxEdgeWidth_temp * 0.5; // Scale up for 3D visibility
    // }
    document.getElementById('val-max-edge-width').textContent = maxEdgeWidth;
    updateGraphSettings();
});

maxParticleWidthSlider.addEventListener('input', (e) => {
    maxParticleWidth = parseInt(e.target.value);
    document.getElementById('val-max-particle-width').textContent = maxParticleWidth;
    updateGraphSettings();
});

minNodeSizeSlider.addEventListener('input', (e) => {
    minNodeSize = parseFloat(e.target.value);
    // if (currentMode === '3D') {
    //     minNodeSize = minNodeSize_temp * minNodeSize_temp; // Scale for 3D
    // }
    document.getElementById('val-min-node-size').textContent = minNodeSize;
    updateGraphSettings();
});

minEdgeWidthSlider.addEventListener('input', (e) => {
    minEdgeWidth = parseFloat(e.target.value);
    // if (currentMode === '3D') {
    //     minEdgeWidth = minEdgeWidth_temp * 0.5; // Scale for 3D
    // }
    document.getElementById('val-min-edge-width').textContent = minEdgeWidth;
    updateGraphSettings();
});

minParticleWidthSlider.addEventListener('input', (e) => {
    minParticleWidth = parseFloat(e.target.value);
    document.getElementById('val-min-particle-width').textContent = minParticleWidth;
    updateGraphSettings();
});

nodeScaleTypeSelect.addEventListener('change', (e) => {
    nodeScaleType = e.target.value;
    updateGraphSettings();
});

edgeScaleTypeSelect.addEventListener('change', (e) => {
    edgeScaleType = e.target.value;
    updateGraphSettings();
});

particleScaleTypeSelect.addEventListener('change', (e) => {
    particleScaleType = e.target.value;
    updateGraphSettings();
});

arrowLengthSlider.addEventListener('input', (e) => {
    arrowLength = parseFloat(e.target.value);
    document.getElementById('val-arrow-length').textContent = arrowLength;
    updateGraphSettings();
});

scoreThresholdSlider.addEventListener('input', (e) => {
    scoreThreshold = parseFloat(e.target.value);
    document.getElementById('val-score-threshold').textContent = scoreThreshold;
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

    if (currentMode === '3D') {
        nodeLabelSize = parseInt(e.target.value) * 2; // Scale up for 3D visibility
    }
    else {
        nodeLabelSize = parseInt(e.target.value) * 0.7;
    }
    document.getElementById('val-node-label-size').textContent = nodeLabelSize;
    updateGraphSettings();
});

edgeLabelSizeSlider.addEventListener('input', (e) => {
    edgeLabelSize = parseInt(e.target.value);

    if (currentMode === '3D') {
        edgeLabelSize = edgeLabelSize * 0.5; // Scale up for 3D visibility
    }
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



// Physics Event Listeners
chargeStrengthSlider.addEventListener('input', (e) => {
    chargeStrength = parseInt(e.target.value);
    document.getElementById('val-charge-strength').textContent = chargeStrength;
    updatePhysicsSettings();
});

chargeThetaSlider.addEventListener('input', (e) => {
    chargeTheta = parseFloat(e.target.value);
    document.getElementById('val-charge-theta').textContent = chargeTheta;
    updatePhysicsSettings();
});

chargeDistMinSlider.addEventListener('input', (e) => {
    chargeDistMin = parseInt(e.target.value);
    document.getElementById('val-charge-dist-min').textContent = chargeDistMin;
    updatePhysicsSettings();
});

chargeDistMaxSlider.addEventListener('input', (e) => {
    chargeDistMax = parseInt(e.target.value);
    document.getElementById('val-charge-dist-max').textContent = chargeDistMax;
    updatePhysicsSettings();
});

linkDistanceSlider.addEventListener('input', (e) => {
    linkDistance = parseInt(e.target.value);
    document.getElementById('val-link-distance').textContent = linkDistance;
    updatePhysicsSettings();
});

linkIterationsSlider.addEventListener('input', (e) => {
    linkIterations = parseInt(e.target.value);
    document.getElementById('val-link-iterations').textContent = linkIterations;
    updatePhysicsSettings();
});

collideStrengthSlider.addEventListener('input', (e) => {
    collideStrength = parseFloat(e.target.value);
    document.getElementById('val-collide-strength').textContent = collideStrength;
    updatePhysicsSettings();
});

collideRadiusSlider.addEventListener('input', (e) => {
    collideRadius = parseFloat(e.target.value);
    document.getElementById('val-collide-radius').textContent = collideRadius;
    updatePhysicsSettings();
});

collideIterationsSlider.addEventListener('input', (e) => {
    collideIterations = parseInt(e.target.value);
    document.getElementById('val-collide-iterations').textContent = collideIterations;
    updatePhysicsSettings();
});

centerStrengthSlider.addEventListener('input', (e) => {
    centerStrength = parseFloat(e.target.value);
    document.getElementById('val-center-strength').textContent = centerStrength;
    updatePhysicsSettings();
});


function updatePhysicsSettings() {
    if (!Graph) return;

    // Safety: 3D graph (using d3-force-3d internally) vs 2D graph (using d3-force)
    // 3d-force-graph exposes d3Force() but we need to be careful about initialization.

    if (currentMode === '3D') {
        // 3D Physics Updates
        try {
            // Check if d3Force method exists (it should for 3d-force-graph)
            if (Graph.d3Force) {
                const charge = Graph.d3Force('charge');
                if (charge) {
                    charge.strength(chargeStrength)
                        .theta(chargeTheta)
                        .distanceMin(chargeDistMin)
                        .distanceMax(chargeDistMax);
                }

                const link = Graph.d3Force('link');
                if (link) {
                    link.distance(linkDistance)
                        .iterations(linkIterations);
                }
            }
        } catch (e) { console.warn("3D Force update error", e); }
    } else {
        // 2D Mode
        try {
            Graph.d3Force('charge').strength(chargeStrength);
            Graph.d3Force('charge').theta(chargeTheta);
            Graph.d3Force('charge').distanceMin(chargeDistMin);
            Graph.d3Force('charge').distanceMax(chargeDistMax);

            Graph.d3Force('link').distance(linkDistance);
            Graph.d3Force('link').iterations(linkIterations);
        } catch (e) { console.warn("2D Force update error", e); }
    }

    if (currentMode === '2D') {
        // Center force is usually default, but we can tweak it
        // Graph.d3Force('center').strength(centerStrength); // 'center' force doesn't have strength in standard d3-force, it just centers. 
        // Actually d3-force-center IS a force. But usually used to center the simulation.
        // Let's check if we can adjust strength. d3.forceCenter([x, y]).strength(strength) is available in newer d3 versions.
        // 3d-force-graph uses d3-force-3d which is compatible.
        try {
            if (Graph.d3Force('center')) Graph.d3Force('center').strength(centerStrength);
        } catch (e) { console.log("Center strength not supported"); }

        // Collision — Size-aware: use actual node value ranges + padding
        const col = Graph.d3Force('collide');
        if (col) {
            // Compute actual min/max from data for proper scaling
            const nodeVals = graphData.nodes.map(n => parseFloat(n[nodeSizeAttribute])).filter(v => !isNaN(v));
            const colMinVal = nodeVals.length ? Math.min(...nodeVals) : 0;
            const colMaxVal = nodeVals.length ? Math.max(...nodeVals) : 1;
            const padding = 3; // Extra buffer to prevent visual overlap

            col.strength(collideStrength)
                .iterations(collideIterations)
                .radius(node => {
                    const val = parseFloat(node[nodeSizeAttribute]);
                    const baseRadius = isNaN(val)
                        ? minNodeSize
                        : scaleValue(val, colMinVal, colMaxVal, minNodeSize, maxNodeSize, nodeScaleType);
                    return (baseRadius + padding) * collideRadius;
                });
        }
    }

    // Reheat simulation to show changes
    Graph.d3ReheatSimulation();
}

applyBtn.addEventListener('click', () => {
    if (graphData) {
        // Read active values from UI that weren't immediately synced
        // Or to be safe, grab all physics/layout ones here
        chargeStrength = parseInt(document.getElementById('charge-strength').value);
        chargeTheta = parseFloat(document.getElementById('charge-theta').value);
        chargeDistMin = parseInt(document.getElementById('charge-dist-min').value);
        chargeDistMax = parseInt(document.getElementById('charge-dist-max').value);
        linkDistance = parseInt(document.getElementById('link-distance').value);
        linkIterations = parseInt(document.getElementById('link-iterations').value);
        collideStrength = parseFloat(document.getElementById('collide-strength').value);
        collideRadius = parseFloat(document.getElementById('collide-radius').value);
        collideIterations = parseInt(document.getElementById('collide-iterations').value);
        centerStrength = parseFloat(document.getElementById('center-strength').value);

        const newLayout = document.getElementById('layout-mode').value;
        clusterStrength = parseFloat(document.getElementById('cluster-strength').value);
        disjointStrength = parseFloat(document.getElementById('disjoint-strength').value);

        applyLayoutMode(newLayout);
        updatePhysicsSettings();

        // Finally, refresh general graph settings
        updateGraphSettings();
    }
});

resetBtn.addEventListener('click', () => {
    resetSettings();
});

function applyDefaults(defaults) {
    // ---- State ----
    fixNodes = defaults.fixNodes;
    hoverEnabled = defaults.hoverEnabled;
    labelDensity = defaults.labelDensity;

    nodeSizeAttribute = defaults.nodeSizeAttribute;
    edgeWidthAttribute = defaults.edgeWidthAttribute;
    particleWidthAttribute = defaults.particleWidthAttribute;

    nodeLabelAttribute = defaults.nodeLabelAttribute;
    edgeLabelAttribute = defaults.edgeLabelAttribute;

    nodeLabelSize = defaults.nodeLabelSize;
    edgeLabelSize = defaults.edgeLabelSize;

    arrowPos = defaults.arrowPos;
    arrowLength = defaults.arrowLength;

    maxNodeSize = defaults.maxNodeSize;
    maxEdgeWidth = defaults.maxEdgeWidth;
    maxParticleWidth = defaults.maxParticleWidth;

    minNodeSize = defaults.minNodeSize;
    minEdgeWidth = defaults.minEdgeWidth;
    minParticleWidth = defaults.minParticleWidth;
    nodeScaleType = defaults.nodeScaleType;
    edgeScaleType = defaults.edgeScaleType;
    particleScaleType = defaults.particleScaleType;

    // Layout & Clustering
    dagSelect.value = defaults.dagMode || "";
    if (Graph) Graph.dagMode(defaults.dagMode || null);

    document.getElementById('layout-mode').value = defaults.layoutMode;
    document.getElementById('cluster-strength').value = defaults.clusterStrength;
    document.getElementById('val-cluster-strength').textContent = defaults.clusterStrength;
    document.getElementById('disjoint-strength').value = defaults.disjointStrength;
    document.getElementById('val-disjoint-strength').textContent = defaults.disjointStrength;

    document.getElementById('clustering-algorithm').value = defaults.clusteringAlgorithm;
    document.getElementById('cluster-bins').value = defaults.clusterBins;
    document.getElementById('val-cluster-bins').textContent = defaults.clusterBins;

    // Physics
    chargeStrength = defaults.chargeStrength;
    chargeTheta = defaults.chargeTheta;
    chargeDistMin = defaults.chargeDistMin;
    chargeDistMax = defaults.chargeDistMax;
    linkDistance = defaults.linkDistance;
    linkIterations = defaults.linkIterations;
    collideStrength = defaults.collideStrength;
    collideRadius = defaults.collideRadius;
    collideIterations = defaults.collideIterations;
    centerStrength = defaults.centerStrength;

    document.getElementById('charge-strength').value = chargeStrength;
    document.getElementById('val-charge-strength').textContent = chargeStrength;
    document.getElementById('charge-theta').value = chargeTheta;
    document.getElementById('val-charge-theta').textContent = chargeTheta;
    document.getElementById('charge-dist-min').value = chargeDistMin;
    document.getElementById('val-charge-dist-min').textContent = chargeDistMin;
    document.getElementById('charge-dist-max').value = chargeDistMax;
    document.getElementById('val-charge-dist-max').textContent = chargeDistMax;

    document.getElementById('link-distance').value = linkDistance;
    document.getElementById('val-link-distance').textContent = linkDistance;
    document.getElementById('link-iterations').value = linkIterations;
    document.getElementById('val-link-iterations').textContent = linkIterations;

    document.getElementById('collide-strength').value = collideStrength;
    document.getElementById('val-collide-strength').textContent = collideStrength;
    document.getElementById('collide-radius').value = collideRadius;
    document.getElementById('val-collide-radius').textContent = collideRadius;
    document.getElementById('collide-iterations').value = collideIterations;
    document.getElementById('val-collide-iterations').textContent = collideIterations;

    document.getElementById('center-strength').value = centerStrength;
    document.getElementById('val-center-strength').textContent = centerStrength;

    // 3D-only
    if (currentMode === '3D') {
        linkOpacity = defaults.linkOpacity;
        linkResolution = defaults.linkResolution;
        linkMaterialType = defaults.linkMaterialType;
        particleResolution = defaults.particleResolution;
        nodeResolution = defaults.nodeResolution;
    }

    // ---- UI ----
    document.getElementById('fix-nodes-toggle').checked = fixNodes;
    document.getElementById('hover-toggle').checked = hoverEnabled; // Wait, hoverToggle is a button in JS logic above, but settings defaults says .checked?
    // Let's check how applyDefaults handles toggles

    // Update visual state of toggles
    const hoverSpan = hoverToggle.querySelector('span');
    if (hoverEnabled) {
        hoverToggle.classList.add('bg-indigo-600');
        hoverToggle.classList.remove('bg-gray-700');
        hoverSpan.classList.add('translate-x-5');
    } else {
        hoverToggle.classList.remove('bg-indigo-600');
        hoverToggle.classList.add('bg-gray-700');
        hoverSpan.classList.remove('translate-x-5');
    }

    const edgesSpan = showEdgesToggle.querySelector('span');
    if (showEdges) {
        showEdgesToggle.classList.add('bg-indigo-600');
        showEdgesToggle.classList.remove('bg-gray-700');
        edgesSpan.classList.add('translate-x-5');
    } else {
        showEdgesToggle.classList.remove('bg-indigo-600');
        showEdgesToggle.classList.add('bg-gray-700');
        edgesSpan.classList.remove('translate-x-5');
    }

    document.getElementById('label-density').value = labelDensity;
    document.getElementById('val-label-density').textContent = labelDensity;

    document.getElementById('node-size-attr').value = nodeSizeAttribute;
    document.getElementById('edge-width-attr').value = edgeWidthAttribute;
    document.getElementById('particle-width-attr').value = particleWidthAttribute;

    document.getElementById('node-label-attr').value = nodeLabelAttribute;
    document.getElementById('edge-label-attr').value = edgeLabelAttribute;

    document.getElementById('node-label-size').value = nodeLabelSize;
    document.getElementById('val-node-label-size').textContent = nodeLabelSize;

    document.getElementById('edge-label-size').value = edgeLabelSize;
    document.getElementById('val-edge-label-size').textContent = edgeLabelSize;

    document.getElementById('arrow-pos').value = arrowPos;
    document.getElementById('val-arrow-pos').textContent = arrowPos;

    document.getElementById('arrow-length').value = arrowLength;
    document.getElementById('val-arrow-length').textContent = arrowLength;

    document.getElementById('score-threshold').value = scoreThreshold;
    document.getElementById('val-score-threshold').textContent = scoreThreshold;

    document.getElementById('max-node-size').value = maxNodeSize;
    document.getElementById('val-max-node-size').textContent = maxNodeSize;

    document.getElementById('max-edge-width').value = maxEdgeWidth;
    document.getElementById('val-max-edge-width').textContent = maxEdgeWidth;

    document.getElementById('max-particle-width').value = maxParticleWidth;
    // Set slider values (handling 3D scaling)
    if (currentMode === '3D') {
        document.getElementById('max-particle-width').value = maxParticleWidth; // Logic not changed for existing
        document.getElementById('val-max-particle-width').textContent = maxParticleWidth;

        document.getElementById('min-node-size').value = minNodeSize;
        document.getElementById('val-min-node-size').textContent = minNodeSize;

        document.getElementById('min-edge-width').value = minEdgeWidth;
        document.getElementById('val-min-edge-width').textContent = minEdgeWidth;

        document.getElementById('min-particle-width').value = minParticleWidth;
        document.getElementById('val-min-particle-width').textContent = minParticleWidth;
    } else {
        document.getElementById('max-particle-width').value = maxParticleWidth;
        document.getElementById('val-max-particle-width').textContent = maxParticleWidth;

        document.getElementById('min-node-size').value = minNodeSize;
        document.getElementById('val-min-node-size').textContent = minNodeSize;

        document.getElementById('min-edge-width').value = minEdgeWidth;
        document.getElementById('val-min-edge-width').textContent = minEdgeWidth;

        document.getElementById('min-particle-width').value = minParticleWidth;
        document.getElementById('val-min-particle-width').textContent = minParticleWidth;
    }

    document.getElementById('node-scale-type').value = nodeScaleType;
    document.getElementById('edge-scale-type').value = edgeScaleType;
    document.getElementById('particle-scale-type').value = particleScaleType;

    if (currentMode === '3D') {
        document.getElementById('link-opacity').value = linkOpacity;
        document.getElementById('val-link-opacity').textContent = linkOpacity;

        document.getElementById('link-resolution').value = linkResolution;
        document.getElementById('val-link-resolution').textContent = linkResolution;

        document.getElementById('link-material').value = linkMaterialType;

        document.getElementById('particle-resolution').value = particleResolution;
        document.getElementById('val-particle-resolution').textContent = particleResolution;

        document.getElementById('node-resolution').value = nodeResolution;
        document.getElementById('val-node-resolution').textContent = nodeResolution;
    }
}

function resetSettings() {
    const defaults = getDefaultsForMode(currentMode);

    // Reset clustering mode UI to Topology
    clusteringMode = 'topology';
    clusterModeTopologyBtn.classList.add('bg-indigo-600', 'text-white');
    clusterModeTopologyBtn.classList.remove('text-gray-400');
    clusterModeAttributeBtn.classList.remove('bg-indigo-600', 'text-white');
    clusterModeAttributeBtn.classList.add('text-gray-400');
    clusterTopologyPanel.classList.remove('hidden');
    clusterAttributePanel.classList.add('hidden');

    // Reset clustering state & data
    clusteringActive = false;
    clusterColorMap = {};
    clusterLabelMap = {};
    selectedClusterAttrs = [];

    // Uncheck all attribute checkboxes
    const checkboxes = clusterAttrList.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    clusterBinsContainer.classList.add('hidden');

    if (clusterLegendDiv) clusterLegendDiv.classList.add('hidden');

    // Remove 'cluster' option from node color dropdown if present
    Array.from(nodeColorSelect.options).forEach(opt => {
        if (opt.value === 'cluster') opt.remove();
    });

    // Default node color back to None
    nodeColorAttribute = '';
    nodeColorSelect.value = '';

    applyDefaults(defaults);
    applyLayoutMode(defaults.layoutMode);
    updatePhysicsSettings();
    updateGraphSettings();

    // Re-trigger default clustering to restore initial state
    if (graphData && Graph) {
        autoRunDefaultClustering();
    }
}


// function resetSettings() {
//     // Reset State Variables
//     fixNodes = false;
//     hoverEnabled = true;
//     labelDensity = 0.1;
//     nodeSizeAttribute = 'amount';
//     edgeWidthAttribute = 'Assesment Amount';
//     nodeLabelAttribute = 'legal_name';
//     edgeLabelAttribute = 'assamtstr';
//     particleWidthAttribute = 'Assesment Amount';
//     nodeLabelSize = 10;
//     edgeLabelSize = 5;

//     // Reset UI Elements
//     document.getElementById('fix-nodes-toggle').checked = false;
//     document.getElementById('hover-toggle').checked = true;

//     document.getElementById('label-density').value = 0.7;
//     document.getElementById('val-label-density').textContent = '0.7';

//     document.getElementById('node-size-attr').value = 'amount';
//     document.getElementById('edge-width-attr').value = 'Assesment Amount';
//     document.getElementById('node-label-attr').value = 'legal_name';
//     document.getElementById('edge-label-attr').value = 'assamtstr';
//     document.getElementById('particle-width-attr').value = 'Assesment Amount';

//     document.getElementById('particle-speed').value = 4;
//     document.getElementById('val-particle-speed').textContent = '4';

//     document.getElementById('node-label-size').value = 12;
//     document.getElementById('val-node-label-size').textContent = '12';

//     document.getElementById('edge-label-size').value = 10;
//     document.getElementById('val-edge-label-size').textContent = '10';

//     document.getElementById('arrow-pos').value = 0.5;
//     document.getElementById('val-arrow-pos').textContent = '0.5';

//     // Reset Scales
//     maxNodeSize = 10;
//     maxEdgeWidth = 5;
//     maxParticleWidth = 4;
//     arrowLength = 3.5;

//     document.getElementById('max-node-size').value = 10;
//     document.getElementById('val-max-node-size').textContent = '10';
//     document.getElementById('max-edge-width').value = 5;
//     document.getElementById('val-max-edge-width').textContent = '5';
//     document.getElementById('max-particle-width').value = 4;
//     document.getElementById('val-max-particle-width').textContent = '4';
//     document.getElementById('arrow-length').value = 3.5;
//     document.getElementById('val-arrow-length').textContent = '3.5';

//     // Reset 3D Settings
//     linkOpacity = 0.2;
//     linkResolution = 6;
//     linkMaterialType = 'MeshLambertMaterial';
//     particleResolution = 6;
//     nodeResolution = 8;

//     document.getElementById('link-opacity').value = 0.2;
//     document.getElementById('val-link-opacity').textContent = '0.2';
//     document.getElementById('link-resolution').value = 6;
//     document.getElementById('val-link-resolution').textContent = '6';
//     document.getElementById('link-material').value = 'MeshLambertMaterial';
//     document.getElementById('particle-resolution').value = 6;
//     document.getElementById('val-particle-resolution').textContent = '6';
//     document.getElementById('node-resolution').value = 8;
//     document.getElementById('val-node-resolution').textContent = '8';

//     // Apply Changes
//     updateGraphSettings();
// }

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

// --- Spread Nodes (Post-layout overlap removal) ---
const spreadBtn = document.getElementById('spread-btn');
spreadBtn.addEventListener('click', () => {
    if (!Graph || !graphData) return;
    spreadNodesRemoveOverlaps();
    pauseBtn.click();
});

function spreadNodesRemoveOverlaps() {
    const nodes = graphData.nodes;
    if (!nodes || nodes.length < 2) return;

    // Compute each node's visual radius
    const nodeVals = nodes.map(n => parseFloat(n[nodeSizeAttribute])).filter(v => !isNaN(v));
    const sMinVal = nodeVals.length ? Math.min(...nodeVals) : 0;
    const sMaxVal = nodeVals.length ? Math.max(...nodeVals) : 1;

    function getRadius(node) {
        const val = parseFloat(node[nodeSizeAttribute]);
        if (isNaN(val)) return minNodeSize + 2;
        return scaleValue(val, sMinVal, sMaxVal, minNodeSize, maxNodeSize, nodeScaleType) + 4;
    }

    // Iterative pairwise overlap removal
    const iterations = 100;
    const damping = 0.5;

    for (let iter = 0; iter < iterations; iter++) {
        let moved = false;
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i];
                const b = nodes[j];
                if (a.x === undefined || b.x === undefined) continue;

                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
                const minDist = getRadius(a) + getRadius(b);

                if (dist < minDist) {
                    const overlap = (minDist - dist) / 2;
                    const moveX = (dx / dist) * overlap * damping;
                    const moveY = (dy / dist) * overlap * damping;

                    a.x -= moveX;
                    a.y -= moveY;
                    b.x += moveX;
                    b.y += moveY;

                    // Fix positions so simulation doesn't undo the spread
                    a.fx = a.x;
                    a.fy = a.y;
                    b.fx = b.x;
                    b.fy = b.y;

                    moved = true;
                }
            }
        }
        if (!moved) break; // No overlaps remain
    }

    // Update the graph to reflect new positions
    Graph.graphData(graphData);
    updateGraphSettings();

    // After a short delay, unfix nodes so simulation can resume if desired
    setTimeout(() => {
        if (!fixNodes) {
            nodes.forEach(n => {
                n.fx = undefined;
                n.fy = undefined;
            });
        }
    }, 2000);
}

pauseBtn.addEventListener('click', () => {
    if (Graph) {
        if (isPaused) {
            Graph.resumeAnimation();
            pauseBtn.innerHTML = '<i data-lucide="pause" class="w-5 h-5"></i>';
            pauseBtn.title = "Pause Simulation";
        } else {
            Graph.pauseAnimation();
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

        // Block 3D if graph has more than 1500 nodes
        if (mode === '3D' && graphData && graphData.nodes.length > 1500) {
            const count = graphData.nodes.length;
            // Flash a warning on the button tooltip and show a banner
            showTemporaryWarning(`⚠️ 3D disabled — graph has ${count.toLocaleString()} nodes (limit: 1500). Use 2D for performance.`);
            return;
        }

        dimBtns.forEach(b => {
            b.classList.remove('bg-indigo-600', 'text-white', 'shadow-sm');
            b.classList.add('text-gray-300', 'hover:bg-gray-600');
        });
        e.target.classList.add('bg-indigo-600', 'text-white', 'shadow-sm');
        e.target.classList.remove('text-gray-300', 'hover:bg-gray-600');

        switchGraphMode(mode);
        resetSettings();
    });
});

function showTemporaryWarning(message) {
    // Create or reuse a warning banner
    let banner = document.getElementById('perf-warning-banner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'perf-warning-banner';
        banner.className = 'absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-300';
        banner.innerHTML = '<i data-lucide="alert-triangle" class="w-4 h-4 shrink-0"></i><span id="perf-warning-text"></span>';
        document.querySelector('main').appendChild(banner);
    }
    document.getElementById('perf-warning-text').textContent = message;
    banner.classList.remove('opacity-0', 'pointer-events-none');
    lucide.createIcons();
    clearTimeout(banner._hideTimer);
    banner._hideTimer = setTimeout(() => {
        banner.classList.add('opacity-0', 'pointer-events-none');
    }, 4000);
}


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

        // Warn if 3D is impractical for this graph size
        if (graphData.nodes.length > 1500) {
            // Mark the 3D button as disabled-looking
            dimBtns.forEach(b => {
                if (b.dataset.value === '3') {
                    b.title = `3D disabled — ${graphData.nodes.length.toLocaleString()} nodes exceeds 1500 node limit`;
                    b.classList.add('opacity-40', 'cursor-not-allowed');
                }
            });
        } else {
            dimBtns.forEach(b => {
                if (b.dataset.value === '3') {
                    b.title = '3D View';
                    b.classList.remove('opacity-40', 'cursor-not-allowed');
                }
            });
        }

        // Auto-run Louvain clustering + Disjoint layout as defaults
        setTimeout(() => autoRunDefaultClustering(), 800);

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

    // Rebuild attribute clustering UI when new data is loaded
    buildAttributeClusteringUI(data);
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
// Helper for min-max scaling with different scale types
function scaleValue(value, minVal, maxVal, minSize, maxSize, scaleType = 'linear') {
    if (minVal === maxVal) return (minSize + maxSize) / 2;
    let val = parseFloat(value);
    if (isNaN(val)) return minSize;

    // Clamp
    if (val <= minVal) return minSize;
    if (val >= maxVal) return maxSize;

    if (scaleType === 'log') {
        // Logarithmic scale
        // Avoid log(0)
        const logMin = Math.log(minVal > 0 ? minVal : 0.0001);
        const logMax = Math.log(maxVal > 0 ? maxVal : 0.0001);
        const logVal = Math.log(val > 0 ? val : 0.0001);
        // Normalize
        const normalized = (logVal - logMin) / (logMax - logMin);
        return minSize + normalized * (maxSize - minSize);
    } else if (scaleType === 'power') {
        // Power scale (square root)
        const powMin = Math.sqrt(minVal);
        const powMax = Math.sqrt(maxVal);
        const powVal = Math.sqrt(val);
        const normalized = (powVal - powMin) / (powMax - powMin);
        return minSize + normalized * (maxSize - minSize);
    } else {
        // Linear
        return minSize + ((val - minVal) / (maxVal - minVal)) * (maxSize - minSize);
    }
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

    // Safely apply physics settings after graph initialization
    setTimeout(() => {
        updatePhysicsSettings();
    }, 500);

    // Event handlers that don't need frequent updates
    Graph
        .onNodeClick(handleNodeClick)
        .onLinkClick(handleLinkClick)
        .onBackgroundClick(resetHighlight)
        .onNodeHover(node => {
            if (isSelectionActive || !hoverEnabled) return; // Disable hover when selection is active OR hover disabled
            hoverNode = node || null;

            // Update 3D hover ring if present
            if (currentMode === '3D' && Graph) {
                // We need to trigger a quick re-render or update materials of rings directly
                // Easiest is to update the group materials if we stored them
                // We can't access all rings easily without a pass, so we'll just trigger update for the scene
                // Actually, force-graph 3D updates automatically on node hover if we change its properties, 
                // but for custom Three objects it might not.
                // We'll let `updateHighlight` handle standard changes, but for custom rings we might need an explicit refresh or we can just apply hover state in `updateHighlight()` if we iterate the scene. Let's see if 3d-force-graph handles hover for threeObjects when hovered node changes. 
                // Wait, it doesn't automatically re-evaluate nodeThreeObject on hover.
                // We will implement a custom update pass in `updateHighlight()` for the rings.
            }

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
    // When nodeColorAttribute === 'cluster', use the globally stored clusterColorMap
    // (which is built with numeric sort in applyClustering) to avoid string-sort mismatch.
    let colorMap = {};
    if (nodeColorAttribute === 'cluster' && Object.keys(clusterColorMap).length > 0) {
        // Use the canonical map — keys are integers stored as strings in JS objects, but values are correct
        colorMap = clusterColorMap;
    } else {
        const values = [...new Set(data.nodes.map(n => n[nodeColorAttribute]).filter(Boolean))].sort();
        const colors = generateColors(values.length);
        values.forEach((v, i) => colorMap[v] = colors[i]);
    }

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
            let radius = 4; // Default constant size
            if (nodeSizeAttribute) {
                radius = scaleValue(node[nodeSizeAttribute], minNodeVal, maxNodeVal, minNodeSize, maxNodeSize, nodeScaleType);
            }

            // Adjust hit-area sizing: force-graph uses Math.sqrt(val), 3d-force-graph uses Math.cbrt(val).
            return currentMode === '3D' ? Math.pow(radius, 3) : Math.pow(radius, 2);
        })
        .nodeRelSize(1) // Use nodeVal directly as radius (or close to it)
        .linkWidth(link => {
            // Scale link width based on selected attribute
            let width = 1; // Default thin
            if (edgeWidthAttribute && currentMode === '2D') {
                width = scaleValue(link[edgeWidthAttribute], minLinkVal, maxLinkVal, minEdgeWidth, maxEdgeWidth, edgeScaleType);
            }
            if (edgeWidthAttribute && currentMode === '3D') {
                width = scaleValue(link[edgeWidthAttribute], minLinkVal, maxLinkVal, minEdgeWidth * edgeWidthMultiplier, maxEdgeWidth * edgeWidthMultiplier, edgeScaleType);
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
        .linkVisibility(showEdges)

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
            if (currentMode === '2D') {
                return scaleValue(link[particleWidthAttribute], minParticleVal, maxParticleVal, minParticleWidth, maxParticleWidth, particleScaleType);
            }
            if (currentMode === '3D') {
                return scaleValue(link[particleWidthAttribute], minParticleVal, maxParticleVal, minParticleWidth * particleWidthMultiplier, maxParticleWidth * particleWidthMultiplier, particleScaleType);
            }
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
                const group = new THREE.Group();
                node.__threeGroup = group; // Store reference to update later

                const score = parseFloat(node[fraudScoreAttribute]) || 0;
                if (score > scoreThreshold) {
                    // Create ring
                    //console.log(`Node ${node.id} has score ${score} above threshold ${scoreThreshold}, adding ring.`);
                    let ringColor = 0x00ff00; // green for score > 0.1 (or > scoreThreshold)
                    if (score >= 0.66) ringColor = 0xff0000; // Red
                    else if (score >= 0.5) ringColor = 0xffa500; // Orange
                    else if (score >= 0.1) ringColor = 0xffff00; // Yellow

                    // We need to scale the ring based on the node size, but node size might be dynamic.
                    // Let's approximate based on nodeScaleType and min/max.
                    const nodeRadius = scaleValue(node[nodeSizeAttribute], minNodeVal, maxNodeVal, minNodeSize, maxNodeSize, nodeScaleType);

                    // Scale the torus geometry slightly larger than the node
                    const ringGeometry = new THREE.TorusGeometry(nodeRadius * 1.4, Math.max(0.2, nodeRadius * 0.15), 8, 24);

                    const material = new THREE.MeshBasicMaterial({
                        color: ringColor,
                        transparent: true,
                        opacity: 0.8
                    });
                    const ring = new THREE.Mesh(ringGeometry, material);
                    group.add(ring);
                    node.__ringMesh = ring; // Store reference to update material color on hover
                }

                // Visibility Logic for Label
                const showLabel = (isSelectionActive && highlightedNodes.has(node.id)) ||
                    (!isSelectionActive && checkLabelDensity(node.id));

                if (showLabel) {
                    const label = node[nodeLabelAttribute] || node.id;
                    const sprite = new SpriteText(label);
                    sprite.material.depthWrite = false;
                    sprite.color = (highlightedNodes.size > 0 && !highlightedNodes.has(node.id)) ? 'rgba(100, 100, 100, 0.2)' : '#ffffff';
                    sprite.textHeight = (nodeLabelSize * 0.2).toFixed(1);
                    sprite.center.y = -0.6;
                    group.add(sprite);
                }

                return group.children.length > 0 ? group : null; // Return group if it has content, else allow default rendering
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
                radius = scaleValue(node[nodeSizeAttribute], minNodeVal, maxNodeVal, minNodeSize, maxNodeSize, nodeScaleType);
            }

            const score = parseFloat(node[fraudScoreAttribute]) || 0;
            if (score > scoreThreshold) {
                // Create ring
                let ringColor = 'green'; // green for score < 0.1 (or > scoreThreshold)
                if (score >= 0.66) ringColor = 'red'; // Red
                else if (score >= 0.5) ringColor = 'orange'; // Orange
                else if (score >= 0.1) ringColor = 'yellow'; // Yellow

                ctx.beginPath();
                ctx.arc(node.x, node.y, radius * 1.4, 0, 2 * Math.PI, false);
                ctx.lineWidth = radius * 0.3;
                ctx.strokeStyle = node === hoverNode ? 'violet' : ringColor;
                ctx.stroke();
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
            .nodePointerAreaPaint((node, color, ctx) => {
                let radius = 4;
                if (nodeSizeAttribute) {
                    radius = scaleValue(node[nodeSizeAttribute], minNodeVal, maxNodeVal, minNodeSize, maxNodeSize, nodeScaleType);
                }
                const score = parseFloat(node[fraudScoreAttribute]) || 0;
                if (score > scoreThreshold) {
                    radius *= 1.4; // Expand hit area to cover the highlight ring
                }
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                ctx.fill();
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
    showPieChart(node, 'node');
    showSankeyChart(node, 'node');
    //zoomToNode(node);

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
    showPieChart(link, 'edge');
    showSankeyChart(link, 'edge');

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

        // For 3D rings, update material colors if any
        if (currentMode === '3D') {
            const graphData = Graph.graphData();
            if (graphData && graphData.nodes) {
                graphData.nodes.forEach(node => {
                    if (node.__ringMesh) {
                        const score = parseFloat(node[fraudScoreAttribute]) || 0;
                        let ringColor = 0x00ff00; // Green
                        if (score >= 0.66) ringColor = 0xff0000; // Red
                        else if (score >= 0.5) ringColor = 0xffa500; // Orange
                        else if (score >= 0.1) ringColor = 0xffff00; // Yellow
                        
                        const finalColor = node === hoverNode ? 0x6c3bfd : ringColor;
                        node.__ringMesh.material.color.setHex(finalColor);
                    }
                });
            }
        }
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
        div.className = 'grid grid-cols-3 gap-2 items-start border-b border-gray-700/50 text-sm';
        div.innerHTML = `
            <dt class="font-semibold text-gray-300 col-span-1 break-words">${key}</dt>
            <dd class="col-span-2 text-gray-200 break-words">${value}</dd>
        `;
        dl.appendChild(div);
    });

    infoContent.appendChild(dl);
    infoPanel.classList.remove('hidden');
}

function closeInfo() {
    infoPanel.classList.add('hidden');
    closeChart();
    closeSankey();
}

// --- Pie Chart Functions ---
function showPieChart(data, type) {
    // Destroy previous chart if exists
    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }

    // Replace canvas to avoid stale Chart.js state
    const canvasContainer = pieChartCanvas.parentNode;
    const newCanvas = document.createElement('canvas');
    newCanvas.id = 'pie-chart';
    canvasContainer.replaceChild(newCanvas, pieChartCanvas);
    pieChartCanvas = newCanvas;

    let labels = [];
    let values = [];
    let title = '';
    let backgroundColors = [];

    if (type === 'node') {
        title = 'Amount In vs Out';
        const amountIn = parseFloat(data.amount_in) || 0;
        const amountOut = parseFloat(data.amount_out) || 0;

        if (amountIn === 0 && amountOut === 0) {
            chartTitle.textContent = title;
            chartPanel.classList.add('hidden');
            return; // No data to show
        }

        labels = ['Amount In', 'Amount Out'];
        values = [amountIn, amountOut];
        backgroundColors = [
            'rgba(99, 202, 183, 0.85)',   // Teal
            'rgba(239, 118, 122, 0.85)'   // Coral
        ];
    } else if (type === 'edge') {
        title = 'Tax Breakdown';
        const cess = parseFloat(data['CESS TAX']) || parseFloat(data.cess_tax) || parseFloat(data.cess) || 0;
        const cgst = parseFloat(data['CGST TAX']) || parseFloat(data.cgst_tax) || parseFloat(data.cgst) || 0;
        const igst = parseFloat(data['IGST TAX']) || parseFloat(data.igst_tax) || parseFloat(data.igst) || 0;
        const sgst = parseFloat(data['SGST TAX']) || parseFloat(data.sgst_tax) || parseFloat(data.sgst) || 0;

        labels = ['CESS Tax', 'CGST Tax', 'IGST Tax', 'SGST Tax'];
        values = [cess, cgst, igst, sgst];
        backgroundColors = [
            'rgba(251, 191, 36, 0.85)',   // Amber
            'rgba(96, 165, 250, 0.85)',   // Blue
            'rgba(168, 85, 247, 0.85)',   // Purple
            'rgba(52, 211, 153, 0.85)'    // Emerald
        ];
    }

    chartTitle.textContent = title;

    currentChart = new Chart(pieChartCanvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: backgroundColors,
                borderColor: 'rgba(55, 65, 81, 0.8)',
                borderWidth: 2,
                hoverBorderColor: '#fff',
                hoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '40%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#d1d5db',
                        font: { size: 11, family: 'system-ui' },
                        padding: 12,
                        usePointStyle: true,
                        pointStyleWidth: 10
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    titleColor: '#a5b4fc',
                    bodyColor: '#e5e7eb',
                    borderColor: 'rgba(75, 85, 99, 0.5)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 10,
                    callbacks: {
                        label: function (context) {
                            const val = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                            return ` ${context.label}: ${val.toLocaleString()} (${pct}%)`;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                duration: 600,
                easing: 'easeOutQuart'
            }
        }
    });

    // Show the chart panel
    chartPanel.classList.remove('hidden');
}

function closeChart() {
    chartPanel.classList.add('hidden');
    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }
}

function closeSankey() {
    sankeyPanel.classList.add('hidden');
    if (sankeyChart) {
        sankeyChart.dispose();
        sankeyChart = null;
    }
}

function showSankeyChart(data, type) {
    if (sankeyChart) {
        sankeyChart.dispose();
        sankeyChart = null;
    }

    if (type !== 'node') {
        closeSankey();
        return;
    }

    const amountIn = parseFloat(data.amount_in) || 0;
    const amountOut = parseFloat(data.amount_out) || 0;
    const totalAmount = parseFloat(data.amount) || (amountIn + amountOut);

    if (amountIn === 0 && amountOut === 0 && totalAmount === 0) {
        closeSankey();
        return;
    }

    const chartDom = document.getElementById('sankey-chart');
    sankeyChart = echarts.init(chartDom);

    const nodesData = [
        { name: 'Total Amount', itemStyle: { color: 'rgba(96, 165, 250, 0.85)' } }
    ];
    const linksData = [];

    if (amountIn > 0) {
        nodesData.push({ name: 'Amount In', itemStyle: { color: 'rgba(99, 202, 183, 0.85)' } });
        linksData.push({ source: 'Amount In', target: 'Total Amount', value: amountIn });
    }

    if (amountOut > 0) {
        nodesData.push({ name: 'Amount Out', itemStyle: { color: 'rgba(239, 118, 122, 0.85)' } });
        linksData.push({ source: 'Total Amount', target: 'Amount Out', value: amountOut });
    }

    if (amountIn === 0 && amountOut === 0) {
        // Just show total amount block if no flow
        if (totalAmount > 0) {
            nodesData[0].value = totalAmount;
        } else {
            closeSankey();
            return;
        }
    }

    const option = {
        tooltip: {
            trigger: 'item',
            triggerOn: 'mousemove',
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            borderColor: 'rgba(75, 85, 99, 0.5)',
            textStyle: { color: '#e5e7eb' },
            formatter: function (params) {
                return `${params.name}: <br/><b>${params.value.toLocaleString()}</b>`;
            }
        },
        series: [
            {
                type: 'sankey',
                emphasis: {
                    focus: 'adjacency'
                },
                nodeAlign: 'justify',
                nodeWidth: 5,
                data: nodesData,
                links: linksData,
                lineStyle: {
                    color: 'source',
                    curveness: 0.5,
                    opacity: 0.4
                },
                label: {
                    color: '#e5e7eb',
                    fontSize: 11
                }
            }
        ]
    };

    sankeyChart.setOption(option);
    sankeyPanel.classList.remove('hidden');
}

function openChartModal(type) {
    if ((type === 'pie' && !currentChart) || (type === 'sankey' && !sankeyChart)) return;

    chartModal.classList.remove('hidden');
    chartModal.classList.add('flex');
    modalContent.innerHTML = '';

    if (type === 'pie') {
        modalTitle.textContent = chartTitle.textContent;
        const newCanvas = document.createElement('canvas');
        newCanvas.style.maxHeight = '100%';
        newCanvas.style.maxWidth = '100%';
        modalContent.appendChild(newCanvas);

        modalChartInstance = new Chart(newCanvas, {
            type: currentChart.config.type,
            data: currentChart.data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: '#d1d5db', font: { size: 14 } } },
                    tooltip: currentChart.options.plugins.tooltip
                }
            }
        });
    } else if (type === 'sankey') {
        modalTitle.textContent = sankeyTitle.textContent;
        const newDiv = document.createElement('div');
        newDiv.style.width = '100%';
        newDiv.style.height = '100%';
        modalContent.appendChild(newDiv);

        modalChartInstance = echarts.init(newDiv);
        const options = sankeyChart.getOption();
        if (options.series && options.series.length > 0) {
            options.series[0].label.fontSize = 14;
        }
        modalChartInstance.setOption(options);
    }
}

function closeChartModal() {
    chartModal.classList.add('hidden');
    chartModal.classList.remove('flex');
    if (modalChartInstance) {
        if (typeof modalChartInstance.destroy === 'function') {
            modalChartInstance.destroy();
        } else if (typeof modalChartInstance.dispose === 'function') {
            modalChartInstance.dispose();
        }
        modalChartInstance = null;
    }
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
    infoPanel.classList.add('hidden');
    closeChart();
    closeSankey();
    closeChartModal();
    fileInput.value = '';

    // Reset cluster state + hide legend
    clusterColorMap = {};
    clusterLabelMap = {};
    clusteringActive = false;
    if (clusterLegendDiv) clusterLegendDiv.classList.add('hidden');
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

// Clustering Elements
const clusteringAlgorithmSelect = document.getElementById('clustering-algorithm');

// Attribute Clustering Elements
const clusterModeTopologyBtn = document.getElementById('cluster-mode-topology');
const clusterModeAttributeBtn = document.getElementById('cluster-mode-attribute');
const clusterTopologyPanel = document.getElementById('cluster-topology-panel');
const clusterAttributePanel = document.getElementById('cluster-attribute-panel');
const clusterAttrList = document.getElementById('cluster-attr-list');
const clusterBinsContainer = document.getElementById('cluster-bins-container');
const clusterBinsSlider = document.getElementById('cluster-bins');
const applyAttrClusterBtn = document.getElementById('apply-attr-cluster-btn');
const clusterLegendDiv = document.getElementById('cluster-legend');
const clusterLegendItems = document.getElementById('cluster-legend-items');

// Layout Elements
const layoutModeSelect = document.getElementById('layout-mode');
const clusterStrengthContainer = document.getElementById('cluster-strength-container');
const clusterStrengthSlider = document.getElementById('cluster-strength');
const disjointStrengthContainer = document.getElementById('disjoint-strength-container');
const disjointStrengthSlider = document.getElementById('disjoint-strength');

// Layout State
let currentLayoutMode = 'default';
let clusterStrength = 0.3;
let disjointStrength = 0.05;
let clusteringActive = false; // Whether clustering has been applied
let clusteringMode = 'topology'; // 'topology' | 'attribute'
let selectedClusterAttrs = []; // Selected attribute names for attribute clustering
let numericBins = 5;
// Global cluster color/label maps — single source of truth for legend + node colors
let clusterColorMap = {}; // cluster_id (int) -> color string
let clusterLabelMap = {}; // cluster_id (int) -> human-readable label

// --- Custom Force: Cluster Attraction ---
// Pulls nodes toward the centroid of their cluster
function forceCluster(strength) {
    let nodes;
    function force(alpha) {
        // Compute centroids
        const centroids = {};
        const counts = {};
        for (const n of nodes) {
            if (n.cluster === undefined) continue;
            const c = n.cluster;
            if (!centroids[c]) { centroids[c] = { x: 0, y: 0, z: 0 }; counts[c] = 0; }
            centroids[c].x += n.x || 0;
            centroids[c].y += n.y || 0;
            centroids[c].z += n.z || 0;
            counts[c]++;
        }
        for (const c in centroids) {
            centroids[c].x /= counts[c];
            centroids[c].y /= counts[c];
            centroids[c].z /= counts[c];
        }
        // Nudge nodes toward their cluster centroid
        for (const n of nodes) {
            if (n.cluster === undefined) continue;
            const cent = centroids[n.cluster];
            n.vx += (cent.x - n.x) * strength * alpha;
            n.vy += (cent.y - n.y) * strength * alpha;
            if (n.vz !== undefined) {
                n.vz += (cent.z - n.z) * strength * alpha;
            }
        }
    }
    force.initialize = function (_nodes) { nodes = _nodes; };
    force.strength = function (_) { if (_ !== undefined) { strength = _; return force; } return strength; };
    return force;
}

// --- Custom Force: Cluster Separation ---
// Pushes cluster centroids apart from each other
function forceClusterSeparation(strength) {
    let nodes;
    function force(alpha) {
        const centroids = {};
        const counts = {};
        for (const n of nodes) {
            if (n.cluster === undefined) continue;
            const c = n.cluster;
            if (!centroids[c]) { centroids[c] = { x: 0, y: 0, z: 0 }; counts[c] = 0; }
            centroids[c].x += n.x || 0;
            centroids[c].y += n.y || 0;
            centroids[c].z += n.z || 0;
            counts[c]++;
        }
        for (const c in centroids) {
            centroids[c].x /= counts[c];
            centroids[c].y /= counts[c];
            centroids[c].z /= counts[c];
        }
        // Push centroids apart
        const clusterIds = Object.keys(centroids);
        for (let i = 0; i < clusterIds.length; i++) {
            for (let j = i + 1; j < clusterIds.length; j++) {
                const a = centroids[clusterIds[i]];
                const b = centroids[clusterIds[j]];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const dz = a.z - b.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
                const minDist = 150; // Minimum distance between cluster centroids
                if (dist < minDist) {
                    const push = ((minDist - dist) / dist) * strength * alpha;
                    const fx = dx * push;
                    const fy = dy * push;
                    const fz = dz * push;
                    // Apply to all nodes in each cluster
                    for (const n of nodes) {
                        if (n.cluster == clusterIds[i]) {
                            n.vx += fx; n.vy += fy;
                            if (n.vz !== undefined) n.vz += fz;
                        } else if (n.cluster == clusterIds[j]) {
                            n.vx -= fx; n.vy -= fy;
                            if (n.vz !== undefined) n.vz -= fz;
                        }
                    }
                }
            }
        }
    }
    force.initialize = function (_nodes) { nodes = _nodes; };
    force.strength = function (_) { if (_ !== undefined) { strength = _; return force; } return strength; };
    return force;
}

// --- Layout Mode UI Handlers ---

layoutModeSelect.addEventListener('change', (e) => {
    const mode = e.target.value;

    // Show/hide relevant controls
    clusterStrengthContainer.classList.toggle('hidden',
        mode !== 'cluster-grouped' && mode !== 'radial-cluster');
    disjointStrengthContainer.classList.toggle('hidden', mode !== 'disjoint');

    // Auto-apply layout on selection
    applyLayoutMode(mode);
});

clusterStrengthSlider.addEventListener('input', (e) => {
    clusterStrength = parseFloat(e.target.value);
    document.getElementById('val-cluster-strength').textContent = clusterStrength;
    // Live update if layout is active
    if (Graph && currentLayoutMode === 'cluster-grouped') {
        try {
            const cf = Graph.d3Force('cluster');
            if (cf && cf.strength) cf.strength(clusterStrength);
            Graph.d3ReheatSimulation();
        } catch (err) { console.warn('Cluster strength update error', err); }
    }
});

disjointStrengthSlider.addEventListener('input', (e) => {
    disjointStrength = parseFloat(e.target.value);
    document.getElementById('val-disjoint-strength').textContent = disjointStrength;
    // Live update
    if (Graph && currentLayoutMode === 'disjoint') {
        try {
            const fx = Graph.d3Force('forceX');
            const fy = Graph.d3Force('forceY');
            if (fx && fx.strength) fx.strength(disjointStrength);
            if (fy && fy.strength) fy.strength(disjointStrength);
            Graph.d3ReheatSimulation();
        } catch (err) { console.warn('Disjoint strength update error', err); }
    }
});

// Layout is now auto-applied on dropdown change

function applyLayoutMode(mode) {
    if (!Graph || !graphData) return;

    currentLayoutMode = mode;

    // Remove custom forces first
    try {
        Graph.d3Force('cluster', null);
        Graph.d3Force('clusterSeparation', null);
        Graph.d3Force('forceX', null);
        Graph.d3Force('forceY', null);
        Graph.d3Force('forceRadial', null);
    } catch (e) { /* Some forces may not exist */ }

    if (mode === 'force-directed') {
        // Standard force-directed — just reheat
        Graph.d3ReheatSimulation();

    } else if (mode === 'cluster-grouped') {
        // Cluster-Grouped: attract same-cluster nodes, separate clusters
        if (!clusteringActive) {
            alert('Please run clustering first before using Cluster-Grouped layout.');
            layoutModeSelect.value = 'default';
            return;
        }

        Graph.d3Force('cluster', forceCluster(clusterStrength));
        Graph.d3Force('clusterSeparation', forceClusterSeparation(0.5));
        Graph.d3ReheatSimulation();

    } else if (mode === 'radial-cluster') {
        // Radial by Cluster: arrange clusters in concentric rings
        if (!clusteringActive) {
            alert('Please run clustering first before using Radial layout.');
            layoutModeSelect.value = 'default';
            return;
        }

        // Assign radial target based on cluster
        const uniqueClusters = [...new Set(graphData.nodes.map(n => n.cluster).filter(c => c !== undefined))].sort((a, b) => a - b);
        const ringSpacing = 150;
        const clusterRadiusMap = {};
        uniqueClusters.forEach((c, i) => {
            clusterRadiusMap[c] = (i + 1) * ringSpacing;
        });

        // Use forceRadial (d3-force)
        // Since d3Force expects a d3 force function, we'll use forceX/Y to simulate radial placement
        // Or we can add a custom radial force
        Graph.d3Force('cluster', forceCluster(clusterStrength * 0.5));

        // Add radial positioning — push nodes to their cluster's ring radius
        const radialForce = function (strength) {
            let nodes;
            function force(alpha) {
                for (const n of nodes) {
                    if (n.cluster === undefined) continue;
                    const targetRadius = clusterRadiusMap[n.cluster] || 100;
                    const dist = Math.sqrt((n.x || 0) ** 2 + (n.y || 0) ** 2) || 1;
                    const factor = (targetRadius - dist) / dist * strength * alpha;
                    n.vx += (n.x || 0) * factor;
                    n.vy += (n.y || 0) * factor;
                }
            }
            force.initialize = function (_nodes) { nodes = _nodes; };
            return force;
        };

        Graph.d3Force('forceRadial', radialForce(0.3));
        Graph.d3ReheatSimulation();

    } else if (mode === 'disjoint') {
        // Disjoint: pull all nodes gently toward center so disconnected components don't fly away
        // This uses forceX and forceY with weak strength

        // Use custom x/y forces
        const forceXFn = function (strength) {
            let nodes;
            function force(alpha) {
                for (const n of nodes) {
                    n.vx += (0 - (n.x || 0)) * strength * alpha;
                }
            }
            force.initialize = function (_nodes) { nodes = _nodes; };
            force.strength = function (_) { if (_ !== undefined) { strength = _; return force; } return strength; };
            return force;
        };

        const forceYFn = function (strength) {
            let nodes;
            function force(alpha) {
                for (const n of nodes) {
                    n.vy += (0 - (n.y || 0)) * strength * alpha;
                }
            }
            force.initialize = function (_nodes) { nodes = _nodes; };
            force.strength = function (_) { if (_ !== undefined) { strength = _; return force; } return strength; };
            return force;
        };

        Graph.d3Force('forceX', forceXFn(disjointStrength));
        Graph.d3Force('forceY', forceYFn(disjointStrength));

        // If clustering is active, also add cluster force
        if (clusteringActive) {
            Graph.d3Force('cluster', forceCluster(clusterStrength * 0.5));
        }

        Graph.d3ReheatSimulation();
    }
}

// Clustering Event Listener — auto-trigger on dropdown change
clusteringAlgorithmSelect.addEventListener('change', async (e) => {
    const algorithm = e.target.value;
    if (!algorithm) return; // "Select Algorithm" placeholder

    if (!graphData) {
        alert('No graph data loaded');
        clusteringAlgorithmSelect.value = '';
        return;
    }

    // Show loading state on the dropdown
    clusteringAlgorithmSelect.disabled = true;
    const originalOption = clusteringAlgorithmSelect.options[clusteringAlgorithmSelect.selectedIndex].text;
    clusteringAlgorithmSelect.options[clusteringAlgorithmSelect.selectedIndex].text = '⏳ Processing...';

    try {
        const payload = {
            nodes: graphData.nodes.map(n => ({ id: n.id })),
            links: graphData.links.map(l => ({
                source: typeof l.source === 'object' ? l.source.id : l.source,
                target: typeof l.target === 'object' ? l.target.id : l.target
            })),
            algorithm: algorithm
        };

        const response = await fetch('/api/cluster', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Clustering failed');
        }

        const result = await response.json();

        if (result.clusters) {
            applyClustering(result.clusters);
        }

    } catch (error) {
        console.error('Clustering error:', error);
        alert(`Clustering failed: ${error.message}`);
    } finally {
        clusteringAlgorithmSelect.options[clusteringAlgorithmSelect.selectedIndex].text = originalOption;
        clusteringAlgorithmSelect.disabled = false;
    }
});

// Auto-run on file load: Louvain clustering + Disjoint layout
async function autoRunDefaultClustering() {
    if (!graphData || !Graph) return;

    try {
        const payload = {
            nodes: graphData.nodes.map(n => ({ id: n.id })),
            links: graphData.links.map(l => ({
                source: typeof l.source === 'object' ? l.source.id : l.source,
                target: typeof l.target === 'object' ? l.target.id : l.target
            })),
            algorithm: 'louvain'
        };

        const response = await fetch('/api/cluster', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const result = await response.json();
            if (result.clusters) {
                applyClustering(result.clusters);
            }
        }
    } catch (err) {
        console.warn('Auto-clustering failed, applying layout only:', err);
    }

    // Always apply Disjoint layout
    layoutModeSelect.value = 'disjoint';
    clusterStrengthContainer.classList.add('hidden');
    disjointStrengthContainer.classList.remove('hidden');
    applyLayoutMode('disjoint');
}

function applyClustering(clusters, labelMap = null) {

    // Update graphData nodes with cluster info
    graphData.nodes.forEach(node => {
        if (clusters[node.id] !== undefined) {
            node.cluster = clusters[node.id];
        }
    });

    clusteringActive = true;

    // Add 'cluster' to node color options if not present
    let optionExists = false;
    Array.from(nodeColorSelect.options).forEach(opt => {
        if (opt.value === 'cluster') optionExists = true;
    });

    if (!optionExists) {
        const opt = document.createElement('option');
        opt.value = 'cluster';
        opt.textContent = 'Cluster';
        nodeColorSelect.appendChild(opt);
    }

    // Set active color attribute to cluster
    nodeColorSelect.value = 'cluster';
    nodeColorAttribute = 'cluster';

    // Build global colorMap with numeric sort (critical: avoids string-sort mismatch)
    const values = [...new Set(Object.values(clusters))].sort((a, b) => a - b);
    const colors = generateColors(values.length);
    clusterColorMap = {};
    values.forEach((v, i) => clusterColorMap[v] = colors[i]);

    // Build label map: use provided labelMap (attribute mode) or auto-generate Cluster N (topology)
    if (labelMap) {
        clusterLabelMap = labelMap;
    } else {
        clusterLabelMap = {};
        values.forEach(v => { clusterLabelMap[v] = 'Cluster ' + v; });
    }

    // Apply colors to graph
    if (Graph) {
        Graph.nodeColor(node => {
            if (highlightedNodes.size > 0 && !highlightedNodes.has(node.id)) return 'rgba(100, 100, 100, 0.2)';
            return clusterColorMap[node.cluster] || '#9ca3af';
        });

        // Auto-apply cluster-grouped layout after clustering
        layoutModeSelect.value = 'cluster-grouped';
        clusterStrengthContainer.classList.remove('hidden');
        disjointStrengthContainer.classList.add('hidden');
        applyLayoutMode('cluster-grouped');
    }

    // Show legend (works for both topology and attribute mode)
    buildClusterLegend();
}

// ============================================================
// ATTRIBUTE-BASED CLUSTERING
// ============================================================

/**
 * Build the dynamic attribute checkbox list from loaded graph node properties.
 * Called every time a new graph file is loaded.
 */
function buildAttributeClusteringUI(data) {
    if (!data || !data.nodes || data.nodes.length === 0) return;

    // Collect all unique attribute keys across nodes (excluding internal/structural keys)
    const skipKeys = new Set(['id', 'name', 'x', 'y', 'z', 'vx', 'vy', 'vz', 'fx', 'fy', 'fz',
        'index', '__indexColor', '__threeObj', '__lineObj', '__arrowObj', 'curvature',
        'cluster', 'val']);

    const attrKeys = new Set();
    data.nodes.forEach(node => {
        Object.keys(node).forEach(k => {
            if (!skipKeys.has(k)) attrKeys.add(k);
        });
    });

    // Reset selected attrs
    selectedClusterAttrs = [];
    clusterBinsContainer.classList.add('hidden');
    clusterLegendDiv.classList.add('hidden');
    clusterAttrList.innerHTML = '';

    if (attrKeys.size === 0) {
        clusterAttrList.innerHTML = '<p class="text-xs text-gray-500 italic">No attributes found</p>';
        return;
    }

    [...attrKeys].sort().forEach(key => {
        // Detect if attribute is numeric
        const sampleVals = data.nodes.map(n => n[key]).filter(v => v !== null && v !== undefined);
        const isNumeric = sampleVals.length > 0 && sampleVals.every(v => !isNaN(parseFloat(v)) && isFinite(v));
        const uniqueCount = new Set(sampleVals).size;

        const wrapper = document.createElement('label');
        wrapper.className = 'flex items-center gap-2 cursor-pointer text-sm text-gray-300 hover:text-white';

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = key;
        cb.className = 'w-3.5 h-3.5 rounded text-indigo-500 bg-gray-700 border-gray-600 focus:ring-indigo-500 cursor-pointer accent-indigo-500';

        const labelText = document.createElement('span');
        labelText.className = 'flex-1 truncate';
        labelText.textContent = key;

        const badge = document.createElement('span');
        badge.className = 'ml-auto text-xs shrink-0 px-1.5 py-0.5 rounded';
        if (isNumeric) {
            badge.className += ' text-indigo-400 bg-indigo-900/40';
            badge.textContent = 'num';
        } else {
            badge.className += ' text-gray-500';
            badge.textContent = uniqueCount + 'v';
        }

        wrapper.append(cb, labelText, badge);

        cb.addEventListener('change', () => {
            if (cb.checked) {
                if (!selectedClusterAttrs.includes(key)) selectedClusterAttrs.push(key);
            } else {
                selectedClusterAttrs = selectedClusterAttrs.filter(k => k !== key);
            }
            // Show bins slider if any selected attr is numeric
            const anyNumeric = selectedClusterAttrs.some(attr => {
                const vals = data.nodes.map(n => n[attr]).filter(v => v !== null && v !== undefined);
                return vals.length > 0 && vals.every(v => !isNaN(parseFloat(v)) && isFinite(v));
            });
            clusterBinsContainer.classList.toggle('hidden', !anyNumeric);
        });

        clusterAttrList.appendChild(wrapper);
    });
}

// Cluster mode toggle: Topology
clusterModeTopologyBtn.addEventListener('click', () => {
    clusteringMode = 'topology';
    clusterModeTopologyBtn.classList.add('bg-indigo-600', 'text-white');
    clusterModeTopologyBtn.classList.remove('text-gray-400');
    clusterModeAttributeBtn.classList.remove('bg-indigo-600', 'text-white');
    clusterModeAttributeBtn.classList.add('text-gray-400');
    clusterTopologyPanel.classList.remove('hidden');
    clusterAttributePanel.classList.add('hidden');
});

// Cluster mode toggle: Attribute
clusterModeAttributeBtn.addEventListener('click', () => {
    clusteringMode = 'attribute';
    clusterModeAttributeBtn.classList.add('bg-indigo-600', 'text-white');
    clusterModeAttributeBtn.classList.remove('text-gray-400');
    clusterModeTopologyBtn.classList.remove('bg-indigo-600', 'text-white');
    clusterModeTopologyBtn.classList.add('text-gray-400');
    clusterAttributePanel.classList.remove('hidden');
    clusterTopologyPanel.classList.add('hidden');
});

// Numeric bins slider
clusterBinsSlider.addEventListener('input', (e) => {
    numericBins = parseInt(e.target.value);
    document.getElementById('val-cluster-bins').textContent = numericBins;
});

// Apply attribute clustering button
applyAttrClusterBtn.addEventListener('click', () => {
    if (!graphData) {
        alert('No graph data loaded.');
        return;
    }
    if (selectedClusterAttrs.length === 0) {
        alert('Please select at least one attribute to cluster by.');
        return;
    }
    applyAttributeClustering(selectedClusterAttrs);
});

/**
 * Core attribute clustering function.
 * Groups nodes by the combined values of the selected attributes.
 * Numeric attributes are binned into `numericBins` equal-width bins.
 */
function applyAttributeClustering(attrs) {
    if (!graphData || attrs.length === 0) return;
    const nodes = graphData.nodes;

    // Pre-compute min/max for numeric attributes
    const numericMeta = {};
    attrs.forEach(attr => {
        const vals = nodes.map(n => parseFloat(n[attr])).filter(v => !isNaN(v) && isFinite(v));
        if (vals.length > 0) {
            const allNumeric = nodes.every(n => {
                const v = n[attr];
                return v === null || v === undefined || (!isNaN(parseFloat(v)) && isFinite(v));
            });
            if (allNumeric) {
                numericMeta[attr] = { min: Math.min(...vals), max: Math.max(...vals) };
            }
        }
    });

    // Compute combined bucket key for a node
    function getNodeKey(node) {
        return attrs.map(attr => {
            const val = node[attr];
            if (val === null || val === undefined) return '__null__';
            if (numericMeta[attr]) {
                const { min, max } = numericMeta[attr];
                if (min === max) return 'bin0';
                const bin = Math.min(
                    numericBins - 1,
                    Math.floor(((parseFloat(val) - min) / (max - min)) * numericBins)
                );
                const binMin = (min + (bin / numericBins) * (max - min)).toFixed(2);
                const binMax = (min + ((bin + 1) / numericBins) * (max - min)).toFixed(2);
                return `${attr}:[${binMin}-${binMax})`;
            }
            return `${attr}:${val}`;
        }).join('  ');
    }

    // Assign cluster IDs
    const keyToCluster = {};
    const clusterToKey = {};
    let nextCluster = 0;
    const clusters = {};

    nodes.forEach(node => {
        const key = getNodeKey(node);
        if (!(key in keyToCluster)) {
            keyToCluster[key] = nextCluster;
            clusterToKey[nextCluster] = key;
            nextCluster++;
        }
        clusters[node.id] = keyToCluster[key];
    });

    // Apply standard clustering rendering + layout
    // Pass clusterToKey as labelMap so applyClustering uses human-readable attribute labels in the legend
    applyClustering(clusters, clusterToKey);
    // Note: buildClusterLegend is called inside applyClustering
}

/**
 * Render the cluster legend from global clusterColorMap and clusterLabelMap.
 * Colors are always in sync with node colors because both use the same global.
 * Works for both topology ("Cluster N") and attribute-based (human-readable keys) modes.
 */
function buildClusterLegend() {
    const ids = Object.keys(clusterLabelMap).map(Number).sort((a, b) => a - b);
    if (ids.length === 0) {
        clusterLegendDiv.classList.add('hidden');
        return;
    }

    clusterLegendItems.innerHTML = '';
    ids.forEach(id => {
        const label = clusterLabelMap[id];
        const color = clusterColorMap[id] || '#9ca3af';

        const row = document.createElement('div');
        row.className = 'flex items-start gap-2 text-xs py-0.5';
        row.innerHTML = `
            <span class="w-3 h-3 rounded-full shrink-0 mt-0.5" style="background:${color}"></span>
            <span class="text-gray-300 leading-tight break-all">${label}</span>
        `;
        clusterLegendItems.appendChild(row);
    });

    clusterLegendDiv.classList.remove('hidden');
}

