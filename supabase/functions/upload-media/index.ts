import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Allowed file types for upload
const allowedTypes = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/webm', 'video/quicktime'
];

// Max file size: 20MB
const MAX_FILE_SIZE = 20 * 1024 * 1024;

// Rate limit: max 5 uploads per minute per fingerprint
const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_MAX_UPLOADS = 5;

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fingerprint = formData.get('fingerprint') as string;
    const wallId = formData.get('wallId') as string;

    // Validate required fields
    if (!file) {
      console.error('Missing file in upload request');
      return new Response(
        JSON.stringify({ error: 'Missing file' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!wallId) {
      console.error('Missing wallId in upload request');
      return new Response(
        JSON.stringify({ error: 'Missing wallId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.error(`File too large: ${file.size} bytes`);
      return new Response(
        JSON.stringify({ error: 'File too large (max 20MB)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      console.error(`Invalid file type: ${file.type}`);
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Only images and videos are allowed.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify wall exists and is active using the secure view
    const { data: wall, error: wallError } = await supabaseAdmin
      .from('walls_public')
      .select('id, is_active')
      .eq('id', wallId)
      .single();

    if (wallError || !wall) {
      console.error('Wall not found:', wallId, wallError);
      return new Response(
        JSON.stringify({ error: 'Wall not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!wall.is_active) {
      console.error('Wall is not active:', wallId);
      return new Response(
        JSON.stringify({ error: 'This wall is no longer active' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting check (if fingerprint provided)
    if (fingerprint) {
      const oneMinuteAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
      const { count, error: countError } = await supabaseAdmin
        .from('memories')
        .select('*', { count: 'exact', head: true })
        .eq('author_fingerprint', fingerprint)
        .gte('created_at', oneMinuteAgo);

      if (!countError && count !== null && count >= RATE_LIMIT_MAX_UPLOADS) {
        console.warn(`Rate limit exceeded for fingerprint: ${fingerprint.substring(0, 8)}...`);
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please wait before uploading again.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'bin';
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${wallId}/${fileName}`;

    console.log(`Uploading file: ${filePath}, type: ${file.type}, size: ${file.size}`);

    // Upload using service role (bypasses RLS)
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('wall-media')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('wall-media')
      .getPublicUrl(filePath);

    console.log(`Upload successful: ${urlData.publicUrl}`);

    return new Response(
      JSON.stringify({
        url: urlData.publicUrl,
        path: filePath
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in upload-media function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
