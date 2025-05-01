import {NextResponse} from "next/server";

import {renderExamplePrompt} from "@reasonote/lib-ai";

// Debug function to inspect what component really is
function dumpObjectInfo(obj: any): string {
  const details: string[] = [];
  
  details.push(`Type: ${typeof obj}`);
  
  if (typeof obj === 'function') {
    details.push(`Is function: true`);
    details.push(`Function name: ${obj.name || 'anonymous'}`);
    details.push(`Function toString: ${obj.toString().slice(0, 500)}...`);
    details.push(`Function properties: ${Object.keys(obj).join(', ')}`);
  } else if (typeof obj === 'object' && obj !== null) {
    details.push(`Is object: true`);
    details.push(`Constructor name: ${obj.constructor?.name}`);
    details.push(`Object properties: ${Object.keys(obj).join(', ')}`);
    
    // Try to safely stringify part of the object
    try {
      const partial = JSON.stringify(obj, null, 2).slice(0, 500);
      details.push(`Partial JSON: ${partial}...`);
    } catch (error: any) {
      details.push(`Cannot stringify: ${error.message}`);
    }
  }
  
  return details.join('\n');
}



// Use JSX transformation for tests
async function testJSXTransformation() {
  try {
    const renderedPrompt = await renderExamplePrompt({name: 'John', message: 'Hello'});

    console.log('Rendered prompt:', renderedPrompt);
    return { success: true, prompt: renderedPrompt };
  } catch (error: any) {
    console.error("Error testing JSX transformation:", error);
    return { 
      success: false, 
      error: error.message || "Unknown error in JSX transformation",
      prompt: "JSX transformation failed. See server logs for details."
    };
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('type') || 'jsx';
    
    let result;
    
    switch (testType) {
      case 'jsx':
        // Test the JSX transformation with TestPriompt
        result = await testJSXTransformation();
        break;
      default:
        result = { 
          success: false, 
          error: "Unknown test type", 
          prompt: "Please specify a valid test type." 
        };
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in Priompt test API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 