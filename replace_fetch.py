import os

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replacements
    content = content.replace("fetch(`${API_URL}", "authFetch(`")
    content = content.replace("fetch(`http://127.0.0.1:5000", "authFetch(`")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

process_file('src/pages/Index.tsx')
process_file('src/components/friends/ChatWindow.tsx')
