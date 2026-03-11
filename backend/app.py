from flask import Flask, send_from_directory, render_template, request, jsonify
import os
import json
import xml.etree.ElementTree as ET
import scipy.sparse as sp

app = Flask(__name__, static_folder='static', template_folder='templates')

def parse_gexf(content):
    try:
        root = ET.fromstring(content)
        ns = {'gexf': 'http://www.gexf.net/1.2draft'}
        
        # Handle cases where namespace might be different or absent
        # A simple way is to strip namespaces or try to find without ns if fails, 
        # but for now let's try to be generic or just look for tags ending in name
        
        nodes = []
        edges = []
        
        # Find all 'node' elements recursively
        for node in root.findall('.//node') + root.findall('.//{http://www.gexf.net/1.2draft}node'):
            nodes.append({
                'id': node.get('id'),
                'name': node.get('label'),
                'val': 1 
            })
            
        # Find all 'edge' elements recursively
        for edge in root.findall('.//edge') + root.findall('.//{http://www.gexf.net/1.2draft}edge'):
            edges.append({
                'source': edge.get('source'),
                'target': edge.get('target'),
                'id': edge.get('id')
            })
            
        return {'nodes': nodes, 'links': edges}
    except Exception as e:
        print(f"Error parsing GEXF: {e}")
        raise ValueError("Invalid GEXF file")

def parse_json(content):
    try:
        data = json.loads(content)
        nodes = []
        links = []
        
        if 'nodes' in data and 'edges' in data:
            # Format 1: nodes and edges
            for node in data['nodes']:
                # Handle attributes if present
                attributes = node.get('attributes', {})
                name = attributes.get('legal_name') or attributes.get('trade_name') or node.get('key')
                nodes.append({
                    'id': node.get('key'),
                    'name': name,
                    **attributes
                })
            
            for edge in data['edges']:
                attributes = edge.get('attributes', {})
                links.append({
                    'source': edge.get('source'),
                    'target': edge.get('target'),
                    'id': edge.get('key'),
                    **attributes,
                    **edge # Include other edge props
                })
                
        elif 'nodes' in data and 'links' in data:
             # Format 2: nodes and links (standard)
             nodes = data['nodes']
             links = data['links']
        else:
            raise ValueError("Invalid JSON format")
            
        return {'nodes': nodes, 'links': links}
    except Exception as e:
        print(f"Error parsing JSON: {e}")
        raise ValueError(f"Invalid JSON file: {str(e)}")


try:
    import networkx as nx
    from networkx.algorithms import community
except ImportError:
    nx = None

try:
    import markov_clustering as mcl
except ImportError:
    mcl = None

try:
    import igraph as ig
    import leidenalg
except ImportError:
    ig = None
    leidenalg = None

def apply_clustering(graph_data, algorithm):
    """
    Apply clustering algorithm to graph data.
    Returns a dictionary mapping node_id -> cluster_id
    """
    
    # Create NetworkX graph
    G = nx.Graph()
    # Add nodes
    for node in graph_data['nodes']:
        G.add_node(node['id'])
        
    # Add edges
    for link in graph_data['links']:
        G.add_edge(link['source'], link['target'])
        
    clusters = {}
    
    try:
        if algorithm == 'louvain':
            # Use NetworkX Louvain implementation
            # Returns list of sets of nodes
            if not nx: raise ImportError("NetworkX not available")
            communities = community.louvain_communities(G)
            for i, comm in enumerate(communities):
                for node_id in comm:
                    clusters[node_id] = i
                    
        elif algorithm == 'leiden':
            # Use leidenalg with igraph
            if not ig or not leidenalg: raise ImportError("Leidenalg/igraph not available")
            
            # Convert NetworkX to igraph
            # Mapping node ids to indices
            node_id_map = {node: i for i, node in enumerate(G.nodes())}
            reverse_map = {i: node for node, i in node_id_map.items()}
            
            h = ig.Graph()
            h.add_vertices(len(G.nodes()))
            edges = [(node_id_map[u], node_id_map[v]) for u, v in G.edges()]
            h.add_edges(edges)
            
            # Run Leiden
            partition = leidenalg.find_partition(h, leidenalg.ModularityVertexPartition)
            
            for i, part in enumerate(partition):
                for node_idx in part:
                    clusters[reverse_map[node_idx]] = i
                    
        elif algorithm == 'mcl':
            # Markov Clustering
            if not mcl: raise ImportError("Markov Clustering not available")
            if not nx: raise ImportError("NetworkX not available")  

            

            matrix = nx.to_scipy_sparse_array(G)

            # Critical conversions
            matrix = sp.csr_matrix(matrix)
            matrix = matrix.astype(float)   
            
            # Run MCL
            result = mcl.run_mcl(matrix)
            clusters_raw = mcl.get_clusters(result)
            
            # Map back to nodes
            nodes_list = list(G.nodes())
            for i, cluster in enumerate(clusters_raw):
                for node_idx in cluster:
                    clusters[nodes_list[node_idx]] = i
                    
        elif algorithm == 'greedy':
            # Greedy Modularity
            if not nx: raise ImportError("NetworkX not available")
            communities = community.greedy_modularity_communities(G)
            for i, comm in enumerate(communities):
                for node_id in comm:
                    clusters[node_id] = i

        else: 
             return {'error': f"Unknown algorithm: {algorithm}"}

        return {'clusters': clusters}
        
    except Exception as e:
        print(f"Clustering error: {e}")
        return {'error': str(e)}


@app.route('/api/cluster', methods=['POST'])
def cluster_graph():
    data = request.json
    if not data or 'nodes' not in data or 'links' not in data:
        return jsonify({'error': 'Invalid graph data'}), 400
        
    algorithm = data.get('algorithm', 'louvain')
    
    result = apply_clustering(data, algorithm)
    
    if 'error' in result:
        return jsonify({'error': result['error']}), 500
        
    return jsonify(result)

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    try:
        content = file.read().decode('utf-8')
        
        if file.filename.endswith('.json'):
            graph_data = parse_json(content)
        elif file.filename.endswith('.gexf'):
            graph_data = parse_gexf(content)
        else:
            return jsonify({'error': 'Unsupported file type'}), 400
            
        return jsonify(graph_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True, port=5001)
