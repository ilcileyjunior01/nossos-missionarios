"""
Módulo de tratamento de imagem para o app Nossos Missionários.
Aplica melhorias de qualidade, nitidez e iluminação, e exporta em resolução 4K.

Dependências: Pillow, OpenCV (opencv-python)
"""

import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
import io


TARGET_WIDTH = 3840   # 4K
TARGET_HEIGHT = 4320  # Proporção retrato 4K (9:10 aprox.)


def process_missionary_photo(image_bytes: bytes) -> bytes:
    """
    Recebe os bytes de uma imagem e retorna os bytes da imagem processada em 4K.
    Etapas: nitidez de rosto/olhos, correção de iluminação, redimensionamento 4K.
    """
    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    img_cv = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    img_cv = _sharpen(img_cv)
    img_cv = _correct_lighting(img_cv)
    img_cv = _upscale_4k(img_cv)

    pil_img = _cv_to_pil(img_cv)
    pil_img = _enhance_with_pil(pil_img)

    output = io.BytesIO()
    pil_img.save(output, format='JPEG', quality=95)
    return output.getvalue()


def _sharpen(img: np.ndarray) -> np.ndarray:
    """Aumenta a nitidez dos traços usando kernel de sharpening."""
    kernel = np.array([
        [-1, -1, -1],
        [-1,  9, -1],
        [-1, -1, -1]
    ])
    sharpened = cv2.filter2D(img, -1, kernel)
    # Blend suave para não exagerar
    return cv2.addWeighted(img, 0.3, sharpened, 0.7, 0)


def _correct_lighting(img: np.ndarray) -> np.ndarray:
    """Corrige iluminação: normaliza brilho e ajusta contraste para aspecto profissional."""
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_corrected = clahe.apply(l)
    lab_corrected = cv2.merge((l_corrected, a, b))
    return cv2.cvtColor(lab_corrected, cv2.COLOR_LAB2BGR)


def _upscale_4k(img: np.ndarray) -> np.ndarray:
    """Redimensiona a imagem para resolução 4K mantendo proporção."""
    h, w = img.shape[:2]
    ratio = min(TARGET_WIDTH / w, TARGET_HEIGHT / h)
    new_w = int(w * ratio)
    new_h = int(h * ratio)
    return cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)


def _cv_to_pil(img: np.ndarray) -> Image.Image:
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    return Image.fromarray(img_rgb)


def _enhance_with_pil(img: Image.Image) -> Image.Image:
    """Aplicações finais com Pillow: brilho, contraste e nitidez."""
    img = ImageEnhance.Brightness(img).enhance(1.05)
    img = ImageEnhance.Contrast(img).enhance(1.15)
    img = ImageEnhance.Sharpness(img).enhance(1.5)
    return img


if __name__ == '__main__':
    import sys

    if len(sys.argv) < 3:
        print("Uso: python image_processing.py <entrada.jpg> <saida.jpg>")
        sys.exit(1)

    with open(sys.argv[1], 'rb') as f:
        input_bytes = f.read()

    output_bytes = process_missionary_photo(input_bytes)

    with open(sys.argv[2], 'wb') as f:
        f.write(output_bytes)

    print(f"Imagem processada salva em: {sys.argv[2]}")
