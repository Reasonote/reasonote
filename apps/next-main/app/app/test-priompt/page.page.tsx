'use client';

import React, {useState} from "react";

export default function TestPriomptPage() {
  const [outputText, setOutputText] = useState<string>('No output yet');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const testJSXTransformation = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Call the API route for JSX transformation test
      const response = await fetch('/api/priompt-test?type=jsx');
      const data = await response.json();
      
      if (data.success) {
        setOutputText(data.prompt || 'No prompt text returned');
      } else {
        setError(data.error || 'Unknown error');
        setOutputText(data.prompt || '');
      }
    } catch (error) {
      console.error('Error testing JSX transformation:', error);
      setError(`Error: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Priompt JSX Test Page</h1>
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={testJSXTransformation}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-blue-300"
          >
            {isLoading ? 'Loading...' : 'Test JSX Transformation'}
          </button>
        </div>
        <div className="mt-4">
          <h2 className="text-lg font-semibold">Test Results:</h2>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-2">
              <p className="font-bold">Error:</p>
              <p>{error}</p>
            </div>
          )}
          <div className="mt-4">
            <h3 className="font-medium">Rendered Prompt:</h3>
            <pre className="bg-gray-100 p-4 mt-2 rounded overflow-auto max-h-96 whitespace-pre-wrap">
              {isLoading ? 'Loading...' : outputText}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
} 