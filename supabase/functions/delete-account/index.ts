import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function jsonResponse(status: number, body: Record<string, string>) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

Deno.serve(async (request: Request) => {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
        return jsonResponse(405, { error: 'Method not allowed.' });
    }

    const bearerToken = request.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!bearerToken) {
        return jsonResponse(401, { error: 'Authentication is required.' });
    }

    let confirmation: string;
    try {
        const body = await request.json();
        confirmation = body?.confirmation;
    } catch {
        return jsonResponse(400, { error: 'A valid confirmation is required.' });
    }

    if (confirmation !== 'EXCLUIR') {
        return jsonResponse(400, { error: 'Type EXCLUIR to confirm account deletion.' });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
        console.error('Missing Supabase environment variables for account deletion.');
        return jsonResponse(500, { error: 'Account deletion is not configured.' });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            detectSessionInUrl: false,
            persistSession: false
        }
    });

    const { data: userData, error: userError } = await adminClient.auth.getUser(bearerToken);
    if (userError || !userData.user) {
        return jsonResponse(401, { error: 'The current session is invalid.' });
    }

    try {
        const encodedPayload = bearerToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const paddedPayload = encodedPayload.padEnd(Math.ceil(encodedPayload.length / 4) * 4, '=');
        const tokenPayload = JSON.parse(atob(paddedPayload));
        const authTime = Number(tokenPayload.auth_time);
        const currentTime = Math.floor(Date.now() / 1000);
        if (!Number.isFinite(authTime) || authTime > currentTime || currentTime - authTime > 300) {
            return jsonResponse(401, { error: 'Sign in again before deleting your account.' });
        }
    } catch {
        return jsonResponse(401, { error: 'The current session is invalid.' });
    }

    const avatarPaths: string[] = [];
    for (let offset = 0; ; offset += 100) {
        const { data: files, error: listError } = await adminClient.storage
            .from('pdf-editor-avatars')
            .list(userData.user.id, { limit: 100, offset });

        if (listError) {
            console.error('Could not list account avatar files.', listError);
            return jsonResponse(500, { error: 'Could not remove the account avatar files.' });
        }

        avatarPaths.push(...files
            .filter((file) => file.id)
            .map((file) => `${userData.user.id}/${file.name}`));

        if (files.length < 100) break;
    }

    if (avatarPaths.length) {
        const { error: removeError } = await adminClient.storage.from('pdf-editor-avatars').remove(avatarPaths);
        if (removeError) {
            console.error('Could not remove account avatar files.', removeError);
            return jsonResponse(500, { error: 'Could not remove the account avatar files.' });
        }
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userData.user.id);
    if (deleteError) {
        console.error('Could not delete the Supabase Auth user.', deleteError);
        return jsonResponse(500, { error: 'Could not delete the account.' });
    }

    return jsonResponse(200, { message: 'Account deleted.' });
});
