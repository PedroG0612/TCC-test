"""Validation, Pillow sanitization, and safe storage helpers for uploaded media."""

import io
import uuid
from pathlib import Path

from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from PIL import Image, ImageOps, ImageSequence, UnidentifiedImageError

MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB
MAX_RESUME_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB
MAX_IMAGE_PIXELS = 25_000_000

ALLOWED_IMAGE_FORMATS = {
    'JPEG': 'jpg',
    'PNG': 'png',
    'WEBP': 'webp',
    'GIF': 'gif',
}

AVATAR_MAX_DIMENSIONS = (1024, 1024)
COVER_MAX_DIMENSIONS = (1920, 1080)
POST_IMAGE_MAX_DIMENSIONS = (1920, 1920)

ALLOWED_RESUME_EXTENSIONS = {'.pdf', '.doc', '.docx'}
RESUME_MAGIC_SIGNATURES = {
    '.pdf': (b'%PDF-',),
    '.docx': (b'PK\x03\x04', b'PK\x05\x06'),
    '.doc': (b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1',),
}


def validate_and_process_image(
    uploaded_file,
    *,
    max_bytes: int = MAX_IMAGE_UPLOAD_BYTES,
    max_dimensions: tuple[int, int] = AVATAR_MAX_DIMENSIONS,
) -> ContentFile:
    """Validate an uploaded image via Pillow, strip metadata, resize, and return a ContentFile."""
    if uploaded_file is None:
        raise ValidationError('Nenhum arquivo de imagem foi enviado.')

    declared_size = getattr(uploaded_file, 'size', None)
    if declared_size is not None and declared_size <= 0:
        raise ValidationError('O arquivo de imagem está vazio.')
    if declared_size is not None and declared_size > max_bytes:
        limit_mb = max_bytes // (1024 * 1024)
        raise ValidationError(f'A imagem excede o tamanho máximo permitido de {limit_mb} MB.')

    if hasattr(uploaded_file, 'seek'):
        uploaded_file.seek(0)
    raw_bytes = uploaded_file.read(max_bytes + 1)
    if hasattr(uploaded_file, 'seek'):
        uploaded_file.seek(0)

    if not raw_bytes:
        raise ValidationError('O arquivo de imagem está vazio.')
    if len(raw_bytes) > max_bytes:
        limit_mb = max_bytes // (1024 * 1024)
        raise ValidationError(f'A imagem excede o tamanho máximo permitido de {limit_mb} MB.')

    # Inspect and verify container/header integrity via Pillow (never trust extension alone).
    try:
        with Image.open(io.BytesIO(raw_bytes)) as probe:
            fmt = (probe.format or '').upper()
            if fmt not in ALLOWED_IMAGE_FORMATS:
                raise ValidationError(
                    'Formato de imagem não suportado. Envie JPG, PNG, WEBP ou GIF.'
                )
            width, height = probe.size
            if width <= 0 or height <= 0 or (width * height) > MAX_IMAGE_PIXELS:
                raise ValidationError('As dimensões da imagem são inválidas ou excedem o limite permitido.')
            probe.verify()
    except ValidationError:
        raise
    except (UnidentifiedImageError, OSError, ValueError, SyntaxError) as exc:
        raise ValidationError(
            'Arquivo de imagem inválido ou corrompido. Envie JPG, PNG, WEBP ou GIF.'
        ) from exc

    # Reopen cleanly after verify() to normalize orientation, resize, and re-encode without EXIF/payloads.
    try:
        with Image.open(io.BytesIO(raw_bytes)) as img:
            fmt = (img.format or '').upper()
            ext = ALLOWED_IMAGE_FORMATS[fmt]
            output = io.BytesIO()

            if fmt == 'GIF' and getattr(img, 'is_animated', False) and getattr(img, 'n_frames', 1) > 1:
                frames = []
                durations = []
                for idx, frame in enumerate(ImageSequence.Iterator(img)):
                    if idx >= 60:
                        break
                    rgba_frame = frame.convert('RGBA')
                    rgba_frame.thumbnail(max_dimensions, Image.Resampling.LANCZOS)
                    frames.append(rgba_frame.convert('P', palette=Image.Palette.ADAPTIVE))
                    durations.append(frame.info.get('duration', img.info.get('duration', 100)))
                frames[0].save(
                    output,
                    format='GIF',
                    save_all=True,
                    append_images=frames[1:],
                    duration=durations,
                    loop=img.info.get('loop', 0),
                    optimize=True,
                )
            else:
                img = ImageOps.exif_transpose(img)
                img.thumbnail(max_dimensions, Image.Resampling.LANCZOS)

                if fmt == 'JPEG':
                    if img.mode in ('RGBA', 'LA', 'P'):
                        background = Image.new('RGB', img.size, (255, 255, 255))
                        alpha_img = img.convert('RGBA')
                        background.paste(alpha_img, mask=alpha_img.split()[3])
                        img = background
                    elif img.mode != 'RGB':
                        img = img.convert('RGB')
                    img.save(output, format='JPEG', quality=88, optimize=True)
                elif fmt == 'PNG':
                    if img.mode not in ('RGB', 'RGBA', 'L', 'LA'):
                        img = img.convert('RGBA')
                    img.save(output, format='PNG', optimize=True)
                elif fmt == 'WEBP':
                    if img.mode not in ('RGB', 'RGBA'):
                        img = img.convert('RGBA' if 'A' in img.getbands() else 'RGB')
                    img.save(output, format='WEBP', quality=88, method=4)
                elif fmt == 'GIF':
                    if img.mode not in ('P', 'L', 'RGB', 'RGBA'):
                        img = img.convert('RGBA')
                    img.save(output, format='GIF', optimize=True)

            sanitized_name = f'{uuid.uuid4().hex}.{ext}'
            return ContentFile(output.getvalue(), name=sanitized_name)
    except ValidationError:
        raise
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise ValidationError('Não foi possível processar a imagem enviada.') from exc


def validate_resume_file(
    uploaded_file,
    *,
    max_bytes: int = MAX_RESUME_UPLOAD_BYTES,
) -> ContentFile:
    """Validate an uploaded resume (PDF/DOC/DOCX) by size, extension, and header bytes."""
    if uploaded_file is None:
        raise ValidationError('Nenhum arquivo foi enviado.')

    declared_size = getattr(uploaded_file, 'size', None)
    if declared_size is not None and declared_size <= 0:
        raise ValidationError('O arquivo enviado está vazio.')
    if declared_size is not None and declared_size > max_bytes:
        limit_mb = max_bytes // (1024 * 1024)
        raise ValidationError(f'O currículo excede o tamanho máximo permitido de {limit_mb} MB.')

    ext = Path(getattr(uploaded_file, 'name', '')).suffix.lower()
    if ext not in ALLOWED_RESUME_EXTENSIONS:
        raise ValidationError('Formato de currículo não suportado. Envie PDF, DOC ou DOCX.')

    if hasattr(uploaded_file, 'seek'):
        uploaded_file.seek(0)
    raw_bytes = uploaded_file.read(max_bytes + 1)
    if hasattr(uploaded_file, 'seek'):
        uploaded_file.seek(0)

    if not raw_bytes:
        raise ValidationError('O arquivo enviado está vazio.')
    if len(raw_bytes) > max_bytes:
        limit_mb = max_bytes // (1024 * 1024)
        raise ValidationError(f'O currículo excede o tamanho máximo permitido de {limit_mb} MB.')

    expected_prefixes = RESUME_MAGIC_SIGNATURES.get(ext, ())
    if expected_prefixes and not any(raw_bytes.startswith(prefix) for prefix in expected_prefixes):
        raise ValidationError('O conteúdo do arquivo não corresponde ao formato declarado (PDF, DOC ou DOCX).')

    sanitized_name = f'{uuid.uuid4().hex}{ext}'
    return ContentFile(raw_bytes, name=sanitized_name)


def delete_replaced_file(old_file_field, new_name: str | None = None) -> None:
    """Safely remove an overwritten media file from storage without failing on missing files."""
    if not old_file_field:
        return
    old_name = getattr(old_file_field, 'name', None)
    if not old_name or old_name == new_name:
        return
    try:
        old_file_field.storage.delete(old_name)
    except Exception:
        pass
