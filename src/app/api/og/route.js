import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const color = searchParams.get('color');

    if (!color) {
      return new Response('Color parameter is required', { status: 400 });
    }

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '1200px',
            height: '1200px',
            backgroundColor: color,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              padding: '40px 80px',
              borderRadius: '20px',
            }}
          >
            <div
              style={{
                fontSize: '100px',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '20px',
              }}
            >
              Your Color
            </div>
            <div
              style={{
                fontSize: '80px',
                color: color,
                fontFamily: 'monospace',
                backgroundColor: 'white',
                padding: '20px 40px',
                borderRadius: '10px',
              }}
            >
              {color.toUpperCase()}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 1200,
      }
    );
  } catch (error) {
    console.error('Error generating image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
} 