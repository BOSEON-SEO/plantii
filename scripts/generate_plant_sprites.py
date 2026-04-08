#!/usr/bin/env python3
"""
Plantii 식물 도트 그래픽 생성 스크립트
각 식물의 성장 단계별 64x64 PNG 이미지를 생성합니다.
"""

from PIL import Image, ImageDraw
import json
import os

# 색상 팔레트
COLORS = {
    # 건강한 식물 색상
    'seed_brown': (101, 67, 33),
    'sprout_light_green': (144, 238, 144),
    'green': (34, 139, 34),
    'dark_green': (0, 100, 0),
    'bright_green': (50, 205, 50),
    'leaf_green': (107, 142, 35),

    # 꽃 색상
    'rose_red': (220, 20, 60),
    'rose_pink': (255, 182, 193),
    'tulip_red': (255, 69, 0),
    'tulip_yellow': (255, 215, 0),
    'sunflower_yellow': (255, 215, 0),
    'sunflower_orange': (255, 140, 0),
    'lavender_purple': (147, 112, 219),
    'orchid_pink': (218, 112, 214),

    # 다육 색상
    'succulent_green': (143, 188, 143),
    'succulent_blue': (176, 196, 222),
    'aloe_green': (85, 107, 47),

    # 채소 색상
    'lettuce_green': (173, 255, 47),
    'tomato_red': (255, 99, 71),
    'tomato_green': (50, 205, 50),
    'chili_red': (178, 34, 34),
    'chili_green': (34, 139, 34),

    # 허브 색상
    'basil_green': (85, 107, 47),
    'mint_green': (152, 251, 152),

    # 기타
    'brown': (139, 69, 19),
    'dark_brown': (101, 67, 33),
    'yellow': (255, 255, 0),
    'white': (255, 255, 255),
    'soil': (160, 82, 45),
    'pot': (205, 133, 63),
    'stem': (107, 142, 35),
    'center_brown': (139, 69, 19),

    # 시든 상태 색상
    'wilted_brown': (139, 119, 101),
    'wilted_yellow': (189, 183, 107),
    'wilted_gray': (128, 128, 128),
}

def create_base_image(size=64):
    """투명 배경의 기본 이미지 생성"""
    return Image.new('RGBA', (size, size), (0, 0, 0, 0))

def draw_pixel(draw, x, y, color, pixel_size=2):
    """도트 픽셀 그리기"""
    draw.rectangle([x, y, x + pixel_size - 1, y + pixel_size - 1], fill=color)

def draw_seed(img, color_scheme):
    """씨앗 단계 (stage 1)"""
    draw = ImageDraw.Draw(img)
    seed_color = COLORS['seed_brown']

    # 작은 타원형 씨앗
    for y in range(26, 38):
        for x in range(26, 38):
            if ((x - 32) ** 2) / 25 + ((y - 32) ** 2) / 16 <= 1:
                draw_pixel(draw, x, y, seed_color)

    # 하이라이트
    draw_pixel(draw, 28, 28, (150, 100, 50))

    return img

def draw_sprout(img, color_scheme):
    """새싹 단계 (stage 2)"""
    draw = ImageDraw.Draw(img)

    # 흙
    for x in range(20, 44):
        draw_pixel(draw, x, 46, COLORS['soil'])
        draw_pixel(draw, x, 48, COLORS['dark_brown'])

    # 줄기
    stem_color = COLORS['stem']
    for y in range(38, 46):
        draw_pixel(draw, 30, y, stem_color)
        draw_pixel(draw, 32, y, stem_color)

    # 작은 새싹 잎 (2개)
    leaf_color = COLORS['sprout_light_green']
    # 왼쪽 잎
    for x in range(24, 30):
        for y in range(32, 38):
            if ((x - 27) ** 2) / 9 + ((y - 35) ** 2) / 9 <= 1:
                draw_pixel(draw, x, y, leaf_color)

    # 오른쪽 잎
    for x in range(34, 40):
        for y in range(32, 38):
            if ((x - 37) ** 2) / 9 + ((y - 35) ** 2) / 9 <= 1:
                draw_pixel(draw, x, y, leaf_color)

    return img

