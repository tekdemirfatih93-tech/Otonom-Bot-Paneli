
import React, { useState } from 'react';
import { GoogleGenAI, GroundingChunk } from "@google/genai";
import { Search, Link as LinkIcon } from 'lucide-react';

const geminiService = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const GroundedSearch: React.FC = () => {
    const [query, setQuery] = useState<string>('');
    const [result, setResult] = useState<string>('');
    const [sources, setSources] = useState<GroundingChunk[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query) {
            setError('Please enter a search query.');
            return;
        }
        setLoading(true);
        setError('');
        setResult('');
        setSources([]);

        try {
            const response = await geminiService.models.generateContent({
                model: "gemini-2.5-flash",
                contents: query,
                config: {
                    tools: [{ googleSearch: {} }],
                },
            });
            
            setResult(response.text);

            const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
            if (groundingMetadata?.groundingChunks) {
                setSources(groundingMetadata.groundingChunks);
            }

        } catch (e) {
            setError('Search failed. Please try again.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-center">Grounded Search</h2>
            <p className="text-gray-400 text-center mb-6">Get up-to-date and accurate information from the web.</p>
            <form onSubmit={handleSearch} className="flex gap-2 mb-8">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask about recent events, news, or any up-to-date topic..."
                    className="flex-grow bg-gray-800 border-gray-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center">
                    {loading ? (
                         <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin"></div>
                    ) : (
                        <Search className="h-5 w-5" />
                    )}
                </button>
            </form>

            {error && <p className="text-red-400 text-center">{error}</p>}

            {result && (
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3">Answer</h3>
                    <p className="text-gray-300 whitespace-pre-wrap">{result}</p>
                    
                    {sources.length > 0 && (
                        <div className="mt-6">
                            <h4 className="text-lg font-semibold mb-3">Sources</h4>
                            <ul className="space-y-2">
                                {sources.map((source, index) => (
                                    source.web && (
                                        <li key={index} className="flex items-start">
                                            <LinkIcon className="h-4 w-4 text-blue-400 mt-1 mr-2 flex-shrink-0" />
                                            <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
                                                {source.web.title || source.web.uri}
                                            </a>
                                        </li>
                                    )
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GroundedSearch;
