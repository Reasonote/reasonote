import {type NextRequest} from "next/server";

import {
  FractalTreeLoadingSimpleHTML,
} from "@/components/icons/FractalTreeLoadingSimpleHTML";
import {createClient} from "@supabase/supabase-js";
import {ImageResponse} from "@vercel/og";

export const runtime = 'edge';

async function getSkill(skillId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('skill')
    .select('id, _name, metadata, emoji')
    .eq('id', skillId)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Skill not found');
  return data;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { skillId: string } }
) {
  const skillId = params.skillId;

  try {
    // Fetch the skill data using the skillId from the path parameter
    const skill = await getSkill(skillId);
    const skillName = skill._name;
    const emoji = skill.emoji ? skill.emoji : <div style={{width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><FractalTreeLoadingSimpleHTML color="white" size={120} maxDepth={5} /></div>; 

    
    // Return the OG image with the skill data
    return new ImageResponse(
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: 'url(https://qqlmpugonlnzzzgdhtfj.supabase.co/storage/v1/object/public/public-images/Reasonote-Icon-BG-Compressed.png)',
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
            position: 'relative',
          }}
        >
          <div style={{
            fontSize: '120px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '8px',
          }}>
            {emoji ?? <FractalTreeLoadingSimpleHTML color="white" size={120} maxDepth={5} />}
          </div>
          
          <h1
            style={{
              fontSize: '85px',
              fontWeight: 'bold',
              color: 'white',
              lineHeight: 1.1,
              textAlign: 'center',
              margin: 0,
              maxWidth: '900px',
            }}
          >
            {skillName}
          </h1>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginTop: '20px',
            }}
          >
            <p
              style={{
                fontSize: '32px',
                color: 'rgba(255, 255, 255, 0.9)',
                textAlign: 'center',
                margin: 0,
              }}
            >
              View Knowledge Graph in Reasonote
            </p>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: '16px',
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <FractalTreeLoadingSimpleHTML color="white" size={40} maxDepth={5} />
              </div>
              <span style={{
                color: 'white',
                fontSize: '24px',
              }}>
                Knowledge Graph Explorer
              </span>
            </div>
          </div>
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error(`Error generating OG image:`, error);
    
    // Fallback image for error cases
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
} 