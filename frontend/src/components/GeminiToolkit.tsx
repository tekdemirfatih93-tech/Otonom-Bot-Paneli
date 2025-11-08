
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Image, Sparkles, FileText } from 'lucide-react';

const geminiService = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// --- Helper function to convert file to base64 ---
const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

// --- Image Analyzer Component ---
const ImageAnalyzer: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [prompt, setPrompt] = useState<string>('Describe this image in detail.');
    const [result, setResult] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleAnalyze = async () => {
        if (!file || !prompt) {
            setError('Please select an image and enter a prompt.');
            return;
        }
        setLoading(true);
        setError('');
        setResult('');
        try {
            const imagePart = await fileToGenerativePart(file);
            const response = await geminiService.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, { text: prompt }] },
            });
            setResult(response.text);
        } catch (e) {
            setError('Failed to analyze image. Please try again.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 flex items-center"><Image className="mr-2"/>Image Analyzer</h3>
            <div className="space-y-4">
                 <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"/>
                {file && <img src={URL.createObjectURL(file)} alt="preview" className="mt-2 rounded-lg max-h-48" />}
                <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Enter your prompt" className="w-full bg-gray-700 p-2 rounded-md" />
                <button onClick={handleAnalyze} disabled={loading || !file} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">
                    {loading ? 'Analyzing...' : 'Analyze Image'}
                </button>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                {result && <div className="bg-black/20 p-4 rounded-md text-sm whitespace-pre-wrap">{result}</div>}
            </div>
        </div>
    );
};


// --- Image Generator Component ---
const ImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<string>('1:1');
    const [image, setImage] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleGenerate = async () => {
        if (!prompt) {
            setError('Please enter a prompt.');
            return;
        }
        setLoading(true);
        setError('');
        setImage('');
        try {
            const response = await geminiService.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio,
                },
            });
            const base64Image = response.generatedImages[0].image.imageBytes;
            setImage(`data:image/jpeg;base64,${base64Image}`);
        } catch (e) {
            setError('Failed to generate image. Please try again.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 flex items-center"><Sparkles className="mr-2"/>Image Generator</h3>
            <div className="space-y-4">
                <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Enter a prompt for the image" className="w-full bg-gray-700 p-2 rounded-md" />
                <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="w-full bg-gray-700 p-2 rounded-md">
                    <option value="1:1">Square (1:1)</option>
                    <option value="16:9">Widescreen (16:9)</option>
                    <option value="9:16">Portrait (9:16)</option>
                    <option value="4:3">Landscape (4:3)</option>
                    <option value="3:4">Tall (3:4)</option>
                </select>
                <button onClick={handleGenerate} disabled={loading || !prompt} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">
                    {loading ? 'Generating...' : 'Generate Image'}
                </button>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                {image && <img src={image} alt="generated" className="mt-2 rounded-lg w-full" />}
                 {loading && <div className="text-center p-4">Generating... This may take a moment.</div>}
            </div>
        </div>
    );
};

// --- Task Assistant Component ---
const TaskAssistant: React.FC = () => {
    const [task, setTask] = useState<string>('summarize');
    const [content, setContent] = useState<string>('');
    const [result, setResult] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    
    const taskPrompts: { [key: string]: string } = {
        summarize: "Summarize the following content:",
        proofread: "Proofread the following text for grammar and spelling errors, and provide a corrected version:",
        keywords: "Extract the main keywords from the following text:",
    };

    const handlePerformTask = async () => {
        if (!content) {
            setError('Please enter some content.');
            return;
        }
        setLoading(true);
        setError('');
        setResult('');
        try {
            const model = task === 'proofread' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
            const fullPrompt = `${taskPrompts[task]}\n\n${content}`;
            const response = await geminiService.models.generateContent({
                model,
                contents: fullPrompt,
            });
            setResult(response.text);
        } catch (e) {
            setError('Task failed. Please try again.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 flex items-center"><FileText className="mr-2"/>Task Assistant</h3>
            <div className="space-y-4">
                <select value={task} onChange={(e) => setTask(e.target.value)} className="w-full bg-gray-700 p-2 rounded-md">
                    <option value="summarize">Summarize Content</option>
                    <option value="proofread">Proofread Text</option>
                    <option value="keywords">Extract Keywords</option>
                </select>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Paste your content here..." rows={6} className="w-full bg-gray-700 p-2 rounded-md"></textarea>
                <button onClick={handlePerformTask} disabled={loading || !content} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">
                    {loading ? 'Processing...' : 'Perform Task'}
                </button>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                {result && <div className="bg-black/20 p-4 rounded-md text-sm whitespace-pre-wrap">{result}</div>}
            </div>
        </div>
    );
};

// --- Main Toolkit Component ---
const GeminiToolkit: React.FC = () => {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Gemini Toolkit</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ImageAnalyzer />
                <ImageGenerator />
                <TaskAssistant />
            </div>
        </div>
    );
};

export default GeminiToolkit;