def draw_seedling(img, color_scheme):
    """묘목 단계 (stage 3)"""
    draw = ImageDraw.Draw(img)

    # 흙
    for x in range(16, 48):
        draw_pixel(draw, x, 50, COLORS['soil'])
        draw_pixel(draw, x, 52, COLORS['dark_brown'])

    # 줄기
    stem_color = COLORS['stem']
    for y in range(30, 50):
        draw_pixel(draw, 30, y, stem_color)
        draw_pixel(draw, 32, y, stem_color)

    # 잎 4-6개
    leaf_color = color_scheme.get('leaf', COLORS['green'])

    # 왼쪽 아래 잎
    for x in range(18, 28):
        for y in range(38, 44):
            if ((x - 23) ** 2) / 16 + ((y - 41) ** 2) / 9 <= 1:
                draw_pixel(draw, x, y, leaf_color)

    # 오른쪽 아래 잎
    for x in range(36, 46):
        for y in range(38, 44):
            if ((x - 41) ** 2) / 16 + ((y - 41) ** 2) / 9 <= 1:
                draw_pixel(draw, x, y, leaf_color)

    # 왼쪽 위 잎
    for x in range(20, 28):
        for y in range(28, 34):
            if ((x - 24) ** 2) / 12 + ((y - 31) ** 2) / 9 <= 1:
                draw_pixel(draw, x, y, leaf_color)

    # 오른쪽 위 잎
    for x in range(36, 44):
        for y in range(28, 34):
            if ((x - 40) ** 2) / 12 + ((y - 31) ** 2) / 9 <= 1:
                draw_pixel(draw, x, y, leaf_color)

    return img

