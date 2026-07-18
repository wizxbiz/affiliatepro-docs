import os
import shutil

public_dir = r'd:\Flutterapp\caculateapp\public'
index_path = os.path.join(public_dir, 'index.html')
community_path = os.path.join(public_dir, 'community.html')
official_path = os.path.join(public_dir, 'official.html')

def execute_rebrand():
    try:
        # 1. Copy original index to official
        if os.path.exists(index_path):
            shutil.copy2(index_path, official_path)
            print(f"Backed up {index_path} to {official_path}")
        
        # 2. Read community.html for rebranding
        if os.path.exists(community_path):
            with open(community_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Perform rebranding replacements
            content = content.replace('TokTok', 'TukTuk')
            content = content.replace('toktok', 'tuktuk')
            
            # Update navigation in the NEW index.html
            # Navigation links update
            content = content.replace(
                '<li class="nav-item"><a class="nav-link" href="index">หน้าแรก</a></li>',
                '<li class="nav-item"><a class="nav-link active" href="index">TukTuk Feed</a></li>'
            )
            content = content.replace(
                '<li class="nav-item"><a class="nav-link active" href="community">Community</a></li>',
                '<li class="nav-item"><a class="nav-link" href="official">Marketplace Official</a></li>'
            )
            
            # Bottom nav update
            content = content.replace(
                '<a href="index" class="nav-btn">',
                '<a href="index" class="nav-btn active">'
            )
            content = content.replace(
                '<span>หน้าแรก</span>',
                '<span>TukTuk Feed</span>'
            )
            
            # Write to index.html
            with open(index_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Applied rebranded community content to {index_path}")
            
            print("REBRAND_SUCCESS")
        else:
            print("ERROR: community.html not found")
            
    except Exception as e:
        print(f"CRITICAL_ERROR: {e}")

if __name__ == '__main__':
    execute_rebrand()
