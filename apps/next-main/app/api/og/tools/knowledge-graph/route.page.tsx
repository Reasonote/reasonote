import {type NextRequest} from "next/server";

import {
  FractalTreeLoadingSimpleHTML,
} from "@/components/icons/FractalTreeLoadingSimpleHTML";
import {ImageResponse} from "@vercel/og";

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  // Default OG image for the Knowledge Graph Explorer
  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: 'url(https://qqlmpugonlnzzzgdhtfj.supabase.co/storage/v1/object/public/public-images//Reasonote-Icon-BG-Compressed.png)',
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundColor: '#4F46E5',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '40px',
          left: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <img
          src="https://reasonote.com/favicon.ico"
          alt="Reasonote"
          style={{
            width: '70px',
            height: '70px',
            borderRadius: '12px',
            border: '2px solid rgba(255, 255, 255, 0.8)',
          }}
        />
        <span style={{
          color: 'white',
          fontSize: '32px',
          fontWeight: 'bold',
        }}>
          Reasonote
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
        }}
      >
        <div style={{
          width: '180px',
          height: '180px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
        }}>
          <FractalTreeLoadingSimpleHTML color="white" size={180} maxDepth={5} />
        </div>
        
        <h1
          style={{
            fontSize: '85px',
            fontWeight: 'bold',
            color: 'white',
            lineHeight: 1.1,
            textAlign: 'center',
            margin: 0,
          }}
        >
          Knowledge Graph Explorer
        </h1>
        <p
          style={{
            fontSize: '32px',
            color: 'rgba(255, 255, 255, 0.9)',
            textAlign: 'center',
            margin: 0,
          }}
        >
          Visualize and explore knowledge graphs for any topic
        </p>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    }
  );
} 