def draw_vegetative(img, color_scheme):
    """영양 성장기 (stage 4)"""
    draw = ImageDraw.Draw(img)

    # 화분
    for x in range(12, 52):
        draw_pixel(draw, x, 54, COLORS['pot'])
        draw_pixel(draw, x, 56, COLORS['dark_brown'])
    for x in range(14, 50):
        draw_pixel(draw, x, 52, COLORS['soil'])

    # 줄기
    stem_color = COLORS['dark_green']
    for y in range(24, 52):
        draw_pixel(draw, 30, y, stem_color)
        draw_pixel(draw, 32, y, stem_color)

    # 많은 잎들
    leaf_color = color_scheme.get('leaf', COLORS['green'])

    positions = [
        (16, 36, 20, 20),  # 왼쪽 하단
        (42, 36, 20, 20),  # 오른쪽 하단
        (18, 26, 16, 16),  # 왼쪽 중단
        (40, 26, 16, 16),  # 오른쪽 중단
        (22, 18, 12, 12),  # 왼쪽 상단
        (36, 18, 12, 12),  # 오른쪽 상단
    ]

    for cx, cy, w, h in positions:
        for x in range(cx - w // 2, cx + w // 2):
            for y in range(cy - h // 2, cy + h // 2):
                if ((x - cx) ** 2) / (w // 2) ** 2 + ((y - cy) ** 2) / (h // 2) ** 2 <= 1:
                    draw_pixel(draw, x, y, leaf_color)

    return img

def draw_mature_flowering(img, color_scheme):
    """성숙/개화 단계 (stage 5) - 화훼류"""
    draw = ImageDraw.Draw(img)

    # 화분
    for x in range(12, 52):
        draw_pixel(draw, x, 56, COLORS['pot'])
        draw_pixel(draw, x, 58, COLORS['dark_brown'])
    for x in range(14, 50):
        draw_pixel(draw, x, 54, COLORS['soil'])

    # 줄기
    for y in range(20, 54):
        draw_pixel(draw, 30, y, COLORS['dark_green'])
        draw_pixel(draw, 32, y, COLORS['dark_green'])

    # 잎들
    leaf_color = color_scheme.get('leaf', COLORS['green'])
    positions = [(18, 40, 16, 12), (44, 40, 16, 12), (20, 30, 12, 10), (42, 30, 12, 10)]

    for cx, cy, w, h in positions:
        for x in range(cx - w // 2, cx + w // 2):
            for y in range(cy - h // 2, cy + h // 2):
                if ((x - cx) ** 2) / (w // 2) ** 2 + ((y - cy) ** 2) / (h // 2) ** 2 <= 1:
                    draw_pixel(draw, x, y, leaf_color)

    # 꽃
    flower_color = color_scheme.get('flower', COLORS['rose_pink'])
    center_color = COLORS['center_brown']

    # 꽃잎 5개
    petal_positions = [
        (32, 12),  # 위
        (42, 18),  # 오른쪽 위
        (38, 26),  # 오른쪽 아래
        (26, 26),  # 왼쪽 아래
        (22, 18),  # 왼쪽 위
    ]

    for px, py in petal_positions:
        for x in range(px - 4, px + 4):
            for y in range(py - 4, py + 4):
                if ((x - px) ** 2) / 16 + ((y - py) ** 2) / 16 <= 1:
                    draw_pixel(draw, x, y, flower_color)

    # 꽃 중심
    for x in range(28, 36):
        for y in range(18, 24):
            if ((x - 32) ** 2) / 16 + ((y - 20) ** 2) / 9 <= 1:
                draw_pixel(draw, x, y, center_color)

    return img

def draw_mature_succulent(img, color_scheme):
    """성숙 단계 (stage 5) - 다육식물"""
    draw = ImageDraw.Draw(img)

    # 화분
    for x in range(16, 48):
        draw_pixel(draw, x, 54, COLORS['pot'])
        draw_pixel(draw, x, 56, COLORS['dark_brown'])
    for x in range(18, 46):
        draw_pixel(draw, x, 52, COLORS['soil'])

    # 다육 잎들 (로제트 형태)
    leaf_color = color_scheme.get('leaf', COLORS['succulent_green'])

    # 중심에서 방사형으로 잎 배치
    center = (32, 36)

    # 바깥쪽 잎 (8개)
    for angle in range(0, 360, 45):
        import math
        rad = math.radians(angle)
        x = int(center[0] + 14 * math.cos(rad))
        y = int(center[1] + 10 * math.sin(rad))

        for dx in range(-4, 4):
            for dy in range(-3, 3):
                if dx * dx / 16 + dy * dy / 9 <= 1:
                    draw_pixel(draw, x + dx, y + dy, leaf_color)

    # 중간쪽 잎 (8개)
    for angle in range(22, 360, 45):
        import math
        rad = math.radians(angle)
        x = int(center[0] + 8 * math.cos(rad))
        y = int(center[1] + 6 * math.sin(rad))

        for dx in range(-3, 3):
            for dy in range(-2, 2):
                if dx * dx / 9 + dy * dy / 4 <= 1:
                    draw_pixel(draw, x + dx, y + dy, leaf_color)

    # 중심부
    highlight_color = tuple(min(c + 30, 255) for c in leaf_color)
    for x in range(28, 36):
        for y in range(32, 40):
            if ((x - 32) ** 2) / 16 + ((y - 36) ** 2) / 16 <= 1:
                draw_pixel(draw, x, y, highlight_color)

    return img

def draw_mature_foliage(img, color_scheme):
    """성숙 단계 (stage 5) - 관엽식물"""
    draw = ImageDraw.Draw(img)

    # 화분
    for x in range(12, 52):
        draw_pixel(draw, x, 56, COLORS['pot'])
        draw_pixel(draw, x, 58, COLORS['dark_brown'])
    for x in range(14, 50):
        draw_pixel(draw, x, 54, COLORS['soil'])

    # 줄기
    for y in range(18, 54):
        draw_pixel(draw, 30, y, COLORS['dark_green'])
        draw_pixel(draw, 32, y, COLORS['dark_green'])

    # 큰 잎들
    leaf_color = color_scheme.get('leaf', COLORS['dark_green'])

    # 대형 잎 4개
    positions = [
        (14, 30, 24, 20),  # 왼쪽 하단
        (46, 30, 24, 20),  # 오른쪽 하단
        (16, 16, 20, 16),  # 왼쪽 상단
        (44, 16, 20, 16),  # 오른쪽 상단
    ]

    for cx, cy, w, h in positions:
        for x in range(cx - w // 2, cx + w // 2):
            for y in range(cy - h // 2, cy + h // 2):
                if ((x - cx) ** 2) / (w // 2) ** 2 + ((y - cy) ** 2) / (h // 2) ** 2 <= 1:
                    draw_pixel(draw, x, y, leaf_color)

        # 잎맥
        vein_color = tuple(max(c - 30, 0) for c in leaf_color)
        draw_pixel(draw, cx, cy - 4, vein_color)
        draw_pixel(draw, cx, cy - 2, vein_color)
        draw_pixel(draw, cx, cy, vein_color)
        draw_pixel(draw, cx, cy + 2, vein_color)

    return img

def draw_mature_vegetable(img, color_scheme):
    """성숙/수확 단계 (stage 5) - 채소류"""
    draw = ImageDraw.Draw(img)

    # 화분
    for x in range(12, 52):
        draw_pixel(draw, x, 56, COLORS['pot'])
        draw_pixel(draw, x, 58, COLORS['dark_brown'])
    for x in range(14, 50):
        draw_pixel(draw, x, 54, COLORS['soil'])

    # 줄기
    for y in range(22, 54):
        draw_pixel(draw, 30, y, COLORS['stem'])
        draw_pixel(draw, 32, y, COLORS['stem'])

    # 잎들
    leaf_color = color_scheme.get('leaf', COLORS['green'])
    positions = [(18, 38, 18, 14), (44, 38, 18, 14), (20, 28, 14, 12), (42, 28, 14, 12)]

    for cx, cy, w, h in positions:
        for x in range(cx - w // 2, cx + w // 2):
            for y in range(cy - h // 2, cy + h // 2):
                if ((x - cx) ** 2) / (w // 2) ** 2 + ((y - cy) ** 2) / (h // 2) ** 2 <= 1:
                    draw_pixel(draw, x, y, leaf_color)

    # 열매/수확물
    fruit_color = color_scheme.get('fruit', COLORS['tomato_red'])

    # 여러 개의 열매
    fruit_positions = [(32, 16, 8, 8), (24, 22, 6, 6), (40, 20, 6, 6)]

    for fx, fy, fw, fh in fruit_positions:
        for x in range(fx - fw // 2, fx + fw // 2):
            for y in range(fy - fh // 2, fy + fh // 2):
                if ((x - fx) ** 2) / (fw // 2) ** 2 + ((y - fy) ** 2) / (fh // 2) ** 2 <= 1:
                    draw_pixel(draw, x, y, fruit_color)

    return img

def draw_mature_herb(img, color_scheme):
    """성숙 단계 (stage 5) - 허브"""
    draw = ImageDraw.Draw(img)

    # 화분
    for x in range(14, 50):
        draw_pixel(draw, x, 56, COLORS['pot'])
        draw_pixel(draw, x, 58, COLORS['dark_brown'])
    for x in range(16, 48):
        draw_pixel(draw, x, 54, COLORS['soil'])

    # 여러 줄기 (덤불 형태)
    for y in range(26, 54):
        draw_pixel(draw, 24, y, COLORS['stem'])
        draw_pixel(draw, 32, y, COLORS['stem'])
        draw_pixel(draw, 40, y, COLORS['stem'])

    # 많은 작은 잎들
    leaf_color = color_scheme.get('leaf', COLORS['green'])

    # 왼쪽 줄기 잎
    for y in range(28, 48, 6):
        for x in range(18, 24):
            for dy in range(-2, 2):
                if abs(x - 21) <= 3 and abs((y + dy) - y) <= 2:
                    draw_pixel(draw, x, y + dy, leaf_color)

    # 중앙 줄기 잎
    for y in range(24, 48, 6):
        for x in range(26, 32):
            for dy in range(-2, 2):
                if abs(x - 29) <= 3 and abs((y + dy) - y) <= 2:
                    draw_pixel(draw, x, y + dy, leaf_color)
        for x in range(34, 40):
            for dy in range(-2, 2):
                if abs(x - 37) <= 3 and abs((y + dy) - y) <= 2:
                    draw_pixel(draw, x, y + dy, leaf_color)

    # 오른쪽 줄기 잎
    for y in range(28, 48, 6):
        for x in range(42, 48):
            for dy in range(-2, 2):
                if abs(x - 45) <= 3 and abs((y + dy) - y) <= 2:
                    draw_pixel(draw, x, y + dy, leaf_color)

    # 상단에 작은 꽃들
    flower_color = color_scheme.get('flower', COLORS['lavender_purple'])
    for x in [26, 32, 38]:
        for y in [18, 22]:
            for dx in range(-1, 2):
                for dy in range(-1, 2):
                    if abs(dx) + abs(dy) <= 1:
                        draw_pixel(draw, x + dx, y + dy, flower_color)

    return img

# 각 식물의 색상 구성
PLANT_COLOR_SCHEMES = {
    'rose': {
        'leaf': COLORS['green'],
        'flower': COLORS['rose_pink'],
        'type': 'flowering'
    },
    'cactus': {
        'leaf': COLORS['succulent_green'],
        'type': 'succulent'
    },
    'tulip': {
        'leaf': COLORS['green'],
        'flower': COLORS['tulip_red'],
        'type': 'flowering'
    },
    'sunflower': {
        'leaf': COLORS['green'],
        'flower': COLORS['sunflower_yellow'],
        'type': 'flowering'
    },
    'lavender': {
        'leaf': COLORS['leaf_green'],
        'flower': COLORS['lavender_purple'],
        'type': 'herb'
    },
    'orchid': {
        'leaf': COLORS['dark_green'],
        'flower': COLORS['orchid_pink'],
        'type': 'flowering'
    },
    'aloe': {
        'leaf': COLORS['aloe_green'],
        'type': 'succulent'
    },
    'succulent': {
        'leaf': COLORS['succulent_blue'],
        'type': 'succulent'
    },
    'rubber_plant': {
        'leaf': COLORS['dark_green'],
        'type': 'foliage'
    },
    'monstera': {
        'leaf': COLORS['dark_green'],
        'type': 'foliage'
    },
    'lettuce': {
        'leaf': COLORS['lettuce_green'],
        'fruit': COLORS['lettuce_green'],
        'type': 'vegetable'
    },
    'tomato': {
        'leaf': COLORS['green'],
        'fruit': COLORS['tomato_red'],
        'type': 'vegetable'
    },
    'chili': {
        'leaf': COLORS['green'],
        'fruit': COLORS['chili_red'],
        'type': 'vegetable'
    },
    'basil': {
        'leaf': COLORS['basil_green'],
        'flower': COLORS['white'],
        'type': 'herb'
    },
    'mint': {
        'leaf': COLORS['mint_green'],
        'flower': COLORS['lavender_purple'],
        'type': 'herb'
    },
}

def generate_plant_sprites(plant_id, color_scheme, output_dir):
    """Generate all growth stage images for a specific plant"""
    stages = [
        ('stage1', draw_seed),
        ('stage2', draw_sprout),
        ('stage3', draw_seedling),
        ('stage4', draw_vegetative),
    ]

    # Stage 5 depends on plant type
    plant_type = color_scheme.get('type', 'flowering')
    if plant_type == 'flowering':
        stages.append(('stage5', draw_mature_flowering))
    elif plant_type == 'succulent':
        stages.append(('stage5', draw_mature_succulent))
    elif plant_type == 'foliage':
        stages.append(('stage5', draw_mature_foliage))
    elif plant_type == 'vegetable':
        stages.append(('stage5', draw_mature_vegetable))
    elif plant_type == 'herb':
        stages.append(('stage5', draw_mature_herb))

    for stage_name, draw_func in stages:
        img = create_base_image(64)
        img = draw_func(img, color_scheme)

        filename = f"{plant_id}_{stage_name}.png"
        filepath = os.path.join(output_dir, filename)
        img.save(filepath)
        print(f"Generated: {filename}")

def main():
    """Main execution function"""
    # Output directory
    output_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'src', 'assets', 'plants')
    os.makedirs(output_dir, exist_ok=True)

    print("Plantii Plant Sprite Generator")
    print("=" * 50)
    print()

    # Generate images for all plants
    for plant_id, color_scheme in PLANT_COLOR_SCHEMES.items():
        print(f"\nGenerating {plant_id}...")
        generate_plant_sprites(plant_id, color_scheme, output_dir)

    print(f"\n{'=' * 50}")
    print(f"Complete! Generated {len(PLANT_COLOR_SCHEMES) * 5} images.")
    print(f"Location: {output_dir}")

if __name__ == '__main__':
    main()
