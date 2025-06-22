#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDatabase() {
  console.log('🚀 Starting database setup...');

  try {
    // Test connection
    console.log('🔍 Testing Supabase connection...');
    const { error: testError } = await supabase
      .from('auth.users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection test failed:', testError.message);
      return;
    }
    console.log('✅ Connected to Supabase successfully');

    // Create user_roles table
    console.log('📋 Creating user_roles table...');
    const { error: rolesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.user_roles (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(50) UNIQUE NOT NULL,
          description TEXT,
          permissions JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Anyone can view roles" ON public.user_roles FOR SELECT USING (true);
        CREATE POLICY "Only admins can modify roles" ON public.user_roles FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
          )
        );
      `
    });

    if (rolesError && !rolesError.message.includes('already exists')) {
      console.error('❌ Failed to create user_roles table:', rolesError.message);
      return;
    }
    console.log('✅ user_roles table created');

    // Create user_profiles table
    console.log('👤 Creating user_profiles table...');
    const { error: profilesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.user_profiles (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
          email VARCHAR(255) NOT NULL,
          full_name VARCHAR(255),
          role VARCHAR(50) DEFAULT 'user',
          permissions JSONB DEFAULT '{}',
          metadata JSONB DEFAULT '{}',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Admins can view all profiles" ON public.user_profiles FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
          )
        );
        CREATE POLICY "Admins can modify all profiles" ON public.user_profiles FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
          )
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
        CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
      `
    });

    if (profilesError && !profilesError.message.includes('already exists')) {
      console.error('❌ Failed to create user_profiles table:', profilesError.message);
      return;
    }
    console.log('✅ user_profiles table created');

    // Insert default roles
    console.log('🔑 Inserting default roles...');
    const defaultRoles = [
      {
        name: 'admin',
        description: 'Full system access',
        permissions: {
          users: { read: true, write: true, delete: true },
          documents: { read: true, write: true, delete: true },
          workflows: { read: true, write: true, delete: true },
          analytics: { read: true, write: true },
          settings: { read: true, write: true }
        }
      },
      {
        name: 'manager',
        description: 'Management access with limited admin features',
        permissions: {
          users: { read: true, write: false, delete: false },
          documents: { read: true, write: true, delete: true },
          workflows: { read: true, write: true, delete: false },
          analytics: { read: true, write: false },
          settings: { read: true, write: false }
        }
      },
      {
        name: 'user',
        description: 'Basic user access',
        permissions: {
          users: { read: false, write: false, delete: false },
          documents: { read: true, write: true, delete: false },
          workflows: { read: true, write: false, delete: false },
          analytics: { read: false, write: false },
          settings: { read: false, write: false }
        }
      }
    ];

    for (const role of defaultRoles) {
      const { error: insertError } = await supabase
        .from('user_roles')
        .upsert(role, { onConflict: 'name' });
      
      if (insertError) {
        console.error(`❌ Failed to insert role ${role.name}:`, insertError.message);
      } else {
        console.log(`✅ Role ${role.name} inserted`);
      }
    }

    // Get all users from auth.users
    console.log('👥 Fetching users from auth.users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Failed to fetch auth users:', authError.message);
      return;
    }
    
    console.log(`📊 Found ${authUsers.users.length} users in auth.users`);

    // Migrate users to user_profiles
    let migratedCount = 0;
    let adminAssigned = false;

    for (const user of authUsers.users) {
      const isAdmin = user.email === 'mwenda0107@gmail.com';
      const role = isAdmin ? 'admin' : 'user';
      
      const profileData = {
        user_id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email,
        role: role,
        permissions: {},
        metadata: user.user_metadata || {},
        is_active: true
      };

      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(profileData, { onConflict: 'user_id' });

      if (profileError) {
        console.error(`❌ Failed to migrate user ${user.email}:`, profileError.message);
      } else {
        console.log(`✅ Migrated user: ${user.email} (${role})`);
        migratedCount++;
        
        if (isAdmin) {
          adminAssigned = true;
          // Update auth metadata
          const { error: metadataError } = await supabase.auth.admin.updateUserById(
            user.id,
            {
              user_metadata: {
                ...user.user_metadata,
                role: 'admin',
                is_admin: true
              }
            }
          );
          
          if (metadataError) {
            console.error(`❌ Failed to update admin metadata:`, metadataError.message);
          } else {
            console.log(`✅ Updated admin metadata for ${user.email}`);
          }
        }
      }
    }

    console.log('\n🎉 Database setup completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Users migrated: ${migratedCount}/${authUsers.users.length}`);
    console.log(`   - Admin assigned: ${adminAssigned ? '✅' : '❌'}`);
    console.log(`   - Tables created: user_roles, user_profiles`);
    console.log(`   - Policies configured: ✅`);
    
    if (adminAssigned) {
      console.log(`\n🔑 Admin user: mwenda0107@gmail.com`);
      console.log(`   - Role: admin`);
      console.log(`   - Full access granted`);
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

setupDatabase();
