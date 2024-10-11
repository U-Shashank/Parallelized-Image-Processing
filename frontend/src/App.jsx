import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [operation, setOperation] = useState('flip');
  const [mode, setMode] = useState('serial');
  const [result, setResult] = useState(null);
  const [demoResults, setDemoResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setUploadedImageUrl(URL.createObjectURL(selectedFile));
    setResult(null);
    setDemoResults(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('operation', operation);
    formData.append('mode', mode);
    try {
      const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/process-image`, formData);
      setResult(response.data);
    } catch (error) {
      console.error('Error processing image:', error);
    }
    setLoading(false);
  };

  const handleDemo = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/demo`, formData);
      setDemoResults(response.data);
    } catch (error) {
      console.error('Error processing demo:', error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-gray-800 shadow-lg sm:rounded-3xl sm:p-20">
          <h1 className="text-4xl font-bold mb-8 text-center text-gray-100">Image Processing App</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300">Upload Image</label>
              <input type="file" onChange={handleFileChange} required className="mt-1 block w-full text-sm text-gray-300
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-gray-700 file:text-gray-300
                hover:file:bg-gray-600
              "/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Operation</label>
              <select value={operation} onChange={(e) => setOperation(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md text-gray-300">
                <option value="flip">Flip Horizontally</option>
                <option value="rotate">Rotate 90 Degrees</option>
                <option value="grayscale">Convert to Grayscale</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Mode</label>
              <select value={mode} onChange={(e) => setMode(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md text-gray-300">
                <option value="serial">Serial</option>
                <option value="parallel">Parallel</option>
              </select>
            </div>
            <button type="submit" disabled={!file || loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-cyan-400 hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50">
              Process Image
            </button>
          </form>

          <button onClick={handleDemo} disabled={!file || loading} className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-green-400 hover:bg-green-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50">
            Run Demo
          </button>

          {loading && <p className="mt-4 text-center text-cyan-400 font-semibold">Processing...</p>}

          <div className="mt-8 flex flex-col md:flex-row justify-between">
            {uploadedImageUrl && (
              <div className="mb-4 md:mb-0 md:mr-4 bg-gray-700 p-4 rounded-lg shadow flex-1">
                <h2 className="text-xl font-semibold mb-4 text-gray-100">Uploaded Image:</h2>
                <img src={uploadedImageUrl} alt="Uploaded" className="w-full rounded-md shadow-md" />
              </div>
            )}

            {result && (
              <div className="bg-gray-700 p-4 rounded-lg shadow flex-1">
                <h2 className="text-xl font-semibold mb-4 text-gray-100">Processed Image:</h2>
                <img src={result.processedImageBase64} alt="Processed" className="w-full rounded-md shadow-md mb-4" />
                <p className="text-sm text-gray-300">Size: {result.metadata.width}x{result.metadata.height}</p>
                <p className="text-sm text-gray-300">Processing Time: {result.metadata.processingTime.toFixed(6)} seconds</p>
                {result.metadata.speedup != 0 && <p className="text-sm text-gray-300">Speedup: {result.metadata.speedup.toFixed(2)}x</p>}
              </div>
            )}
          </div>

          {demoResults && (
            <div className="mt-8 bg-gray-700 p-4 rounded-lg shadow overflow-hidden">
              <h2 className="text-2xl font-semibold mb-4 text-gray-100">Demo Results:</h2>
              <p className="text-sm text-gray-300 mb-4">Image Size: {demoResults.imageSize}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-300">
                  <thead className="text-xs uppercase bg-gray-600 text-gray-400">
                    <tr>
                      <th scope="col" className="px-4 py-3">Operation</th>
                      <th scope="col" className="px-4 py-3">Serial (s)</th>
                      <th scope="col" className="px-4 py-3">Parallel (s)</th>
                      <th scope="col" className="px-4 py-3">Speedup</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demoResults.results.map((result, index) => (
                      <tr key={index} className="border-b bg-gray-800 border-gray-700">
                        <th scope="row" className="px-4 py-4 font-medium whitespace-nowrap text-white">
                          {result.operation}
                        </th>
                        <td className="px-4 py-4">{result.serial.toFixed(6)}</td>
                        <td className="px-4 py-4">{result.parallel.toFixed(6)}</td>
                        <td className="px-4 py-4">{result.speedup.toFixed(2)}x</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;