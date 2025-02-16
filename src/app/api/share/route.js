import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const S3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  try {
    const { color } = await request.json();

    if (!color) {
      return Response.json({ error: 'Color is required' }, { status: 400 });
    }

    // Generate the image using our OG route
    const imageResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/og?color=${encodeURIComponent(color)}`);
    
    if (!imageResponse.ok) {
      throw new Error('Failed to generate image');
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const fileName = `colors/${color.replace('#', '')}-${Date.now()}.png`;

    // Upload to R2
    await S3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: Buffer.from(imageBuffer),
      ContentType: 'image/png',
    }));

    const imageUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

    return Response.json({ 
      success: true,
      imageUrl 
    });

  } catch (error) {
    console.error('Share error:', error);
    return Response.json(
      { error: 'Failed to share color', details: error.message },
      { status: 500 }
    );
  }
} 