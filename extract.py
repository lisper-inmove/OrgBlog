import os
import base64
import re
import json

# 定义要处理的目录路径
directory_path = 'posts'

# 初始化元数据字典
metadata = []

# 定义正则表达式模式
pattern = re.compile(r'^#\+(TITLE|CATEGORIES|DATE|KEYWORDS|DIFFICULTY): (.+)$')

# 使用 os.walk() 递归遍历目录
for foldername, subfolders, filenames in os.walk(directory_path):
    for filename in filenames:
        if not filename.endswith("org"):
            continue
        file_path = os.path.join(foldername, filename)
        # print('Processing file:', file_path)

        # 生成文件路径的 16 位哈希值
        encoded_string = base64.b64encode(file_path.encode()).decode().rstrip('=')

        # 初始化文件元数据
        file_metadata = {'path': file_path, 'id': encoded_string}

        with open(file_path, 'r') as file:
            while True:
                line = file.readline()
                if not line.startswith('#+'):
                    break
                match = pattern.match(line)
                if match:
                    key = match.group(1)
                    value = match.group(2).strip()
                    file_metadata[key.lower()] = value

        if file_metadata.get("categories") is None:
            print(filename)

        # 将文件元数据添加到总元数据字典中
        metadata.append(file_metadata)

# 将元数据保存到 metadata.json 文件中
with open('metadata.json', 'w') as json_file:
    json.dump(metadata, json_file, indent=4, ensure_ascii=False)

print('Metadata has been saved to metadata.json')
