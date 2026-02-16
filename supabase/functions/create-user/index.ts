
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Create a Supabase client with the Auth context of the logged in user
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        console.log('Auth Header:', req.headers.get('Authorization'));
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        console.log('User found:', user?.email, 'Error:', userError);

        // Check if the user is an Admin
        const { data: { user } } = await supabaseClient.auth.getUser()

        if (!user) {
            throw new Error('Unauthorized')
        }

        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'Admin') {
            throw new Error('Forbidden: Only Admins can create users')
        }

        // Now use the SERVICE_ROLE_KEY to actually create the new user
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { email, password, name, role, status } = await req.json()

        // 1. Create the user in Auth
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: name, role: role }
        })

        if (createError) throw createError

        // 2. Update the profile (Trigger might handle creation, but we update status/role to be sure)
        // Wait a brief moment for trigger to run, or upsert here
        if (newUser.user) {
            const { error: updateError } = await supabaseAdmin
                .from('profiles')
                .update({
                    full_name: name,
                    role: role,
                    status: status || 'Active'
                })
                .eq('id', newUser.user.id)

            if (updateError) throw updateError
        }

        return new Response(
            JSON.stringify(newUser),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        )
    }
})
