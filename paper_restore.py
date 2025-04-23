import base64
import json
import ssl
import urllib.request
import argparse
from pathlib import Path

# 内置的AppCode（请替换为你的实际AppCode）
APP_CODE = '436f05e3e86347468a7fc7df27696c44'

def restore_exam_paper(image_path, output_dir="output"):
    """
    试卷还原处理
    :param image_path: 要处理的图片路径
    :param output_dir: 输出目录
    :return: 处理后的图片路径
    """
    # 创建输出目录
    Path(output_dir).mkdir(exist_ok=True)
    
    # API配置
    host = 'https://papertr.market.alicloudapi.com'
    path = '/sjsxcc'
    url = host + path

    # 读取并编码图片
    with open(image_path, "rb") as f:
        base64_data = base64.b64encode(f.read())

    # 准备请求
    request_body = json.dumps({
        'media_id': str(base64_data, encoding='utf-8'),
        'keep_ori': True
    })

    request = urllib.request.Request(url, request_body.encode())
    request.add_header('Authorization', 'APPCODE ' + APP_CODE)
    request.add_header('Content-Type', 'application/json; charset=UTF-8')

    # 跳过SSL验证
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    # 处理API响应
    try:
        with urllib.request.urlopen(request, context=ctx) as response:
            result = json.loads(response.read().decode('utf-8'))
            
            if result.get('code') != 0:
                raise ValueError(f"API错误: {result.get('message', '未知错误')}")
            
            # 获取并保存图片
            media_data = result['data']['media_id']
            input_name = Path(image_path).stem
            output_path = f"{output_dir}/{input_name}_restored.jpg"
            
            # 处理Base64前缀
            if media_data.startswith('data:image'):
                media_data = media_data.split(',')[1]
            
            with open(output_path, 'wb') as f:
                f.write(base64.b64decode(media_data))
            
            print(f"✅ 处理完成: {output_path}")
            return output_path

    except Exception as e:
        print(f"❌ 处理失败: {str(e)}")
        return None

def main():
    parser = argparse.ArgumentParser(description='试卷还原工具')
    parser.add_argument('image', help='要处理的图片路径')
    args = parser.parse_args()
    
    restore_exam_paper(args.image)

if __name__ == '__main__':
    main()