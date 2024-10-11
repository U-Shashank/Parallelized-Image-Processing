#define STB_IMAGE_IMPLEMENTATION
#include "stb_image.h"
#define STB_IMAGE_WRITE_IMPLEMENTATION
#include "stb_image_write.h"
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

// Function to flip the image horizontally
void flipImageHorizontally(unsigned char *img, int width, int height,
                           int channels) {
  for (int i = 0; i < height; i++) {
    for (int j = 0; j < width / 2; j++) {
      for (int c = 0; c < channels; c++) {
        int left_idx = (i * width + j) * channels + c;
        int right_idx = (i * width + (width - j - 1)) * channels + c;
        // Swap pixels
        unsigned char temp = img[left_idx];
        img[left_idx] = img[right_idx];
        img[right_idx] = temp;
      }
    }
  }
}
// Function to rotate the image by 90 degrees clockwise
unsigned char *rotateImage90(unsigned char *img, int width, int height,
                             int channels) {
  unsigned char *rotatedImg =
      (unsigned char *)malloc(width * height * channels);
  // Perform 90-degree clockwise rotation
  for (int i = 0; i < height; i++) {
    for (int j = 0; j < width; j++) {
      for (int c = 0; c < channels; c++) {
        // Map the original pixel (i, j) to the new position (j,
        // height - i - 1)
        rotatedImg[(j * height + (height - i - 1)) * channels + c] =
            img[(i * width + j) * channels + c];
      }
    }
  }
  return rotatedImg;
}
// Function to convert the image to grayscale (assuming 3 channels RGB)
void convertToGrayscale(unsigned char *img, int width, int height,
                        int channels) {
  for (int i = 0; i < width * height; i++) {
    unsigned char r = img[i * channels];
    unsigned char g = img[i * channels + 1];
    unsigned char b = img[i * channels + 2];
    // Calculate grayscale value using luminosity method
    unsigned char gray = (unsigned char)(0.2989 * r + 0.5870 * g + 0.1140 * b);
    // Set all RGB channels to the grayscale value
    img[i * channels] = gray;
    img[i * channels + 1] = gray;
    img[i * channels + 2] = gray;
  }
}

int main() {
  srand(time(NULL)); // Seed for random number generation
  int width, height, channels;

  // Load image
  unsigned char *img =
      stbi_load("download.jpeg", &width, &height, &channels, 0);
  printf("Image loaded: %dx%d, %d channels\n", width, height, channels);

  int choice;
  printf("Choose an operation:\n");
  printf("1. Flip Image Horizontally\n");
  printf("2. Rotate Image 90 Degrees\n");
  printf("3. Convert Image to Grayscale\n");
  printf("Enter your choice (1-3): ");
  scanf("%d", &choice);

  unsigned char *resultImg = NULL;
  int newWidth = width;
  int newHeight = height;

  // Start timing
  clock_t start = clock();

  switch (choice) {
  case 1:
    flipImageHorizontally(img, width, height, channels);
    resultImg = img;
    printf("Image flipped horizontally.\n");
    break;
  case 2:
    resultImg = rotateImage90(img, width, height, channels);
    printf("Image rotated by 90 degrees.\n");
    // Swap width and height after rotation
    newWidth = height;
    newHeight = width;
    break;
  case 3:
    convertToGrayscale(img, width, height, channels);
    resultImg = img;
    printf("Image converted to grayscale.\n");
    break;
  default:
    printf("Invalid choice.\n");
    return -1;
  }

  // End timing
  clock_t end = clock();
  double cpu_time_used = ((double)(end - start)) / CLOCKS_PER_SEC;

  // Save the processed image
  char filename[20];
  sprintf(filename, "processed_image%d.jpg", choice);
  stbi_write_jpg(filename, newWidth, newHeight, channels, resultImg, 100);

  printf("Image processing complete. Saved as '%s'.\n", filename);
  printf("Time taken for processing: %f seconds\n", cpu_time_used);

  // Clean up
  stbi_image_free(img);
  if (choice == 2) {
    free(resultImg);
  }

  return 0;
}