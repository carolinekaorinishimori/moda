from PIL import Image
import os

def split_faces(image_path, output_dir):
    img = Image.open(image_path)
    width, height = img.size
    
    # Grid is 2 rows by 5 columns
    cols = 5
    rows = 2
    
    face_width = width // cols
    face_height = height // rows
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    count = 1
    for r in range(rows):
        for c in range(cols):
            left = c * face_width
            top = r * face_height
            right = (c + 1) * face_width
            bottom = (r + 1) * face_height
            
            face = img.crop((left, top, right, bottom))
            face.save(os.path.join(output_dir, f"rosto_{count}.png"))
            print(f"Saved: rosto_{count}.png")
            count += 1

if __name__ == "__main__":
    split_faces(r"C:\Users\26012211\Documents\GitHub\moda\Rostos.png", 
                r"C:\Users\26012211\Documents\GitHub\moda\assets\skin")
