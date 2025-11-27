from flask import Flask, send_from_directory, render_template, request, jsonify
import os
import json
import xml.etree.ElementTree as ET

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
    app.run(debug=True, port=5000)
