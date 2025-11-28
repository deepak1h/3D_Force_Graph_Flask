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
let nodeColorAttribute = 'division';

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
const pauseBtn = document.getElementById('pause-btn');
const zoomBtn = document.getElementById('zoom-btn');
const dimBtns = document.querySelectorAll('.dim-btn');
const particleSpeedSlider = document.getElementById('particle-speed');
const nodeColorSelect = document.getElementById('node-color-by');
const fixNodesToggle = document.getElementById('fix-nodes-toggle');

// Info Panel
const infoPanel = document.getElementById('info-panel');
const infoContent = document.getElementById('info-content');
const infoTitle = document.getElementById('info-title');
const closeInfoBtn = document.getElementById('close-info-btn');

// Constants
const NODE_R = 4;
const BACKGROUND_COLOR = '#000011'; // Dark background for consistency
const LABEL_DENSITY = 0.1; // Control label density (0.0 - 1.0)

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
        } else {
            tabFilters.classList.add('hidden');
            tabSettings.classList.remove('hidden');
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

// Controls
pauseBtn.addEventListener('click', () => {
    if (Graph) {
        const isPaused = pauseBtn.querySelector('span').textContent === 'Resume';
        if (isPaused) {
            Graph.resumeAnimation();
            pauseBtn.innerHTML = '<i data-lucide="pause" class="w-4 h-4"></i><span>Pause</span>';
        } else {
            Graph.pauseAnimation();
            pauseBtn.innerHTML = '<i data-lucide="play" class="w-4 h-4"></i><span>Resume</span>';
        }
        lucide.createIcons();
    }
});

zoomBtn.addEventListener('click', () => {
    if (Graph) Graph.zoomToFit(400);
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

function initGraph(data) {
    // Calculate ranges for scaling
    // Nodes: amount -> 2-10px
    const nodeAmounts = data.nodes.map(n => parseFloat(n.amount)).filter(v => !isNaN(v));
    const minNodeAmt = nodeAmounts.length ? Math.min(...nodeAmounts) : 0;
    const maxNodeAmt = nodeAmounts.length ? Math.max(...nodeAmounts) : 1;

    // Links: Assesment Amount -> 1-5px
    const linkAmounts = data.links.map(l => parseFloat(l['Assesment Amount'])).filter(v => !isNaN(v));
    const minLinkAmt = linkAmounts.length ? Math.min(...linkAmounts) : 0;
    const maxLinkAmt = linkAmounts.length ? Math.max(...linkAmounts) : 1;

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

    const GraphConstructor = currentMode === '2D' ? ForceGraph : ForceGraph3D;

    Graph = GraphConstructor()
        (graphContainer)
        .width(graphContainer.offsetWidth)
        .height(graphContainer.offsetHeight)
        .backgroundColor(BACKGROUND_COLOR) // Consistent background
        .graphData(data)
        .nodeLabel(node => node.legal_name || node.name || node.id) // Tooltip
        .linkLabel(link => link.assamtstr || link.label || '') // Tooltip
        .nodeColor(node => {
            if (highlightedNodes.size > 0 && !highlightedNodes.has(node.id)) return 'rgba(100, 100, 100, 0.2)'; // Increased visibility
            // if (hoverNode && hoverNode !== node && !highlightedNodes.has(node.id)) return 'rgba(100, 100, 100, 0.2)'; // Dim on hover - REMOVED per request
            return colorMap[node[nodeColorAttribute]] || '#9ca3af';
        })
        .nodeVal(node => {
            // Scale node size (radius) based on amount (2-10px)
            return scaleValue(node.amount, minNodeAmt, maxNodeAmt, 2, 10);
        })
        .nodeRelSize(1) // Use nodeVal directly as radius (or close to it)
        .linkWidth(link => {
            // Scale link width based on Assesment Amount (1-5px)
            let width = scaleValue(link['Assesment Amount'], minLinkAmt, maxLinkAmt, 1, 5);

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
        .linkDirectionalArrowLength(3.5)
        .linkDirectionalArrowRelPos(1)
        .linkDirectionalParticles(link => {
            // Map 'Degree' to particle count
            const degree = parseInt(link.Degree);
            return !isNaN(degree) ? Math.min(degree, 5) : 2; // Cap at 5
        })
        .linkDirectionalParticleWidth(link => {
            // Map 'Invoice count' to particle width
            const count = parseFloat(link['Invoice count']);
            return !isNaN(count) ? Math.min(count, 4) : 2;
        })
        .linkDirectionalParticleSpeed(0.006) // Fixed speed as requested (6 -> 0.006)
        .linkHoverPrecision(5) // Increased precision
        .onNodeClick(handleNodeClick)
        .onLinkClick(handleLinkClick)
        .onBackgroundClick(resetHighlight)
        .onNodeHover(node => {
            if (isSelectionActive) return; // Disable hover when selection is active

            hoverNode = node || null;
            graphContainer.style.cursor = node ? 'pointer' : null;

            if (node) {
                showInfo(node, 'Node Details');
            } else if (!hoverLink) {
                closeInfo();
            }
        })
        .onLinkHover(link => {
            if (isSelectionActive) return; // Disable hover when selection is active

            hoverLink = link || null;
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

    // 2D Specific: Render Labels
    if (currentMode === '2D') {
        Graph.nodeCanvasObject((node, ctx, globalScale) => {
            const label = node.legal_name || node.name || node.id;
            const fontSize = 12 / globalScale;

            // Draw Node
            const radius = scaleValue(node.amount, minNodeAmt, maxNodeAmt, 2, 10);

            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = (highlightedNodes.size > 0 && !highlightedNodes.has(node.id)) ? 'rgba(100, 100, 100, 0.2)' : (colorMap[node[nodeColorAttribute]] || '#9ca3af');
            ctx.fill();

            // Draw Label
            // Show if selection is active AND node is highlighted, OR if no selection and zoomed in (filtered by density)
            const showLabel = (isSelectionActive && highlightedNodes.has(node.id)) ||
                (!isSelectionActive && globalScale >= 1.5 && checkLabelDensity(node.id));

            if (showLabel) {
                ctx.font = `${fontSize}px Sans-Serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.fillText(label, node.x, node.y + radius + fontSize, 200);
            }
        })
            .linkCanvasObjectMode(() => 'after')
            .linkCanvasObject((link, ctx, globalScale) => {
                const label = link.assamtstr || link.label || '';
                if (!label) return;

                // Show if selection is active AND link is highlighted, OR if no selection and zoomed in (filtered by density)
                const showLabel = (isSelectionActive && highlightedLinks.has(getLinkId(link))) ||
                    (!isSelectionActive && globalScale >= 1.5 && checkLabelDensity(getLinkId(link)));

                if (showLabel) {
                    const fontSize = 10 / globalScale;
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
    if (LABEL_DENSITY >= 1) return true;
    let hash = 0;
    const str = String(id);
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return ((Math.abs(hash) % 100) / 100) < LABEL_DENSITY;
}
