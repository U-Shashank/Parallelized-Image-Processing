const express = require('express');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();
const { exec } = require('child_process');
const util = require('util');
const stream = require('stream');

const app = express();
const execAsync = util.promisify(exec);
const finished = util.promisify(stream.finished);

const corsOptions = {
  origin: process.env.CLIENT_URL,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors());
app.use(express.json());

// Configure multer to store files in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // Limit file size to 10MB
});

async function processImage(imageBuffer, operation, mode) {
  const tempInputPath = `/tmp/input_${Date.now()}.jpg`;
  const tempOutputPath = `/tmp/output_${Date.now()}.jpg`;

  try {
    // Write the buffer to a temporary file
    await util.promisify(require('fs').writeFile)(tempInputPath, imageBuffer);

    // Process the image
    const { stdout } = await execAsync(`./image_processor ${tempInputPath} ${operation} ${tempOutputPath} ${mode}`);
    const metadata = JSON.parse(stdout);

    // Read the processed image back into a buffer
    const outputBuffer = await util.promisify(require('fs').readFile)(tempOutputPath);

    // Clean up temporary files
    await Promise.all([
      util.promisify(require('fs').unlink)(tempInputPath),
      util.promisify(require('fs').unlink)(tempOutputPath)
    ]);

    return { operation, mode, metadata, outputBuffer };
  } catch (error) {
    console.error(`Error processing image: ${error}`);
    throw error;
  }
}

app.post('/process-image', upload.single('image'), async (req, res) => {
  const { operation, mode } = req.body;
  const imageBuffer = req.file.buffer;

  try {
    const result = await processImage(imageBuffer, operation, mode);
    const base64Image = result.outputBuffer.toString('base64');

    res.json({
      processedImageBase64: `data:image/jpeg;base64,${base64Image}`,
      metadata: result.metadata
    });
  } catch (error) {
    console.error(`Error: ${error}`);
    res.status(500).json({ error: 'Image processing failed' });
  }
});

app.post('/demo', upload.single('image'), async (req, res) => {
  const imageBuffer = req.file.buffer;
  const operations = ['flip', 'rotate', 'grayscale'];
  const modes = ['serial', 'parallel'];

  try {
    const results = [];
    for (const op of operations) {
      for (const mode of modes) {
        const result = await processImage(imageBuffer, op, mode);
        results.push(result);
      }
    }

    const imageSize = `${results[0].metadata.width}x${results[0].metadata.height}`;
    
    const processedResults = operations.map(op => {
      const serialResult = results.find(r => r.operation === op && r.mode === 'serial');
      const parallelResult = results.find(r => r.operation === op && r.mode === 'parallel');
      return {
        operation: op,
        serial: serialResult.metadata.processingTime,
        parallel: parallelResult.metadata.processingTime,
        speedup: parallelResult.metadata.speedup
      };
    });

    res.json({ imageSize, results: processedResults });
  } catch (error) {
    console.error(`Error: ${error}`);
    res.status(500).json({ error: 'Demo processing failed' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});