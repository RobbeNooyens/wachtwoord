from PIL import Image
import os

# The path to the directory containing the images
folder_path = 'logos'

# The target size
target_size = (256, 256)

for filename in os.listdir(folder_path):
    if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.gif')):
        try:
            img_path = os.path.join(folder_path, filename)
            img = Image.open(img_path)
            img = img.resize(target_size, Image.Resampling.LANCZOS)
            img.save(img_path)
            print(f'Resized {filename}')
        except Exception as e:
            print(f'Error resizing {filename}: {e}')
