#define STB_IMAGE_IMPLEMENTATION
#include "stb_image.h"
#define STB_IMAGE_WRITE_IMPLEMENTATION
#include "stb_image_write.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <omp.h>

// Function to flip the image horizontally
void flipImageHorizontally(unsigned char *img, int width, int height, int channels, bool parallel) {
    if (parallel) {
        #pragma omp parallel for
        for (int i = 0; i < height; i++) {
            for (int j = 0; j < width / 2; j++) {
                for (int c = 0; c < channels; c++) {
                    int left_idx = (i * width + j) * channels + c;
                    int right_idx = (i * width + (width - j - 1)) * channels + c;
                    unsigned char temp = img[left_idx];
                    img[left_idx] = img[right_idx];
                    img[right_idx] = temp;
                }
            }
        }
    } else {
        for (int i = 0; i < height; i++) {
            for (int j = 0; j < width / 2; j++) {
                for (int c = 0; c < channels; c++) {
                    int left_idx = (i * width + j) * channels + c;
                    int right_idx = (i * width + (width - j - 1)) * channels + c;
                    unsigned char temp = img[left_idx];
                    img[left_idx] = img[right_idx];
                    img[right_idx] = temp;
                }
            }
        }
    }
}

// Function to rotate the image by 90 degrees clockwise
unsigned char* rotateImage90(unsigned char *img, int width, int height, int channels, bool parallel) {
    unsigned char *rotatedImg = (unsigned char*)malloc(width * height * channels);
    
    if (parallel) {
        #pragma omp parallel for
        for (int i = 0; i < height; i++) {
            for (int j = 0; j < width; j++) {
                for (int c = 0; c < channels; c++) {
                    rotatedImg[(j * height + (height - i - 1)) * channels + c] = img[(i * width + j) * channels + c];
                }
            }
        }
    } else {
        for (int i = 0; i < height; i++) {
            for (int j = 0; j < width; j++) {
                for (int c = 0; c < channels; c++) {
                    rotatedImg[(j * height + (height - i - 1)) * channels + c] = img[(i * width + j) * channels + c];
                }
            }
        }
    }
    return rotatedImg;
}

// Function to convert the image to grayscale
void convertToGrayscale(unsigned char *img, int width, int height, int channels, bool parallel) {
    if (parallel) {
        #pragma omp parallel for
        for (int i = 0; i < width * height; i++) {
            unsigned char r = img[i * channels];
            unsigned char g = img[i * channels + 1];
            unsigned char b = img[i * channels + 2];
            unsigned char gray = (unsigned char)(0.2989 * r + 0.5870 * g + 0.1140 * b);
            img[i * channels] = gray;
            img[i * channels + 1] = gray;
            img[i * channels + 2] = gray;
        }
    } else {
        for (int i = 0; i < width * height; i++) {
            unsigned char r = img[i * channels];
            unsigned char g = img[i * channels + 1];
            unsigned char b = img[i * channels + 2];
            unsigned char gray = (unsigned char)(0.2989 * r + 0.5870 * g + 0.1140 * b);
            img[i * channels] = gray;
            img[i * channels + 1] = gray;
            img[i * channels + 2] = gray;
        }
    }
}

int main(int argc, char* argv[]) {
    if (argc != 5) {
        fprintf(stderr, "Usage: %s <input_image> <operation> <output_image> <mode>\n", argv[0]);
        return 1;
    }

    const char* input_file = argv[1];
    const char* operation = argv[2];
    const char* output_file = argv[3];
    const char* mode = argv[4];

    bool parallel = (strcmp(mode, "parallel") == 0);

    int width, height, channels;
    unsigned char *img = stbi_load(input_file, &width, &height, &channels, 0);
    if (!img) {
        fprintf(stderr, "Error loading image\n");
        return 1;
    }

    double start_time = omp_get_wtime();

    if (strcmp(operation, "flip") == 0) {
        flipImageHorizontally(img, width, height, channels, parallel);
    } else if (strcmp(operation, "rotate") == 0) {
        unsigned char* rotated = rotateImage90(img, width, height, channels, parallel);
        stbi_image_free(img);
        img = rotated;
        int temp = width;
        width = height;
        height = temp;
    } else if (strcmp(operation, "grayscale") == 0) {
        convertToGrayscale(img, width, height, channels, parallel);
    } else {
        fprintf(stderr, "Unknown operation: %s\n", operation);
        stbi_image_free(img);
        return 1;
    }

    double end_time = omp_get_wtime();
    double processing_time = end_time - start_time;

    stbi_write_jpg(output_file, width, height, channels, img, 100);

    // Calculate speedup if parallel mode was used
    double speedup = 0.0;
    if (parallel) {
        // Run the same operation in serial mode to calculate speedup
        unsigned char *img_serial = stbi_load(input_file, &width, &height, &channels, 0);
        double start_time_serial = omp_get_wtime();

        if (strcmp(operation, "flip") == 0) {
            flipImageHorizontally(img_serial, width, height, channels, false);
        } else if (strcmp(operation, "rotate") == 0) {
            unsigned char* rotated = rotateImage90(img_serial, width, height, channels, false);
            stbi_image_free(img_serial);
            img_serial = rotated;
        } else if (strcmp(operation, "grayscale") == 0) {
            convertToGrayscale(img_serial, width, height, channels, false);
        }

        double end_time_serial = omp_get_wtime();
        double processing_time_serial = end_time_serial - start_time_serial;

        speedup = processing_time_serial / processing_time;
        stbi_image_free(img_serial);
    }

    // Output JSON metadata
    printf("{\"width\": %d, \"height\": %d, \"channels\": %d, \"processingTime\": %.6f, \"speedup\": %.2f}\n",
           width, height, channels, processing_time, speedup);

    stbi_image_free(img);
    return 0;
}